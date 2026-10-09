import { validateRitual } from './validation.js';
/* Virtual Rites — ritual player
   Expands a ritual file into steps, runs them, and provides the flow controls:
   pause (graceful), next, repeat, mark, jump, skip phase (with one acknowledgment),
   save and resume. */
(function (VR) {
'use strict';
const PHASES = ['preparation', 'boundary', 'invocation', 'working', 'sealing'];
const PHASE_NAMES = { preparation: 'Preparation', boundary: 'Boundary', invocation: 'Invocation', working: 'The Working', sealing: 'Sealing and Release' };
const SKIP_NOTES = {
  preparation: 'Skipping preparation means beginning without settling in first.',
  boundary: 'Skipping the boundary means continuing without a cast circle.',
  invocation: 'Skipping invocation means working without calling in the powers of this rite.',
  working: 'Skipping the working leaves the core act of the rite undone.',
  sealing: 'Skipping sealing leaves what was opened unclosed.'
};
VR.PHASES = PHASES; VR.PHASE_NAMES = PHASE_NAMES;

/* Turn "use" references into real steps and give every step a phase. */
function expand(r) {
  validateRitual(r, VR.actions);
  const seqs = r.sequences || {}, out = []; let last = 'preparation';
  const walk = (list, forced, intro, depth) => list.forEach((s, idx) => {
    if (s.use) { if (depth > 5) return; const sub = seqs[s.use]; if (!sub) { console.warn('[Virtual Rites] missing sequence:', s.use); return; } walk(sub, s.phase || forced, s.intro, depth + 1); return; }
    const st = JSON.parse(JSON.stringify(s)); st.phase = forced || s.phase || last; if (!PHASES.includes(st.phase)) st.phase = 'working'; last = st.phase;
    if (intro && idx === 0) st.text = intro + ' ' + (st.text || '');
    out.push(st);
  });
  walk(r.steps || [], null, null, 0);
  return out;
}
VR.expandRitual = expand;

function cardsText(c) { if (!c || !c.length) return 'your card'; const n = c.map(x => x.name + (x.reversed ? ', reversed' : '')); return n.length === 1 ? n[0] : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; }

const P = VR.player = { active: false, ritual: null, steps: [], si: -1, stepT: 0, guided: true, paused: false, face: 90, view: 90, look: { p: 0, y: 0 }, elev: 0, focus: 1.4, pending: null, session: null };
const L = {}; P.on = (ev, fn) => (L[ev] = L[ev] || []).push(fn); const emit = (ev, x) => (L[ev] || []).forEach(f => f(x));

P.load = (ritual, session) => {
  P.ritual = ritual; P.steps = expand(ritual);
  if (session.energy === 'low') P.steps = P.steps.filter(s => !s.optional);
  if (!P.steps.length) P.steps = [{ phase: 'working', title: ritual.title || 'Empty rite', text: 'This ritual file has no steps yet.', hold: true }];
  P.session = session; VR.session = session; session.total = P.steps.length; session.marks = session.marks || []; session.draws = session.draws || [];
};
P.fill = t => String(t || '').replace(/\{(\w+)\}/g, (m, k) => { const S = P.session || {}, c = S.cosmos || {};
  switch (k) { case 'intent': return S.intent || 'your intent'; case 'letters': return (S.sigil && S.sigil.letters) || '';
    case 'cards': return cardsText(S.lastCards);
    case 'meanings': case 'meaning': return (S.lastCards || []).map(c => `${c.name}${c.reversed ? ', reversed' : ''}: ${VR.tarotMeaning(c)}.`).join(' '); case 'moon': return c.moon ? c.moon.name : ''; case 'hour': return c.hourRuler || '';
    case 'day': return c.dayRuler || ''; case 'sign': return c.sunSign || ''; case 'world': return S.worldName || ''; default: return m; } });

function ctx(skip) { return { skip, get face() { return P.face; }, setFace: b => { P.face = b; P.view = b; }, session: P.session }; }
function apply(i, skip) {
  const s = P.steps[i];
  if (s.face !== undefined) P.face = VR.shortest(P.face, VR.bearing(s.face));
  P.view = s.view !== undefined ? VR.shortest(P.face, VR.bearing(s.view)) : P.face;
  P.look = { p: (s.look && s.look.pitch) || 0, y: (s.look && s.look.yaw) || 0 };
  P.elev = (s.camera && s.camera.elevation) || 0; P.focus = (s.camera && s.camera.focus) || (s.view !== undefined ? 3.6 : 1.4);
  VR.fx.run(s.actions, ctx(skip));
}
function saveProgress() {
  if (!P.active) return;
  VR.store.set('progress', { ritualFile: P.session.ritualFile, world: P.session.world, si: P.si, session: P.session, savedAt: new Date().toISOString(), elapsed: P.elapsed() });
}
P.elapsed = () => Math.round((performance.now() - (P.t0 || performance.now())) / 1000) + (P.session && P.session.priorSec || 0);

P.start = (from = 0) => {
  from = Number.isInteger(from) ? Math.max(0, Math.min(from, P.steps.length - 1)) : 0;
  P.active = true; P.paused = false; P.face = 90; P.view = 90; P.si = -1; P.t0 = performance.now(); VR.fx.reset();
  VR.audio.start();
  P.session.startedAt = P.session.startedAt || new Date().toISOString();
  if (from > 0) { fastForward(from); P.si = from; P.pending = { t: 3, i: from }; VR.audio.bell(523.25, .14); VR.at(.5, () => VR.audio.bell(783.99, .1));
    const Lt = VR.centerLight, i0 = Lt.intensity; VR.tween(2.4, (e, p) => Lt.intensity = i0 + 1.2 * Math.sin(p * Math.PI) * VR.fxK()); emit('reentry', from);
    if (VR.settings.narration && P.guided) VR.say('Returning to the circle.'); }
  else P.go(0);
};
function fastForward(n) { const wasSilent = VR.silent; VR.silent = true; try { for (let i = 0; i < n; i++) { apply(i, true); VR.finishTweens(); } } finally { VR.silent = wasSilent; } }
P.go = i => {
  VR.media.clearStep();
  VR.finishTweens(); P.si = i; P.stepT = 0; P.pending = null; apply(i, false);
  const s = P.steps[i]; P.session.stepsDone = Math.max(P.session.stepsDone || 0, i + 1);
  const spoke = P.guided && VR.settings.narration && s.say;
  if (spoke) VR.say(P.fill(s.say),false,{url:s.narration ? VR.media.url(P.ritual,s.narration) : null});
  if (VR.settings.describe && s.describe) VR.say(P.fill(s.describe),!!spoke,{url:s.descriptionAudio ? VR.media.url(P.ritual,s.descriptionAudio) : null});
  VR.haptic(.25, 40); saveProgress(); emit('step', i);
};
P.dur = s => (s.duration || 4.6) * VR.settings.pace * (P.session && P.session.energy === 'low' ? 1.15 : 1);
P.isLast = () => P.si >= P.steps.length - 1;
P.next = () => { if (!P.active) return; if (P.pending) { const i = P.pending.i; P.pending = null; P.go(i); return; } if (P.paused) P.resume(); if (P.isLast()) { P.finish(); return; } P.go(P.si + 1); };
P.repeat = () => { if (!P.active || P.si < 0 || P.pending) return; P.session.repeats = (P.session.repeats || 0) + 1; if (P.paused) P.resume(); P.go(P.si); };
P.mark = () => { if (!P.active || P.si < 0) return; const s = P.steps[P.si];
  P.session.marks.push({ step: P.si + 1, title: P.fill(s.title), phase: s.phase, elapsed: P.elapsed() });
  VR.audio.bell(1318.5, .08); VR.haptic(.6, 80); saveProgress(); emit('mark'); };
P.pause = () => { if (!P.active || P.paused) return; P.paused = true; VR.stopSpeech(); VR.media.pause(true); VR.audio.duck(true); emit('pause', true); };
P.resume = () => { if (!P.paused) return; P.paused = false; VR.audio.duck(false); VR.audio.bell(659.25, .12);
  VR.media.pause(false);
  const Lt = VR.centerLight, i0 = Lt.intensity; VR.tween(1.4, (e, p) => Lt.intensity = i0 + .8 * Math.sin(p * Math.PI) * VR.fxK()); emit('pause', false); };
P.jump = i => { if (!P.active) return; i = Math.max(0, Math.min(P.steps.length - 1, i)); if (P.paused) { P.paused = false; VR.audio.duck(false); emit('pause', false); }
  VR.stopSpeech(); VR.finishTweens(); VR.fx.reset(); P.face = 90; P.view = 90; fastForward(i); P.go(i); };
let ack = null;
P.skipPhase = () => {
  if (!P.active || P.si < 0) return { done: false, msg: '' };
  const ph = P.steps[P.si].phase; let j = P.si; while (j < P.steps.length && P.steps[j].phase === ph) j++;
  if (j >= P.steps.length) return { done: false, msg: 'This is the final phase. Use Next to move through it.' };
  if (!ack || ack.ph !== ph || ack.si !== P.si || Date.now() - ack.t > 15000) { ack = { ph, si: P.si, t: Date.now() }; return { done: false, msg: SKIP_NOTES[ph] + ' Press again to skip anyway.' }; }
  ack = null; P.session.skippedPhases = (P.session.skippedPhases || []).concat(ph); if (P.paused) P.resume(); P.go(j); return { done: true, msg: '' };
};
P.finish = () => {
  if (!P.active) return; P.active = false; VR.stopSpeech(); VR.audio.stop();
  P.session.completed = P.si >= P.steps.length - 1; P.session.endedAt = new Date().toISOString(); P.session.durationSec = P.elapsed();
  VR.store.del('progress'); emit('end', P.session);
};
P.leave = save => { if (!P.active) return; if (save) saveProgress(); else VR.store.del('progress'); P.active = false; P.paused = false; VR.stopSpeech(); VR.audio.stop(); emit('leave', save); };
P.update = dt => {
  if (!P.active || P.paused) return; VR.updTweens(dt);
  if (P.pending) { P.pending.t -= dt; if (P.pending.t <= 0) { const i = P.pending.i; P.pending = null; P.go(i); } return; }
  const s = P.steps[P.si]; if (!s) return; P.stepT += dt;
  if (P.guided && !s.hold && !P.isLast() && P.stepT >= P.dur(s) && !VR.narration.busy) P.next();
};
P.progress = () => { if (P.si < 0 || !P.steps.length) return 0; const s = P.steps[P.si], d = P.dur(s); return (P.si + (s.hold || P.isLast() || !P.guided ? 1 : Math.min(P.stepT / d, 1))) / P.steps.length; };
})(window.VR);
