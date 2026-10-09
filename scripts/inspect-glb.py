"""Static embedded-GLB budget check, independently of the provider's status."""
import hashlib
import io
import json
import struct
import sys
from pathlib import Path
from PIL import Image

path = Path(sys.argv[1])
raw = path.read_bytes()
magic, version, length = struct.unpack_from('<III', raw)
assert magic == 0x46546c67 and version == 2 and length == len(raw)
cursor = 12
chunks = {}
while cursor < length:
    size, kind = struct.unpack_from('<II', raw, cursor)
    cursor += 8
    chunks[kind] = raw[cursor:cursor+size]
    cursor += size
assert cursor == length
doc = json.loads(chunks[0x4e4f534a])
binary = chunks[0x004e4942]
assert all('uri' not in b and b['byteLength'] <= len(binary) for b in doc['buffers'])
triangles = 0
for mesh in doc['meshes']:
    for primitive in mesh['primitives']:
        assert primitive.get('mode', 4) == 4
        accessor = doc['accessors'][primitive.get('indices', primitive['attributes']['POSITION'])]
        triangles += accessor['count'] // 3
images = []
for image in doc.get('images', []):
    assert 'uri' not in image
    view = doc['bufferViews'][image['bufferView']]
    start = view.get('byteOffset', 0)
    decoded = Image.open(io.BytesIO(binary[start:start+view['byteLength']]))
    decoded.verify()
    images.append(list(decoded.size))
for view in doc['bufferViews']:
    assert view.get('byteOffset', 0) + view['byteLength'] <= len(binary)
policy = dict(maxTriangles=25000, maxBytes=12000000, maxTextureDimension=2048, maxMaterials=6, embeddedOnly=True)
assert triangles <= policy['maxTriangles']
assert len(raw) <= policy['maxBytes']
assert len(doc.get('materials', [])) <= policy['maxMaterials']
assert all(max(size) <= 2048 for size in images)
result = dict(file=path.name, sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw), triangles=triangles, meshes=len(doc['meshes']), materials=len(doc.get('materials', [])), textures=images, policy=policy, passed=True, validation='GLB v2 header/chunk lengths, embedded buffer/image bounds, decoded image integrity, triangle/material/texture/file budgets')
print(json.dumps(result, indent=2))
path.with_name('validation.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
