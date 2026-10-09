# Ritual media and narration

Ritual JSON remains `virtual-rites/1`. Optional assets live in `rituals/<ritual-id>/`; `assetRoot` can select another repository-local folder. Paths must be relative, without traversal, remote URLs, encoded characters or query strings. Vite copies ritual folders to the Pages repository subpath.

Declare `assets` entries with `type` (`image`, `audio`, `video`, `model`) and `file`. A step action such as `{"do":"media","asset":"focus","id":"focus","quarter":"east","distance":3,"height":1.7,"width":1.5,"size":1.5}` displays an image. Audio accepts `volume` and `loop`; video is muted and uses a separate audio asset when needed. Models require embedded GLB v2, at most 20 MB and 100K triangles. `size` sets the largest model dimension. Animated model playback is not implemented.

Media defaults to step lifetime. `lifetime: "ritual"` persists across steps; `mediaClear` removes a specific `id` or all media. Repeating a step replaces matching IDs. Reset, exit and late asynchronous completion clean up resources. Pause cancels audio samples; repeat restarts them. Video pauses and resumes. Silent practice skips audio. Simplified mode skips models, and simplified/low-energy/reduced-motion modes use a video's optional image `poster` instead.

See `examples/media-demo.json` and `rituals/media-demo/focus.svg`. To publish the example, copy its JSON into `rituals/` and add its filename to `rituals/index.json`. Adding arbitrary files through the JSON paste UI does not upload them: custom assets must also be deployed to the repository.

## Narration fallback order

1. A step's `narration` audio asset (`descriptionAudio` for optional descriptions), or an exact-text entry in `assets/narration/manifest.json`.
2. Browser speech synthesis when a voice is available; startup failure falls through.
3. Optional local Kokoro WASM speech, enabled and prepared in Comfort and access.
4. Existing visible captions, with a message when no voice is ready.

Recorded clips work without browser TTS and need no API key at runtime. The manifest maps 98 static phrases across all four existing rites to shared MP3 files; repeated phrases reuse one file. The selected fourth ElevenLabs Daniel pilot is preserved at `assets/narration/pilot/lbrp-pronunciation.mp3`; it is a pronunciation review sample, not wired to individual steps. Actual library clips were generated separately, one take per phrase.

Local speech is experimental and off by default. Preparing it downloads the quantized Kokoro model (roughly 100 MB) plus a 21.6 MB WASM runtime. It uses a worker with one WASM thread and no WebGPU requirement. Text inference runs locally; model files are fetched from Hugging Face and browser caching is best effort. Prepare before entering XR. Desktop Chromium preparation and playback have been exercised; inference and memory/frame-time on Quest remain unverified. Recorded narration remains the preferred headset route. Dynamic personalized phrases require browser/local speech rather than fixed clips.

The generation script inventory is `assets/narration/script.json`; the entry with placeholders is marked dynamic and excluded from fixed narration generation. The approved 4,200-credit library budget produced 98 clips for 3,781 credits (USD $0.83182), collected in batches after submission. The completed pronunciation pilot cost 516 credits (USD $0.11352), across four takes; the user selected take four. Total speech spend: 4,297 credits (USD $0.94534). No sound-effect credits were spent. `generation-receipt.json` records clip generation IDs, duration and cost without temporary download credentials.

## Verification limits

Desktop automation covers asset resolution, rejection of unsafe inputs, image lifetime, quiet video posters, narration cancellation without native speech, existing ritual replay/resume and Grove disposal. The Grove now renders 18 rotated/scaled oak instances sharing one geometry and texture set; simplified mode retains procedural trees. Instancing reduces draws and shared resource memory, but still renders roughly 369K oak triangles before the rest of the scene. Physical Quest testing must measure frame time, texture memory, local speech startup/inference, XR audio unlock, headset pause/resume, video codecs and MR visibility.

`npm audit` reports six moderate findings in the local speech dependency tree after overriding Sharp to 0.35.5. They trace to the `sprintf-js` unbounded precision denial-of-service advisory through ONNX's Node proxy/logger dependencies, rather than the browser speech worker. A safe compatible dependency update still needs review before production release; build and smoke success do not establish dependency security. Browser WASM speech uses the published Kokoro implementation: https://github.com/hexgrad/kokoro/tree/main/kokoro.js .
