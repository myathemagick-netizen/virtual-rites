/* World: Above the Earth
   A hexagonal platform in low orbit. The Earth fills the lower view, its horizon curving
   about 14 degrees below eye level, turning slowly beneath you. The Milky Way arches overhead. */
VR.registerWorld({
  id: 'orbit',
  name: 'Above the Earth',
  blurb: 'A floating platform in orbit, the living Earth below and the Milky Way arching overhead.',
  build(ctx) {
    const g = ctx.group, K = VR.kit, dir = VR.dir;
    ctx.setFog(null);
    K.sky(g, { top: 0x000003, mid: 0x01020a, horizon: 0x040716, glow: 0x3a5aff, glowBearing: 60, glowPower: 6, opposite: 0x2a0a3a, oppositeAmount: .3, below: 0x000000 });
    K.stars(g, { count: ctx.simplified ? 1500 : 3200, full: true, size: 1.6 });
    if (!ctx.simplified) {
      const n = 5000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(.9, .3, .4)), v = new THREE.Vector3();
      const pal = [0xbfc8ff, 0xffd8f0, 0xffe7c0, 0xa8f0ff].map(c => new THREE.Color(c));
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, spread = (Math.random() + Math.random() + Math.random() - 1.5) * .16;
        v.set(Math.cos(a), spread, Math.sin(a)).normalize().multiplyScalar(540).applyQuaternion(tilt); pos.set([v.x, v.y, v.z], i * 3);
        const c = pal[i % 4], b = .25 + Math.random() * .5; col.set([c.r * b, c.g * b, c.b * b], i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.3, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false })));
    }
    const sunDir = dir(60).setY(.75).normalize();
    const sun = VR.sprite(0xfff2d8, 90, 1); sun.position.copy(sunDir.clone().multiplyScalar(520)); g.add(sun);
    const sunHalo = VR.sprite(0xffb070, 220, .35); sunHalo.position.copy(sun.position); g.add(sunHalo);
    const earthMat = new THREE.ShaderMaterial({ uniforms: { uSun: { value: sunDir }, uT: { value: 0 } },
      vertexShader: 'varying vec3 vN;varying vec3 vP;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vP=position;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader: `varying vec3 vN;varying vec3 vP;varying vec3 vW;uniform vec3 uSun;uniform float uT;
        float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
        float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
        void main(){vec3 p=normalize(vP);float land=smoothstep(.5,.54,fbm(p*9.));float lat=abs(p.y);
          vec3 ocean=mix(vec3(.02,.1,.32),vec3(.03,.22,.45),fbm(p*24.));vec3 ground=mix(vec3(.12,.32,.14),vec3(.5,.42,.25),smoothstep(.45,.7,fbm(p*20.+3.)));
          ground=mix(ground,vec3(.92),smoothstep(.9,.95,lat));vec3 c=mix(ocean,ground,land);
          float cl=smoothstep(.55,.72,fbm(p*14.+vec3(uT*.02,0.,0.)));c=mix(c,vec3(1.),cl*.75);
          float d=max(dot(vN,uSun),0.);vec3 lit=c*(.08+1.05*d);
          vec3 city=vec3(1.,.75,.35)*land*(1.-cl)*smoothstep(.6,.66,fbm(p*60.))*smoothstep(.15,0.,d)*.8;
          vec3 V=normalize(cameraPosition-vW);float rim=pow(1.-max(dot(vN,V),0.),2.5);
          vec3 col=lit+city+vec3(.25,.55,1.)*rim*(.3+d);gl_FragColor=vec4(pow(max(col,vec3(0.)),vec3(1./2.2)),1.);}` });
    const ER = 500, earth = new THREE.Mesh(new THREE.SphereGeometry(ER, 160, 100), earthMat); earth.position.set(0, -ER - 15, 0); earth.rotation.z = .5; g.add(earth);
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(ER + 5, 96, 48), new THREE.MeshBasicMaterial({ color: 0x4f8cff, transparent: true, opacity: .35,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }));
    atmo.position.copy(earth.position); g.add(atmo);
    g.add(new THREE.HemisphereLight(0x8aa0ff, 0x101020, .45));
    const sl = new THREE.DirectionalLight(0xfff0dd, 1.1); sl.position.copy(sunDir).multiplyScalar(100); g.add(sl);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 4.6, .4, 6), new THREE.MeshStandardMaterial({ color: 0x262b45, metalness: .65, roughness: .35, flatShading: true }));
    plat.position.y = -.2; plat.rotation.y = Math.PI / 6; g.add(plat);
    const top = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(5.4, 4.6, .4, 6)), new THREE.LineBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: .7 }));
    top.position.copy(plat.position); top.rotation.y = plat.rotation.y; g.add(top);
    const under = VR.sprite(0x5a8cff, 14, .35); under.position.y = -1.5; g.add(under);
    const crystals = [];
    for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(.5 + VR.hash(i) * .5, 0), VR.addMat([0x7fe8ff, 0xb67cff, 0xffd36b, 0xe0408a][i % 4], .6));
      c.userData = { r: 9 + VR.hash(i + 2) * 6, a: i / 7 * Math.PI * 2, y: 1 + VR.hash(i + 5) * 5 }; g.add(c); crystals.push(c); }
    return { update(dt, T) { earth.rotation.y += dt * .003; earthMat.uniforms.uT.value = T;
      crystals.forEach((c, i) => { const u = c.userData; u.a += dt * .05; c.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(T * .5 + i) * .4, Math.sin(u.a) * u.r); c.rotation.y += dt * .6; c.rotation.x += dt * .3; }); } };
  }
});
