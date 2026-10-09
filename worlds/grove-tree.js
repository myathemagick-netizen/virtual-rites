import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Each world owns its imported tree; never share its disposable meshes or maps.
export function buildHeroTree(ctx, fallback) {
  if (ctx.simplified) return null;
  const holder = new THREE.Group();
  holder.name = 'Grove hero oak';
  holder.userData.status = 'loading';
  holder.userData.fallback = fallback;
  const position = VR.dir(185).multiplyScalar(18.5);
  holder.position.set(position.x, 0, position.z);
  ctx.group.add(holder);
  const ready = new GLTFLoader().loadAsync(VR.assetURL('assets/models/grove-oak/tree.glb')).then(gltf => {
    const tree = gltf.scene;
    if (holder.parent !== ctx.group) { VR.disposeGroup(tree); return; }
    tree.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tree), size = box.getSize(new THREE.Vector3());
    if (![size.x, size.y, size.z].every(v => Number.isFinite(v) && v > 0)) {
      VR.disposeGroup(tree); throw new Error('Invalid oak bounds');
    }
    const scale = Math.min(12 / size.y, 12 / Math.max(size.x, size.z));
    const center = box.getCenter(new THREE.Vector3());
    tree.scale.multiplyScalar(scale);
    tree.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    tree.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = false; object.receiveShadow = false;
      object.frustumCulled = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        material.metalness = 0; material.roughness = 1;
        material.emissive.setHex(0); material.emissiveIntensity = 0;
        if (material.map) material.map.anisotropy = Math.min(4, VR.renderer.capabilities.getMaxAnisotropy());
      });
    });
    holder.add(tree);
    // Its bark/leaves are shared with the ring. Keep it owned by this world
    // until normal teardown, rather than disposing those shared materials.
    if (fallback) fallback.visible = false;
    holder.userData.status = 'ready';
    holder.userData.height = size.y * scale;
    holder.userData.width = Math.max(size.x, size.z) * scale;
  }).catch(error => {
    holder.userData.status = 'fallback';
    // Existing grove trees remain usable if loading fails, including offline.
    console.warn('[Virtual Rites] hero oak unavailable; retaining procedural grove', error.message);
  });
  holder.userData.ready = ready;
  return holder;
}
