# Making a World

A world is the place a rite happens: Stonehenge, a grove, a temple, orbit. Each one is a single JavaScript file in `worlds/`. Worlds only build scenery. The circle, pentagrams, guardians and every other ritual effect are drawn by the engine on top of whatever world is chosen, so any rite works in any world.

## Adding a world

1. Create `worlds/my-world.js`.
2. Add `"my-world.js"` to `worlds/index.json`. The order of the list is the order on the home screen.
3. Commit. The world appears under "Choose a place". A ritual can make it the default with `"defaultWorld": "my-world"`.

## The contract

```js
VR.registerWorld({
  id: 'my-world',                 // unique, lowercase, used by rituals' defaultWorld
  name: 'My World',               // shown on the chip
  blurb: 'One sentence describing the place.',
  build(ctx) {
    const g = ctx.group;          // add everything to this group
    ctx.setFog(0x102030, 0.02);   // or ctx.setFog(null) for none
    VR.kit.sky(g, { top: 0x000010, horizon: 0x305070, glow: 0xffc080, glowBearing: 90 });
    VR.kit.stars(g, { count: ctx.simplified ? 600 : 1800 });
    VR.kit.ground(g, { a: 0x203020, b: 0x304830 });
    g.add(new THREE.HemisphereLight(0x8090ff, 0x102010, .6));
    const motes = VR.kit.motes(g, { count: ctx.simplified ? 100 : 400 });
    return { update(dt, T) { motes.update(dt, T); } };  // called every frame
  }
});
```

`build` is called whenever the world is chosen. Everything you add to `ctx.group` is removed and disposed automatically when another world is chosen, so no cleanup code is needed.

Respect `ctx.simplified`: when the practitioner turns on Simplified environment, use fewer particles and less motion. Keep the area within about 7 meters of the center clear, since that is where the circle, pentagrams (3.2 m) and guardians (6.8 m) appear. The practitioner stands at the origin facing East, which is the -Z direction. `VR.dir(bearing)` gives a unit vector toward any compass bearing, and `VR.yawFor(bearing)` gives the rotation that faces it.

Set `passthrough: true` on a world meant for mixed reality; its scenery is hidden when a passthrough session starts. The included `room.js` is the model.

## The world kit

| Helper | What it makes |
|---|---|
| `VR.kit.sky(g, opts)` | A gradient sky dome. `top`, `mid`, `horizon`, `below` colors; a horizon `glow` aimed at `glowBearing` with `glowPower` (higher is tighter); an `opposite` glow with `oppositeAmount`. |
| `VR.kit.stars(g, opts)` | A star field. `count`, `radius`, `size`, `palette`, `full: true` for stars below the horizon too. |
| `VR.kit.ground(g, opts)` | A large ground plane with color variation. `a` and `b` colors, `center` tint, `flatRadius` before hills begin, `hills: false` for flat. |
| `VR.kit.motes(g, opts)` | Drifting glowing particles. Returns an object whose `update(dt, T)` you call each frame. `count`, `radius`, `height`, `palette`, `size`, `speed`, `opacity`. |
| `VR.sprite(color, size, opacity)` | A soft glowing point. |
| `VR.addMat(color, opacity)` | An additive glowing material. |
| `VR.hash(n)` | A repeatable pseudo-random number from 0 to 1, for placing things the same way every time. |

Three.js r128 is available as the global `THREE`. Keep a world under a few thousand objects so it runs smoothly on a standalone headset.
