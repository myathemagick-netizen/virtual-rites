# Drowned Temple architecture

Generated through the user's connected Meshy account using Meshy 6 text-to-3D and standard 2K PBR texturing. These are generated assets, not public-domain historical artwork; redistribution follows the account's applicable Meshy terms. Prompts/settings and production notes: `docs/drowned-temple-asset-plan.md`. Stage IDs and the actual 60-credit total: `generation-receipt.json`.

Deploy only `arch.glb` and `ruins.glb`: embedded assets with four 1024-square maps each. The arch was locally extracted from the generated wall using `scripts/extract-temple-arch.py`; runtime textures are produced with `scripts/temple-texture-tier.py`. Per-file hashes and inspection results are in the two validation receipts.

All clones share model geometry/materials within one world. Materials receive the same GLSL ripple projection as procedural stone. Simplified mode skips model downloads; failed loads retain procedural assets. Late loads are disposed if the world has been left. Original 2K provider GLBs remain locally in `../meshy-temple-sources/` outside this repository.
