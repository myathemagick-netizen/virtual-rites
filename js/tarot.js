/* Virtual Rites — tarot module
   78 cards named after the Rider-Waite-Smith deck (1909, public domain).
   Faces are drawn procedurally. To use real card images, see assets/tarot/README.md. */
(function (VR) {
'use strict';
const MAJ = ['The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
  'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance', 'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World'];
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];
const SUITS = [{ n: 'Wands', c: '#ff7a3d' }, { n: 'Cups', c: '#3d9bff' }, { n: 'Swords', c: '#d8d0ff' }, { n: 'Pentacles', c: '#9fd34a' }];
/* Traditional meanings in brief, after the Rider-Waite-Smith tradition: [upright, reversed] */
const MAJ_M = [
  ['new beginnings, spontaneity, a leap of faith', 'recklessness, hesitation, poor judgment'],
  ['will, skill, resourcefulness, manifestation', 'manipulation, untapped talent, trickery'],
  ['intuition, hidden knowledge, the inner voice', 'secrets, ignored intuition, withdrawal'],
  ['abundance, nurturing, fertility, the senses', 'dependence, creative block, smothering'],
  ['authority, structure, stability, leadership', 'rigidity, domination, lack of discipline'],
  ['tradition, teaching, institutions, shared belief', 'rebellion, unconventional paths, dogma questioned'],
  ['love, union, aligned values, a meaningful choice', 'disharmony, imbalance, a choice avoided'],
  ['willpower, victory, determination, forward motion', 'lack of direction, scattered force, obstacles'],
  ['courage, gentle power, patience, compassion', 'self-doubt, weakness, raw emotion'],
  ['solitude, introspection, inner guidance', 'isolation, loneliness, withdrawal'],
  ['cycles, fate, turning points, luck', 'bad luck, resisting change, broken cycles'],
  ['fairness, truth, cause and effect, accountability', 'injustice, dishonesty, avoiding accountability'],
  ['surrender, suspension, a new perspective', 'stalling, needless sacrifice, indecision'],
  ['endings, transformation, transition', 'resisting change, stagnation, lingering'],
  ['balance, moderation, patience, blending', 'excess, imbalance, short-sightedness'],
  ['bondage, temptation, materialism, the shadow', 'release, breaking free, reclaiming power'],
  ['sudden upheaval, revelation, false structures falling', 'averted disaster, fear of change, delayed collapse'],
  ['hope, renewal, inspiration, serenity', 'despair, lost faith, disconnection'],
  ['illusion, dreams, the unconscious, uncertainty', 'confusion lifting, repressed fear, truth emerging'],
  ['joy, success, vitality, clarity', 'temporary gloom, dimmed enthusiasm, delayed success'],
  ['awakening, reckoning, a calling, renewal', 'self-doubt, refusing the call, harsh self-judgment'],
  ['completion, fulfillment, integration, wholeness', 'incompletion, lack of closure, delays']];
const MIN_M = {
  Wands: [['inspiration, a spark, a new venture', 'delays, lack of motivation'], ['planning, future vision, decisions', 'fear of the unknown, poor planning'],
    ['expansion, foresight, progress', 'setbacks, frustrated plans'], ['celebration, homecoming, harmony', 'instability at home, transition'],
    ['conflict, competition, friction', 'avoiding conflict, resolution'], ['victory, recognition, acclaim', 'fall from grace, ego'],
    ['standing your ground, defense, perseverance', 'overwhelm, giving up'], ['swift movement, momentum, news', 'delays, frustration'],
    ['resilience, persistence, a last stand', 'exhaustion, defensiveness'], ['burden, responsibility, overload', 'releasing burdens, delegating'],
    ['enthusiasm, exploration, a message', 'false starts, impatience'], ['action, adventure, impulsiveness', 'recklessness, haste'],
    ['confidence, warmth, determination', 'jealousy, insecurity'], ['vision, leadership, boldness', 'impulsiveness, overbearing force']],
  Cups: [['new love, emotional opening, compassion', 'blocked feelings, emptiness'], ['partnership, mutual attraction, union', 'imbalance, broken communication'],
    ['friendship, celebration, community', 'overindulgence, gossip'], ['apathy, contemplation, a missed offer', 'renewed interest, acceptance'],
    ['loss, grief, regret', 'acceptance, moving on'], ['nostalgia, childhood, innocence', 'stuck in the past'],
    ['choices, fantasy, illusion', 'clarity, focus'], ['walking away, seeking deeper meaning', 'fear of change, aimless drifting'],
    ['contentment, a wish fulfilled', 'smugness, dissatisfaction'], ['harmony, family, lasting happiness', 'disconnection, strained family'],
    ['a creative offer, intuition, sensitivity', 'emotional immaturity'], ['romance, charm, following the heart', 'moodiness, unrealistic ideals'],
    ['compassion, calm, emotional depth', 'codependence, insecurity'], ['emotional balance, diplomacy, generosity', 'manipulation, volatility']],
  Swords: [['clarity, breakthrough, truth', 'confusion, chaos'], ['a difficult choice, stalemate', 'indecision, information overload'],
    ['heartbreak, sorrow, grief', 'recovery, forgiveness'], ['rest, recovery, contemplation', 'restlessness, burnout'],
    ['conflict, defeat, winning at a cost', 'reconciliation, making amends'], ['transition, moving on, calmer waters', 'resisting change, unfinished business'],
    ['deception, strategy, stealth', 'confession, coming clean'], ['restriction, feeling trapped, self-limiting beliefs', 'release, a new perspective'],
    ['anxiety, worry, sleeplessness', 'hope, reaching out'], ['a painful ending, rock bottom', 'recovery, regeneration'],
    ['curiosity, new ideas, vigilance', 'gossip, hasty words'], ['ambition, drive, fast thinking', 'aggression, scattered energy'],
    ['independence, clear judgment, honesty', 'coldness, bitterness'], ['intellect, authority, truth', 'manipulation, cruelty']],
  Pentacles: [['a new opportunity, prosperity, manifestation', 'a missed chance, poor planning'], ['balance, adaptability, juggling priorities', 'overwhelm, disorganization'],
    ['teamwork, craft, collaboration', 'disharmony, poor workmanship'], ['security, holding on, control', 'greed, letting go'],
    ['hardship, loss, isolation', 'recovery, help arriving'], ['generosity, giving and receiving', 'debt, strings attached'],
    ['patience, long-term investment', 'impatience, poor return'], ['diligence, skill, mastery through practice', 'perfectionism, lack of focus'],
    ['abundance, self-sufficiency, luxury', 'overwork, dependence'], ['wealth, legacy, family', 'financial loss, a legacy at risk'],
    ['study, ambition, new skills', 'procrastination, lack of progress'], ['hard work, routine, reliability', 'stagnation, boredom'],
    ['nurturing, practicality, comfort', 'self-neglect, work and home out of balance'], ['wealth, security, discipline', 'greed, stubbornness']]
};
const deck = [];
MAJ.forEach((n, i) => deck.push({ id: 'major-' + String(i).padStart(2, '0'), name: n, num: ROMAN[i], arcana: 'major', color: '#ffd36b', up: MAJ_M[i][0], rev: MAJ_M[i][1] }));
SUITS.forEach(s => RANKS.forEach((r, i) => deck.push({ id: s.n.toLowerCase() + '-' + String(i + 1).padStart(2, '0'), name: r + ' of ' + s.n, num: i < 10 ? String(i + 1) : r, arcana: 'minor', suit: s.n, color: s.c, up: MIN_M[s.n][i][0], rev: MIN_M[s.n][i][1] })));
VR.tarotMeaning = c => c ? (c.reversed ? c.rev : c.up) : '';

function rand(n) { if (window.crypto && crypto.getRandomValues) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } return Math.floor(Math.random() * n); }
function draw(n, reversals) { const pool = deck.slice(), out = []; for (let i = 0; i < n && pool.length; i++) { const c = pool.splice(rand(pool.length), 1)[0]; out.push(Object.assign({}, c, { reversed: reversals ? rand(2) === 1 : false })); } return out; }

function emblem(g, card, cx, cy, s) {
  g.save(); g.translate(cx, cy); g.strokeStyle = card.color; g.fillStyle = card.color; g.lineWidth = 7; g.lineCap = 'round'; g.shadowColor = card.color; g.shadowBlur = 24;
  switch (card.suit) {
    case 'Wands': g.beginPath(); g.moveTo(-s * .15, s * .9); g.lineTo(s * .15, -s * .9); g.stroke();
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(k * s * .06 + s * .05, k * s * .35 - s * .05, s * .12, s * .05, -.6, 0, Math.PI * 2); g.fill(); } break;
    case 'Cups': g.beginPath(); g.moveTo(-s * .55, -s * .6); g.quadraticCurveTo(-s * .5, s * .15, 0, s * .2); g.quadraticCurveTo(s * .5, s * .15, s * .55, -s * .6); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(0, s * .2); g.lineTo(0, s * .7); g.moveTo(-s * .3, s * .75); g.lineTo(s * .3, s * .75); g.stroke(); break;
    case 'Swords': g.beginPath(); g.moveTo(0, -s * .95); g.lineTo(0, s * .55); g.stroke(); g.beginPath(); g.moveTo(-s * .4, s * .5); g.lineTo(s * .4, s * .5); g.stroke();
      g.beginPath(); g.moveTo(0, s * .55); g.lineTo(0, s * .85); g.stroke(); g.beginPath(); g.arc(0, s * .9, s * .06, 0, Math.PI * 2); g.fill(); break;
    case 'Pentacles': g.beginPath(); g.arc(0, 0, s * .75, 0, Math.PI * 2); g.stroke(); g.beginPath();
      for (let k = 0; k <= 5; k++) { const a = -Math.PI / 2 + k * 4 * Math.PI / 5; const x = Math.cos(a) * s * .65, y = Math.sin(a) * s * .65; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); break;
    default: g.beginPath(); g.arc(0, 0, s * .4, 0, Math.PI * 2); g.stroke();
      for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(a) * s * .52, Math.sin(a) * s * .52); g.lineTo(Math.cos(a) * s * (k % 2 ? .75 : .95), Math.sin(a) * s * (k % 2 ? .75 : .95)); g.stroke(); }
      g.beginPath(); g.arc(0, 0, s * .12, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
function faceCanvas(card) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 880; const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 880); bg.addColorStop(0, '#1b0d3a'); bg.addColorStop(1, '#0b0620'); g.fillStyle = bg; g.fillRect(0, 0, 512, 880);
  const rg = g.createRadialGradient(256, 400, 20, 256, 400, 300); rg.addColorStop(0, card.color + '55'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 512, 880);
  g.strokeStyle = '#ffd36b'; g.lineWidth = 6; g.strokeRect(22, 22, 468, 836); g.lineWidth = 2; g.strokeRect(36, 36, 440, 808);
  g.fillStyle = '#ffe7a8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '64px Marcellus, Georgia, serif'; g.fillText(card.num, 256, 104);
  emblem(g, card, 256, 420, 190);
  g.fillStyle = '#f6efff'; const words = card.name.split(' '); let size = card.name.length > 16 ? 40 : 48; g.font = size + 'px Marcellus, Georgia, serif';
  if (g.measureText(card.name).width > 420 && words.length > 2) { const mid = Math.ceil(words.length / 2); g.fillText(words.slice(0, mid).join(' '), 256, 730); g.fillText(words.slice(mid).join(' '), 256, 784); }
  else g.fillText(card.name, 256, 756);
  return c;
}
let backTex = null;
function backCanvas() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 880; const g = c.getContext('2d');
  g.fillStyle = '#140a3a'; g.fillRect(0, 0, 512, 880); g.strokeStyle = '#ffd36b'; g.lineWidth = 6; g.strokeRect(22, 22, 468, 836);
  g.strokeStyle = 'rgba(255,211,107,.55)'; g.lineWidth = 2;
  for (let r = 40; r < 240; r += 28) { g.beginPath(); g.arc(256, 440, r, 0, Math.PI * 2); g.stroke(); }
  for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12; g.beginPath(); g.moveTo(256, 440); g.lineTo(256 + Math.cos(a) * 230, 440 + Math.sin(a) * 230); g.stroke(); }
  return c;
}
let info = { images: false, ext: 'jpg' };
function loadDeckInfo() { return fetch('assets/tarot/deck.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { if (j) info = Object.assign(info, j); }).catch(() => {}); }
function mesh(card) {
  const outer = new THREE.Group(), inner = new THREE.Group(); outer.add(inner);
  const frontMat = new THREE.MeshBasicMaterial({ map: VR.canvasTex(faceCanvas(card)), transparent: true, toneMapped: false, fog: false });
  if (!backTex) backTex = VR.canvasTex(backCanvas());
  const backMat = new THREE.MeshBasicMaterial({ map: backTex, transparent: true, toneMapped: false, fog: false });
  const geo = new THREE.PlaneGeometry(.66, 1.14), front = new THREE.Mesh(geo, frontMat), back = new THREE.Mesh(geo, backMat); back.rotation.y = Math.PI;
  const glow = VR.sprite(card.color, 2, .35); glow.position.z = -.05;
  inner.add(glow, front, back); if (card.reversed) inner.rotation.z = Math.PI;
  if (info.images) new THREE.TextureLoader().load(`assets/tarot/${card.id}.${info.ext || 'jpg'}`, t => { t.encoding = THREE.sRGBEncoding; frontMat.map.dispose(); frontMat.map = t; frontMat.needsUpdate = true; }, undefined, () => {});
  outer.userData = { inner, mats: [frontMat, backMat, glow.material] };
  backMat.userData.shared = true;
  return outer;
}
VR.tarot = { deck, draw, mesh, loadDeckInfo };
})(window.VR);
