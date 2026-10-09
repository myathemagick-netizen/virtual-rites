# Illustrated tarot deck

All 78 faces use historic Rider–Waite–Smith illustrations by Pamela Colman Smith, sourced from the [TaionWC collection on Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Rider-Waite-Smith_tarot_deck_(TaionWC)). Every downloaded file's Commons metadata explicitly identifies it as **Public domain**. These are historic scans, rather than artwork from a modern commercial recoloring.

`provenance.json` records each source page, license metadata, source hash, shipped hash, and dimensions. Scans are fitted without cropping into 512×884 ivory canvases and encoded as WebP quality 86. Only cards actually drawn load GPU textures; each face belongs to its card and is disposed on removal. A failed image keeps the procedural face. The existing back, meanings, reversals, draws and journal format are preserved.

`deck.json` enables the images. Set `images` to `false` to restore procedural faces. IDs remain `major-00` through `major-21`, plus `wands`, `cups`, `swords`, and `pentacles` ranks `01`–`14` (Ace–King).

The optional maintenance script `scripts/import-tarot.py` requires Pillow and network access. It checks every source's public-domain status, caches originals in ignored `asset-work/`, and regenerates optimized images and provenance. It is never part of application startup or the build.
