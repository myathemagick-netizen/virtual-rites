# Virtual Rites Ritual Markup

A ritual in Virtual Rites is a single JSON file in the `rituals/` folder. The engine reads it, shows it in the rite list, and performs it step by step in whichever world the practitioner chooses. You never touch the engine code to add a ritual.

This document is the complete reference. If you only want to get started, copy one of the three included rituals, change the words, and add it to `rituals/index.json`.

## Adding a ritual in four steps

1. Create a file such as `rituals/middle-pillar.json`. Use lowercase letters, numbers and hyphens in the file name.
2. Write the ritual using the structure below.
3. Add the file name to `rituals/index.json`. The order of this list is the order rites appear on the home screen.

   ```json
   ["lbrp.json", "sigil-charging.json", "daily-draw.json", "middle-pillar.json"]
   ```
4. Commit the change on GitHub. GitHub Pages republishes in a minute or two. Reload the site (on Quest, close the tab and reopen it, because the browser caches aggressively).

If a file has a JSON mistake, the home screen shows a message naming the file and the other rituals keep working. A free checker such as jsonlint.com will point to the exact line.

## The shape of a ritual file

```json
{
  "format": "virtual-rites/1",
  "id": "middle-pillar",
  "title": "The Middle Pillar",
  "summary": "One or two sentences shown on the rite card.",
  "tradition": "Hermetic Order of the Golden Dawn",
  "source": "Where the text comes from, and its license or public-domain status.",
  "duration": "about 6 minutes",
  "defaultWorld": "grove",
  "uses": [],
  "sequences": { },
  "steps": [ ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `format` | yes | Always `"virtual-rites/1"` for this version of the format. |
| `id` | yes | A unique short name, lowercase with hyphens. Used in the journal. |
| `title` | yes | Shown on the rite card, the HUD and in the journal. |
| `summary` | recommended | Shown on the rite card and the intent screen. |
| `tradition` | recommended | The lineage or school. Shown under the title. |
| `source` | recommended | Attribution. Please be honest about origin and rights. |
| `duration` | optional | Free text such as `"about 3 minutes"`. |
| `defaultWorld` | optional | A world id from `worlds/index.json`. Selected automatically when this rite is chosen. The practitioner can still pick another. |
| `uses` | optional | Modules this rite needs. `"sigil"` shows the sigil maker on the intent screen. `"tarot"` relabels the intent box as "Your question". |
| `sequences` | optional | Named groups of steps you can reuse. See below. |
| `steps` | yes | The rite itself, in order. |

## The five phases

Every step belongs to one of five structural phases, taken from the Virtual Rites ritual grammar. The Conductor groups steps by phase, and skipping a whole phase asks for one acknowledgment first.

| Value | Shown as | What it is for |
|---|---|---|
| `preparation` | Preparation | Arrival, grounding, breath, statement of intent, purification. |
| `boundary` | Boundary | Casting the circle, banishing, marking the quarters. |
| `invocation` | Invocation | Calling in powers: archangels, deities, elements, spirits. |
| `working` | The Working | The core act: charging, divination, pathworking, the operation itself. |
| `sealing` | Sealing and Release | Thanks, dismissal, closing the circle, grounding out. |

A step without a `phase` inherits the phase of the step before it. Not every rite needs all five. The LBRP has no separate working phase, and that is fine.

## Steps

```json
{
  "phase": "boundary",
  "title": "Yod Heh Vav Heh",
  "hebrew": "יהוה",
  "text": "Trace the banishing pentagram of Earth. Stab its center and vibrate the name.",
  "say": "Yod. Heh. Vav. Heh.",
  "describe": "A blue flaming pentagram is drawn in the air to the East.",
  "face": "east",
  "view": "east",
  "look": { "pitch": 0.3, "yaw": 0 },
  "camera": { "elevation": 0.5, "focus": 1.6 },
  "duration": 8,
  "hold": false,
  "optional": false,
  "actions": [ { "do": "pentagram", "quarter": "east", "type": "banishing-earth" } ]
}
```

| Field | Meaning |
|---|---|
| `phase` | One of the five phases above. |
| `title` | The large caption. Usually the spoken word or the name of the gesture. |
| `hebrew` | Optional line shown above the title in Hebrew type, right to left. Any script works. |
| `text` | The instruction shown under the title. |
| `say` | Spoken by the narrator in Guided mode. Write it phonetically if pronunciation matters: `"Ah-geh-lah."` |
| `describe` | Audio description of what appears in the space. Spoken only when the practitioner turns on Audio description, in either mode. Describe what is seen, not what to do. |
| `face` | Which way the practitioner faces: a quarter name or a compass bearing in degrees. Persists until changed. |
| `view` | Where the camera and the caption panel look, if different from `face`. The LBRP uses this so "Behind me, Gabriel" looks West while the practitioner still faces East. |
| `look` | Small gaze adjustments. `pitch` above zero looks up, below zero looks down. `yaw` turns the head: positive to the left, negative to the right. Values around 1 are a strong glance. |
| `camera` | For the witness camera. `elevation` from 0 to 1 lifts it for an overview. `focus` is the height in meters it looks at. |
| `duration` | Seconds before Guided mode moves on. Default 4.6. Multiplied by the practitioner's pace setting. |
| `hold` | `true` means Guided mode waits here until the practitioner presses Next. Use it for contemplation and for the final step. |
| `optional` | `true` means the step is left out when the practitioner sets energy to Low. |
| `actions` | What happens in the space. A list; all actions in a step start together. |

**Quarters and bearings.** Use `north`, `northeast`, `east`, `southeast`, `south`, `southwest`, `west`, `northwest`, or a number of degrees (0 north, 90 east, 180 south, 270 west). The practitioner always begins facing East.

### Templates

These placeholders are replaced in `title`, `text`, `say` and `describe`:

| Placeholder | Becomes |
|---|---|
| `{intent}` | What the practitioner wrote on the intent screen. |
| `{letters}` | The sigil's letters after reduction. |
| `{cards}` | The cards drawn by the most recent `tarot` action, e.g. "The Star" or "Three of Cups, reversed". |
| `{moon}` | The moon phase at the start of the rite, e.g. "Waxing Crescent". |
| `{hour}` | The planetary ruler of the current hour, e.g. "Venus". |
| `{day}` | The planetary ruler of the day. |
| `{sign}` | The sun's zodiac sign. |
| `{world}` | The name of the world being used. |

## Sequences: reusable groups of steps

Write a group once under `sequences`, then drop it in anywhere with `use`.

```json
"sequences": {
  "qabalistic-cross": [
    { "title": "Ateh", "actions": [ { "do": "cross", "point": "crown" } ] },
    { "title": "Malkuth", "actions": [ { "do": "cross", "point": "descend" } ] }
  ]
},
"steps": [
  { "use": "qabalistic-cross", "phase": "preparation" },
  { "use": "qabalistic-cross", "phase": "sealing", "intro": "Close with the Qabalistic Cross." }
]
```

A `use` step can set `phase` (every step inside takes that phase) and `intro` (text placed before the first step's instruction). Sequences may use other sequences, up to five levels deep.

## Actions reference

Each action is an object with a `do` field naming it, plus parameters. Every parameter is optional unless marked. Colors are CSS colors such as `"#4cc3ff"` or `"gold"`.

When the practitioner presses Repeat, a step's actions run again: pentagrams and sigils redraw, guardians who are already present glow brighter instead of appearing twice.

### Geometry and fire

**`pentagram`** draws a flaming pentagram in the air at a quarter.

| Parameter | Default | Meaning |
|---|---|---|
| `quarter` | current facing | Where it appears. |
| `type` | `banishing-earth` | `invoking-` or `banishing-` followed by `earth`, `fire`, `water` or `air`. The stroke order follows the Golden Dawn attributions: Spirit at the top point, Water upper right, Air upper left, Fire lower right, Earth lower left. |
| `color` | `#4cc3ff` | Flame color. |
| `name` | none | `{ "he": "יהוה", "latin": "Yod Heh Vav Heh" }`. Shown above the pentagram after it is traced. Either part may be left out. |
| `vibrate` | none | A frequency in hertz. A vowel-formant drone sounds as the name is vibrated, and controllers pulse. 70 to 120 sounds like a human chest voice. |
| `radius`, `height`, `size` | 3.2, 1.6, 0.85 | Distance from center, height of its center, and size, in meters. |
| `traceTime` | 3.4 | Seconds to trace it. |
| `key` | the quarter | Give two pentagrams in the same quarter different keys to keep both. |

**`line`** draws a line of fire around the circle.

| Parameter | Default | Meaning |
|---|---|---|
| `from`, `to` | current facing | Start and end quarters. If they are the same, the line goes all the way around. |
| `direction` | sunwise | `"widdershins"` draws counterclockwise. |
| `degrees` | computed | Override the sweep angle directly. Negative is counterclockwise. |
| `turn` | false | `true` turns the practitioner along with the line. |
| `color` | white | Line color. |
| `duration` | 2.8 | Seconds. |
| `radius`, `height` | 3.2, 1.6 | Meters. |

**`chaosphere`** draws the eight-rayed Chaos Star in the air in front of the practitioner, one arrow at a time, each in a different octarine color, with a small circle at the center. The arrows keep shimmering once drawn.

| Parameter | Default | Meaning |
|---|---|---|
| `quarter` | current facing | Where it appears. |
| `colors` | octarine palette | A list of up to eight colors, one per arrow. |
| `size` | 0.95 | Length of each arrow in meters. |
| `radius`, `height` | 2.8, 1.7 | Distance in front of the practitioner and height of the center. |
| `rayTime` | 0.45 | Seconds to draw each arrow. |
| `vibrate` | none | A frequency in hertz sounded once the star is complete. |
| `key` | the quarter | Give two stars in one quarter different keys to keep both. |

`flare` accepts `"target": "chaosphere"`, and `clear` accepts it too.

**`hexagram`** forms a turning six-rayed star around the practitioner at chest height. Parameters: `color` (default gold), `radius` (1.35), `height` (1.25), `chord` (a list of frequencies, or `false` for silence).

**`cross`** builds the Qabalistic Cross on the practitioner's body, one point at a time. Parameter `point` is one of `crown` (sphere above the head), `descend` (column of light into the earth), `right` (scarlet point at the right shoulder), `left` (blue point at the left shoulder, joined by a beam), `heart` (the beam extends and the heart glows), or `seal` (all points brighten). Calling it again later, as in the closing cross, brightens what is already there.

**`circle`** controls the circle on the ground.

| Parameter | Meaning |
|---|---|
| `names` | Up to four words written around the ring at East, South, West and North, in that order. Hebrew and Latin scripts both work. `[]` clears them. |
| `brightness` | 0 to 1. Around 0.2 is a faint guide, 0.45 is bright. |
| `color` | Ring color. |
| `duration` | Seconds to fade to the new brightness. Default 2. |

**`flare`** makes existing pentagrams, lines and Chaos Stars blaze brighter for a few seconds. `target` is `all` (default), `pentagrams`, `lines` or `chaosphere`.

**`clear`** fades things away. `target` is one of `all`, `pentagrams`, `lines`, `hexagram`, `cross`, `sigil`, `cards`, `guardians`, `chaosphere`, `planets` or `serpent`. `duration` in seconds, default 2. Use it in the sealing phase.

### Presences

**`guardian`** raises a tall winged figure at a quarter: an archangel, a deity, an elemental king, a spirit.

| Parameter | Default | Meaning |
|---|---|---|
| `quarter` | current facing | Where it stands. |
| `name` | none | For your own reference and the journal. |
| `colors` | white, gold | Two colors: the robe, then the wings and light. |
| `attribute` | none | What it holds: `wand`, `cup`, `sword`, `sheaf`, `orb` or `none`. |
| `wings` | true | `false` for a wingless figure. |
| `chord` | none | A list of frequencies sounded as it appears. |
| `scale` | 1 | Size. 1 is about 7 meters tall. |
| `radius` | 6.8 | Distance from center. |
| `duration` | 3 | Seconds to rise. |

**`dismiss`** lets guardians depart upward. `quarter` names one, or leave it out (or use `"all"`) for every guardian. Optional `chord` and `duration`.

### The heavens

**`planet`** places one of the seven classical planets in a ring circling the practitioner overhead, as a colored sphere labeled with its symbol. `name` is `Saturn`, `Jupiter`, `Mars`, `Sun`, `Venus`, `Mercury` or `Moon`; colors follow the planetary colors used by the timing strip. Optional `label`, `radius` (5.2), `height` (2.8), `size` (0.28). Placing a planet that is already there makes it pulse.

Use `"name": "Ouranos"` (or `"Uranus"`) for the eighth: a dark sun with a shifting octarine corona, standing outside the ring at a quarter. Optional `quarter`, `radius` (12), `height` (5.5), `size` (0.9), `label`. Placing it again makes its corona swell.

**`planets`** controls the whole ring. `speed` sets how fast it turns (0.05 is a slow drift, 0.35 is brisk) over `duration` seconds. `"mode": "withdraw"` lifts every planet away and fades it, along with the eighth unless `"eighth": false`. `clear` with `"target": "planets"` does the same.

**`serpent`** tears a riftline across the sky above the practitioner, and a scintillating octarine serpent pours through it and undulates overhead.

| `mode` | What happens |
|---|---|
| `appear` | The rift opens at `from` and the serpent flows across to `to` over `duration` seconds (default 5). |
| `charge` | It writhes faster and brighter over `duration` seconds. Optional `speed` (default 2.6). |
| `calm` | It settles back to its resting motion. |
| `withdraw` | It draws back into the rift, which then closes. |

Other parameters for `appear`: `from` (current facing) and `to` (the opposite quarter), `height` (3.2 at the ends), `arch` (3 more meters at the middle), `length` (13), `coils` (3), `sway` (1.4), `width` (0.08). `clear` with `"target": "serpent"` fades it out. At the Low intensity setting its sparkles are switched off.

### Light, breath and celebration

**`light`** changes the light at the center. `color`, `intensity` (0 to about 3, default 1), `duration` in seconds.

**`breath`** shows a ring on the ground that widens as you breathe in and narrows as you breathe out, with soft tones. `cycles` (default 3), `inhale`, `hold`, `exhale` in seconds (defaults 4, 0, 4), `color`. Set the step's `duration` to match: cycles times the sum of the three.

**`sparkle`** releases a burst of colored light from the center with rising bells. Optional `colors` (list), `speed`, `life` in seconds, and `at` as `[x, y, z]`.

### Modules

**`sigil`** works with the practitioner's sigil, made from their intent on the intent screen. Add `"uses": ["sigil"]` to the ritual so the sigil maker appears.

| `mode` | What happens |
|---|---|
| `appear` | The sigil draws itself in the air in front of the practitioner. |
| `charge` | It brightens steadily over `duration` seconds (default 10). |
| `gnosis` | It spins faster and its halo swells while the light turns rose, over `duration` seconds. |
| `release` | It bursts into sparks and vanishes. |

Other parameters: `color`, `size` (default 0.8), `distance` (2.3), `height` (1.7). If a later mode runs without `appear` first, the sigil appears automatically.

**`tarot`** draws cards from a full 78-card deck, using the browser's cryptographic randomness. Add `"uses": ["tarot"]` to the ritual.

| Parameter | Default | Meaning |
|---|---|---|
| `count` | 1 | Cards to draw, up to 10. They rise and turn over side by side. |
| `reversals` | false | `true` allows reversed cards. |
| `distance`, `height` | 1.9, 1.45 | Placement in meters. |

The draw is written to the journal automatically, and `{cards}` names the result in later steps.

### Sound

| Action | Parameters |
|---|---|
| `bell` | `freq` for one strike, or `notes` for several; `gap` seconds between them (0.35); `volume` (0.14); `delay`. |
| `chord` | `notes` (list of frequencies), `duration` (5), `volume` (0.06), `delay`. |
| `vibrate` | `freq` (98), `duration` (3.4), `delay`. A vowel-formant drone with a haptic pulse. |
| `tone` | `freq` (196), `duration` (4), `volume` (0.05), `delay`. A single soft swelling tone. |

Useful frequencies: C 261.63, D 293.66, E 329.63, F 349.23, G 392, A 440, B 493.88. Halve for an octave down.

**`wait`** does nothing. A step with only `wait`, or with no actions, simply holds for its duration.

## A complete small example

```json
{
  "format": "virtual-rites/1",
  "id": "elemental-greeting",
  "title": "Greeting the Elements",
  "summary": "Invoke each element at its quarter, sit with them, and release them.",
  "tradition": "Western elemental practice",
  "source": "Original to its author.",
  "duration": "about 2 minutes",
  "defaultWorld": "grove",
  "steps": [
    { "phase": "preparation", "title": "Arrive", "text": "Stand at the center, facing East.",
      "say": "Arrive.", "duration": 6, "actions": [ { "do": "circle", "brightness": 0.25 } ] },
    { "phase": "invocation", "title": "Air", "text": "Invoke Air in the East.", "say": "Air.", "face": "east", "duration": 6,
      "actions": [ { "do": "pentagram", "quarter": "east", "type": "invoking-air", "color": "#ffe066" } ] },
    { "phase": "invocation", "title": "Fire", "text": "Invoke Fire in the South.", "say": "Fire.", "face": "south", "duration": 6,
      "actions": [ { "do": "pentagram", "quarter": "south", "type": "invoking-fire", "color": "#ff4a2a" } ] },
    { "phase": "invocation", "title": "Water", "text": "Invoke Water in the West.", "say": "Water.", "face": "west", "duration": 6,
      "actions": [ { "do": "pentagram", "quarter": "west", "type": "invoking-water", "color": "#3d9bff" } ] },
    { "phase": "invocation", "title": "Earth", "text": "Invoke Earth in the North.", "say": "Earth.", "face": "north", "duration": 6,
      "actions": [ { "do": "pentagram", "quarter": "north", "type": "invoking-earth", "color": "#6fd34a" } ] },
    { "phase": "working", "title": "Sit with them", "text": "Feel all four around you.", "face": "east", "hold": true,
      "actions": [ { "do": "flare" } ] },
    { "phase": "sealing", "title": "Release", "text": "Thank each element and let the stars fade.", "say": "Go in peace.",
      "duration": 5, "actions": [ { "do": "clear", "target": "all" } ] },
    { "phase": "sealing", "title": "Done", "text": "The space is clear.", "hold": true }
  ]
}
```

## How the engine treats your steps

Guided mode advances each step after its `duration` (times the pace setting, and slightly longer on low energy) unless `hold` is set. Practice mode never advances on its own and doesn't narrate, though audio description still speaks if it is on. Pause fades the ambience and freezes all effects; resuming sounds a chime and a soft pulse of light.

When the Conductor jumps to a step, or a saved rite is resumed, the engine rebuilds the space by running every earlier step's actions instantly and silently, so the circle looks as it should. Skipping a phase jumps ahead without building the skipped steps. That is intentional: skipping the boundary means there really is no circle.

## Writing well for the space

Keep `title` short enough to read at a glance in a headset: a word, a name, a short phrase. Put the gesture in `text` and the sound in `say`. Write `describe` for someone who cannot see the scene, in the present tense, one sentence. Give the practitioner time: vibrated names need at least 7 seconds, a quarter turn at least 3. Test in both modes and with the Low energy setting.

## Sharing a ritual with others

Rituals are plain files, so anyone can suggest one through GitHub: fork the repository, add the file and the line in `rituals/index.json`, and open a pull request. Please include a clear `source`, and only submit material you wrote or that is in the public domain or openly licensed.
