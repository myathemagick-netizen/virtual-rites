/* World: Sacred Grove
   A ring of old oaks under a midsummer moon, a still pool, glowing mushrooms and fireflies. */
VR.registerWorld({
  id: 'grove',
  name: 'Sacred Grove',
  blurb: 'A ring of ancient oaks under a bright moon, with a still pool, glowing fungi and fireflies.',
  build(ctx) {
    const g = ctx.group, K = VR.kit, dir = VR.dir, hash = VR.hash, MB = 200;
    ctx.setFog(0x0d2a2c, 0.026);
    K.sky(g, { top: 0x020816, mid: 0x0b2440, horizon: 0x2c6a6a, glow: 0xbfd8ff, glowBearing: MB, glowPower: 8, opposite: 0x3a1a5a, oppositeAmount: .4, below: 0x04100c });
    K.stars(g, { count: ctx.simplified ? 700 : 1600 });
    const md = dir(MB), moonPos = md.clone().multiplyScalar(420).setY(170);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 32, 16), new THREE.MeshBasicMaterial({ color: 0xeaf2ff, fog: false, toneMapped: false })); moon.position.copy(moonPos); g.add(moon);
    const halo = VR.sprite(0x9fc4ff, 120, .45); halo.position.copy(moonPos); g.add(halo);
    K.ground(g, { a: 0x0b2416, b: 0x1d4a28, center: 0x2a3a22, flatRadius: 40, rise: .02 });
    g.add(new THREE.HemisphereLight(0x6f9cff, 0x0c2014, .55));
    const ml = new THREE.DirectionalLight(0xbcd4ff, .75); ml.position.copy(moonPos); g.add(ml);

    const bark = new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 1, flatShading: true });
    const leaves = [0x1f4d2b, 0x2d6a36, 0x19402a, 0x28593a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true }));
    const crowns = [];
    for (let i = 0; i < 18; i++) {
      const b = i * 20 + hash(i) * 8, r = 14 + hash(i + 7) * 3, p = dir(b).multiplyScalar(r), h = 6 + hash(i + 3) * 3;
      const tree = new THREE.Group(); tree.position.set(p.x, 0, p.z); g.add(tree);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.35 + hash(i + 1) * .15, .7, h, 7), bark); trunk.position.y = h / 2; tree.add(trunk);
      for (let k = 0; k < 3; k++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(.08, .2, 3, 5), bark); br.position.y = h * (.55 + k * .12); br.rotation.z = (k % 2 ? 1 : -1) * .9; br.rotation.y = k * 2; br.position.x = (k % 2 ? -1 : 1) * .9; tree.add(br); }
      const crown = new THREE.Group(); crown.position.y = h; tree.add(crown); crowns.push(crown);
      for (let k = 0; k < 6; k++) { const s = 1.8 + hash(i * 7 + k) * 1.4, m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), leaves[(i + k) % 4]);
        m.position.set((hash(i + k * 3) - .5) * 4, (hash(i * 3 + k) - .2) * 2.6, (hash(i * 5 + k) - .5) * 4); crown.add(m); }
      if (!ctx.simplified) for (let k = 0; k < 3; k++) { const mp = dir(b + (k - 1) * 6).multiplyScalar(r - 1.2 - hash(i + k) * .8);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), VR.addMat(k % 2 ? 0x3fe0c0 : 0x9f7bff, .9)); cap.position.set(mp.x, .12, mp.z); g.add(cap);
        const gl = VR.sprite(k % 2 ? 0x3fe0c0 : 0x9f7bff, .8, .5); gl.position.set(mp.x, .2, mp.z); g.add(gl); }
    }
    const pb = 305, pp = dir(pb).multiplyScalar(9.5);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshStandardMaterial({ color: 0x0a2a44, metalness: .9, roughness: .08 })); pool.rotation.x = -Math.PI / 2; pool.position.set(pp.x, .04, pp.z); g.add(pool);
    const stoneM = new THREE.MeshStandardMaterial({ color: 0x6f7a78, roughness: .95, flatShading: true });
    const ns = new THREE.Mesh(new THREE.BoxGeometry(1, 2.6, .6), stoneM), np = dir(0).multiplyScalar(10); ns.position.set(np.x, 1.3, np.z); ns.rotation.y = VR.yawFor(0); ns.rotation.z = .05; g.add(ns);

    const flies = K.motes(g, { count: ctx.simplified ? 120 : 420, radius: 17, height: 5, palette: [0xd4ff6a, 0xffe66a, 0x9dff9a, 0xfff0a0], size: .13, speed: .4, opacity: .9 });
    return { update(dt, T) { flies.update(dt, T); crowns.forEach((c, i) => { c.rotation.z = Math.sin(T * .4 + i) * .015; c.rotation.x = Math.cos(T * .35 + i) * .012; }); } };
  }
});
