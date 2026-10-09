# Virtual Rites

Ritual spaces you can step into, in a web browser or a VR headset. Choose a rite and a place, set an intent, and perform it guided by voice or at your own pace. Everything runs from static files on GitHub Pages, and your journal never leaves your device.

## What's here

```
virtual-rites/
├── index.html              the page
├── css/style.css
├── js/                     the engine (rarely needs editing)
│   ├── core.js             renderer, audio, settings, world kit
│   ├── effects.js          everything a ritual can "do"
│   ├── player.js           runs rituals: pause, repeat, mark, skip, save and resume
│   ├── sigil.js            Spare reduction and glyph construction
│   ├── tarot.js            78-card deck
│   ├── cosmos.js           moon phase, planetary day and hour, sun sign, festivals
│   ├── journal.js          local journal, export and import
│   └── app.js              screens, controls, VR and mixed reality
├── rituals/                one JSON file per rite
│   ├── index.json          the list shown on the home screen
│   ├── lbrp.json
│   ├── sigil-charging.json
│   └── daily-draw.json
├── worlds/                 one JS file per place
│   ├── index.json
│   ├── stonehenge.js
│   ├── grove.js
│   ├── black-sun.js
│   ├── orbit.js
│   └── room.js             mixed reality (your real room)
├── assets/tarot/           optional card images (see its README)
└── docs/
    ├── ritual-markup.md    how to write a ritual
    └── worlds.md           how to make a world
```

To add a ritual, write a file in `rituals/` and list it in `rituals/index.json`. To add a place, write a file in `worlds/` and list it in `worlds/index.json`. Nothing else needs to change.

## Development and GitHub Pages

Use Node 22.12+ (Node 24 is used in CI), then run:

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:smoke
```

The default URL includes `/virtual-rites/`. Deploy the generated `dist/` directory, rather than the source folder. In GitHub Settings → Pages choose **GitHub Actions**; the included Pages workflow builds and publishes after changes land on main. It has not been deployed as part of the migration review.

For a renamed repository, set `VITE_BASE=/your-repository/` when building. For a custom domain at the root, set `VITE_BASE=/`. Relative runtime library URLs use the same configured base. Adding worlds still uses `VR.registerWorld` and `worlds/index.json`; rebuild after adding a JavaScript world. Ritual JSON and optional tarot images remain static files.

WebGL2 is required. WebXR also requires HTTPS (or localhost) and a compatible device. See [the migration audit](docs/modernization-audit.md) for verification results and physical Quest checks.

## Controls

On a screen: Space or the right arrow for next, R to repeat the current element, M to mark a moment for the journal, P to pause, C for the Conductor, V to switch between the witness camera and first person. Drag to look around.

In a headset: trigger for next, grip to mark, thumbstick press to repeat, A or X to pause, B or Y for the Conductor panel. With single-button mode on, any button moves forward.

The Conductor shows every element of the rite grouped by phase. From it you can jump to any element, skip to the next phase (with one acknowledgment of what skipping means), save and leave to resume later, or end the rite.

## Comfort and access

Effect intensity (with a low setting that removes flashes), simplified environments, seated mode, guided pace, text size, audio description of what appears, gaze-to-continue in VR, single-button mode, and controller haptics. Energy level on the intent screen shortens and slows a rite on low days. All of it is under Comfort and access on the home screen.

## Privacy

Intents, sigils, journal entries, settings and your optional location are stored only in this browser's local storage. Nothing is sent anywhere. Export the journal from the Journal screen to keep a copy or move it to another device, and import it there.

## Credits

The Lesser Banishing Ritual of the Pentagram follows Golden Dawn material from the 1890s, in the public domain. Sigil reduction follows Austin Osman Spare's The Book of Pleasure (1913). Tarot card names follow the Rider-Waite-Smith deck (1909). Built with three.js.

## Roadmap

Things that need a small server or outside service and are planned next: AI-voiced deities and a familiar through a key-protected proxy, shared rituals with other practitioners over WebRTC, and a phone companion for sigils and outcome tracking.
