/* Virtual Rites — core
   Renderer, shared helpers, settings, audio, speech, haptics, tweens and the world kit.
   Everything hangs off one global object: window.VR */
window.VR = window.VR || {};
(function (VR) {
'use strict';

/* ---------- math & directions ----------
   Bearings are compass degrees: 0 north, 90 east, 180 south, 270 west.
   The practitioner stands at the origin; -Z is east. */
const DEG = Math.PI / 180; VR.DEG = DEG;
VR.QUARTERS = { north: 0, northeast: 45, east: 90, southeast: 135, south: 180, southwest: 225, west: 270, northwest: 315 };
VR.bearing = q => typeof q === 'number' ? q : (VR.QUARTERS[String(q).toLowerCase()] ?? 90);
VR.dir = b => new THREE.Vector3(-Math.cos(b * DEG), 0, -Math.sin(b * DEG));
VR.yawFor = b => Math.PI / 2 - b * DEG;
VR.lerp = (a, b, t) => a + (b - a) * t;
VR.ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
VR.shortest = (cur, t) => cur + ((((t - cur) % 360) + 540) % 360 - 180);
VR.hash = n => { const s = Math.sin(n * 91.345 + 7.13) * 43758.5453; return s - Math.floor(s); };
VR.UP = new THREE.Vector3(0, 1, 0);
VR.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
VR.silent = false;

/* ---------- storage & settings (everything stays in this browser) ---------- */
VR.store = {
  get(k, d) { try { const v = localStorage.getItem('vr.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('vr.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem('vr.' + k); } catch (e) {} }
};
const DEFAULTS = { narrationSource: 'auto', localNarration: false, grovePrototype: false, intensity: 'full', simplified: false, seated: false, pace: 1, textScale: 1, describe: false, haptics: true,
  gaze: false, singleSwitch: false, narration: true, sound: true, timingTint: true, camera: 'witness', location: null };
VR.settings = Object.assign({}, DEFAULTS, VR.store.get('settings', {}));
VR.saveSettings = () => VR.store.set('settings', VR.settings);
VR.fxK = () => ({ full: 1, soft: .65, low: .4 })[VR.settings.intensity] || 1;
VR.calm = () => VR.settings.intensity === 'low';

/* ---------- renderer, scene, camera ---------- */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 1500);
camera.rotation.order = 'YXZ';
camera.position.set(Math.cos(.6) * 34, 9, Math.sin(.6) * 34);
const rig = new THREE.Group(); rig.add(camera); scene.add(rig);
Object.assign(VR, { renderer, scene, camera, rig });
VR.worldGroup = new THREE.Group(); scene.add(VR.worldGroup);
VR.centerLight = new THREE.PointLight(0x9fd4ff, 0, 26, 1.6); VR.centerLight.position.set(0, 2, 0); scene.add(VR.centerLight);
VR.tintLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0); scene.add(VR.tintLight);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

/* ---------- textures & glowing materials ---------- */
VR.canvasTex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const GLOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.85)');
  gr.addColorStop(.45, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
VR.GLOW = GLOW;
VR.sharedTextures = new Set([GLOW]);
const scaled = color => new THREE.Color(color).multiplyScalar(VR.fxK());
VR.addMat = (color, op = 1) => new THREE.MeshBasicMaterial({ color: scaled(color), transparent: true, opacity: op,
  blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide, toneMapped: false });
VR.sprite = (color, size, op = 1) => { const m = new THREE.SpriteMaterial({ map: GLOW, color: scaled(color), blending: THREE.AdditiveBlending,
  transparent: true, depthWrite: false, fog: false, opacity: op, toneMapped: false }); const s = new THREE.Sprite(m); s.scale.setScalar(size); return s; };
VR.textSprite = (lines, w, h, scale) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(L => { g.font = L.font; g.fillStyle = L.color; g.shadowColor = L.glow || L.color; g.shadowBlur = 34; g.fillText(L.text, w / 2, L.y); g.shadowBlur = 0; g.fillText(L.text, w / 2, L.y); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: VR.canvasTex(c), transparent: true, depthWrite: false, fog: false, opacity: 0, toneMapped: false }));
  s.scale.set(scale, scale * h / w, 1); return s;
};

/* Beams fade out near the viewer's eyes so they never fill the headset view. */
VR.EYE = new THREE.Vector3(0, 1.6, 0); const BEAMS = new Set();
VR.beamMat = (color, op) => {
  const u = { uColor: { value: scaled(color) }, uOp: { value: op }, uEye: { value: VR.EYE }, uFade: { value: 0 } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vW,vN,vView;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 p=viewMatrix*w;vN=normalMatrix*normal;vView=-p.xyz;gl_Position=projectionMatrix*p;}',
    fragmentShader: `varying vec3 vW,vN,vView;uniform vec3 uColor;uniform float uOp;uniform vec3 uEye;uniform float uFade;
      void main(){float f=mix(1.,smoothstep(.3,1.1,distance(vW,uEye)),uFade);
      float edge=pow(abs(dot(normalize(vN),normalize(vView))),2.);
      gl_FragColor=vec4(uColor,uOp*f*edge);
      #include <colorspace_fragment>
      }` });
  Object.defineProperty(m, 'opacity', { get() { return u.uOp.value; }, set(v) { u.uOp.value = v; }, configurable: true });
  m.addEventListener('dispose', () => BEAMS.delete(u)); BEAMS.add(u); return m;
};
VR.updateBeams = near => BEAMS.forEach(u => u.uFade.value = near ? 1 : 0);

/* A glowing line that can be revealed progressively: trace.userData.set(0..1), .glow(multiplier) */
VR.trace = (curve, { segs = 200, r = .028, core = 0xffffff, glow = 0x4cc3ff, gop = .4 } = {}) => {
  const g1 = new THREE.TubeGeometry(curve, segs, r * .6, 6, false), g2 = new THREE.TubeGeometry(curve, segs, r * 4.2, 8, false);
  const m1 = VR.addMat(core, 1);
  // View-dependent edge falloff makes a soft halo rather than a second solid tube.
  const uniforms = { uColor: { value: scaled(glow) }, uOpacity: { value: gop } };
  const m2 = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.FrontSide, toneMapped: false,
    vertexShader: `varying vec3 vNormal,vView;void main(){vec4 p=modelViewMatrix*vec4(position,1.);
      vNormal=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}`,
    fragmentShader: `varying vec3 vNormal,vView;uniform vec3 uColor;uniform float uOpacity;
      void main(){float profile=pow(abs(dot(normalize(vNormal),normalize(vView))),3.);
      gl_FragColor=vec4(uColor,uOpacity*profile*.65);
      #include <colorspace_fragment>
      }` });
  Object.defineProperty(m2, 'opacity', { get: () => uniforms.uOpacity.value,
    set: value => { uniforms.uOpacity.value = value; }, configurable: true });
  const grp = new THREE.Group(); grp.add(new THREE.Mesh(g1, m1), new THREE.Mesh(g2, m2));
  const head = VR.sprite(glow, .65); head.visible = false; grp.add(head); const per = 36;
  grp.userData = {
    p: 0,
    set(p) { this.p = p; const n = Math.floor(p * segs) * per; g1.setDrawRange(0, n); g2.setDrawRange(0, Math.floor(p * segs) * 48);
      head.visible = p > 0 && p < 1; if (head.visible) head.position.copy(curve.getPointAt(Math.min(p, 1))); },
    glow(a) { m1.opacity = Math.max(0, Math.min(1, a)); m2.opacity = Math.max(0, Math.min(1, gop * a)); }
  };
  grp.userData.set(0); return grp;
};
VR.Arc = class extends THREE.Curve {
  constructor(b0, b1, r, y) { super(); Object.assign(this, { b0, b1, r, y }); }
  getPoint(t, o = new THREE.Vector3()) { const d = VR.dir(this.b0 + (this.b1 - this.b0) * t); return o.set(d.x * this.r, this.y, d.z * this.r); }
};

/* ---------- tweens ---------- */
let tweens = [];
VR.tween = (dur, fn, delay = 0) => { tweens.push({ t: -delay, dur: Math.max(dur, .0001), fn }); };
VR.at = (delay, fn) => { tweens.push({ t: -delay, dur: .0001, fn: (e, p, skip) => { if (!skip) fn(); } }); };
VR.updTweens = dt => { tweens = tweens.filter(tw => { tw.t += dt; if (tw.t < 0) return true; const p = Math.min(tw.t / tw.dur, 1); tw.fn(VR.ease(p), p, false); return p < 1; }); };
VR.finishTweens = () => { let guard = 0; while (tweens.length && guard++ < 5) { const t = tweens; tweens = []; t.forEach(tw => tw.fn(1, 1, true)); } tweens = []; };
VR.pulse = (spr, amt, dur = 1.4) => { const s0 = spr.scale.x, a = VR.calm() ? amt * .3 : amt; VR.tween(dur, (e, p) => spr.scale.setScalar(s0 * (1 + a * Math.sin(p * Math.PI)))); };
VR.fadeSprite = (spr, size, op = 1, dur = 1.4) => VR.tween(dur, e => { spr.material.opacity = op * e; spr.scale.setScalar(.05 + size * e); });
/* Fade every material under an object to zero, then call done() */
VR.fadeObject = (obj, dur, done) => {
  const mats = []; obj.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.push([m, m.opacity])); });
  VR.tween(dur, e => { mats.forEach(([m, o]) => m.opacity = o * (1 - e)); if (e >= 1 && done) { const d = done; done = null; d(); } });
};

/* ---------- audio ---------- */
const AU = VR.audio = { ctx: null, active: false };
function out(n) { n.connect(AU.master); n.connect(AU.rev); }
AU.init = function () {
  if (AU.ctx || !AU.active || !VR.settings.sound) return; try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const A = AU.ctx; AU.master = A.createGain(); AU.master.gain.value = VR.settings.sound ? .7 : 0;
  const comp = A.createDynamicsCompressor(); AU.master.connect(comp); comp.connect(A.destination);
  AU.rev = A.createConvolver(); const len = A.sampleRate * 3.6, buf = A.createBuffer(2, len, A.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  AU.rev.buffer = buf; const wet = A.createGain(); wet.gain.value = .5; AU.rev.connect(wet); wet.connect(AU.master);
  [73.42, 110, 146.83].forEach((f, i) => { const o = A.createOscillator(); o.frequency.value = f; o.detune.value = (i - 1) * 5;
    const g = A.createGain(); g.gain.value = .045 / (i + 1); const l = A.createOscillator(); l.frequency.value = .05 + i * .03;
    const lg = A.createGain(); lg.gain.value = .02 / (i + 1); l.connect(lg); lg.connect(g.gain); o.connect(g); out(g); o.start(); l.start(); });
  const nb = A.createBuffer(1, A.sampleRate * 4, A.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const n = A.createBufferSource(); n.buffer = nb; n.loop = true; const bp = A.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .7;
  const ng = A.createGain(); ng.gain.value = .03; const l = A.createOscillator(); l.frequency.value = .07; const lg = A.createGain(); lg.gain.value = 280;
  l.connect(lg); lg.connect(bp.frequency); n.connect(bp); bp.connect(ng); out(ng); n.start(); l.start();
};
AU.start = () => {
  AU.active = true; AU.init();
  if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume().catch(() => {});
};
AU.stop = () => {
  VR.media?.stopAudio(); VR.narration?.stop();
  AU.active = false;
  const ctx = AU.ctx;
  // Drop the whole graph, including looping sources, LFOs and reverb tails.
  // A fresh context on re-entry cannot replay the previous ritual's notes.
  AU.ctx = null; AU.master = null; AU.rev = null;
  if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
};
const ready = () => AU.active && AU.ctx && VR.settings.sound && !VR.silent;
AU.level = () => AU.active && VR.settings.sound ? .7 : 0;
AU.setOn = () => { if (AU.ctx) AU.master.gain.setTargetAtTime(AU.level(), AU.ctx.currentTime, .1); };
AU.duck = on => { if (AU.ctx) AU.master.gain.setTargetAtTime(on ? AU.level() * .15 : AU.level(), AU.ctx.currentTime, .5); };
AU.bell = (f, v = .16) => { if (!ready()) return; const A = AU.ctx, now = A.currentTime;
  [1, 2.76, 5.4].forEach((m, i) => { const o = A.createOscillator(); o.frequency.value = f * m; const g = A.createGain();
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(v / (i + 1.4), now + .01); g.gain.exponentialRampToValueAtTime(.0001, now + 2.6 / (i + 1));
    o.connect(g); out(g); o.start(now); o.stop(now + 3); }); };
AU.vibrate = (f, dur = 3.4) => { if (!ready()) return; const A = AU.ctx, now = A.currentTime; const g = A.createGain();
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(.2, now + .6); g.gain.setValueAtTime(.2, now + dur - .9); g.gain.linearRampToValueAtTime(0, now + dur);
  const src = A.createGain();
  [1, 1.006, .994].forEach(m => { const o = A.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * 2 * m; o.connect(src); o.start(now); o.stop(now + dur + .1); });
  const f1 = A.createBiquadFilter(), f2 = A.createBiquadFilter(); [f1, f2].forEach(x => { x.type = 'bandpass'; x.Q.value = 7; });
  f1.frequency.setValueAtTime(300, now); f1.frequency.linearRampToValueAtTime(800, now + dur * .45); f1.frequency.linearRampToValueAtTime(420, now + dur);
  f2.frequency.setValueAtTime(2250, now); f2.frequency.linearRampToValueAtTime(1150, now + dur * .45); f2.frequency.linearRampToValueAtTime(820, now + dur);
  const mix = A.createGain(); mix.gain.value = 1.5; src.connect(f1); src.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(g);
  const sub = A.createOscillator(); sub.frequency.value = f; const sg = A.createGain(); sg.gain.value = .55; sub.connect(sg); sg.connect(g); sub.start(now); sub.stop(now + dur + .1); out(g); };
AU.chord = (fs, dur = 5, v = .06) => { if (!ready()) return; const A = AU.ctx, now = A.currentTime;
  fs.forEach((f, i) => [0, 7].forEach(dt => { const o = A.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = dt;
    const g = A.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(v, now + 1.2); g.gain.linearRampToValueAtTime(0, now + dur);
    o.connect(g); out(g); o.start(now); o.stop(now + dur + .1); })); };
AU.tone = (f, dur = 4, v = .05) => { if (!ready()) return; const A = AU.ctx, now = A.currentTime; const o = A.createOscillator(); o.frequency.value = f;
  const g = A.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(v, now + dur * .45); g.gain.linearRampToValueAtTime(0, now + dur);
  o.connect(g); out(g); o.start(now); o.stop(now + dur + .1); };

/* ---------- speech & haptics ---------- */
// The narration module installs recorded, browser and local voice providers.
VR.say = () => {};
VR.stopSpeech = () => {};
VR.haptic = (strength = .5, ms = 60) => { if (!VR.settings.haptics || VR.silent) return; const s = renderer.xr.getSession && renderer.xr.getSession(); if (!s) return;
  for (const src of s.inputSources) { const a = src.gamepad && src.gamepad.hapticActuators && src.gamepad.hapticActuators[0]; if (a && a.pulse) try { a.pulse(strength, ms); } catch (e) {} } };

VR.toast = (msg, ms = 5000) => { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.remove('off'); clearTimeout(VR.toast.h); VR.toast.h = setTimeout(() => t.classList.add('off'), ms); };

/* ---------- worlds ---------- */
VR.worlds = {}; VR.worldOrder = []; VR.world = null;
VR.registerWorld = def => { if (!VR.worlds[def.id]) VR.worldOrder.push(def.id); VR.worlds[def.id] = def; };
function disposeGroup(g) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), instances = new Set();
  // Include g itself: effect removals also pass Mesh and Sprite roots.
  g.traverse(x => {
    if (x.isInstancedMesh) instances.add(x);
    if (x.geometry && !x.isSprite) geometries.add(x.geometry);
    const ms = x.material ? (Array.isArray(x.material) ? x.material : [x.material]) : [];
    ms.forEach(m => {
      materials.add(m);
      Object.values(m).forEach(v => { if (v && v.isTexture) textures.add(v); });
      Object.values(m.uniforms || {}).forEach(u => {
        const values = Array.isArray(u.value) ? u.value : [u.value];
        values.forEach(v => { if (v && v.isTexture) textures.add(v); });
      });
    });
  });
  const bitmaps = new Set();
  textures.forEach(t => {
    if (VR.sharedTextures.has(t)) return;
    // GLTFLoader uses ImageBitmap; disposing the GPU texture does not close it.
    if (t.image && typeof t.image.close === 'function') bitmaps.add(t.image);
    t.dispose();
  });
  bitmaps.forEach(image => image.close());
  materials.forEach(m => { m.userData.disposed = true; m.dispose(); });
  geometries.forEach(geo => { geo.dispose(); });
  instances.forEach(mesh => mesh.dispose());
  g.clear();
}
VR.disposeGroup = disposeGroup;
VR.resourceSnapshot = () => ({ geometries: renderer.info.memory.geometries,
  textures: renderer.info.memory.textures, programs: renderer.info.programs.length,
  calls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
VR.loadWorld = (id, force) => {
  const def = VR.worlds[id] || VR.worlds[VR.worldOrder[0]]; if (!def) return null;
  if (!force && VR.world && VR.world.def === def) return VR.world;
  disposeGroup(VR.worldGroup); scene.fog = null;
  const ctx = { group: VR.worldGroup, simplified: VR.settings.simplified, setFog: (c, d) => { scene.fog = c == null ? null : new THREE.FogExp2(c, d); } };
  let inst = {}; try { inst = def.build(ctx) || {}; } catch (e) { console.error('[Virtual Rites] world failed to build:', def.id, e); }
  VR.world = { def, inst }; return VR.world;
};

/* ---------- world kit: shared building blocks for world files ---------- */
VR.kit = {
  /* Gradient sky dome. glowBearing aims a horizon glow (sunrise, moon, black sun...). */
  sky(parent, o = {}) {
    const col = c => new THREE.Color(c);
    const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
      uniforms: { uTop: { value: col(o.top ?? 0x09051f) }, uMid: { value: col(o.mid ?? 0x33104f) }, uHor: { value: col(o.horizon ?? 0xd83c78) },
        uGlow: { value: col(o.glow ?? 0xff9440) }, uOpp: { value: col(o.opposite ?? 0x1a8c9e) }, uDir: { value: VR.dir(o.glowBearing ?? 51) },
        uPow: { value: o.glowPower ?? 5 }, uOppAmt: { value: o.oppositeAmount ?? .35 }, uBelow: { value: col(o.below ?? 0x0d0819) } },
      vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec3 vP;uniform vec3 uTop,uMid,uHor,uGlow,uOpp,uDir,uBelow;uniform float uPow,uOppAmt;
      void main(){float h=vP.y;vec3 f=normalize(vec3(vP.x,0.,vP.z));float d=max(dot(f,uDir),0.);float o=max(-dot(f,uDir),0.);
      vec3 c=mix(uHor,uMid,smoothstep(0.,.22,h));c=mix(c,uTop,smoothstep(.18,.75,h));
      c+=uGlow*pow(d,uPow)*smoothstep(.32,0.,h)*1.1;c+=uOpp*pow(o,2.)*smoothstep(.28,0.,abs(h-.04))*uOppAmt;
      if(h<0.)c=mix(uHor*.55,uBelow,smoothstep(0.,-.15,h));gl_FragColor=vec4(c,1.);}` });
    const s = new THREE.Mesh(new THREE.SphereGeometry(o.radius || 600, 48, 24), m); parent.add(s); return s;
  },
  stars(parent, o = {}) {
    const n = o.count || 2000, R = o.radius || 560, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const pal = (o.palette || [0xffffff, 0xccd8ff, 0xffd8f0, 0xd8ffff]).map(h => new THREE.Color(h));
    for (let i = 0; i < n; i++) { const u = Math.random() * 2 * Math.PI, v = Math.acos(1 - Math.random() * (o.full ? 2 : .9));
      pos[i * 3] = R * Math.sin(v) * Math.cos(u); pos[i * 3 + 1] = R * Math.cos(v); pos[i * 3 + 2] = R * Math.sin(v) * Math.sin(u);
      const c = pal[i % pal.length], b = .35 + Math.random() * .65; col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size: o.size || 1.7, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false }));
    parent.add(p); return p;
  },
  /* Drifting glowing particles. Returns {update(dt,T)} */
  motes(parent, o = {}) {
    const n = o.count || 500, R = o.radius || 22, H = o.height || 10, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sp = new Float32Array(n);
    const pal = (o.palette || [0x4cc3ff, 0xe0408a, 0xffd36b, 0xa77bff, 0x3fe0c0]).map(h => new THREE.Color(h));
    for (let i = 0; i < n; i++) { const r = Math.sqrt(Math.random()) * R, a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (o.minY || 0) + Math.random() * H; pos[i * 3 + 2] = Math.sin(a) * r;
      const c = pal[i % pal.length]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; sp[i] = (o.speed || 1) * (.08 + Math.random() * .25); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size: o.size || .16, map: GLOW, vertexColors: true, transparent: true, opacity: o.opacity ?? .75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const p = new THREE.Points(g, m); parent.add(p);
    return { points: p, update(dt, T) { const a = g.attributes.position; for (let i = 0; i < n; i++) { let y = a.getY(i) + sp[i] * dt; if (y > (o.minY || 0) + H) y = o.minY || 0; a.setY(i, y);
      a.setX(i, a.getX(i) + Math.sin(T * .3 + i) * dt * .05); } a.needsUpdate = true; } };
  },
  /* Large ground plane with gentle color variation and rolling edges. */
  ground(parent, o = {}) {
    const size = o.size || 900, g = new THREE.PlaneGeometry(size, size, 150, 150); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, c = new Float32Array(p.count * 3), a = new THREE.Color(o.a ?? 0x14352a), b = new THREE.Color(o.b ?? 0x27503a), tmp = new THREE.Color();
    const flat = o.flatRadius ?? 58;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
      const n = .5 + .25 * Math.sin(x * .21 + z * .13) + .25 * Math.sin(x * .047 - z * .09 + 1.3); tmp.copy(a).lerp(b, n);
      if (o.center && r < 17) tmp.lerp(new THREE.Color(o.center), .35 * (1 - r / 17));
      c[i * 3] = tmp.r; c[i * 3 + 1] = tmp.g; c[i * 3 + 2] = tmp.b;
      if (o.hills !== false && r > flat) p.setY(i, Math.sin(x * .02) * 1.5 + Math.sin(z * .017 + 2) * 1.8 + (r - flat) * (o.rise ?? .012)); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.roughness ?? 1, metalness: o.metalness ?? 0 })); parent.add(m); return m;
  }
};
})(window.VR);
