# Three.js r186 modernization audit

Reviewed `main` at `4b2e5c1feb6d8ec1115d976bf4fdfef880fed3fe`. Work is on `modernization/three-r186`. The migration retains `WebGLRenderer`; there is no WebGPU renderer or TSL conversion.

## Phase 1 findings and changes

| Area | Finding | Change / remaining risk |
| --- | --- | --- |
| Boot and libraries | CDN r128 global scripts depend on order; worlds are loaded through injected scripts. | Exact npm pin `three@0.186.0`, locked Vite dependencies, ES module entry point, ordered module imports, Vite world module discovery. `window.VR`, `THREE`, `VR.registerWorld`, world ordering and JSON manifests remain available. New JS worlds require a rebuild. |
| Pages / assets | Library fetches and optional tarot images need to work under a repository path. | Default base `/virtual-rites/`, configurable `VITE_BASE`, common asset URL helper. Build copies ritual JSON, world index and optional images; JS worlds are bundled. CI smoke tests serve the built repository subpath. Pages workflow deploys `dist`; repository Pages must be set to GitHub Actions. |
| Color | `outputEncoding`, `texture.encoding`, `sRGBEncoding` are obsolete. | Use `outputColorSpace`, `texture.colorSpace`, `SRGBColorSpace`. Canvas and optional card image color textures are tagged sRGB. White glow mask remains a linear mask. ACES, exposure, additive blending and transparent renderer retained. Modern linear color management and lighting can change perceived brightness; exact r128 pixel parity is not claimed. |
| Shaders | Sky, aurora, Earth, beams and serpent use GLSL `varying` / `gl_FragColor`. | Existing GLSL bodies retained. WebGLRenderer adapts ShaderMaterial GLSL for WebGL2; browser tests render the worlds and replay effects with shader/action failures treated as failures. No blanket color-output chunk insertion: additive effects and procedural sky need individual visual calibration before changing their output behavior. |
| Lighting | r128 defaults predate physically correct lighting changes. | Existing light parameters retained to avoid arbitrary global retuning. Point-light falloff, hemisphere / directional brightness, PBR ground and emissive appearance need visual acceptance on real GPUs and Quest. Adding `Math.PI` to every light would not restore point-light attenuation. |
| Geometry / materials | Cleanup pops child arrays directly, leaves parent links, misses Mesh roots and disposes shared geometry/material references repeatedly. | Traverse the root, deduplicate resources within cleanup, use `clear()` for child parent links, handle material arrays, material texture slots and texture uniforms. Keep Three's shared Sprite geometry. Dispose instancing buffers explicitly. Resources shared between separately owned groups still require explicit ownership. |
| Texture caches | Glow is exempted but cached tarot backs and guardian wings are disposed when individual owners are removed. A `material.userData.shared` flag is ignored by cleanup. | Explicit application-lifetime shared texture registry covers glow, tarot back and wing texture. Card fronts remain independently owned. Late card image callbacks dispose the arriving texture if the material was removed. |
| Effect lifecycle | Reset can dispose objects with live tween closures. | Finish pending tweens before clearing effect resources. Resume fast-forward restores the prior silent state with `finally`. Resume index is clamped to existing expanded steps. |
| Ritual validation | Missing or cyclic sequences, malformed action arrays and arbitrary line segment budgets can reach playback. | Validate format, required identity, steps, reference existence/cycles/depth, expansion budget, text/array size, finite values, unsafe object keys, recognized action names and selected action field types. Limit explicit line degrees to 3600. Invalid files are excluded with existing error notices; valid `virtual-rites/1` files are unchanged. This is defensive validation, not a full schema for every optional action parameter. |
| XR | Uses `local-floor`, optional bounded floor / hand tracking, session start/end, controller select/squeeze, button polling, gaze and canvas captions. | These APIs, seated offset, controller bindings, haptics, caption/conductor and passthrough scene visibility remain in place. Physical session and device behavior are unverified. `Clock` was replaced by a bounded performance timestamp delta. |
| Persistence / access | Settings, journal, progress and sigils use `vr.*` browser storage. | Existing keys and journal format remain. Automated tests cover persisted settings/journal and reload/resume; controls and all preexisting access options remain. New prototype setting defaults off. Storage requires the same browser and origin as before. |
| Browser support | Modern Three no longer supports WebGL1. | WebGL2, ES modules and a current browser required. Startup failures display an accessible notice and retain storage. WebXR requires a secure context and device support; desktop tests do not validate immersive sessions. Fonts still load externally with existing serif fallbacks. |

## Validation and practical limits

Commands: `npm ci`, `npm test`, `npm run build`, `npx playwright install chromium`, `npm run test:smoke`.

Node validation tests cover all four unchanged ritual JSON files and malformed, cyclic, missing, unsafe and oversized input. Production Chromium smoke tests cover all five worlds in full/simplified modes, all four expanded rituals and their effects, repeat, reconstructed resume, UI begin/next/repeat/camera/save-and-leave/reload/resume, root disposal, shared tarot ownership, local journal/settings storage and Grove prototype fallbacks. Runtime errors, shader errors and swallowed action failures fail the main smoke test. CI uploads screenshots, JSON counters and the Playwright report.

Desktop tests use software WebGL2 (SwiftShader). They prove rendering and application flow in that environment, not hardware performance, visual equivalence to r128, stereo comfort or cross-browser certification. `renderer.info` counts live tracked resources and draw calls, not GPU bytes or frame timing. Renderer/internal and intentionally shared cache resources need not return to zero; repeated warmed world/reset cycles must not grow geometries or textures.

The Three entry chunk is about 741 kB (189 kB gzip). Vite emits the expected >500 kB chunk warning. Worlds/application modules are split; no extra renderer dependency is bundled. npm install reports zero known vulnerabilities for the locked tree at review time.

An existing semantic limitation remains: the tarot action draws fresh random cards on repeat and on fast-forward reconstruction, and appends another draw record. The migration preserves that behavior. Smoke tests verify successful reconstruction and storage, not identical tarot cards across replay. Deterministic per-step draws require a separate session-format decision.

Screenshots and actual measured counters are recorded in [verification results](verification-results.md).

## Physical Quest acceptance checklist

- Load the built HTTPS Pages URL on Quest Browser; check both eyes, shader output, text/font readability, brightness and depth ordering in every world.
- Enter/exit VR repeatedly, including headset sleep, lost focus, interruption and session rejection. Check seated local-floor height, recentering, rig reset and desktop return.
- Trigger next, grip mark, stick repeat, A/X pause, B/Y conductor; test single-button mode, gaze dwell/cooldown, haptic pulse and unsupported hand/controller combinations.
- Run guided narration/audio and pause/resume under headset audio policies. Compare Hebrew captions, enlarged text and audio description; verify low intensity removes existing flashes.
- Enter mixed reality in Practice Room: passthrough alpha, hidden scenery, no fog, retained ritual geometry, captions/controllers, exit and restored desktop world. Test denied passthrough permissions.
- Save/reload/resume LBRP, sigil charging, tarot and Ouranos on the same Pages origin; check restored effects and stable card results as well as journal export/import.
- Observe frame rate, thermal behavior and memory over a sustained session, repeated world changes and effect replay. Compare full/simplified and prototype off/on; desktop draw-call counts are not headset FPS.

## Phase 2 opt-in Grove prototype

Implemented only after the initial Phase 1 production desktop smoke test passed. Enable **Grove lighting prototype** in Comfort and access; default is off. Existing Grove remains the default.

Fungal caps use one InstancedMesh and one batched glow Points object instead of individual meshes/sprites. New geometry is at radius 12.5–15.5 m, outside the circle, pentagrams and guardian area. Two nonshadowed short-range point lights respond slowly to the center light; their intensity is bounded and eased rather than pulsed. Fog density is reduced to .018 (.012 for low/simplified). Low intensity, reduced-motion preference and simplified mode freeze prototype world motion and remove responsive illumination; simplified mode builds twelve caps instead of fifty-four. No bloom pass or render target is added.

Changing intensity while the prototype is loaded immediately stops motion and eases response to zero; entering quiet modes at build time creates no point lights. The existing simplified toggle reloads the world. Low mode remains available without creating a new ritual format or obstructing ritual geometry.

## Optional WebGPU / TSL follow-up (not implemented)

Use a separate experiment with capability detection and WebGL fallback. Port procedural sky/aurora/Earth and additive beam/serpent effects one at a time, with color-space reference captures and alpha/depth tests. Confirm WebXR support on the target browser before selecting WebGPU for immersive sessions. Profile actual Quest runs before adding bloom, clustered lighting or postprocessing. Do not replace the established renderer or shader pipeline solely to adopt a newer API.

References: [Three migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide), [color management](https://threejs.org/manual/en/color-management.html), [renderer diagnostics](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info).

## Changed files

- Build/deploy: `package.json`, `package-lock.json`, `vite.config.js`, `.gitignore`, `index.html`, `.github/workflows/verify.yml`, `.github/workflows/pages.yml`.
- Runtime: `js/main.js`, `js/validation.js`, `js/core.js`, `js/app.js`, `js/player.js`, `js/tarot.js`, `js/effects.js`.
- Prototype: `worlds/grove.js`, `worlds/grove-lighting.js`.
- Verification: `playwright.config.js`, `tests/validation.test.js`, `tests/browser/smoke.spec.js`.
- Documentation: `README.md`, `docs/worlds.md`, this audit and verification results/captures.

Ritual JSON files, journal module, cosmos module, sigil module, CSS and the other world definitions are unchanged.
