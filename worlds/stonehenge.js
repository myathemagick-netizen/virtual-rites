/* World: Stonehenge before dawn
   Sarsen circle with lintels, trilithon horseshoe opening to the northeast, bluestones,
   altar, slaughter and heel stones on the solstice sunrise line. */
VR.registerWorld({
  id: 'stonehenge',
  name: 'Stonehenge',
  blurb: 'The sarsen circle before dawn, with aurora overhead and the Heel Stone on the sunrise line.',
  build(ctx) {
    const g = ctx.group, K = VR.kit, dir = VR.dir, yaw = VR.yawFor, hash = VR.hash;
    ctx.setFog(0x3a1a58, 0.011);
    K.sky(g, { top: 0x09051f, mid: 0x33104f, horizon: 0xdb3d78, glow: 0xff9440, glowBearing: 51, opposite: 0x1a8c9e });
    K.stars(g, { count: ctx.simplified ? 900 : 2200 });
    let aur = null;
    if (!ctx.simplified) {
      aur = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
        vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: `varying vec2 vUv;uniform float uT;void main(){float w=sin(vUv.x*18.+uT*.35)*.5+.5;float w2=sin(vUv.x*43.-uT*.6)*.5+.5;
          float band=smoothstep(0.,.25,vUv.y)*pow(1.-vUv.y,1.6)*(.45+.55*w)*(.6+.4*w2);float edge=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);
          vec3 c=mix(vec3(.15,1.,.75),vec3(.95,.3,.9),smoothstep(.15,.9,vUv.y+.2*sin(vUv.x*6.+uT*.2)));gl_FragColor=vec4(c*band*edge*.55,1.);}` });
      [[330, 300, 70], [250, 320, 95]].forEach(([b, r, h], k) => { const geo = new THREE.PlaneGeometry(1, 1, 96, 1), p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), d = dir(b + x * 80), rr = r + Math.sin(x * 9 + k) * 20; p.setXYZ(i, d.x * rr, h + (y + .5) * 70, d.z * rr); }
        g.add(new THREE.Mesh(geo, aur)); });
    }
    K.ground(g, { a: 0x14352a, b: 0x27503a, center: 0x3b3f36 });
    const bank = new THREE.Mesh(new THREE.TorusGeometry(52, 2.4, 8, 120), new THREE.MeshStandardMaterial({ color: 0x23493a, roughness: 1, flatShading: true }));
    bank.rotation.x = -Math.PI / 2; bank.scale.z = .3; g.add(bank);
    g.add(new THREE.HemisphereLight(0x9a86ff, 0x16302a, .6));
    const sun = new THREE.DirectionalLight(0xff9f6a, 1.25); sun.position.copy(dir(51)).multiplyScalar(60).setY(10); g.add(sun);
    const moon = new THREE.DirectionalLight(0x6f8cff, .45); moon.position.set(40, 60, 50); g.add(moon);

    const mats = [0x8c879a, 0x7b7788, 0x96908b, 0x6e6a7c, 0x85807a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .95, flatShading: true }));
    let seed = 1;
    function stoneGeo(w, h, d, sd, rough) {
      const geo = new THREE.BoxGeometry(w, h, d, 2, 4, 2), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const kx = Math.round(x * 100), ky = Math.round(y * 100), kz = Math.round(z * 100);
        const r1 = hash(kx * .37 + ky * 1.13 + kz * 2.71 + sd * 13.1), r2 = hash(kx * 1.91 + ky * .53 + kz * .77 + sd * 7.7), r3 = hash(kx * .61 + ky * 2.3 + kz * 1.37 + sd * 3.3), t = y / h + .5;
        x = (x + (r1 - .5) * rough * w) * (1 - .1 * t); y = y + (r2 - .5) * rough * h * .25; z = (z + (r3 - .5) * rough * d) * (1 - .1 * t); p.setXYZ(i, x, y, z); }
      geo.computeVertexNormals(); geo.translate(0, h / 2, 0); return geo;
    }
    function stone(w, h, d, pos, yw, o = {}) {
      const m = new THREE.Mesh(stoneGeo(w, h, d, seed, o.rough ?? .14), mats[seed % mats.length]); seed++;
      m.position.set(pos.x, o.y || 0, pos.z); m.rotation.y = yw; if (o.lean) m.rotation.z = o.lean; g.add(m); return m;
    }
    const missing = new Set([8, 9, 15, 18, 19, 23, 24, 27]), ups = [];
    for (let i = 0; i < 30; i++) { const b = i * 12; if (missing.has(i)) { ups.push(0); continue; } const h = 4 + hash(i) * .5; stone(2.1, h, 1.1, dir(b).multiplyScalar(15), yaw(b), { lean: (hash(i + 3) - .5) * .04 }); ups.push(h); }
    for (let i = 0; i < 30; i++) { const j = (i + 1) % 30; if (ups[i] && ups[j] && hash(i + 40) > .2) { const b = i * 12 + 6; stone(3.35, .75, 1.05, dir(b).multiplyScalar(14.95), yaw(b), { y: Math.min(ups[i], ups[j]) - .15, rough: .06 }); } }
    stone(2, 1, 4.2, dir(112).multiplyScalar(18), yaw(112) + .4); stone(1.9, .9, 3.8, dir(300).multiplyScalar(17.5), yaw(300) - .3);
    [{ b: 230, r: 8.3, h: 7.3 }, { b: 180, r: 8.4, h: 6.4 }, { b: 280, r: 8.4, h: 6.4 }, { b: 130, r: 9.1, h: 5.8 }, { b: 330, r: 9.1, h: 5.8 }].forEach(t => {
      const c = dir(t.b).multiplyScalar(t.r), tg = dir(t.b + 90); [-1.15, 1.15].forEach(s => stone(2, t.h, 1.3, c.clone().addScaledVector(tg, s), yaw(t.b)));
      stone(4.9, .95, 1.2, c, yaw(t.b), { y: t.h - .15, rough: .06 }); });
    for (let i = 0; i < 40; i++) { if (hash(i + 50) < .22) continue; const b = i * 9 + hash(i + 60) * 3, h = 1.3 + hash(i + 70);
      stone(.75, h, .55, dir(b).multiplyScalar(11.6), yaw(b) + (hash(i + 80) - .5) * .4, { lean: (hash(i + 90) - .5) * .16 }); }
    stone(4.8, .5, 1, dir(232).multiplyScalar(5.2), yaw(232) + Math.PI / 2, { rough: .08 });
    stone(2.4, 4.8, 2.1, dir(51).multiplyScalar(70), yaw(51), { lean: .12, rough: .24 });
    stone(2.1, .6, 6, dir(51).multiplyScalar(26), yaw(51), { rough: .1 });

    const motes = K.motes(g, { count: ctx.simplified ? 150 : 650, radius: 24 });
    return { update(dt, T) { if (aur) aur.uniforms.uT.value = T; motes.update(dt, T); } };
  }
});
