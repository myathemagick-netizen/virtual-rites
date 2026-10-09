/* World: Above the Earth
   A level observation deck with a transparent central window. Earth sits forward and below
   the viewer so its curved horizon remains visible from headset height. */
import {galaxyBand} from './orbit-sky.js';
VR.registerWorld({
  id: 'orbit',
  name: 'Above the Earth',
  blurb: 'A floating platform in orbit, the living Earth below and the Milky Way arching overhead.',
  build(ctx) {
    const g = ctx.group, K = VR.kit, dir = VR.dir;
    ctx.setFog(null);
    K.sky(g, { top: 0x000003, mid: 0x01020a, horizon: 0x040716, glow: 0x3a5aff, glowBearing: 240, glowPower: 6, opposite: 0x2a0a3a, oppositeAmount: .3, below: 0x000000 });
    K.stars(g, { count: ctx.simplified ? 1500 : 3200, full: true, size: 1.6 });
    g.add(galaxyBand(ctx.simplified));
    {
      const n = ctx.simplified?1800:7000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(.9, .3, .4)), v = new THREE.Vector3();
      const pal = [0xbfc8ff, 0xffd8f0, 0xffe7c0, 0xa8f0ff].map(c => new THREE.Color(c));
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, spread = (Math.random() + Math.random() + Math.random() - 1.5) * .16;
        v.set(Math.cos(a), spread, Math.sin(a)).normalize().multiplyScalar(540).applyQuaternion(tilt); pos.set([v.x, v.y, v.z], i * 3);
        const c = pal[i % 4], b = .45 + Math.random() * .5; col.set([c.r * b, c.g * b, c.b * b], i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false })));
    }
    const sunDir = dir(240).setY(.75).normalize();
    const sun = VR.sprite(0xfff2d8, 90, 1); sun.position.copy(sunDir.clone().multiplyScalar(520)); g.add(sun);
    const sunHalo = VR.sprite(0xffb070, 220, .35); sunHalo.position.copy(sun.position); g.add(sunHalo);
    const earthMat = new THREE.ShaderMaterial({ uniforms: { uSun: { value: sunDir }, uT: { value: 0 }, uMap:{value:null},uMapped:{value:0} },
      vertexShader: 'varying vec3 vN;varying vec3 vP;varying vec3 vW;varying vec2 vUv;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vP=position;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader: `varying vec3 vN;varying vec3 vP;varying vec3 vW;uniform vec3 uSun;uniform float uT;uniform sampler2D uMap;uniform float uMapped;varying vec2 vUv;
        float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
        float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
        void main(){vec3 p=normalize(vP);float land=smoothstep(.5,.54,fbm(p*9.));float lat=abs(p.y);
          vec3 ocean=mix(vec3(.02,.1,.32),vec3(.03,.22,.45),fbm(p*24.));vec3 ground=mix(vec3(.12,.32,.14),vec3(.5,.42,.25),smoothstep(.45,.7,fbm(p*20.+3.)));
          ground=mix(ground,vec3(.92),smoothstep(.9,.95,lat));vec3 c=mix(ocean,ground,land);
          if(uMapped>.5)c=texture2D(uMap,vUv).rgb;float cl=smoothstep(.62,.78,fbm(p*14.+vec3(uT*.02,0.,0.)));c=mix(c,vec3(1.),cl*.75);
          float d=max(dot(vN,uSun),0.);vec3 lit=c*(.18+.95*d);
          vec3 V=normalize(cameraPosition-vW);float rim=pow(1.-max(dot(vN,V),0.),2.5);
          vec3 col=lit+vec3(.25,.55,1.)*rim*(.12+d*.25);gl_FragColor=vec4(max(col,vec3(0.)),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
}` });
    const ER = 90, earth = new THREE.Mesh(new THREE.SphereGeometry(ER, ctx.simplified?48:96, ctx.simplified?32:64), earthMat); earth.position.copy(dir(90).multiplyScalar(190)).setY(-28); earth.rotation.z=.18;earth.rotation.y=2.4;earth.name='Recognizable Earth';g.add(earth);
    const earthReady=new THREE.TextureLoader().loadAsync(VR.assetURL('assets/earth/blue-marble.jpg')).then(texture=>{if(earth.parent!==g){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,VR.renderer.capabilities.getMaxAnisotropy());earthMat.uniforms.uMap.value=texture;earthMat.uniforms.uMapped.value=1;}).catch(()=>{});
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(ER + .7, ctx.simplified?48:96, 48), new THREE.MeshBasicMaterial({ color: 0x4f8cff, transparent: true, opacity: .35,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }));
    atmo.position.copy(earth.position); g.add(atmo);
    g.add(new THREE.HemisphereLight(0x8aa0ff, 0x101020, .45));
    const sl = new THREE.DirectionalLight(0xfff0dd, 1.1); sl.position.copy(sunDir).multiplyScalar(100); g.add(sl);
    const plat = new THREE.Mesh(new THREE.RingGeometry(3.3,5.4,6), new THREE.MeshStandardMaterial({ color: 0x262b45, metalness: .65, roughness: .35, flatShading: true }));
    plat.rotation.x=-Math.PI/2;plat.position.y=-.02;plat.name='Orbital deck rim';g.add(plat);
    const glass=new THREE.Mesh(new THREE.CircleGeometry(3.3,48),new THREE.MeshPhysicalMaterial({color:0x6babc4,metalness:0,roughness:.25,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));glass.rotation.x=-Math.PI/2;glass.position.y=-.03;glass.name='Earth viewing window';g.add(glass);
    for(const radius of [3.3,4.1,5.35]){const rim=new THREE.Mesh(new THREE.TorusGeometry(radius,.025,6,ctx.simplified?48:96),VR.addMat(0x7fe8ff,.35));rim.rotation.x=Math.PI/2;rim.position.y=.01;g.add(rim);}
    const top = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(5.4, 4.6, .4, 6)), new THREE.LineBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: .7 }));
    top.position.copy(plat.position); top.rotation.y = Math.PI/6; g.add(top);
    const under = VR.sprite(0x5a8cff, 14, .35); under.position.y = -1.5; g.add(under);
    const crystals=[];
    const geometries=[new THREE.TetrahedronGeometry(.85),new THREE.BoxGeometry(1.2,1.2,1.2),new THREE.OctahedronGeometry(.85),new THREE.DodecahedronGeometry(.85),new THREE.IcosahedronGeometry(.85)];
    geometries.forEach((geo,i)=>{const c=new THREE.Group();c.name=['Tetrahedron','Cube','Octahedron','Dodecahedron','Icosahedron'][i];const color=[0xffa46e,0x86e7c2,0x8bdcff,0xe9bcff,0xffdc82][i];c.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,metalness:.3,roughness:.4,flatShading:true})),new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color,transparent:true,opacity:.6})));c.userData={r:11,a:i/5*Math.PI*2,y:2.5};g.add(c);crystals.push(c);});
    return {earthReady,earth,update(dt,T){const quiet=VR.calm()||VR.reducedMotion||ctx.simplified;const step=quiet?0:dt;earth.rotation.y+=step*.003;earthMat.uniforms.uT.value=quiet?0:T;
      crystals.forEach((c, i) => { const u = c.userData; u.a += step * .012; c.position.set(Math.cos(u.a) * u.r, u.y + (quiet?0:Math.sin(T*.2+i)*.2), Math.sin(u.a) * u.r); c.rotation.y += step * .12; c.rotation.x += step * .06; }); } };
  }
});
