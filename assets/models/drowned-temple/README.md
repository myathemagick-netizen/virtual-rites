# Drowned Temple architecture

The generated arch was rejected visually and remains inactive. The original ruin cluster is now reused in the far background alongside the user's supplied colonnade. Original generation receipts remain below.

`user-parts.glb` contains three independently reusable meshes extracted from the user's supplied `Meshy_AI_Ancient_Ruined_Archwa_1009134850_texture_obj.zip`: full arch (2,392 triangles), pillar (993), and arch span (786). All original triangles/UVs are retained. One shared 1024-square color map, matte stone materials and runtime ripple projection serve every clone. Conversion: `scripts/import-temple-obj.mjs`; clean connected-component separation: `scripts/inspect-temple-parts.py`. Original OBJ/MTL/PNG and the unsplit conversion are preserved locally outside deployment in `../meshy-temple-sources/`. Runtime hash/budgets: `user-parts-validation.json`; source ZIP hash: `user-source-receipt.json`. No paid generation was used for this import. The unsplit conversion's historical receipt is `user-colonnade-validation.json`.

Generated through the user's connected Meshy account using Meshy 6 text-to-3D and standard 2K PBR texturing. These are generated assets, not public-domain historical artwork; redistribution follows the account's applicable Meshy terms. Prompts/settings and production notes: `docs/drowned-temple-asset-plan.md`. Stage IDs and the actual 60-credit total: `generation-receipt.json`.

The active scene loads `user-parts.glb` and `ruins.glb`. The rejected `arch.glb` is retained for reference; its generated wall was locally extracted using `scripts/extract-temple-arch.py`. Original generated runtime texture tiers use `scripts/temple-texture-tier.py`. Per-file hashes and inspection results are in their validation receipts.

All clones share model geometry/materials within one world. Materials receive the same GLSL ripple projection as procedural stone. Simplified mode skips model downloads; failed loads retain procedural assets. Late loads are disposed if the world has been left. Original 2K provider GLBs remain locally in `../meshy-temple-sources/` outside this repository.
