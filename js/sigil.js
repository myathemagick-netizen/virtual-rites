/* Virtual Rites — sigil module
   Austin Osman Spare's letter reduction (drop vowels and repeated letters),
   then a glyph built by one of two constructions:
     wheel: consonants placed around a circle, joined in order
     grid:  consonants placed on a 5x5 letter square (I and J share), joined in order
   Every glyph gets a small circle at its start and a bar at its end. */
(function (VR) {
'use strict';
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
function reduce(text) {
  const clean = (text || '').toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '');
  const seen = new Set(); let out = '';
  for (const ch of clean) { if (VOWELS.has(ch) || seen.has(ch)) continue; seen.add(ch); out += ch; }
  return out;
}
function wheel(letters) { return [...letters].map(ch => { const i = ch.charCodeAt(0) - 65, a = Math.PI / 2 - i / 26 * Math.PI * 2, r = i % 2 ? .62 : .95; return [Math.cos(a) * r, Math.sin(a) * r]; }); }
const SQUARE = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
function grid(letters) { return [...letters].map(ch => { const i = SQUARE.indexOf(ch === 'J' ? 'I' : ch), x = i % 5, y = Math.floor(i / 5); return [(x - 2) * .45, (2 - y) * .45]; }); }
function make(intent, method = 'wheel') {
  const letters = reduce(intent) || 'VRTS';
  const raw = (method === 'grid' ? grid : wheel)(letters);
  const pts = raw.filter((p, i) => i === 0 || Math.hypot(p[0] - raw[i - 1][0], p[1] - raw[i - 1][1]) > 1e-3);
  if (pts.length === 1) pts.push([-pts[0][0] * .5, -pts[0][1] * .5 - .2]);
  return { intent: intent || '', letters, method, pts };
}
function draw2D(canvas, s, o = {}) {
  const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, sc = W * .4, cx = W / 2, cy = H / 2, P = p => [cx + p[0] * sc, cy - p[1] * sc];
  g.clearRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1;
  if (s.method === 'grid') { for (let i = 0; i < 25; i++) { const [x, y] = P([(i % 5 - 2) * .45, (2 - Math.floor(i / 5)) * .45]); g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.stroke(); } }
  else { g.beginPath(); g.arc(cx, cy, sc * .95, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(cx, cy, sc * .62, 0, Math.PI * 2); g.stroke(); }
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = o.color || '#ff7ab8'; g.shadowColor = o.glow || '#e0408a'; g.shadowBlur = 14; g.lineWidth = W / 55;
  g.beginPath(); s.pts.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  const [x0, y0] = P(s.pts[0]); g.beginPath(); g.arc(x0, y0, W / 30, 0, Math.PI * 2); g.stroke();
  const n = s.pts.length, [xa, ya] = P(s.pts[n - 2]), [xb, yb] = P(s.pts[n - 1]), dx = xb - xa, dy = yb - ya, L = Math.hypot(dx, dy) || 1, nx = -dy / L * W / 20, ny = dx / L * W / 20;
  g.beginPath(); g.moveTo(xb - nx, yb - ny); g.lineTo(xb + nx, yb + ny); g.stroke(); g.shadowBlur = 0;
}
const lib = {
  all() { return VR.store.get('sigils', []); },
  save(s) { const l = lib.all(); if (l.some(x => x.letters === s.letters && x.method === s.method)) return;
    l.unshift({ id: Date.now().toString(36), intent: s.intent, letters: s.letters, method: s.method, pts: s.pts, created: new Date().toISOString() }); VR.store.set('sigils', l.slice(0, 200)); },
  remove(id) { VR.store.set('sigils', lib.all().filter(x => x.id !== id)); }
};
VR.sigil = { reduce, make, draw2D, lib };
})(window.VR);
