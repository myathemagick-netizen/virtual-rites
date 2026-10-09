import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Each world owns its imported tree; never share its disposable meshes or maps.
export function buildHeroTree(ctx, fallbacks) {
  if (ctx.simplified) return null;
  const holder = new THREE.Group();
  holder.name = 'Grove hero oak';
  holder.userData.status = 'loading';
  holder.userData.fallback = fallbacks[9];
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
    const normalize = new THREE.Matrix4().makeScale(scale, scale, scale)
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z));
    const instances = [];
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
      object.geometry.applyMatrix4(object.matrixWorld).applyMatrix4(normalize);
      const batch = new THREE.InstancedMesh(object.geometry, object.material, 18);
      batch.name = 'Varied ancient oaks';
      const matrix = new THREE.Matrix4(), position = new THREE.Vector3();
      for (let i = 0; i < 18; i++) {
        const bearing = i === 9 ? 185 : i * 20 + VR.hash(i) * 6;
        const radius = i === 9 ? 18.5 : 23 + VR.hash(i + 40) * 3;
        position.copy(VR.dir(bearing).multiplyScalar(radius));
        const variation = i === 9 ? 1 : .75 + VR.hash(i + 91) * .25;
        matrix.compose(position, new THREE.Quaternion().setFromAxisAngle(VR.UP, VR.hash(i + 55) * Math.PI * 2), new THREE.Vector3(variation, variation, variation));
        batch.setMatrixAt(i, matrix);
      }
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingBox(); batch.computeBoundingSphere();
      instances.push(batch);
    });
    instances.forEach(batch => holder.add(batch));
    // Its bark/leaves are shared with the ring. Keep it owned by this world
    // until normal teardown, rather than disposing those shared materials.
    fallbacks.forEach(fallback => { fallback.visible = false; });
    holder.userData.status = 'ready';
    holder.userData.height = size.y * scale;
    holder.userData.width = Math.max(size.x, size.z) * scale;
    holder.userData.count = 18;
  }).catch(error => {
    holder.userData.status = 'fallback';
    // Existing grove trees remain usable if loading fails, including offline.
    console.warn('[Virtual Rites] hero oak unavailable; retaining procedural grove', error.message);
  });
  holder.userData.ready = ready;
  return holder;
}
