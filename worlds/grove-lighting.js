// Opt-in prototype: every fungus stays outside the ritual ring (radius 4.3).
export function buildFungalLighting(ctx) {
  const g = ctx.group, quiet = ctx.simplified || VR.calm() || VR.reducedMotion;
  const count = ctx.simplified ? 12 : 54;
  const geometry = new THREE.SphereGeometry(.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const caps = new THREE.InstancedMesh(geometry, material, count);
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const matrix = new THREE.Matrix4(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const p = VR.dir(i * 360 / count + VR.hash(i) * 5).multiplyScalar(12.5 + VR.hash(i + 7) * 3);
    matrix.makeTranslation(p.x, .12, p.z); caps.setMatrixAt(i, matrix);
    color.set(i % 2 ? 0x3fe0c0 : 0x9f7bff).multiplyScalar(VR.fxK());
    caps.setColorAt(i, color);
    positions.set([p.x, .2, p.z], i * 3); colors.set(color.toArray(), i * 3);
  }
  caps.instanceMatrix.needsUpdate = true; caps.instanceColor.needsUpdate = true;
  g.add(caps);
  const glowGeometry = new THREE.BufferGeometry();
  glowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  glowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const glowMaterial = new THREE.PointsMaterial({ map: VR.GLOW, size: .8, vertexColors: true,
    transparent: true, opacity: quiet ? .2 : .38, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false });
  g.add(new THREE.Points(glowGeometry, glowMaterial));
  const lights = [];
  if (!quiet) for (const bearing of [70, 250]) {
    const light = new THREE.PointLight(bearing === 70 ? 0x3fe0c0 : 0x9f7bff, .35, 6, 2);
    light.position.copy(VR.dir(bearing).multiplyScalar(13.5)); light.position.y = .45;
    g.add(light); lights.push(light);
  }
  let level = .35;
  return {
    update(dt, time) {
      const still = ctx.simplified || VR.calm() || VR.reducedMotion;
      const target = still ? 0 : (.35 + Math.min(1, Math.max(0, VR.centerLight.intensity)) * .3) * VR.fxK();
      level += (target - level) * Math.min(1, dt * .8);
      lights.forEach(light => { light.intensity = level; });
      // Slow, small changes only; no pulses in quiet modes.
      glowMaterial.opacity = (still ? .2 : .34 + Math.sin(time * .35) * .035) * VR.fxK();
    }
  };
}
