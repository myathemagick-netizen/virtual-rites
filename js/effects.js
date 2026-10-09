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
    VR.finishTweens();
    if (F) { VR.scene.remove(F.root); VR.disposeGroup(F.root); }
    F = { root: new THREE.Group(), on: {}, pents: {}, lines: [], guardians: {}, cards: [], bursts: [], sigil: null, qc: null, hex: null, breath: null, chaos: {}, planets: null, serpent: null };
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
    Object.values(F.chaos).forEach(C => { for (let k = 0; k < C.lit; k++) C.rays[k].userData.glow(1 + (VR.calm() ? .08 : .35) * Math.sin(T * 2.6 + k * .8)); });
    if (F.planets) { const P = F.planets; P.g.rotation.y += dt * P.speed; Object.values(P.list).forEach(m => { m.position.y = m.userData.base + Math.sin(T * .7 + m.userData.phase) * .12; });
      if (P.eighth) P.eighth.userData.halos.forEach((h, i) => { h.material.rotation += dt * (i % 2 ? -.2 : .15); }); }
    if (F.serpent) { const S = F.serpent; S.U.uT.value += dt * S.speed; const r = S.U.uReveal.value;
      S.head.material.opacity = r > .002 && r < .995 ? .9 : 0; if (S.head.material.opacity) S.head.position.copy(S.curve.getPointAt(Math.min(r, 1))); }
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
  if (!wingTex) { wingTex = makeWingTex(); VR.sharedTextures.add(wingTex); }
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
  if (t === 'all' || t === 'chaosphere') Object.values(F.chaos).forEach(C => { C.lit = 0; C.rays.concat([C.ring]).forEach((r, i) => VR.tween(3.2, (e, p) => { r.userData.glow(1 + k * Math.sin(p * Math.PI)); if (p >= 1) C.lit = 8; }, i * .08)); });
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
  if (VR.session) { VR.session.draws = (VR.session.draws || []).concat([{ at: new Date().toISOString(), cards: cards.map(c => c.name + (c.reversed ? ' (reversed)' : '')), meanings: cards.map(c => VR.tarotMeaning(c)) }]); VR.session.lastCards = cards; }
  F.cards.forEach(c => { F.root.remove(c); VR.disposeGroup(c); }); F.cards = [];
  const d = VR.dir(ctx.face), right = new THREE.Vector3().crossVectors(d, VR.UP);
  cards.forEach((c, i) => { const m = VR.tarot.mesh(c), off = (i - (n - 1) / 2) * .9, pos = d.clone().multiplyScalar(a.distance || 1.9).addScaledVector(right, off);
    pos.y = a.height || 1.45; m.position.copy(pos); m.lookAt(0, pos.y, 0); m.userData.baseY = pos.y; F.root.add(m); F.cards.push(m);
    const inner = m.userData.inner; inner.rotation.y = Math.PI; inner.position.y = -.55; inner.scale.setScalar(.15);
    VR.tween(2.2, e => { inner.position.y = -.55 * (1 - e); inner.scale.setScalar(.15 + .85 * e); }, i * .4);
    VR.tween(1.4, e => { inner.rotation.y = Math.PI * (1 - e); }, i * .4 + 1.6);
    VR.at(i * .4 + 1.6, () => { VR.audio.bell(783.99 - i * 98, .12); VR.haptic(.5, 80); }); });
};

/* ---------- chaos star (chaosphere) ----------
   The eight-rayed star of chaos, drawn in the air in front of the practitioner,
   one arrow at a time, in scintillating octarine. */
VR.OCTARINE = ['#b8ff5a', '#5affc8', '#5ab8ff', '#9a6aff', '#ff5ae0', '#ff6a5a', '#ffc85a', '#e8ff5a'];
class PlaneCirc extends THREE.Curve { constructor(c, right, up, r) { super(); Object.assign(this, { c, right, up, r }); }
  getPoint(t, o = new THREE.Vector3()) { const a = t * Math.PI * 2; return o.copy(this.c).addScaledVector(this.right, Math.cos(a) * this.r).addScaledVector(this.up, Math.sin(a) * this.r); } }
A.chaosphere = (a, ctx) => {
  const b = VR.bearing(a.quarter ?? ctx.face), key = a.key || String(b);
  if (F.chaos[key]) { F.root.remove(F.chaos[key].group); VR.disposeGroup(F.chaos[key].group); }
  const R = a.size || .95, r0 = R * .23, d = VR.dir(b), c = d.clone().multiplyScalar(a.radius || 2.8); c.y = a.height || 1.7;
  const right = new THREE.Vector3().crossVectors(d, VR.UP), up = VR.UP.clone(), cols = a.colors || VR.OCTARINE;
  const at = (ang, rr) => c.clone().addScaledVector(right, Math.sin(ang) * rr).addScaledVector(up, Math.cos(ang) * rr);
  const grp = new THREE.Group(); F.root.add(grp); const rays = [];
  for (let k = 0; k < 8; k++) {
    const ang = k * Math.PI / 4, tip = at(ang, R), p0 = at(ang, r0), back = at(ang, R - R * .17);
    const perp = at(ang + Math.PI / 2, 1).sub(c).multiplyScalar(R * .1);
    const path = new THREE.CurvePath(); [[p0, tip], [tip, back.clone().add(perp)], [back.clone().add(perp), tip], [tip, back.clone().sub(perp)]].forEach(([u, v]) => path.add(new THREE.LineCurve3(u, v)));
    const col = new THREE.Color(cols[k % cols.length]);
    const tr = VR.trace(path, { segs: 90, r: .022, core: col.clone().lerp(new THREE.Color(0xffffff), .55), glow: col, gop: .5 }); grp.add(tr); rays.push(tr);
  }
  const ring = VR.trace(new PlaneCirc(c, right, up, r0), { segs: 60, r: .02, core: 0xffffff, glow: cols[3], gop: .5 }); grp.add(ring);
  const heart = VR.sprite(0xffffff, .05, 0); heart.position.copy(c); grp.add(heart);
  const S = { group: grp, rays, ring, heart, lit: 0 }; F.chaos[key] = S;
  const per = a.rayTime || .45;
  VR.tween(.7, e => ring.userData.set(e)); VR.fadeSprite(heart, .9, .8, 1);
  rays.forEach((tr, k) => { VR.tween(per, (e, p) => { tr.userData.set(p); if (p >= 1) S.lit = Math.max(S.lit, k + 1); }, .5 + k * per);
    VR.at(.5 + k * per, () => VR.audio.bell([261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25][k], .1)); });
  const end = .5 + 8 * per;
  if (!VR.calm()) { const fl = VR.sprite(0xffffff, .1, 0); fl.position.copy(c); grp.add(fl); VR.tween(1.4, (e, p) => { fl.material.opacity = Math.sin(p * Math.PI) * .8; fl.scale.setScalar(.2 + 3 * p); }, end); }
  if (a.vibrate) VR.at(end, () => { VR.audio.vibrate(a.vibrate); VR.haptic(.8, 400); });
};

/* ---------- planets ----------
   The seven classical planets circle the practitioner. "Ouranos" (or "Uranus") is the eighth:
   a dark sun with an octarine corona, standing outside the ring. */
const PLANET_NOTES = { Saturn: 98, Jupiter: 130.81, Mars: 146.83, Sun: 164.81, Venus: 196, Mercury: 220, Moon: 261.63 };
const RING_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
function planetRing(a) {
  if (F.planets) return F.planets;
  const g = new THREE.Group(); F.root.add(g); F.planets = { g, list: {}, speed: .05, eighth: null }; return F.planets;
}
A.planet = (a, ctx) => {
  const name = String(a.name || 'Sun'), P = planetRing(a);
  if (/^(ouranos|uranus)$/i.test(name)) {
    if (P.eighth) { const L = P.eighth.userData.halos; L.forEach(h => VR.pulse(h, .5, 2)); return; }
    const g = new THREE.Group(), d = VR.dir(VR.bearing(a.quarter ?? ctx.face)); g.position.copy(d.multiplyScalar(a.radius || 12)); g.position.y = a.height || 5.5;
    const core = new THREE.Mesh(new THREE.SphereGeometry(a.size || .9, 32, 16), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, transparent: true, opacity: 1 }));
    const halos = [[VR.OCTARINE[3], 4.6, .75], [VR.OCTARINE[0], 3.2, .6], [VR.OCTARINE[4], 6.5, .3]].map(([c, s, o]) => { const h = VR.sprite(c, .1, 0); g.add(h); VR.tween(3, e => { h.material.opacity = o * e; h.scale.setScalar(.1 + s * e * (a.size || .9)); }); return h; });
    const lbl = VR.textSprite([{ text: '♅', font: '140px serif', color: '#e8ffd0', glow: VR.OCTARINE[3], y: 110 }, { text: a.label || 'Ouranos', font: '54px Marcellus, Georgia, serif', color: '#e8ffd0', glow: VR.OCTARINE[0], y: 215 }], 512, 256, 2.2);
    lbl.position.y = (a.size || .9) + 1.3; g.add(core, lbl); core.scale.setScalar(.01);
    VR.tween(3, e => { core.scale.setScalar(Math.max(.01, e)); }); VR.tween(1.5, e => lbl.material.opacity = e, 2);
    g.userData = { halos, lbl }; F.root.add(g); P.eighth = g;
    VR.at(0, () => { VR.audio.tone(55, 6, .09); VR.audio.chord([55, 82.41, 116.54], 6, .05); }); VR.haptic(.7, 300);
    return;
  }
  if (P.list[name]) { VR.pulse(P.list[name].userData.glow, .6); VR.audio.bell(PLANET_NOTES[name] * 2 || 440, .12); return; }
  const info = (VR.cosmos && VR.cosmos.PLANETS[name]) || { color: '#ffffff', sym: '·' };
  const idx = Math.max(0, RING_ORDER.indexOf(name)), ang = idx / 7 * Math.PI * 2 + Math.PI / 2, rad = a.radius || 5.2;
  const m = new THREE.Group(); m.position.set(-Math.cos(ang) * rad, a.height || 2.8, -Math.sin(ang) * rad);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(a.size || .28, 24, 12), VR.addMat(info.color, .95));
  const glow = VR.sprite(info.color, .05, 0);
  const lbl = VR.textSprite([{ text: info.sym, font: '130px serif', color: '#ffffff', glow: info.color, y: 100 }, { text: a.label || name, font: '52px Marcellus, Georgia, serif', color: '#ffffff', glow: info.color, y: 205 }], 512, 256, 1.1);
  lbl.position.y = .6; m.add(ball, glow, lbl); ball.scale.setScalar(.01); P.g.add(m); P.list[name] = m;
  m.userData = { glow, lbl, base: m.position.y, phase: idx };
  VR.tween(1.6, e => { ball.scale.setScalar(Math.max(.01, e)); glow.material.opacity = .7 * e; glow.scale.setScalar(.05 + 1.6 * e); });
  VR.tween(1.2, e => lbl.material.opacity = e, .8);
  VR.at(0, () => VR.audio.bell(PLANET_NOTES[name] * 2 || 440, .14)); VR.at(.1, () => VR.audio.tone(PLANET_NOTES[name] || 196, 4, .04));
};
A.planets = a => {
  const P = F.planets; if (!P) return;
  if (a.speed != null) { const s0 = P.speed, s1 = a.speed; VR.tween(a.duration || 3, e => P.speed = VR.lerp(s0, s1, e)); }
  if (a.mode === 'withdraw') { const D = a.duration || 3;
    Object.entries(P.list).forEach(([n, m], i) => { const y0 = m.position.y; VR.tween(D, e => { m.userData.base = y0 + 4 * e; }, i * .15);
      VR.fadeObject(m, D, () => { P.g.remove(m); VR.disposeGroup(m); if (P.list[n] === m) delete P.list[n]; }); });
    if (P.eighth && a.eighth !== false) { const g8 = P.eighth; VR.tween(D, e => g8.scale.setScalar(Math.max(.01, 1 - e))); VR.fadeObject(g8, D, () => { F.root.remove(g8); VR.disposeGroup(g8); if (P.eighth === g8) P.eighth = null; }); }
  }
};

/* ---------- serpent (riftline) ----------
   A scintillating octarine serpent that tears across the sky above the practitioner like a
   riftline, then undulates overhead. Modes: appear, charge, calm, withdraw. */
const SERPENT_VS = `varying vec2 vUv;uniform float uT,uAmp,uR;
void main(){vUv=uv;float taper=smoothstep(0.,.07,uv.x)*smoothstep(1.,.86,uv.x);
vec3 p=position-normal*uR*(1.-taper);p.y+=sin(uv.x*14.-uT*1.3)*.35*uAmp;p+=normal*sin(uv.x*120.-uT*5.)*uR*.22;
gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const SERPENT_FS = `varying vec2 vUv;uniform float uT,uReveal,uOp,uK,uSpark;
vec3 hsv(float h,float s,float v){vec3 k=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);return v*mix(vec3(1.),k,s);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){if(vUv.x>uReveal)discard;
float h=fract(vUv.x*2.5-uT*.06+sin(vUv.y*6.2831)*.04);vec3 c=hsv(h,.62,1.);
c=mix(c,vec3(.72,1.,.34),.18+.14*sin(vUv.x*30.-uT*1.6));
float band=.72+.28*sin(vUv.x*90.-uT*3.);
float sp=step(.993,hash(floor(vUv*vec2(700.,6.))+floor(uT*5.)))*uSpark;
float edge=uReveal<.999?smoothstep(uReveal,uReveal-.03,vUv.x):1.;
gl_FragColor=vec4((c*band+sp)*uK,uOp*edge);}`;
A.serpent = (a, ctx) => {
  const mode = a.mode || 'appear';
  if (mode === 'appear' || !F.serpent) {
    if (F.serpent) { F.root.remove(F.serpent.g); VR.disposeGroup(F.serpent.g); }
    const b0 = VR.bearing(a.from ?? ctx.face), b1 = VR.bearing(a.to ?? (b0 + 180)), L = a.length || 13, H = a.height || 3.2, arch = a.arch ?? 3;
    const d0 = VR.dir(b0), d1 = VR.dir(b1), side = new THREE.Vector3().crossVectors(d0, VR.UP), pts = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24, p = d0.clone().multiplyScalar(L * (1 - t)).add(d1.clone().multiplyScalar(L * t));
      p.addScaledVector(side, Math.sin(t * Math.PI * (a.coils || 3)) * (a.sway ?? 1.4)); p.y = H + Math.sin(t * Math.PI) * arch; pts.push(p); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const U = { uT: { value: 0 }, uReveal: { value: 0 }, uAmp: { value: 1 }, uK: { value: VR.fxK() }, uSpark: { value: VR.calm() ? 0 : 1 } };
    const mk = (r, op) => new THREE.ShaderMaterial({ uniforms: Object.assign({}, U, { uOp: { value: op }, uR: { value: r } }), vertexShader: SERPENT_VS, fragmentShader: SERPENT_FS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const R = a.width || .08, g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.TubeGeometry(curve, 420, R, 10, false), mk(R, .95));
    const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 300, R * 3.4, 8, false), mk(R * 3.4, .28));
    const head = VR.sprite(0xf0ffe0, .9, 0), rift = VR.sprite(VR.OCTARINE[3], 2.4, 0); rift.position.copy(curve.getPointAt(0));
    g.add(body, halo, head, rift); F.root.add(g);
    F.serpent = { g, curve, U, body, halo, head, rift, speed: a.speed || 1, op: [body.material.uniforms.uOp, halo.material.uniforms.uOp] };
    const S = F.serpent, D = a.duration || 5;
    VR.tween(1.2, e => { rift.material.opacity = .8 * e; rift.scale.setScalar(.2 + 2.4 * e); });
    VR.tween(D, (e, p) => { U.uReveal.value = e; }, .6);
    VR.at(.6, () => { VR.audio.chord([110, 164.81, 207.65, 277.18], D + 2, .045); VR.audio.tone(55, D, .06); });
    VR.at(.6 + D, () => VR.haptic(.6, 250));
    if (mode === 'appear') return;
  }
  const S = F.serpent, D = a.duration || 6;
  if (mode === 'charge') { const s0 = S.speed, a0 = S.U.uAmp.value; VR.tween(D, e => { S.speed = VR.lerp(s0, a.speed || 2.6, e); S.U.uAmp.value = VR.lerp(a0, VR.calm() ? 1.2 : 1.8, e); S.op[1].value = VR.lerp(.28, .45, e); }); }
  if (mode === 'calm') { const s0 = S.speed, a0 = S.U.uAmp.value; VR.tween(D, e => { S.speed = VR.lerp(s0, 1, e); S.U.uAmp.value = VR.lerp(a0, 1, e); S.op[1].value = VR.lerp(S.op[1].value, .28, e); }); }
  if (mode === 'withdraw') { const r0 = S.U.uReveal.value;
    VR.tween(D, e => { S.U.uReveal.value = r0 * (1 - e); }); VR.tween(1.5, e => S.rift.material.opacity = .8 * (1 - e), D - .5);
    VR.tween(D + 1, (e, p) => { if (p >= 1) { F.root.remove(S.g); VR.disposeGroup(S.g); if (F.serpent === S) F.serpent = null; } }); }
};
function fadeSerpent(D) { const S = F.serpent; if (!S) return; const o = S.op.map(u => u.value), ro = S.rift.material.opacity;
  VR.tween(D, (e, p) => { S.op.forEach((u, i) => u.value = o[i] * (1 - e)); S.rift.material.opacity = ro * (1 - e); S.head.material.opacity = 0;
    if (p >= 1) { F.root.remove(S.g); VR.disposeGroup(S.g); if (F.serpent === S) F.serpent = null; } }); }

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
  if (is('chaosphere')) Object.entries(F.chaos).forEach(([k, C]) => { C.lit = 0; VR.fadeObject(C.group, D, () => { F.root.remove(C.group); VR.disposeGroup(C.group); if (F.chaos[k] === C) delete F.chaos[k]; }); });
  if (is('planets') && F.planets) A.planets({ mode: 'withdraw', duration: D });
  if (is('serpent')) fadeSerpent(D);
  if (t === 'all') { const o0 = F.ring.material.opacity; VR.tween(D, e => F.ring.material.opacity = VR.lerp(o0, .06, e)); const c0 = VR.centerLight.intensity; VR.tween(D, e => VR.centerLight.intensity = c0 * (1 - e)); }
};
A.wait = () => {};
})(window.VR);
