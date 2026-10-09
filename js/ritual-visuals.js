// Procedural ritual artwork; no external asset requests or postprocessing targets.
export function createFlames(path, color) {
  const count = VR.settings.simplified ? 55 : 110;
  const positions = [], uv = [], progress = [], seed = [], indices = [];
  const samples = path.getSpacedPoints(count);
  const tangent = new THREE.Vector3(), side = new THREE.Vector3();
  samples.forEach((p, i) => {
    const t = i / count;
    tangent.copy(path.getTangentAt(Math.min(.9999, t)));
    // Each tongue lies in the star's plane, with a little overlap along its edge.
    side.copy(tangent).setY(0);
    if (side.lengthSq() < .01) side.set(1, 0, 0);
    side.normalize().multiplyScalar(.065);
    const h = .16 + VR.hash(i + 41) * .32;
    const n = positions.length / 3;
    for (const [x, y] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) {
      positions.push(p.x + side.x * x, p.y + y * h - .018, p.z + side.z * x);
      uv.push((x + 1) / 2, y); progress.push(t); seed.push(VR.hash(i + 17) * 11);
    }
    indices.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('aProgress', new THREE.Float32BufferAttribute(progress, 1));
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  geometry.setIndex(indices);
  const uniforms = { uTime: { value: 0 }, uReveal: { value: 0 }, uMotion: { value: 1 },
    uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 }, uEye: { value: VR.EYE } };
  const material = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `attribute float aProgress,aSeed;varying vec2 vUv;varying float vProgress,vSeed;varying vec3 vWorld;
      uniform float uTime,uMotion;
      void main(){vUv=uv;vProgress=aProgress;vSeed=aSeed;vec3 p=position;
      p.x+=sin(uTime*2.1+aSeed+uv.y*4.)*.026*uv.y*uMotion;
      p.y+=sin(uTime*1.7+aSeed)*.022*uv.y*uMotion;
      vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;
      gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader: `varying vec2 vUv;varying float vProgress,vSeed;varying vec3 vWorld;
      uniform float uTime,uReveal,uMotion,uOpacity;uniform vec3 uColor,uEye;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      void main(){float y=vUv.y;float time=uTime*uMotion;
      float bend=(noise(vec2(y*5.+vSeed,time*.8))- .5)*.65*y;
      float width=mix(.47,.025,pow(y,.75));
      float edge=1.-smoothstep(width*.4,width,abs(vUv.x-.5-bend));
      float wisps=.65+.35*noise(vec2(vUv.x*5.+vSeed,y*7.-time*1.4));
      float reveal=1.-smoothstep(uReveal-.012,uReveal+.012,vProgress);
      float alpha=edge*pow(1.-y,.8)*wisps*reveal*uOpacity;
      alpha*=smoothstep(.35,1.1,distance(vWorld,uEye));
      vec3 tint=mix(vec3(.5,.8,1.),uColor,smoothstep(0.,.32,y));
      gl_FragColor=vec4(tint,alpha);
      #include <colorspace_fragment>
      }`
  });
  Object.defineProperty(material, 'opacity', { get: () => uniforms.uOpacity.value,
    set: value => { uniforms.uOpacity.value = value; }, configurable: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { uniforms, update(time, reveal) {
    const quiet = VR.calm() || VR.settings.simplified || VR.reducedMotion;
    uniforms.uTime.value = quiet ? 0 : time;
    uniforms.uMotion.value = quiet ? 0 : 1;
    uniforms.uReveal.value = reveal;
    mesh.visible = !quiet;
  } };
  return mesh;
}

function robeGeometry() {
  const geometry = new THREE.CylinderGeometry(.57, 1.28, 5.3, 48, 20, true);
  geometry.translate(0, 2.7, 0);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i));
    const pleat = Math.sin(a * 14 + y * .18) * (.035 + .09 * (1 - y / 5.4));
    const r = Math.hypot(p.getX(i), p.getZ(i)) + pleat;
    p.setXYZ(i, Math.cos(a) * r, y + Math.cos(a * 7) * .025, Math.sin(a) * r);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function featherGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.bezierCurveTo(-.13, .3, -.16, .8, 0, 1.35);
  shape.bezierCurveTo(.18, .91, .11, .32, 0, 0);
  const g = new THREE.ExtrudeGeometry(shape, { depth: .025, bevelEnabled: true,
    bevelSegments: 1, steps: 1, bevelSize: .018, bevelThickness: .01, curveSegments: 6 });
  const uv = g.attributes.uv, positions = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (positions.getX(i) + .2) / .4, positions.getY(i) / 1.35);
  return g;
}

function detailTexture(feather = false) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const g = canvas.getContext('2d');
  g.fillStyle = feather ? '#e9e5da' : '#a0a0a0'; g.fillRect(0, 0, 256, 256);
  if (feather) {
    g.strokeStyle = '#c3bfae'; g.lineWidth = 1;
    for (let y = 0; y < 256; y += 6) {
      g.beginPath(); g.moveTo(128, y); g.lineTo(25, y + 42); g.moveTo(128, y); g.lineTo(231, y + 42); g.stroke();
    }
    g.strokeStyle = '#f8f4e8'; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke();
  } else {
    for (let i = 0; i < 256; i += 3) {
      g.strokeStyle = i % 2 ? '#989898' : '#aaaaaa'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  if (feather) texture.colorSpace = THREE.SRGBColorSpace;
  else { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(5, 7); }
  return texture;
}

export function createAngel(a, bearing, wingTexture) {
  const [primary, secondary] = a.colors || ['#e8e3ff', '#ffd36b'];
  const root = new THREE.Group(); root.position.copy(VR.dir(bearing).multiplyScalar(a.radius || 6.8));
  root.lookAt(0, 0, 0); root.scale.setScalar(a.scale || 1);
  const inner = new THREE.Group(); root.add(inner);
  const materials = [];
  const weave = detailTexture();
  const cloth = (color, alpha = .95, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: metalness ? .3 : .86,
      metalness, emissive: color, emissiveIntensity: .04 * VR.fxK(), bumpMap: metalness ? null : weave, bumpScale: .025, transparent: true,
      opacity: 0, side: THREE.DoubleSide, depthWrite: true });
    materials.push([m, alpha]); return m;
  };
  const glow = (color, alpha) => { const m = VR.addMat(color, 0); materials.push([m, alpha]); return m; };
  const mesh = (geo, mat, x, y, z, parent = inner) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m;
  };
  const ivory = new THREE.Color(0xf2ecd9), accent = cloth(primary), lining = cloth(secondary);
  const featherMat = cloth(ivory, .94), gold = cloth(0xe6c47e, .95, .65), skin = cloth(ivory);
  featherMat.map = detailTexture(true); featherMat.bumpMap = featherMat.map; featherMat.bumpScale = .018;
  mesh(robeGeometry(), accent, 0, 0, 0);
  const shoulders = mesh(new THREE.SphereGeometry(.85, 24, 16), lining, 0, 5.2, .03);
  shoulders.scale.set(1, .55, .72);
  for (const side of [-1, 1]) {
    const geometry = new THREE.PlaneGeometry(.29, 4.35, 4, 24), p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + side * .32, y = p.getY(i) + 2.95;
      const radius = 1.28 - (y - .05) / 5.3 * .71;
      const angle = Math.atan2(Math.sqrt(Math.max(0, radius * radius - x * x)), x);
      const foldedRadius = radius + Math.sin(angle * 14 + y * .18) * (.035 + .09 * (1 - y / 5.4));
      p.setXYZ(i, x, y, Math.sqrt(Math.max(0, foldedRadius * foldedRadius - x * x)) + .025);
    }
    geometry.computeVertexNormals(); mesh(geometry, lining, 0, 0, 0);
  }
  const head = mesh(new THREE.SphereGeometry(.35, 24, 16), skin, 0, 5.95, .08);
  head.scale.set(.83, 1.2, .87);
  const hood = mesh(new THREE.SphereGeometry(.47, 24, 16, 0, Math.PI * 2, 0, Math.PI * .68), lining, 0, 6.03, -.09);
  hood.rotation.x = -.35;
  // Relaxed arms and hands give the angel a protective, recognizably human pose.
  for (const side of [-1, 1]) {
    const sleeve = mesh(new THREE.CylinderGeometry(.29, .38, 1.65, 16), accent, side * .93, 4.52, .18);
    sleeve.rotation.z = side * .23;
    mesh(new THREE.SphereGeometry(.18, 12, 8), skin, side * 1.1, 3.68, .24).scale.set(.8, 1.3, .8);
  }
  const halo = mesh(new THREE.TorusGeometry(.66, .019, 6, 80), glow(0xffdfa0, .68), 0, 6.2, -.42);
  mesh(new THREE.TorusGeometry(.75, .007, 4, 80), glow(secondary, .3), 0, 6.2, -.44);
  const aura = VR.sprite(primary, 2.4, 0); aura.position.set(0, 5.7, -.6); inner.add(aura); materials.push([aura.material, .13]);
  const wings = [];
  if (a.wings !== false) for (const side of [-1, 1]) {
    const wing = new THREE.Group(); wing.position.set(side * .42, 4.65, -.44);
    wing.scale.x = side; wing.rotation.y = side * -.18; inner.add(wing); wings.push(wing);
    const n = VR.settings.simplified ? 12 : 32;
    const feathers = new THREE.InstancedMesh(featherGeometry(), featherMat, n);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const row = i < n * .62 ? 0 : 1;
      const k = row ? (i - Math.ceil(n * .62)) / Math.max(1, n - Math.ceil(n * .62) - 1) : i / Math.max(1, Math.ceil(n * .62) - 1);
      dummy.position.set(.25 + k * 2.1, .18 + Math.sin(k * Math.PI * .9) * 1.05 - row * .32, row * .09);
      dummy.rotation.set(.05 * Math.sin(i), 0, -.12 - k * 1.45);
      dummy.scale.set(row ? .9 : 1.15, row ? .8 : 1.35 - k * .18, 1);
      dummy.updateMatrix(); feathers.setMatrixAt(i, dummy.matrix);
    }
    feathers.instanceMatrix.needsUpdate = true; wing.add(feathers);
    const veil = glow(secondary, .08); veil.map = wingTexture;
    mesh(new THREE.PlaneGeometry(2.8, 3.5), veil, 1.3, .7, -.08, wing);
  }
  const attribute = new THREE.Group(); attribute.position.set(1.1, 3.8, .4); inner.add(attribute);
  if (a.attribute === 'sword' || a.attribute === 'wand') {
    const sword = a.attribute === 'sword';
    mesh(sword ? new THREE.BoxGeometry(.12, 2.35, .035) : new THREE.CylinderGeometry(.035, .045, 2.5, 10), sword ? cloth(0xdce6f1, 1, .75) : gold, 0, .7, 0, attribute);
    if (sword) mesh(new THREE.BoxGeometry(.62, .07, .1), gold, 0, -.25, 0, attribute);
    const tip = VR.sprite(secondary, .52, 0); tip.position.y = 1.95; attribute.add(tip); materials.push([tip.material, .6]);
  } else if (a.attribute === 'cup') {
    mesh(new THREE.LatheGeometry([[0, 0], [.24, 0], [.1, .12], [.055, .38], [.3, .55], [.4, .85]].map(p => new THREE.Vector2(...p)), 24), gold, 0, -.35, 0, attribute);
  } else if (a.attribute === 'sheaf') {
    for (let i = 0; i < 7; i++) {
      const stalk = mesh(new THREE.CylinderGeometry(.02, .025, 1.3, 5), gold, (i - 3) * .075, .35, 0, attribute);
      stalk.rotation.z = (i - 3) * -.08;
      mesh(new THREE.CapsuleGeometry(.065, .22, 3, 6), gold, (i - 3) * .15, 1.05, 0, attribute);
    }
  } else if (a.attribute === 'orb') mesh(new THREE.SphereGeometry(.28, 16, 12), glow(secondary, .75), 0, .25, 0, attribute);
  const disk = mesh(new THREE.PlaneGeometry(4, 4), glow(primary, .12), 0, .035, 0, root);
  disk.material.map = VR.GLOW; disk.rotation.x = -Math.PI / 2;
  const n = VR.settings.simplified ? 24 : 64, positions = new Float32Array(n * 3), speeds = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const angle = VR.hash(i + 31) * Math.PI * 2, r = 1.2 + VR.hash(i + 7) * .6;
    positions.set([Math.cos(angle) * r, VR.hash(i + 9) * 7, Math.sin(angle) * r], i * 3); speeds[i] = .13 + VR.hash(i) * .2;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pm = new THREE.PointsMaterial({ map: VR.GLOW, size: .08, color: secondary, transparent: true,
    opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  materials.push([pm, .4]); const parts = new THREE.Points(pg, pm); parts.userData.spd = speeds; inner.add(parts);
  const light = new THREE.PointLight(primary, 0, 18, 1.5); light.position.set(0, 4, 1.2); root.add(light);
  root.visible = false;
  root.userData = { inner, wings, halo, parts, light, a: 0,
    setA(value) { materials.forEach(([m, alpha]) => {
      m.opacity = alpha * value;
      if (m.isMeshStandardMaterial) m.depthWrite = value > .96;
    }); } };
  return root;
}
