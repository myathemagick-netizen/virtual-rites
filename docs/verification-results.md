# Verification results

Review date: October 9, 2026. Baseline: main commit `4b2e5c1feb6d8ec1115d976bf4fdfef880fed3fe`.

The subsequent [LBRP artwork pass](ritual-artwork.md) adds a sixth browser test for flame reveal, quiet fallbacks, feather instancing and resource cleanup, with close-up captures. The table below records the initial modernization verification.

The audio exit repair adds a seventh browser regression using real Web Audio contexts. Leaving or finishing closes the complete synth graph, including looping drone/LFO sources and reverb tails, and cancels narration. Selection, journal, settings and after-rite screens cannot initialize menu audio. Beginning or resuming starts a fresh context; muted rites do not create one. The test checks context closure during sustained notes, menu/settings silence and fresh audio after resume and a new begin. Headset listening remains part of physical acceptance.

| Check | Result |
| --- | --- |
| `npm install` / locked dependencies | Three 0.186.0, Vite 8.3.4, Playwright 1.64.0; zero reported vulnerabilities |
| `npm test` | 2 tests passed: all 4 published rituals, malformed/reference/budget validation |
| `npm run build` | Passed; expected warning for the Three entry chunk (740.74 kB / 188.57 kB gzip) |
| `npm run test:smoke` | 5 tests passed against production `/virtual-rites/` in Chromium / SwiftShader |
| Desktop flow | Library selection, begin, next, repeat, first-person/witness, conductor, save/leave, reload/resume passed |
| World / effect coverage | 5 worlds in full and simplified modes; every expanded step of all 4 rituals rendered and repeated |
| Resource ownership | Mesh root cleanup, child parent detachment, deduplicated geometry, card-front disposal, shared tarot back and guardian-wing survival passed |
| Persistence | Existing `vr.*` settings and journal survived reload; progress saved/resumed |
| Failure paths | WebGL2 startup failure notice and exclusion of a malformed ritual passed |
| Physical Quest / hardware GPU / Firefox / Safari | Not performed; acceptance checklist in audit |

After warming the effect caches, six Grove/Room world-reset cycles returned to **5 geometries / 5 textures** in Practice Room. Some cached shader programs are released after further renders (8 programs at warm sample, 4 at final sample). Shared glow, tarot back and guardian wing caches are deliberately retained for the application's lifetime. These counters are not GPU byte measurements.

## Grove prototype (initial migration, before hero asset)

Measurements in one production desktop frame with the same full-mode Grove camera:

| Counter | Existing Grove | Opt-in prototype |
| --- | ---: | ---: |
| Draw calls | 349 | 189 |
| Tracked geometries | 242 | 190 |
| Tracked textures | 3 | 3 |
| Triangles | 63,002 | 56,954 |

The draw-call reduction is approximately 46%; it is not a claimed frame-rate improvement. Four forced prototype rebuilds stayed at **190 geometries / 3 textures**. The minimum new fungus radius was **12.55 m**. Low/simplified build produced **12 caps and 0 point lights**. Two local lights are used only in full animated prototype mode; no shadows or bloom pass are added.

Raw diagnostics: [world/reset counters](captures/resource-counters.json), [Grove counters](captures/grove-counters.json).

## Captures

Captured from the migrated production build. These are review captures, not r128/r186 pixel comparisons. The Grove capture hides the home overlay to show the environment; the desktop capture includes the existing ritual HUD.

![Desktop ritual](captures/desktop-rite.png)

![Opt-in Grove prototype](captures/grove-prototype.png)

No physical VR or mixed-reality screenshots are available. Refer to [the audit](modernization-audit.md) for lighting/color compatibility risks, retained tarot redraw semantics, and optional WebGPU/TSL work.

## Illustrated assets follow-up

All 78 public-domain card faces decode at 512×884, and samples render upright/reversed. The Meshy oak passes static GLB policy checks (20,489 triangles, one material, four 2K embedded images, 10.5MB). Its bounding rectangle stays more than 13m from the ritual centre; simplified mode skips the GLB. Repeated card/world teardown returns to warm GPU geometry/texture counts, and delayed/missing assets have disposal/fallback coverage.

The final local checks are **4 Node tests, production build, and 11 Playwright browser tests**. Browser coverage retains all previous ritual replay, session/journal, accessibility, WebGL failure, visual-effect and audio-exit checks. Current receipts and screenshots: [asset details](illustrated-assets.md), [GPU counters](captures/asset-resources.json). The initial Grove comparison above is historical and does not describe the added tree's cost. Physical Quest performance and VR/MR transitions remain unverified.
