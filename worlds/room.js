/* World: Your own room
   Mixed reality. In a passthrough-capable headset the rite appears in your real space and
   this world's geometry is hidden. On a screen it shows a simple preview floor. */
VR.registerWorld({
  id: 'room',
  name: 'Your own room',
  blurb: 'Mixed reality: the rite appears in your real space on passthrough headsets. On a screen, a simple preview floor.',
  passthrough: true,
  build(ctx) {
    const g = ctx.group;
    ctx.setFog(0x14101f, 0.03);
    VR.kit.sky(g, { top: 0x0c0a14, mid: 0x14101f, horizon: 0x2a2238, glow: 0x3a3050, glowPower: 2, opposite: 0x14101f, oppositeAmount: 0, below: 0x0c0a14 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0x1c1828, roughness: .9 })); floor.rotation.x = -Math.PI / 2; g.add(floor);
    const grid = new THREE.GridHelper(40, 40, 0x6a5a8a, 0x2a2440); grid.material.transparent = true; grid.material.opacity = .35; grid.position.y = .005; g.add(grid);
    g.add(new THREE.HemisphereLight(0xcfc4ff, 0x1a1428, .7));
    return { passthrough: true, update() {} };
  }
});
