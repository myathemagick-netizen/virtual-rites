# Drowned Temple Meshy asset plan

Status: generated and evaluated, then rejected visually by the user. Procedural arches and ruins are restored in the active scene. The generated files remain for reference; no new generation is authorized. The approved Meshy 6 jobs consumed 60 credits. Task IDs and stage costs are in `assets/models/drowned-temple/generation-receipt.json`.

The text-generated arch included unwanted wall geometry. A local extraction retains the open surround (836 triangles), preserves UVs and removes the threshold obstruction. It is fitted to an 8.6m span, 3.8m height and 1m depth above perimeter pillars. The ruin cluster has 9,301 triangles; 18 clones share its geometry/textures and vary rotation/scale. The runtime tier downsamples the generated 2K maps to 1024, approximately halving GLB download sizes. Original provider files are preserved locally outside the deployable repository in `../meshy-temple-sources/`. Future architectural generations should use an approved reference drawing to avoid the wall interpretation. No extra charged takes or optimizations were run.

Runtime: Three.js WebGLRenderer, embedded textured GLB, shared geometry/materials across clones, existing procedural simplified fallback. Keep every asset outside the 13.5m ritual floor. Inspect bounds, aperture, triangle count and texture memory before placement; never automatically regenerate a rejected asset.

## Weathered arch

Target: approximately 7m wide, 5m high, 1m deep; open aperture at least 4m wide. Place above existing perimeter pillars, preserving the radial layout. Target 12,000 triangles.

Geometry prompt: One isolated ancient underwater temple stone arch span, semicircular segmented masonry voussoirs with an open empty passage underneath, flat mounting ends on both sides, no supporting columns, no wall, no ground base. Thick aged limestone blocks, chipped irregular edges, shallow eroded geometric carvings, realistic construction and readable silhouette. Broad front faces, approximately seven meters wide and five meters tall, one meter deep. No plants, floating particles, water, text or surrounding scene. Game environment architectural asset.

Texture prompt: Pale grey blue limestone, natural mineral grain, pitting, subtle green algae in crevices, water-worn carvings, restrained color variation, matte rough stone. No baked lighting, emissive glow or painted shadows.

## Broken ruin cluster

Target: approximately 6m wide, 7m high, 4m deep. Place at 30–55m with varied rotation/scale. Target 10,000 triangles.

Geometry prompt: One compact isolated ancient underwater temple ruin cluster, two fractured stone columns of different heights with a broken lintel segment and a few fallen masonry blocks at their feet. Uneven chipped limestone, erosion, shallow geometric carvings, credible heavy construction, coherent low footprint, detailed readable silhouette from all sides. Tallest column approximately seven meters, cluster six meters wide and four meters deep. No full building, solid enclosing wall, ground plane, vegetation, water, particles, text or surrounding scene. Game environment prop.

Texture prompt: Grey blue limestone matching an ancient submerged sanctuary, mineral speckling, worn edges, subtle green algae concentrated in recesses, matte roughness, no baked lighting or shadows.

## Proposed spend

Meshy MCP quotes text-to-3D Meshy 6 at 20 credits/model and standard 2K PBR refinement at 10 credits/model: 60 credits for two complete assets. Meshy 5 is the previous generation at 5+10 credits/model: 30 total. GLB only, triangle topology, generation-time remeshing to the targets above. No 8K textures, extra takes or separate paid optimization. Submitted prompts/settings leave the local environment for Meshy. Actual consumed credits and task IDs will be saved after authorization.
