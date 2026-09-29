# Tarot card images (optional)

Virtual Rites draws its own simple card faces. To use real card art instead, put 78 images in this folder and turn them on.

The Rider-Waite-Smith deck, illustrated by Pamela Colman Smith and published in 1909, is in the public domain in the United States. Scans are available from Wikimedia Commons and other public archives. Check the rules where you live before redistributing.

## File names

Name each file by its card id, all lowercase:

- Major arcana: `major-00.jpg` (The Fool) through `major-21.jpg` (The World)
- Minor arcana: the suit, a hyphen, and the rank from `01` (Ace) to `10`, then `11` Page, `12` Knight, `13` Queen, `14` King. For example `wands-01.jpg`, `cups-12.jpg`, `swords-14.jpg`, `pentacles-07.jpg`.

Images around 500 by 860 pixels look good and keep the download small.

## Turning them on

Edit `deck.json` in this folder:

```json
{ "images": true, "ext": "jpg" }
```

Use `"ext": "png"` or `"webp"` if your files are in that format. Any missing image falls back to the drawn card.
