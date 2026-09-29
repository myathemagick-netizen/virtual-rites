/* Virtual Rites — ritual effects
   Every "do" in a ritual file maps to a function in VR.actions.
   See docs/ritual-markup.md for the author-facing reference. */
(function (VR) {
'use strict';
const A = VR.actions = {};
let F = null;                       // live effect state for the current rite
const RING_R = 4.3;

/* ---------- ground circle ---------- */
function drawRing(names) {
  const c = F.ringCanvas, g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1024, 1024); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.translate(512, 512);
  [[500, 4], [472, 2], [300, 3], [286, 1.5]].forEach(([r, w]) => { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); });
  for (let i = 0; i < 72; i++) { g.save(); g.rotate(i * 5 * VR.DEG); g.lineWidth = i % 6 ? 1.5 : 3; g.beginPath(); g.moveTo(0, -472); g.lineTo(0, i % 6 ? -486 : -500); g.stroke(); g.restore(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  (names || []).forEach((n, k) => { if (!n) return; g.font = (/[\u0590-\u05FF]/.test(n) ? '700 76px "Noto Serif Hebrew", serif' : '60px Marcellus, Georgia, serif');
    g.save(); g.rotate(k * Math.PI / 2); g.fillText(n, 0, -385); g.restore();
    g.save(); g.rotate(k * Math.PI / 2 + Math.PI / 4); g.beginPath(); g.arc(0, -385, 16, 0, Math.PI * 2); g.lineWidth = 2; g.stroke(); g.restore(); });
  F.ringTex.needsUpdate = true;
}

VR.fx = {
  get state() { return F; },
  reset() {
    if (F) { VR.scene.remove(F.root); VR.disposeGroup(F.root); }
    F = { root: new THREE.Group(), on: {}, pents: {}, lines: [], guardians: {}, cards: [], bursts: [], sigil: null, qc: null, hex: null, breath: null };
    VR.scene.add(F.root);
    F.ringCanvas = document.createElement('canvas'); F.ringCanvas.width = F.ringCanvas.height = 1024; F.ringTex = VR.canvasTex(F.ringCanvas);
    const m = new THREE.MeshBasicMaterial({ map: F.ringTex, color: new THREE.Color(0x7fd0ff).multiplyScalar(VR.fxK()), transparent: true, opacity: .16,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
    F.ring = new THREE.Mesh(new THREE.PlaneGeometry(RING_R * 2, RING_R * 2), m); F.ring.rotation.x = -Math.PI / 2; F.ring.position.y = .03; F.root.add(F.ring);
    drawRing(null); VR.centerLight.intensity = 0;
  },
  run(list, ctx) {
    (list || []).forEach(a => { const f = A[a.do]; if (!f) { console.warn('[Virtual Rites] unknown action:', a.do); return; }
      try { f(a, ctx); } catch (e) { console.warn('[Virtual Rites] action failed:', a, e); } });
  },
  update(dt, T) {
    if (!F) return;
    F.ring.rotation.z += dt * .02;
    Object.values(F.pents).forEach(P => { if (P.fl.material.opacity <= 0) return; const a = P.fl.geometry.attributes.position, b = P.fl.userData.base;
      for (let i = 0; i < a.count; i++) { const f = (T * 1.6 + i * .37) % 1; a.setXYZ(i, b[i * 3] + Math.sin(T * 9 + i * 1.7) * .02, b[i * 3 + 1] + f * .14, b[i * 3 + 2] + Math.cos(T * 8 + i) * .02); }
      a.needsUpdate = true; if (P.label) P.label.position.y = P.labelY + Math.sin(T * .8) * .04; });
    Object.values(F.guardians).forEach((G, i) => { if (!G.visible) return; const u = G.userData;
      u.wings.forEach((w, s) => { w.rotation.z = (s ? -1 : 1) * Math.sin(T * 1.1 + i) * .06; }); u.halo.rotation.z += dt * .5; u.inner.rotation.y = Math.sin(T * .4 + i) * .04;
      const p = u.parts.geometry.attributes.position, sp = u.parts.userData.spd; for (let j = 0; j < sp.length; j++) { let y = p.getY(j) + sp[j] * dt; if (y > 8.5) y = 0; p.setY(j, y); } p.needsUpdate = true;
      if (u.a >= 1) u.light.intensity = (2.2 + Math.sin(T * 2 + i) * .3) * VR.fxK(); });
    if (F.hex) F.hex.rotation.y += dt * .25;
    if (F.sigil) { const s = F.sigil; s.spinner.rotation.z += dt * (.12 + (s.spinBoost || 0)); s.halo.material.opacity = (s.haloBase || .2) + Math.sin(T * 2) * .04; }
    F.cards.forEach((c, i) => { c.position.y = c.userData.baseY + Math.sin(T * .9 + i) * .03; });
    F.bursts = F.bursts.filter(b => { b.t += dt; const a = b.pts.geometry.attributes.position; for (let i = 0; i < a.count; i++) {
      a.setXYZ(i, a.getX(i) + b.v[i * 3] * dt, a.getY(i) + b.v[i * 3 + 1] * dt, a.getZ(i) + b.v[i * 3 + 2] * dt); } a.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.t / b.life); if (b.t >= b.life) { F.root.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); return false; } return true; });
  }
};

/* ---------- Qabalistic Cross ---------- */
function qc(ctx) {
  if (F.qc) return F.qc;
  const q = {}, g = new THREE.Group(); g.rotation.y = VR.yawFor(ctx.face); F.root.add(g); q.g = g;
  q.crown = VR.sprite(0xffffff, .2, 0); q.crown.position.set(0, 2.35, -.2);
  q.crownHalo = VR.sprite(0xfff0c8, .2, 0); q.crownHalo.position.copy(q.crown.position);
  const colG = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true); colG.translate(0, -.5, 0);
  q.col = new THREE.Mesh(colG, VR.beamMat(0xffffff, .55)); q.colGlow = new THREE.Mesh(colG, VR.beamMat(0xfff0c4, .22));
  [q.col, q.colGlow].forEach((m, i) => { m.position.y = 2.35; m.scale.set(i ? .15 : .035, .0001, i ? .15 : .035); });
  q.ground = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 72), VR.addMat(0xfff0c0, 0)); q.ground.rotation.x = -Math.PI / 2; q.ground.position.y = .05;
  q.r = VR.sprite(0xff5a4a, .1, 0); q.r.position.set(.45, 1.45, 0);
  q.l = VR.sprite(0x5aa8ff, .1, 0); q.l.position.set(-.45, 1.45, 0);
  const hG = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true); hG.rotateZ(Math.PI / 2);
  q.h = new THREE.Mesh(hG, VR.beamMat(0xffffff, .5)); q.hGlow = new THREE.Mesh(hG, VR.beamMat(0xfff0c4, .2));
  [q.h, q.hGlow].forEach((m, i) => { m.position.y = 1.45; m.scale.set(.0001, i ? .12 : .028, i ? .12 : .028); });
  q.heart = VR.sprite(0xffb38a, .1, 0); q.heart.position.set(0, 1.42, -.16);
  g.add(q.crown, q.crownHalo, q.col, q.colGlow, q.ground, q.r, q.l, q.h, q.hGlow, q.heart);
  F.qc = q; return q;
}
A.cross = (a, ctx) => {
  const q = qc(ctx), on = F.on;
  switch (a.point) {
    case 'crown':
      if (!on.crown) { on.crown = 1; VR.fadeSprite(q.crown, .9, .85); VR.fadeSprite(q.crownHalo, 2.4, .26, 2); } else { VR.pulse(q.crown, .8); VR.pulse(q.crownHalo, .5); }
      VR.audio.bell(587.33); break;
    case 'descend':
      if (!on.col) { on.col = 1; VR.tween(2, e => { q.col.scale.y = q.colGlow.scale.y = Math.max(.0001, 5.35 * e); }); }
      else { const b0 = q.colGlow.material.opacity; VR.tween(1.6, (e, p) => q.colGlow.material.opacity = b0 + (VR.calm() ? .08 : .28) * Math.sin(p * Math.PI)); }
      VR.tween(2.4, (e, p) => { q.ground.scale.setScalar(.3 + 7 * p); q.ground.material.opacity = .85 * (1 - p); }, .8);
      VR.audio.bell(440); VR.at(.9, () => VR.audio.bell(110, .3)); break;
    case 'right':
      if (!on.r) { on.r = 1; VR.fadeSprite(q.r, .7); } else VR.pulse(q.r, 1); VR.audio.bell(659.25); break;
    case 'left':
      if (!on.l) { on.l = 1; VR.fadeSprite(q.l, .7); VR.tween(1.4, e => { q.h.scale.x = q.hGlow.scale.x = Math.max(.0001, .9 * e); }, .5); } else VR.pulse(q.l, 1);
      VR.audio.bell(739.99); break;
    case 'heart':
      if (!on.h) { on.h = 1; VR.tween(1.8, e => { q.h.scale.x = q.hGlow.scale.x = Math.max(.9, .9 + 2.6 * e); }); VR.fadeSprite(q.heart, .6, .8); } else VR.pulse(q.heart, 1);
      VR.audio.bell(880); break;
    case 'seal': {
      [q.crown, q.r, q.l, q.heart].forEach(s => { if (s.material.opacity > 0) VR.pulse(s, .6, 1.8); });
      const b0 = q.colGlow.material.opacity; VR.tween(1.8, (e, p) => q.colGlow.material.opacity = b0 + (VR.calm() ? .06 : .22) * Math.sin(p * Math.PI));
      const c0 = VR.centerLight.intensity; VR.tween(2, e => VR.centerLight.intensity = Math.max(c0, 1.2 * e * VR.fxK()));
      VR.audio.chord([146.83, 220, 293.66], 4.5); break; }
  }
};

/* ---------- pentagrams ---------- */
const PV = { top: 90, ur: 18, lr: -54, ll: -126, ul: 162 }, CYC = ['top', 'lr', 'ul', 'ur', 'll'], EL = { earth: 'll', fire: 'lr', water: 'ur', air: 'ul' };
function pentOrder(type) {
  const [mode, el] = String(type || 'banishing-earth').split('-'); const p = EL[el] || 'll'; let start, second;
  if (p === 'll' || p === 'lr') { [start, second] = mode === 'invoking' ? ['top', p] : [p, 'top']; }
  else { const other = p === 'ur' ? 'ul' : 'ur'; [start, second] = mode === 'invoking' ? [other, p] : [p, other]; }
  const i = CYC.indexOf(start), j = CYC.indexOf(second), step = ((j - i + 5) % 5) === 1 ? 1 : -1;
  const out = []; for (let k = 0; k <= 5; k++) out.push(CYC[(((i + step * k) % 5) + 5) % 5]); return out;
}
function flames(path, color) {
  const pts = path.getSpacedPoints(150), base = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => { base[i * 3] = p.x; base[i * 3 + 1] = p.y; base[i * 3 + 2] = p.z; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
  const m = new THREE.PointsMaterial({ map: VR.GLOW, size: .17, color: new THREE.Color(color).multiplyScalar(VR.fxK()), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
  const p = new THREE.Points(g, m); p.userData.base = base; return p;
}
A.pentagram = (a, ctx) => {
  const b = VR.bearing(a.quarter ?? ctx.face), key = a.key || String(b);
  if (F.pents[key]) { F.root.remove(F.pents[key].group); VR.disposeGroup(F.pents[key].group); }
  const R = a.radius || 3.2, S = a.size || .85, H = a.height || 1.6, glow = new THREE.Color(a.color || '#4cc3ff'), core = glow.clone().lerp(new THREE.Color(0xffffff), .7);
  const c = VR.dir(b).multiplyScalar(R); c.y = H; const right = new THREE.Vector3().crossVectors(VR.dir(b), VR.UP);
  const pts = pentOrder(a.type).map(k => c.clone().addScaledVector(right, Math.cos(PV[k] * VR.DEG) * S).addScaledVector(VR.UP, Math.sin(PV[k] * VR.DEG) * S));
  const path = new THREE.CurvePath(); for (let i = 0; i < 5; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  const grp = new THREE.Group(); F.root.add(grp);
  const tr = VR.trace(path, { segs: 240, r: .03, core, glow, gop: .45 }), fl = flames(path, glow), flash = VR.sprite(core, .1, 0); flash.position.copy(c);
  grp.add(tr, fl, flash);
  let label = null;
  if (a.name) { const he = a.name.he || a.name.hebrew, la = a.name.latin || a.name.text || '';
    label = VR.textSprite([he ? { text: he, font: '700 170px "Noto Serif Hebrew", serif', color: '#eaf6ff', glow: '#' + glow.getHexString(), y: 200 } : null,
      la ? { text: la, font: '64px Marcellus, Georgia, serif', color: '#dff0ff', glow: '#' + glow.getHexString(), y: he ? 390 : 256 } : null].filter(Boolean), 1024, 512, 1.7);
    label.position.copy(c).add(new THREE.Vector3(0, S + .45, 0)); grp.add(label); }
  const P = { group: grp, tr, fl, flash, label, labelY: c.y + S + .45 }; F.pents[key] = P;
  const T = a.traceTime || 3.4;
  VR.tween(T, (e, p) => tr.userData.set(p));
  [523.25, 587.33, 659.25, 783.99, 880].forEach((f, k) => VR.at(k * T / 5, () => VR.audio.bell(f, .12)));
  if (!VR.calm()) VR.tween(1.6, (e, p) => { flash.material.opacity = Math.sin(p * Math.PI); flash.scale.setScalar(.2 + 2.8 * p); }, T + .1);
  VR.tween(2.2, (e, p) => tr.userData.glow(1 + (VR.calm() ? .4 : 2) * Math.sin(p * Math.PI)), T + .1);
  if (label) VR.tween(1.2, e => label.material.opacity = e, T + .3);
  VR.tween(1.5, e => fl.material.opacity = .9 * e, T + .1);
  if (a.vibrate) VR.at(T + .1, () => { VR.audio.vibrate(a.vibrate); VR.haptic(.8, 400); });
};

/* ---------- line of light around the circle ---------- */
A.line = (a, ctx) => {
  const b0 = VR.bearing(a.from ?? ctx.face), b1 = VR.bearing(a.to ?? a.from ?? ctx.face);
  let deg = a.degrees;
  if (deg == null) deg = a.direction === 'widdershins' ? -((((b0 - b1) % 360) + 360) % 360 || 360) : ((((b1 - b0) % 360) + 360) % 360 || 360);
  const col = new THREE.Color(a.color || '#ffffff');
  const tr = VR.trace(new VR.Arc(b0, b0 + deg, a.radius || 3.2, a.height || 1.6), { segs: Math.max(40, Math.round(Math.abs(deg) * 1.5)), r: .016,
    core: col.clone().lerp(new THREE.Color(0xffffff), .6), glow: col, gop: .35 });
  F.root.add(tr); F.lines.push(tr);
  const base = VR.shortest(ctx.face, b0), T = a.duration || 2.8;
  VR.tween(T, (e, p) => { tr.userData.set(p); if (a.turn) ctx.setFace(base + deg * e); });
};

/* ---------- guardians (archangels, deities, elemental kings, spirits) ---------- */
let wingTex = null;
function makeWingTex() { const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d'); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 13; i++) { const t = i / 12, ang = VR.lerp(-1.47, -.12, t), len = VR.lerp(480, 215, t); g.save(); g.translate(12, 470); g.rotate(ang);
    const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,.12)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(len / 2, 0, len / 2, 15 + t * 9, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(10, 0); g.lineTo(len * .96, 0); g.stroke(); g.restore(); }
  return VR.canvasTex(c); }
function makeGuardian(a, b) {
  if (!wingTex) wingTex = makeWingTex();
  const [pc, sc] = a.colors || ['#ffffff', '#ffd36b'];
  const root = new THREE.Group(); root.position.copy(VR.dir(b).multiplyScalar(a.radius || 6.8)); root.lookAt(0, 0, 0); root.scale.setScalar(a.scale || 1);
  const inner = new THREE.Group(); root.add(inner); const mats = [];
  const M = (c, o) => { const m = VR.addMat(c, o); mats.push([m, o]); m.opacity = 0; return m; };
  const S = (c, size, o, x, y, z) => { const s = VR.sprite(c, size, 0); s.position.set(x, y, z); mats.push([s.material, o]); inner.add(s); return s; };
  const prof = [[0, 0], [1.5, .05], [1.25, 1.5], [.95, 3], [.7, 4.4], [.55, 5.4], [.4, 6.1], [0, 6.3]].map(v => new THREE.Vector2(v[0], v[1]));
  const robe = new THREE.LatheGeometry(prof, 40); inner.add(new THREE.Mesh(robe, M(pc, .26)));
  const core = new THREE.Mesh(robe, M(0xffffff, .1)); core.scale.set(.45, 1, .45); inner.add(core);
  S(0xffffff, 1.3, .9, 0, 6.85, .1); S(pc, 3.4, .6, 0, 6.7, 0); S(sc, 6, .25, 0, 4.5, -.4);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.8, .035, 8, 64), M(0xffe7a0, .9)); halo.position.set(0, 6.95, -.3); inner.add(halo);
  const wings = [];
  if (a.wings !== false) { const wm = M(sc, .8); wm.map = wingTex; wm.needsUpdate = true;
    [1, -1].forEach(side => { const pv = new THREE.Group(); pv.position.set(.35 * side, 4.1, -.2); pv.scale.x = side;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 6.6), wm); pl.position.set(1.52, 2.75, 0); pv.add(pl); pv.rotation.y = -.38 * side; inner.add(pv); wings.push(pv); }); }
  const at = new THREE.Group(); at.position.set(1, 3.2, .5);
  switch (a.attribute) {
    case 'sword': at.add(new THREE.Mesh(new THREE.BoxGeometry(.09, 2.8, .03), M(0xffffff, .9)), new THREE.Mesh(new THREE.BoxGeometry(.22, 2.9, .1), M(pc, .5)));
      { const gd = new THREE.Mesh(new THREE.BoxGeometry(.7, .09, .09), M(0xffe7a0, .9)); gd.position.y = -.9; at.add(gd); } break;
    case 'cup': { const cup = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.25, 0], [.08, .1], [.06, .5], [.36, .7], [.44, 1.1]].map(v => new THREE.Vector2(v[0], v[1])), 24), M(sc, .75));
      cup.position.y = -.4; at.add(cup); S(0x9fdcff, 1, .8, 1, 3.95, .5); } break;
    case 'wand': at.add(new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 2.4, 8), M(0xffffff, .8))); S(sc, 1.1, .9, 1, 4.45, .5); break;
    case 'sheaf': for (let i = 0; i < 7; i++) { const cn = new THREE.Mesh(new THREE.ConeGeometry(.07, 1.6, 6), M(i % 2 ? pc : sc, .8)); cn.rotation.z = (i - 3) * .12; cn.position.x = (i - 3) * .05; at.add(cn); } break;
    case 'orb': S(sc, 1.2, .9, 1, 3.4, .5); S(0xffffff, .4, .9, 1, 3.4, .5); break;
    default: break;
  }
  inner.add(at);
  const dm = M(pc, .55); dm.map = GLOW_MAP(); const disk = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), dm); disk.rotation.x = -Math.PI / 2; disk.position.y = .06; root.add(disk);
  const n = VR.settings.simplified ? 50 : 150, pp = new Float32Array(n * 3), spd = new Float32Array(n);
  for (let i = 0; i < n; i++) { const r = Math.random() * 1.8, t = Math.random() * 6.28; pp[i * 3] = Math.cos(t) * r; pp[i * 3 + 1] = Math.random() * 8; pp[i * 3 + 2] = Math.sin(t) * r; spd[i] = .4 + Math.random() * 1.2; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pm = new THREE.PointsMaterial({ map: VR.GLOW, size: .2, color: new THREE.Color(sc).multiplyScalar(VR.fxK()), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
  mats.push([pm, .9]); const parts = new THREE.Points(pg, pm); parts.userData.spd = spd; inner.add(parts);
  const light = new THREE.PointLight(new THREE.Color(pc), 0, 22, 1.5); light.position.set(0, 3, 1); root.add(light);
  root.visible = false; root.userData = { setA: v => mats.forEach(([m, o]) => m.opacity = o * v), inner, light, wings, halo, parts, a: 0 };
  return root;
}
function GLOW_MAP() { return VR.GLOW; }
A.guardian = (a, ctx) => {
  const b = VR.bearing(a.quarter ?? ctx.face), key = a.key || String(b); let G = F.guardians[key];
  if (G && G.visible && G.userData.a > 0) { const L = G.userData.light, i0 = L.intensity; VR.tween(2, (e, p) => L.intensity = i0 + 1.5 * Math.sin(p * Math.PI) * VR.fxK()); if (a.chord) VR.audio.chord(a.chord, 4); return; }
  if (!G) { G = makeGuardian(a, b); F.root.add(G); F.guardians[key] = G; }
  G.visible = true; const u = G.userData;
  VR.tween(a.duration || 3, e => { u.a = e; u.setA(e); u.inner.position.y = -2 * (1 - e); u.light.intensity = 2.4 * e * VR.fxK(); });
  if (a.chord) VR.audio.chord(a.chord, 5.5); VR.haptic(.4, 200);
};
A.dismiss = a => {
  const keys = !a.quarter || a.quarter === 'all' ? Object.keys(F.guardians) : [a.key || String(VR.bearing(a.quarter))];
  keys.forEach(k => { const G = F.guardians[k]; if (!G || !G.visible) return; const u = G.userData, a0 = u.a;
    VR.tween(a.duration || 2.5, e => { u.a = a0 * (1 - e); u.setA(u.a); u.inner.position.y = 3 * e; u.light.intensity = 2.4 * u.a * VR.fxK(); if (e >= 1) G.visible = false; }); });
  if (a.chord) VR.audio.chord(a.chord, 4);
};

/* ---------- hexagram ---------- */
A.hexagram = a => {
  if (F.hex) { F.root.remove(F.hex); VR.disposeGroup(F.hex); }
  const g = new THREE.Group(); g.position.y = a.height || 1.25; const R = a.radius || 1.35, col = new THREE.Color(a.color || '#ffc53d');
  const trs = [0, 60].map(o => { const path = new THREE.CurvePath(); const pts = [0, 120, 240, 360].map(d => new THREE.Vector3(Math.cos((d + o) * VR.DEG) * R, 0, Math.sin((d + o) * VR.DEG) * R));
    for (let i = 0; i < 3; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    const t = VR.trace(path, { segs: 180, r: .025, core: col.clone().lerp(new THREE.Color(0xffffff), .6), glow: col, gop: .5 }); g.add(t); return t; });
  F.root.add(g); F.hex = g; VR.tween(2.8, (e, p) => trs.forEach(t => t.userData.set(p)));
  if (F.qc && F.on.col) { const cg = F.qc.colGlow.material, b0 = cg.opacity; VR.tween(2.2, e => cg.opacity = b0 + .16 * e); }
  const c0 = VR.centerLight.intensity; VR.tween(2.2, e => VR.centerLight.intensity = Math.max(c0, (1 + .6 * e) * VR.fxK()));
  if (a.chord !== false) VR.audio.chord(a.chord || [293.66, 369.99, 440, 587.33], 6, .05);
};

/* ---------- flare, circle, light ---------- */
A.flare = a => {
  const t = a.target || 'all', k = VR.calm() ? .4 : 1.5;
  if (t === 'all' || t === 'pentagrams') Object.values(F.pents).forEach((P, i) => {
    VR.tween(3.6, (e, p) => { const s = Math.sin(p * Math.PI); P.tr.userData.glow(1 + k * s); P.fl.material.size = .17 * (1 + k * s); }, i * .25);
    VR.at(i * .25, () => VR.audio.bell(1046.5 - i * 130.8, .1)); });
  if (t === 'all' || t === 'lines') F.lines.forEach(L => VR.tween(3, (e, p) => L.userData.glow(1 + k * Math.sin(p * Math.PI))));
  const o0 = F.ring.material.opacity; VR.tween(3, e => F.ring.material.opacity = Math.max(o0, VR.lerp(o0, .45, e)));
};
A.circle = a => {
  if (a.names !== undefined) drawRing(a.names);
  if (a.color) F.ring.material.color.set(a.color).multiplyScalar(VR.fxK());
  if (a.brightness != null) { const o0 = F.ring.material.opacity, o1 = a.brightness; VR.tween(a.duration || 2, e => F.ring.material.opacity = VR.lerp(o0, o1, e)); }
};
A.light = a => { const L = VR.centerLight; if (a.color) L.color.set(a.color); const i0 = L.intensity, i1 = (a.intensity ?? 1) * VR.fxK(); VR.tween(a.duration || 2, e => L.intensity = VR.lerp(i0, i1, e)); };

/* ---------- sound ---------- */
A.bell = a => { const ns = a.notes || [a.freq || 660]; ns.forEach((f, i) => VR.at((a.delay || 0) + i * (a.gap ?? .35), () => VR.audio.bell(f, a.volume || .14))); };
A.chord = a => VR.at(a.delay || 0, () => VR.audio.chord(a.notes || [220, 277.18, 329.63], a.duration || 5, a.volume || .06));
A.vibrate = a => VR.at(a.delay || 0, () => { VR.audio.vibrate(a.freq || 98, a.duration || 3.4); VR.haptic(.8, 400); });
A.tone = a => VR.at(a.delay || 0, () => VR.audio.tone(a.freq || 196, a.duration || 4, a.volume || .05));

/* ---------- sparkle burst ---------- */
function burst(at, n, palette, speed, life) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), v = new Float32Array(n * 3), pal = palette.map(c => new THREE.Color(c));
  for (let i = 0; i < n; i++) { pos[i * 3] = at.x; pos[i * 3 + 1] = at.y; pos[i * 3 + 2] = at.z;
    const u = Math.random() * 6.28, w = Math.acos(Math.random() * 2 - 1), s = speed * (.3 + Math.random() * .7);
    v[i * 3] = Math.sin(w) * Math.cos(u) * s; v[i * 3 + 1] = Math.abs(Math.cos(w)) * s * .8 + .3; v[i * 3 + 2] = Math.sin(w) * Math.sin(u) * s;
    const c = pal[i % pal.length]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: .14, map: VR.GLOW, vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  F.root.add(pts); F.bursts.push({ pts, v, t: 0, life });
}
A.sparkle = (a, ctx) => {
  if (ctx.skip) return;
  const at = a.at ? new THREE.Vector3(a.at[0], a.at[1], a.at[2]) : new THREE.Vector3(0, 1.4, 0);
  burst(at, VR.settings.simplified ? 80 : 220, a.colors || ['#4cc3ff', '#e0408a', '#ffd36b', '#a77bff', '#3fe0c0'], a.speed || 2.2, a.life || 4);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => VR.at(k * .3, () => VR.audio.bell(f, .09)));
};

/* ---------- breath ring ---------- */
A.breath = a => {
  const cyc = a.cycles || 3, ti = a.inhale || 4, th = a.hold || 0, te = a.exhale || 4, per = ti + th + te, total = cyc * per;
  if (!F.breath) { const r = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 96), VR.addMat(a.color || '#9fe8ff', 0)); r.rotation.x = -Math.PI / 2; r.position.y = .06; F.root.add(r); F.breath = r; }
  const r = F.breath;
  VR.tween(total, (e, p) => { const tt = (p * total) % per; let s = tt < ti ? VR.ease(tt / ti) : tt < ti + th ? 1 : 1 - VR.ease((tt - ti - th) / te);
    if (p >= 1) s = 0; r.scale.setScalar(.6 + 2.6 * s); r.material.opacity = p >= 1 ? 0 : .25 + .45 * s; });
  for (let c = 0; c < cyc; c++) { VR.at(c * per, () => VR.audio.tone(196, ti, .05)); VR.at(c * per + ti + th, () => VR.audio.tone(146.83, te, .04)); }
};

/* ---------- sigil ---------- */
class Circ extends THREE.Curve { constructor(c, r) { super(); this.c = c; this.r = r; }
  getPoint(t, o = new THREE.Vector3()) { return o.set(this.c.x + Math.cos(t * Math.PI * 2) * this.r, this.c.y + Math.sin(t * Math.PI * 2) * this.r, 0); } }
function buildSigil(a, ctx) {
  const S = (VR.session && VR.session.sigil) || VR.sigil.make((VR.session && VR.session.intent) || 'Virtual Rites', 'wheel');
  if (F.sigil) { F.root.remove(F.sigil.g); VR.disposeGroup(F.sigil.g); }
  const size = a.size || .8, d = VR.dir(ctx.face), g = new THREE.Group(); g.position.copy(d.multiplyScalar(a.distance || 2.3)); g.position.y = a.height || 1.7; g.lookAt(0, g.position.y, 0);
  const spinner = new THREE.Group(); g.add(spinner);
  const col = new THREE.Color(a.color || '#e0408a'), core = col.clone().lerp(new THREE.Color(0xffffff), .6);
  const V = p => new THREE.Vector3(p[0] * size, p[1] * size, 0);
  const path = new THREE.CurvePath(); for (let i = 0; i < S.pts.length - 1; i++) path.add(new THREE.LineCurve3(V(S.pts[i]), V(S.pts[i + 1])));
  const main = VR.trace(path, { segs: 60 * S.pts.length, r: .022, core, glow: col, gop: .5 });
  const start = VR.trace(new Circ(V(S.pts[0]), size * .07), { segs: 40, r: .018, core, glow: col, gop: .5 });
  const n = S.pts.length, pa = V(S.pts[n - 2]), pb = V(S.pts[n - 1]), dirv = pb.clone().sub(pa).normalize(), nrm = new THREE.Vector3(-dirv.y, dirv.x, 0).multiplyScalar(size * .09);
  const barPath = new THREE.CurvePath(); barPath.add(new THREE.LineCurve3(pb.clone().sub(nrm), pb.clone().add(nrm)));
  const bar = VR.trace(barPath, { segs: 10, r: .018, core, glow: col, gop: .5 });
  const halo = VR.sprite(col, size * 3.2, 0); halo.position.z = -.05;
  spinner.add(main, start, bar, halo); F.root.add(g);
  F.sigil = { g, spinner, traces: [main, start, bar], halo, haloBase: .2, spinBoost: 0, pos: g.position.clone() };
  VR.tween(.6, e => start.userData.set(e));
  VR.tween(a.duration || 3.2, (e, p) => main.userData.set(p), .4);
  VR.tween(.4, e => bar.userData.set(e), (a.duration || 3.2) + .4);
  VR.tween(1.5, e => halo.material.opacity = .2 * e);
  VR.at(0, () => VR.audio.chord([220, 329.63, 440], 4, .04));
}
A.sigil = (a, ctx) => {
  const mode = a.mode || 'appear';
  if (mode === 'appear' || !F.sigil) buildSigil(a, ctx);
  if (mode === 'appear') return;
  const s = F.sigil, D = a.duration || 10;
  if (mode === 'charge') VR.tween(D, e => { s.traces.forEach(t => t.userData.glow(1 + (VR.calm() ? .5 : 1.4) * e)); s.haloBase = .2 + .35 * e; });
  if (mode === 'gnosis') { VR.tween(D, e => { s.spinBoost = e * (VR.calm() ? .6 : 3.5); s.halo.scale.setScalar((.8 * 3.2) * (1 + (VR.calm() ? .5 : 1.6) * e)); });
    const c0 = VR.centerLight.intensity; VR.centerLight.color.set('#ff6aa8'); VR.tween(D, e => VR.centerLight.intensity = c0 + 1.5 * e * VR.fxK()); VR.at(0, () => VR.audio.tone(55, D, .08)); }
  if (mode === 'release') {
    if (!ctx.skip) burst(s.pos, VR.settings.simplified ? 90 : 260, ['#e0408a', '#ffd36b', '#ffffff', '#a77bff'], 3, 3.5);
    if (!VR.calm()) { const fl = VR.sprite(0xffffff, .2, 0); fl.position.copy(s.pos); F.root.add(fl); VR.tween(1.2, (e, p) => { fl.material.opacity = Math.sin(p * Math.PI); fl.scale.setScalar(.2 + 5 * p); if (p >= 1) F.root.remove(fl); }); }
    VR.tween(1.4, e => s.g.scale.setScalar(Math.max(.001, 1 - e)));
    VR.fadeObject(s.g, 1.6, () => { F.root.remove(s.g); VR.disposeGroup(s.g); if (F.sigil === s) F.sigil = null; });
    const c0 = VR.centerLight.intensity; VR.tween(3, e => VR.centerLight.intensity = c0 * (1 - e));
    VR.haptic(1, 300);
  }
};

/* ---------- tarot ---------- */
A.tarot = (a, ctx) => {
  const n = Math.max(1, Math.min(10, a.count || 1)), cards = VR.tarot.draw(n, !!a.reversals);
  if (VR.session) { VR.session.draws = (VR.session.draws || []).concat([{ at: new Date().toISOString(), cards: cards.map(c => c.name + (c.reversed ? ' (reversed)' : '')) }]); VR.session.lastCards = cards; }
  F.cards.forEach(c => { F.root.remove(c); VR.disposeGroup(c); }); F.cards = [];
  const d = VR.dir(ctx.face), right = new THREE.Vector3().crossVectors(d, VR.UP);
  cards.forEach((c, i) => { const m = VR.tarot.mesh(c), off = (i - (n - 1) / 2) * .9, pos = d.clone().multiplyScalar(a.distance || 1.9).addScaledVector(right, off);
    pos.y = a.height || 1.45; m.position.copy(pos); m.lookAt(0, pos.y, 0); m.userData.baseY = pos.y; F.root.add(m); F.cards.push(m);
    const inner = m.userData.inner; inner.rotation.y = Math.PI; inner.position.y = -1.2;
    VR.tween(2.2, e => { inner.position.y = -1.2 * (1 - e); }, i * .4);
    VR.tween(1.4, e => { inner.rotation.y = Math.PI * (1 - e); }, i * .4 + 1.6);
    VR.at(i * .4 + 1.6, () => { VR.audio.bell(783.99 - i * 98, .12); VR.haptic(.5, 80); }); });
};

/* ---------- clearing & release ---------- */
A.clear = a => {
  const t = a.target || 'all', D = a.duration || 2, is = k => t === 'all' || t === k;
  if (is('pentagrams')) Object.entries(F.pents).forEach(([k, P]) => VR.fadeObject(P.group, D, () => { F.root.remove(P.group); VR.disposeGroup(P.group); if (F.pents[k] === P) delete F.pents[k]; }));
  if (is('lines')) { const ls = F.lines; F.lines = []; ls.forEach(L => VR.fadeObject(L, D, () => { F.root.remove(L); VR.disposeGroup(L); })); }
  if (is('hexagram') && F.hex) { const h = F.hex; VR.fadeObject(h, D, () => { F.root.remove(h); VR.disposeGroup(h); if (F.hex === h) F.hex = null; }); }
  if (is('cross') && F.qc) { const q = F.qc; VR.fadeObject(q.g, D, () => { F.root.remove(q.g); VR.disposeGroup(q.g); if (F.qc === q) { F.qc = null; F.on = {}; } }); }
  if (is('sigil') && F.sigil) { const s = F.sigil; VR.fadeObject(s.g, D, () => { F.root.remove(s.g); VR.disposeGroup(s.g); if (F.sigil === s) F.sigil = null; }); }
  if (is('cards')) { const cs = F.cards; F.cards = []; cs.forEach(c => VR.fadeObject(c, D, () => { F.root.remove(c); VR.disposeGroup(c); })); }
  if (is('guardians')) A.dismiss({ quarter: 'all', duration: D });
  if (t === 'all') { const o0 = F.ring.material.opacity; VR.tween(D, e => F.ring.material.opacity = VR.lerp(o0, .06, e)); const c0 = VR.centerLight.intensity; VR.tween(D, e => VR.centerLight.intensity = c0 * (1 - e)); }
};
A.wait = () => {};
})(window.VR);
