"""Refresh the Commons public-domain deck. Requires Pillow; never runs at build time."""
import hashlib
import io
import json
import time
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/tarot'
CACHE = ROOT / 'asset-work/tarot-originals'
CACHE.mkdir(parents=True, exist_ok=True)
CATEGORY = 'Category:Rider-Waite-Smith tarot deck (TaionWC)'

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'VirtualRitesAssetImport/1.0 (public-domain deck provenance)'})
    for attempt in range(8):
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 503) or attempt == 7:
                raise
            time.sleep(min(30, 3 * 2**attempt))

def api(**params):
    return json.loads(fetch('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(dict(action='query', format='json', **params))))

members = api(list='categorymembers', cmtitle=CATEGORY, cmlimit=100)['query']['categorymembers']
assert len(members) == 78
records = []
for offset in range(0, 78, 25):
    pages = api(titles='|'.join(m['title'] for m in members[offset:offset+25]), prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=500)['query']['pages']
    for page in pages.values():
        title = page['title']
        stem = title.removeprefix('File:').removesuffix('.jpg')
        if stem.startswith('RWS Tarot '):
            card_id = 'major-' + stem.split()[2]
        else:
            suit = {'Cups': 'cups', 'Pents': 'pentacles', 'Swords': 'swords', 'Wands': 'wands'}
            card_id = next(v + '-' + stem[-2:] for k, v in suit.items() if stem.startswith(k))
        data = page['imageinfo'][0]
        metadata = data['extmetadata']
        assert metadata['LicenseShortName']['value'] == 'Public domain', title
        assert metadata['Copyrighted']['value'].lower() == 'false', title
        cache = CACHE / (card_id + '.jpg')
        source_receipt = CACHE / (card_id + '.source.txt')
        download = data.get('thumburl', data['url']).split('?')[0]
        if not cache.exists():
            cache.write_bytes(fetch(download))
            source_receipt.write_text(download, encoding='utf-8')
        download = source_receipt.read_text(encoding='utf-8') if source_receipt.exists() else data['url'].split('?')[0]
        original = cache.read_bytes()
        image = Image.open(io.BytesIO(original)).convert('RGB')
        fitted = ImageOps.contain(image, (512, 884), Image.Resampling.LANCZOS)
        canvas = Image.new('RGB', (512, 884), '#f4ebd8')
        canvas.paste(fitted, ((512-fitted.width)//2, (884-fitted.height)//2))
        path = DEST / (card_id + '.webp')
        canvas.save(path, 'WEBP', quality=86, method=6)
        records.append(dict(id=card_id, file=path.name, source=data['descriptionurl'], download=download, license='Public domain', artist='Pamela Colman Smith', sourceSha256=hashlib.sha256(original).hexdigest(), sha256=hashlib.sha256(path.read_bytes()).hexdigest(), sourceSize=list(image.size), size=[512,884], metadata=metadata))
        print(card_id, flush=True)
        time.sleep(1.5)
assert len({r['id'] for r in records}) == 78
(DEST / 'provenance.json').write_text(json.dumps(dict(collection=CATEGORY, retrieved='2026-10-09', transformation='Fit without cropping to 512x884 ivory canvas; WebP quality 86', cards=sorted(records,key=lambda r:r['id'])), indent=2), encoding='utf-8')
