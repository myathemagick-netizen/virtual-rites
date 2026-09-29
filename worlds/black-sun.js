/* World: Temple of the Black Sun
   A surreal obsidian plane under a crimson sky. A black sun with a burning corona hangs in the east,
   gold armillary rings turn overhead, and dark monoliths drift in orbit. */
VR.registerWorld({
  id: 'black-sun',
  name: 'Temple of the Black Sun',
  blurb: 'A mirror-black plain beneath an eclipsed sun, gold rings turning overhead and monoliths adrift.',
  build(ctx) {
    const g = ctx.group, K = VR.kit, dir = VR.dir, hash = VR.hash, SB = 90;
    ctx.setFog(0x1a0612, 0.014);
    K.sky(g, { top: 0x07010a, mid: 0x2e0818, horizon: 0xa8263e, glow: 0xff7a2a, glowBearing: SB, glowPower: 3, opposite: 0x3a1070, oppositeAmount: .6, below: 0x050005 });
    K.stars(g, { count: ctx.simplified ? 300 : 700, palette: [0xffd8c8, 0xffb0c8, 0xffffff] });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x07070b, metalness: .85, roughness: .22 }));
    floor.rotation.x = -Math.PI / 2; g.add(floor);
    const grid = new THREE.GridHelper(240, 80, 0xffc53d, 0x5a2a3a); grid.material.transparent = true; grid.material.opacity = .22; grid.position.y = .01; g.add(grid);
    g.add(new THREE.HemisphereLight(0xff6a8a, 0x100010, .5));
    const cl = new THREE.DirectionalLight(0xff9a5a, .9); cl.position.copy(dir(SB)).multiplyScalar(80).setY(40); g.add(cl);
    const cool = new THREE.DirectionalLight(0x6a5aff, .35); cool.position.set(60, 50, 60); g.add(cool);

    const sunPos = dir(SB).multiplyScalar(170).setY(58);
    const core = new THREE.Mesh(new THREE.SphereGeometry(20, 48, 24), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false })); core.position.copy(sunPos); g.add(core);
    const behind = dir(SB).multiplyScalar(178).setY(60);
    [[0xff5a2a, 95, .9], [0xffd36b, 62, .8], [0xff2a6a, 140, .35]].forEach(([c, s, o]) => { const sp = VR.sprite(c, s, o); sp.position.copy(behind); g.add(sp); });
    const rays = new THREE.Group(); rays.position.copy(behind); rays.lookAt(0, 0, 0); g.add(rays);
    const rm = VR.addMat(0xffc53d, .35);
    for (let i = 0; i < 28; i++) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 60 + hash(i) * 50), rm); pl.position.y = 0; pl.geometry.translate(0, 45, 0); pl.rotation.z = i / 28 * Math.PI * 2; rays.add(pl); }

    const rings = new THREE.Group(); rings.position.y = 13; g.add(rings);
    [10, 14, 19].forEach((r, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .06 + i * .02, 8, 160), VR.addMat(i === 1 ? 0xff7ab8 : 0xffc53d, .75));
      t.rotation.x = Math.PI / 2 + (i - 1) * .35; t.rotation.y = i * .7; rings.add(t); });

    const obs = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, metalness: .9, roughness: .15 });
    const edge = new THREE.LineBasicMaterial({ color: 0xffc53d, transparent: true, opacity: .55 });
    const monos = [];
    for (let i = 0; i < 9; i++) { const m = new THREE.Group(), box = new THREE.BoxGeometry(1.5, 9, .6);
      m.add(new THREE.Mesh(box, obs), new THREE.LineSegments(new THREE.EdgesGeometry(box), edge));
      m.userData = { r: 24 + hash(i) * 18, a: i / 9 * Math.PI * 2, y: 5 + hash(i + 4) * 7, s: .02 + hash(i + 9) * .03 }; g.add(m); monos.push(m); }
    const embers = K.motes(g, { count: ctx.simplified ? 120 : 420, radius: 26, height: 12, palette: [0xff5a2a, 0xffd36b, 0xff2a6a, 0xb67cff], size: .14, speed: .6 });
    return { update(dt, T) {
      rays.rotation.z += dt * .02; rings.children.forEach((r, i) => { r.rotation.z += dt * (.04 + i * .02) * (i % 2 ? -1 : 1); });
      monos.forEach(m => { const u = m.userData; u.a += dt * u.s; m.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(T * .3 + u.r) * .8, Math.sin(u.a) * u.r); m.rotation.y += dt * .1; m.rotation.z = Math.sin(T * .2 + u.r) * .2; });
      embers.update(dt, T); } };
  }
});
