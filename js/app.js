import { validateRitual, validateLibrary } from './validation.js';
/* Virtual Rites — app
   Boots the library (worlds/ and rituals/), runs the screens, the HUD and Conductor,
   the journal and settings, WebXR (VR and passthrough mixed reality) and the render loop. */
(function (VR) {
'use strict';
const $ = s => document.querySelector(s);
const P = VR.player, S = VR.settings;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const state = { rituals: [], ritual: null, world: null, mode: 'guided', sigilMethod: 'wheel', savedSigil: null, screen: 'home', cosmos: null, pendingSession: null };
const xr = { vr: false, ar: false, session: null, mode: null, prev: {} };

/* ---------- boot ---------- */
const fetchJSON = url => fetch(VR.assetURL(url), { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });
const loadScript = src => VR.loadWorldModule(src);
async function boot() {
  applyCss();
  try { const wl = validateLibrary(await fetchJSON('worlds/index.json'), 'js'); for (const f of wl) await loadScript(f); }
  catch (e) { console.error(e); VR.toast("Couldn't read worlds/index.json. If you opened the file directly, serve the folder from GitHub Pages or a local web server."); }
  try { const rl = validateLibrary(await fetchJSON('rituals/index.json'), 'json');
    const rs = await Promise.all(rl.map(f => fetchJSON('rituals/' + f).then(r => { validateRitual(r, VR.actions); r.file = f; return r; }).catch(err => { console.error('[Virtual Rites] ritual failed to load:', f, err); VR.toast('Ritual file ' + f + " couldn't be read. Check it for JSON errors."); return null; })));
    state.rituals = rs.filter(Boolean); }
  catch (e) { console.error(e); VR.toast("Couldn't read rituals/index.json."); }
  VR.tarot.loadDeckInfo();
  state.ritual = state.rituals[0] || null;
  state.world = (state.ritual && VR.worlds[state.ritual.defaultWorld]) ? state.ritual.defaultWorld : VR.worldOrder[0];
  VR.loadWorld(state.world); VR.fx.reset(); renderHome(); checkXR();
}
function applyCss() { document.documentElement.style.setProperty('--text-scale', S.textScale); }

/* ---------- screens ---------- */
function show(id) {
  ['home', 'intent', 'after', 'journal', 'settings'].forEach(x => $('#' + x).classList.toggle('off', x !== id));
  const rite = id === 'rite'; state.screen = id;
  $('#top').classList.toggle('off', !rite); $('#stage').classList.toggle('off', !rite);
  if (!rite) setConductor(false);
}
document.querySelectorAll('[data-home]').forEach(b => b.addEventListener('click', () => { renderHome(); show('home'); }));

function applyTint(c) { VR.tintLight.color.set(c.hourColor); VR.tintLight.groundColor.set(0x000000); VR.tintLight.intensity = S.timingTint ? .3 : 0; }
function renderHome() {
  const c = VR.cosmos.summary(new Date(), S.location); state.cosmos = c; applyTint(c);
  $('#timing').innerHTML = `${c.moon.icon} <b>${c.moon.name}</b>, ${c.moon.illumination}% lit. ${esc(c.dayName)}, day of <b>${c.daySym} ${c.dayRuler}</b>. `
    + `Hour of <b style="color:${c.hourColor}">${c.hourSym} ${c.hourRuler}</b>${c.approx ? ' (approximate; add your location in Comfort and access)' : ''}. Sun in ${c.sunSign}. ${esc(c.festival)}.`;
  const n = $('#notices'); n.innerHTML = '';
  const pr = VR.store.get('progress', null);
  if (pr && pr.session) { const d = document.createElement('div'); d.className = 'notice';
    d.innerHTML = `<p>You left <b>${esc(pr.session.ritual.title)}</b> in ${esc(pr.session.worldName)} at step ${pr.si + 1} of ${pr.session.total}.</p><div class="row"><button class="primary" data-a="resume">Resume</button><button data-a="drop">Discard</button></div>`;
    d.querySelector('[data-a=resume]').onclick = () => resume(pr); d.querySelector('[data-a=drop]').onclick = () => { VR.store.del('progress'); renderHome(); }; n.appendChild(d); }
  const pend = VR.journal.pending();
  if (pend.length) { const d = document.createElement('div'); d.className = 'notice';
    d.innerHTML = `<p>${pend.length === 1 ? 'A working from a few days ago is' : pend.length + ' workings are'} waiting for an outcome note.</p><div class="row"><button data-a="j">Record outcomes</button></div>`;
    d.querySelector('button').onclick = openJournal; n.appendChild(d); }
  const rl = $('#riteList'); rl.innerHTML = '';
  if (!state.rituals.length) rl.innerHTML = '<p class="small">No rituals found. Check rituals/index.json.</p>';
  state.rituals.forEach(r => { const b = document.createElement('button'); b.className = 'rite'; b.setAttribute('role', 'listitem');
    b.setAttribute('aria-pressed', String(r === state.ritual));
    b.innerHTML = `<b>${esc(r.title)}</b><span>${esc(r.tradition || '')}${r.duration ? ' · ' + esc(r.duration) : ''}</span><span>${esc(r.summary || '')}</span>`;
    b.onclick = () => { state.ritual = r; if (r.defaultWorld && VR.worlds[r.defaultWorld]) selectWorld(r.defaultWorld); renderHome(); }; rl.appendChild(b); });
  const wl = $('#worldList'); wl.innerHTML = '';
  VR.worldOrder.forEach(id => { const w = VR.worlds[id], b = document.createElement('button'); b.textContent = w.name; b.setAttribute('aria-pressed', String(id === state.world));
    b.onclick = () => { selectWorld(id); renderHome(); }; wl.appendChild(b); });
  const w = VR.worlds[state.world]; $('#worldBlurb').textContent = w ? w.blurb || '' : '';
  $('#toIntent').disabled = !state.ritual;
}
function selectWorld(id) { state.world = id; VR.loadWorld(id); }

/* ---------- intent ---------- */
function uses(r, m) { return (r.uses || []).includes(m); }
function openIntent() {
  const r = state.ritual; if (!r) return;
  $('#intentTitle').textContent = r.title; $('#intentDesc').textContent = r.summary || '';
  $('#intentMeta').textContent = [r.tradition, r.duration, 'in ' + (VR.worlds[state.world] || {}).name, r.source].filter(Boolean).join(' · ');
  $('#intentLabel').textContent = uses(r, 'tarot') ? 'Your question' : 'Your intent';
  $('#intentText').placeholder = uses(r, 'sigil') ? 'Write it as a statement: "It is my will to..."' : uses(r, 'tarot') ? 'What would you like guidance on today?' : 'What is this working for? (optional)';
  $('#sigilBox').classList.toggle('off', !uses(r, 'sigil'));
  const sel = $('#savedSigils'); sel.innerHTML = '<option value="">New sigil from my intent</option>' + VR.sigil.lib.all().map(s => `<option value="${esc(s.id)}">${esc(s.letters)} · ${esc((s.intent || '').slice(0, 40))}</option>`).join('');
  state.savedSigil = null; updateSigil(); setMode(state.mode); refreshXRButtons(); show('intent');
}
function updateSigil() {
  if (!state.ritual || !uses(state.ritual, 'sigil')) return;
  const s = state.savedSigil || VR.sigil.make($('#intentText').value || state.ritual.title, state.sigilMethod);
  $('#sigilLetters').textContent = s.letters; VR.sigil.draw2D($('#sigilCanvas'), s);
}
$('#intentText').addEventListener('input', () => { if (!state.savedSigil) updateSigil(); });
$('#sigilMethod').addEventListener('click', e => { const m = e.target.dataset && e.target.dataset.m; if (!m) return; state.sigilMethod = m; state.savedSigil = null; $('#savedSigils').value = '';
  $('#sigilMethod').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m))); updateSigil(); });
$('#savedSigils').addEventListener('change', e => { const s = VR.sigil.lib.all().find(x => x.id === e.target.value) || null; state.savedSigil = s;
  if (s && !$('#intentText').value) $('#intentText').value = s.intent || ''; updateSigil(); });
function setMode(m) { state.mode = m; $('#modeSeg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  $('#modeNote').textContent = m === 'guided' ? 'The rite moves on its own with narration. You can pause, repeat or skip at any time.' : 'Nothing moves until you do. Advance each element yourself, at your own pace, with no narration.'; }
$('#modeSeg').addEventListener('click', e => { const m = e.target.dataset && e.target.dataset.mode; if (m) setMode(m); });
$('#toIntent').onclick = openIntent;
$('#beginBtn').onclick = () => begin(null);
$('#beginVR').onclick = () => begin('vr');
$('#beginMR').onclick = () => begin('ar');

/* ---------- sessions ---------- */
function begin(mode) {
  VR.audio.init(); if (VR.audio.ctx && VR.audio.ctx.state === 'suspended') VR.audio.ctx.resume();
  const r = state.ritual; if (!r) return;
  const intent = $('#intentText').value.trim();
  let sigil = null;
  if (uses(r, 'sigil')) { sigil = state.savedSigil || VR.sigil.make(intent || r.title, state.sigilMethod); VR.sigil.lib.save(sigil); }
  const world = mode === 'ar' ? 'room' : state.world; selectWorld(world);
  const session = { id: 's' + Date.now().toString(36), ritual: { id: r.id, title: r.title }, ritualFile: r.file, world, worldName: VR.worlds[world].name,
    intent, stateIn: $('#stateIn').value, energy: $('#energy').value, mode: state.mode, sigil, marks: [], draws: [], cosmos: VR.cosmos.summary(new Date(), S.location), createdAt: new Date().toISOString() };
  startSession(r, session, 0, mode);
}
function resume(pr) {
  const r = state.rituals.find(x => x.file === pr.ritualFile);
  if (!r) { VR.toast("That ritual file is no longer in rituals/index.json, so it can't be resumed."); return; }
  VR.audio.init(); if (VR.audio.ctx && VR.audio.ctx.state === 'suspended') VR.audio.ctx.resume();
  state.ritual = r; selectWorld(VR.worlds[pr.world] ? pr.world : state.world);
  const s = pr.session; s.priorSec = pr.elapsed || 0; s.resumedAt = (s.resumedAt || []).concat(new Date().toISOString());
  state.mode = s.mode; startSession(r, s, pr.si, null);
}
function startSession(r, session, from, mode) {
  P.guided = session.mode === 'guided'; P.load(r, session);
  $('#riteName').textContent = r.title; $('#worldName').textContent = session.worldName;
  $('#pauseBtn').classList.toggle('off', !P.guided);
  show('rite'); syncHud(); P.start(from); renderScore();
  if (mode) enterXR(mode);
}

/* ---------- HUD ---------- */
function setCaption(title, text, phase, heb) {
  const box = $('#capBox'); box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
  $('#phaseLabel').textContent = phase || ''; $('#heb').textContent = heb || ''; $('#word').textContent = title || ''; $('#instr').textContent = text || '';
}
P.on('step', i => { const s = P.steps[i];
  setCaption(P.fill(s.title), P.fill(s.text), VR.PHASE_NAMES[s.phase], s.hebrew);
  $('#count').textContent = `Step ${i + 1} of ${P.steps.length}`; $('#nextBtn').textContent = P.isLast() ? 'Finish' : 'Next';
  renderScore(); xrui.caption(); });
P.on('reentry', i => { setCaption('Returning to the circle', `The space you built is restored around you. The rite continues from step ${i + 1}.`, 'Re-entry', '');
  $('#count').textContent = `Resuming at step ${i + 1} of ${P.steps.length}`; xrui.caption(); });
P.on('pause', on => { $('#pauseBtn').textContent = on ? 'Resume' : 'Pause'; $('#pauseBtn').setAttribute('aria-pressed', String(on));
  if (on) VR.toast('Paused. The space holds. Resume when you are ready.', 3000); xrui.caption(); });
P.on('mark', () => { VR.toast('Marked for your journal.', 1800); renderScore(); xrui.flashMark(); });
P.on('end', s => { state.pendingSession = s; exitXR(); openAfter(s); });
P.on('leave', save => { exitXR(); VR.fx.reset(); if (save) VR.toast('Saved. You can resume from the home screen.'); renderHome(); show('home'); });

function syncHud() {
  $('#camSeg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cam === S.camera)));
  $('#sndBtn').setAttribute('aria-pressed', String(S.sound)); $('#narBtn').setAttribute('aria-pressed', String(S.narration));
}
$('#camSeg').addEventListener('click', e => { const c = e.target.dataset && e.target.dataset.cam; if (!c) return; S.camera = c; VR.saveSettings(); syncHud(); });
$('#sndBtn').onclick = () => { S.sound = !S.sound; VR.saveSettings(); VR.audio.init(); VR.audio.setOn(); if (!S.sound) VR.stopSpeech(); syncHud(); };
$('#narBtn').onclick = () => { S.narration = !S.narration; VR.saveSettings(); if (!S.narration) VR.stopSpeech(); syncHud(); };
$('#nextBtn').onclick = () => P.next();
$('#repeatBtn').onclick = () => P.repeat();
$('#markBtn').onclick = () => P.mark();
$('#pauseBtn').onclick = () => P.paused ? P.resume() : P.pause();
addEventListener('keydown', e => {
  if (state.screen !== 'rite' || e.target.closest('textarea,input,select')) return;
  if (S.singleSwitch && !e.metaKey && !e.ctrlKey && !e.altKey && e.key !== 'Tab') { e.preventDefault(); P.next(); return; }
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'arrowright' || k === 'enter') { if (e.target.tagName === 'BUTTON' && k !== 'arrowright') return; e.preventDefault(); P.next(); }
  else if (k === 'r') P.repeat(); else if (k === 'm') P.mark(); else if (k === 'p') { if (P.guided) P.paused ? P.resume() : P.pause(); }
  else if (k === 'c') setConductor($('#conductor').classList.contains('off')); else if (k === 'v') { S.camera = S.camera === 'fp' ? 'witness' : 'fp'; VR.saveSettings(); syncHud(); }
  else if (k === 'escape') setConductor(false);
});

/* ---------- Conductor ---------- */
function setConductor(open) { $('#conductor').classList.toggle('off', !open); $('#condBtn').setAttribute('aria-expanded', String(open)); if (open) { $('#condNote').textContent = ''; renderScore(); } xrui.conductor(open && !!xr.session); }
$('#condBtn').onclick = () => setConductor($('#conductor').classList.contains('off'));
$('#condClose').onclick = () => setConductor(false);
function renderScore() {
  const ol = $('#score'); if (!ol || !P.steps.length) return; ol.innerHTML = ''; let ph = null;
  const marked = new Set(((P.session && P.session.marks) || []).map(m => m.step - 1));
  P.steps.forEach((s, i) => {
    if (s.phase !== ph) { ph = s.phase; const h = document.createElement('li'); h.className = 'ph'; h.textContent = VR.PHASE_NAMES[ph]; ol.appendChild(h); }
    const li = document.createElement('li'), b = document.createElement('button'); b.textContent = P.fill(s.title) || `Step ${i + 1}`;
    b.className = (i < P.si ? 'done' : i === P.si ? 'now' : '') + (marked.has(i) ? ' marked' : '');
    if (i === P.si) b.setAttribute('aria-current', 'step');
    b.onclick = () => { P.jump(i); $('#condNote').textContent = ''; }; li.appendChild(b); ol.appendChild(li); });
  if (xr.session) xrui.conductor(xrui.condOpen);
}
$('#skipPhaseBtn').onclick = () => { const r = P.skipPhase(); $('#condNote').textContent = r.msg; };
$('#saveLeaveBtn').onclick = () => P.leave(true);
$('#endBtn').onclick = () => P.finish();

/* ---------- after the rite ---------- */
function fmtDur(s) { s = s || 0; const m = Math.floor(s / 60), r = s % 60; return m ? `${m} min ${r} s` : `${r} s`; }
function openAfter(s) {
  $('#afterSummary').textContent = `${s.ritual.title} in ${s.worldName}. ${s.completed ? 'Completed' : `Ended at step ${s.stepsDone} of ${s.total}`}, ${fmtDur(s.durationSec)}.`;
  const facts = [];
  if (s.intent) facts.push(`Intent: ${s.intent}`);
  if (s.sigil) facts.push(`Sigil letters: ${s.sigil.letters} (${s.sigil.method})`);
  (s.draws || []).forEach(d => d.cards.forEach((c, i) => facts.push(`Drew: ${c}${d.meanings && d.meanings[i] ? ' (' + d.meanings[i] + ')' : ''}`)));
  if (s.marks.length) facts.push(`Marked: ${s.marks.map(m => m.title).join('; ')}`);
  if (s.skippedPhases && s.skippedPhases.length) facts.push(`Skipped: ${s.skippedPhases.map(p => VR.PHASE_NAMES[p]).join(', ')}`);
  if (s.cosmos) facts.push(`${s.cosmos.moon.name}, day of ${s.cosmos.dayRuler}, hour of ${s.cosmos.hourRuler}`);
  $('#afterFacts').innerHTML = facts.map(f => `<li>${esc(f)}</li>`).join('');
  ['#impressions', '#significant', '#incomplete'].forEach(k => $(k).value = '');
  show('after');
}
$('#saveEntry').onclick = () => { const s = state.pendingSession; if (!s) return;
  Object.assign(s, { impressions: $('#impressions').value.trim(), significant: $('#significant').value.trim(), incomplete: $('#incomplete').value.trim(), stateOut: $('#stateOut').value });
  VR.journal.save(s); state.pendingSession = null; VR.fx.reset(); VR.toast('Saved to your journal.'); renderHome(); show('home'); };
$('#discardEntry').onclick = () => { state.pendingSession = null; VR.fx.reset(); renderHome(); show('home'); };

/* ---------- journal ---------- */
function openJournal() { renderJournal(); show('journal'); }
$('#openJournal').onclick = openJournal;
function renderJournal() {
  const box = $('#entries'), list = VR.journal.all();
  box.innerHTML = list.length ? '' : '<p class="small">No sessions yet. Your first rite will appear here.</p>';
  list.forEach(s => {
    const d = document.createElement('details'); d.className = 'entry';
    const when = new Date(s.createdAt), pend = !s.outcome && s.intent;
    const row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
    d.innerHTML = `<summary><b>${esc(s.ritual.title)}</b><span>${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${esc(s.worldName)}${pend ? ' · <span class="pending">outcome not yet recorded</span>' : ''}</span></summary>
      <dl>${row('Intent', s.intent)}${row('Mode', s.mode)}${row('Going in', s.stateIn)}${row('Energy', s.energy)}${row('Coming out', s.stateOut)}
      ${row('Progress', s.completed ? 'Completed' : `${s.stepsDone} of ${s.total} steps`)}${row('Length', fmtDur(s.durationSec))}
      ${row('Sigil', s.sigil ? s.sigil.letters : '')}${row('Cards', (s.draws || []).map(x => x.cards.map((c, i) => c + (x.meanings && x.meanings[i] ? ': ' + x.meanings[i] : '')).join('; ')).join(' / '))}
      ${row('Marked', (s.marks || []).map(m => m.title).join('; '))}${row('Timing', s.cosmos ? `${s.cosmos.moon.name}, ${s.cosmos.dayName}, hour of ${s.cosmos.hourRuler}` : '')}
      ${row('Impressions', s.impressions)}${row('Significant', s.significant)}${row('Incomplete', s.incomplete)}
      ${s.outcome ? row('Outcome', `${s.outcome.result}${s.outcome.notes ? ': ' + s.outcome.notes : ''} (${new Date(s.outcome.at).toLocaleDateString()})`) : ''}</dl>
      <div class="outcome"></div><div class="row"><button data-a="del">Delete entry</button></div>`;
    const oc = d.querySelector('.outcome');
    if (!s.outcome) { oc.innerHTML = `<label class="field"><span>Outcome so far</span><select><option>Manifested</option><option>Partly</option><option>Not yet</option><option>No</option><option>Unexpected result</option></select></label>
      <label class="field"><span>Notes</span><textarea rows="2"></textarea></label><div class="row"><button class="primary" data-a="oc">Record outcome</button></div>`;
      oc.querySelector('[data-a=oc]').onclick = () => { VR.journal.update(s.id, { outcome: { result: oc.querySelector('select').value, notes: oc.querySelector('textarea').value.trim(), at: new Date().toISOString() } }); renderJournal(); }; }
    d.querySelector('[data-a=del]').onclick = () => { if (confirm('Delete this journal entry? This cannot be undone.')) { VR.journal.remove(s.id); renderJournal(); } };
    box.appendChild(d);
  });
  const sl = $('#sigilLib'), sg = VR.sigil.lib.all(); sl.innerHTML = sg.length ? '' : '<p class="small">Sigils you make are kept here.</p>';
  sg.forEach(s => { const f = document.createElement('figure'), c = document.createElement('canvas'); c.width = c.height = 192; VR.sigil.draw2D(c, s);
    const cap = document.createElement('figcaption'); cap.textContent = s.letters; const del = document.createElement('button'); del.className = 'link'; del.textContent = 'Remove';
    del.onclick = () => { VR.sigil.lib.remove(s.id); renderJournal(); }; f.append(c, cap, del); sl.appendChild(f); });
}
$('#exportBtn').onclick = () => VR.journal.exportFile();
$('#importFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return;
  VR.journal.importFile(f).then(n => { VR.toast(`Imported ${n} session${n === 1 ? '' : 's'}.`); renderJournal(); }).catch(err => { console.error(err); VR.toast("That file couldn't be read as a Virtual Rites journal."); });
  e.target.value = ''; });

/* ---------- settings ---------- */
const SET = [
  { k: 'grovePrototype', label: 'Grove lighting prototype', bool: true, help: 'Batched luminous fungi and gentle responsive light. Low intensity and simplified mode use static, gentler lighting.', reload: true },
  { k: 'intensity', label: 'Effect intensity', opts: [['full', 'Full'], ['soft', 'Soft'], ['low', 'Low (no flashes)']], help: 'Low removes flashes and strong pulses, for photosensitivity. Takes effect from the next element.' },
  { k: 'simplified', label: 'Simplified environment', bool: true, help: 'Fewer particles and less motion in the world. Easier on attention and on older devices.', reload: true },
  { k: 'seated', label: 'Seated mode', bool: true, help: 'In a headset, lifts you to standing eye level while you sit.' },
  { k: 'pace', label: 'Guided pace', num: true, opts: [[.75, 'Brisk'], [1, 'Normal'], [1.25, 'Slower'], [1.5, 'Much slower'], [2, 'Very slow']], help: 'How long each element lasts before the guide moves on.' },
  { k: 'textScale', label: 'Text size', num: true, opts: [[1, 'Normal'], [1.15, 'Large'], [1.3, 'Larger']], css: true },
  { k: 'narration', label: 'Narration', bool: true, help: 'The spoken guide in Guided mode.' },
  { k: 'describe', label: 'Audio description', bool: true, help: 'Also speaks a description of what appears in the space, for low vision.' },
  { k: 'sound', label: 'Sound', bool: true, help: 'Drone, bells, vibrated names and narration.', sound: true },
  { k: 'haptics', label: 'Controller haptics', bool: true, help: 'Controllers pulse when names are vibrated and elements change.' },
  { k: 'gaze', label: 'Gaze to continue (VR)', bool: true, help: 'Look at the small gold orb below the caption for a moment to move on, with no buttons.' },
  { k: 'singleSwitch', label: 'Single-button mode', bool: true, help: 'Any key or controller button moves the rite forward. Other controls are reached through the Conductor.' },
  { k: 'timingTint', label: 'Let the planetary hour tint the light', bool: true, help: 'A faint wash of the current hour\u2019s planetary color.', tint: true }
];
function renderSettings() {
  const f = $('#settingsForm'); f.innerHTML = '';
  SET.forEach(o => { const d = document.createElement('div'); d.className = 'set'; const id = 'set-' + o.k;
    const ctl = o.bool ? `<input type="checkbox" id="${id}" ${S[o.k] ? 'checked' : ''}>` : `<select id="${id}">${o.opts.map(([v, l]) => `<option value="${v}" ${String(S[o.k]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    d.innerHTML = `<label for="${id}">${o.label}</label>${ctl}${o.help ? `<p>${o.help}</p>` : ''}`;
    d.querySelector('#' + id).addEventListener('change', e => { S[o.k] = o.bool ? e.target.checked : o.num ? parseFloat(e.target.value) : e.target.value; VR.saveSettings();
      if (o.css) applyCss(); if (o.reload) VR.loadWorld(state.world, true); if (o.sound) { VR.audio.setOn(); if (!S.sound) VR.stopSpeech(); } if (o.tint && state.cosmos) applyTint(state.cosmos); syncHud(); });
    f.appendChild(d); });
  const d = document.createElement('div'); d.className = 'set'; const loc = S.location;
  d.innerHTML = `<label>Location for planetary hours</label><span class="small">${loc ? `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}` : 'Not set'}</span>
    <p>Planetary hours run from local sunrise and sunset. Your location stays in this browser. Without it, hours are approximated from 6 am and 6 pm.</p>
    <div class="row"><button data-a="use">Use my location</button>${loc ? '<button data-a="clr">Clear</button>' : ''}</div>`;
  d.querySelector('[data-a=use]').onclick = () => { if (!navigator.geolocation) { VR.toast('This browser cannot share location.'); return; }
    navigator.geolocation.getCurrentPosition(p => { S.location = { lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }; VR.saveSettings(); renderSettings(); VR.toast('Location saved in this browser.'); },
      () => VR.toast('Location was not shared.'), { timeout: 10000 }); };
  const clr = d.querySelector('[data-a=clr]'); if (clr) clr.onclick = () => { S.location = null; VR.saveSettings(); renderSettings(); };
  f.appendChild(d);
}
$('#openSettings').onclick = () => { renderSettings(); show('settings'); };

/* ---------- WebXR ---------- */
function checkXR() {
  if (!navigator.xr || !navigator.xr.isSessionSupported) return;
  navigator.xr.isSessionSupported('immersive-vr').then(ok => { xr.vr = ok; refreshXRButtons(); }).catch(() => {});
  navigator.xr.isSessionSupported('immersive-ar').then(ok => { xr.ar = ok && !!VR.worlds.room; refreshXRButtons(); }).catch(() => {});
}
function refreshXRButtons() {
  $('#beginVR').classList.toggle('off', !xr.vr); $('#beginMR').classList.toggle('off', !xr.ar);
  const roomAR = state.world === 'room' && xr.ar; $('#hudXR').classList.toggle('off', !(xr.vr || roomAR)); $('#hudXR').textContent = roomAR ? 'Enter mixed reality' : 'Enter VR';
}
$('#hudXR').onclick = () => enterXR(state.world === 'room' && xr.ar ? 'ar' : 'vr');
async function enterXR(mode) {
  if (xr.session) return; VR.audio.init();
  try { const s = await navigator.xr.requestSession(mode === 'ar' ? 'immersive-ar' : 'immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
    xr.mode = mode; await VR.renderer.xr.setSession(s); }
  catch (e) { console.error(e); VR.toast(mode === 'ar' ? "Mixed reality couldn't start. Passthrough may not be available on this device." : "VR couldn't start on this device."); }
}
function exitXR() { if (xr.session) xr.session.end().catch(() => {}); }
VR.renderer.xr.addEventListener('sessionstart', () => {
  xr.session = VR.renderer.xr.getSession(); xr.prev = {};
  VR.rig.position.set(0, S.seated ? .45 : 0, 0); VR.camera.position.set(0, 0, 0); VR.camera.rotation.set(0, 0, 0);
  const ar = xr.mode === 'ar'; VR.worldGroup.visible = !ar; VR.scene.fog = ar ? null : VR.scene.fog;
  if (ar) VR.loadWorld('room'); operator.visible = false; xrui.show(true); xrui.caption();
});
VR.renderer.xr.addEventListener('sessionend', () => {
  const wasAR = xr.mode === 'ar'; xr.session = null; xr.mode = null; VR.rig.position.set(0, 0, 0); VR.worldGroup.visible = true; xrui.show(false); xrui.condOpen = false;
  if (wasAR) VR.loadWorld(state.world === 'room' ? 'room' : state.world, true);
  VR.camera.position.set(0, 1.6, 6);
});
[0, 1].forEach(i => { const c = VR.renderer.xr.getController(i); VR.rig.add(c);
  c.addEventListener('select', () => P.next());
  c.addEventListener('squeeze', () => S.singleSwitch ? P.next() : P.mark()); });
function pollXR() {
  if (!xr.session) return;
  for (const src of xr.session.inputSources) { const gp = src.gamepad; if (!gp) continue; const key = src.handedness || 'none', prev = xr.prev[key] || [];
    const now = gp.buttons.map(b => b.pressed);
    [3, 4, 5].forEach(bi => { if (now[bi] && !prev[bi]) {
      if (S.singleSwitch) { P.next(); return; }
      if (bi === 3) P.repeat(); else if (bi === 4) { if (P.guided) P.paused ? P.resume() : P.pause(); } else xrui.conductor(!xrui.condOpen); } });
    xr.prev[key] = now; }
}

/* ---------- in-headset UI: caption panel, conductor panel, gaze orb ---------- */
const xrui = (() => {
  const mk = (w, h, pw, ph) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = VR.canvasTex(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
    m.renderOrder = 10; m.visible = false; VR.scene.add(m); return { c, g: c.getContext('2d'), t, m }; };
  const cap = mk(1024, 512, .74, .37), con = mk(768, 1024, .75, 1);
  const orb = VR.sprite(0xffd36b, .09, .9); orb.visible = false; VR.scene.add(orb);
  const ret = new THREE.Mesh(new THREE.RingGeometry(.008, .012, 32), new THREE.MeshBasicMaterial({ color: 0xffe7a8, transparent: true, opacity: .8, depthTest: false, toneMapped: false }));
  ret.position.z = -1; ret.visible = false; ret.renderOrder = 20; VR.camera.add(ret);
  const U = { condOpen: false, dwell: 0, cool: 0, mark: 0 };
  function wrap(g, text, x, y, maxW, lh, max) { const words = String(text).split(' '); let line = '', n = 0;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y + n * lh); line = w; if (++n >= max) return; } else line = t; }
    if (line) g.fillText(line, x, y + n * lh); }
  function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(14,6,38,.8)'; g.beginPath(); g.moveTo(24, 0); g.lineTo(w - 24, 0); g.quadraticCurveTo(w, 0, w, 24);
    g.lineTo(w, h - 24); g.quadraticCurveTo(w, h, w - 24, h); g.lineTo(24, h); g.quadraticCurveTo(0, h, 0, h - 24); g.lineTo(0, 24); g.quadraticCurveTo(0, 0, 24, 0); g.fill();
    g.strokeStyle = 'rgba(255,211,107,.45)'; g.lineWidth = 3; g.stroke(); }
  U.caption = () => {
    let phase = '', heb = '', title = '', text = '';
    if (P.pending) { phase = 'Re-entry'; title = 'Returning to the circle'; text = 'The space you built is restored. Pull the trigger to continue now.'; }
    else if (P.si >= 0 && P.steps[P.si]) { const s = P.steps[P.si]; phase = VR.PHASE_NAMES[s.phase]; heb = s.hebrew || ''; title = P.fill(s.title); text = P.fill(s.text); }
    if (P.paused) phase = 'Paused · ' + phase;
    const g = cap.g; panelBg(g, 1024, 512); g.textAlign = 'center';
    g.fillStyle = '#7fd0ff'; g.font = '28px Spectral, Georgia, serif'; g.fillText(phase.toUpperCase(), 512, 56);
    let y = 110; if (heb) { g.fillStyle = '#ffd36b'; g.font = '700 58px "Noto Serif Hebrew", serif'; g.fillText(heb, 512, y + 10); y += 70; }
    g.fillStyle = '#f6efff'; g.font = (title.length > 30 ? '46px' : '58px') + ' Marcellus, Georgia, serif'; g.fillText(title, 512, y + 30); y += 90;
    g.fillStyle = '#cbbbe8'; g.font = '32px Spectral, Georgia, serif'; wrap(g, text, 512, y, 900, 42, heb ? 3 : 4);
    g.fillStyle = 'rgba(203,187,232,.7)'; g.font = '22px Spectral, Georgia, serif';
    const last = P.isLast && P.isLast();
    g.fillText(S.singleSwitch ? 'Any button: ' + (last ? 'finish' : 'next') : `Trigger: ${last ? 'finish' : 'next'}  ·  Grip: mark  ·  Stick press: repeat  ·  A/X: pause  ·  B/Y: conductor`, 512, 488);
    cap.t.needsUpdate = true;
  };
  U.conductor = open => {
    U.condOpen = open && !!xr.session; con.m.visible = U.condOpen; if (!U.condOpen) return;
    const g = con.g; panelBg(g, 768, 1024); g.textAlign = 'left'; g.fillStyle = '#f6efff'; g.font = '44px Marcellus, Georgia, serif'; g.fillText('Conductor', 40, 70);
    const lo = Math.max(0, P.si - 5), hi = Math.min(P.steps.length, lo + 16); let y = 130, ph = null;
    for (let i = lo; i < hi; i++) { const s = P.steps[i];
      if (s.phase !== ph) { ph = s.phase; g.fillStyle = '#7fd0ff'; g.font = '22px Spectral, Georgia, serif'; g.fillText(VR.PHASE_NAMES[ph].toUpperCase(), 40, y); y += 38; }
      g.fillStyle = i === P.si ? '#ffd36b' : i < P.si ? 'rgba(203,187,232,.55)' : '#cbbbe8'; g.font = (i === P.si ? '34px' : '28px') + ' Spectral, Georgia, serif';
      g.fillText((i === P.si ? '▸ ' : i < P.si ? '✓ ' : '   ') + P.fill(s.title).slice(0, 34), 40, y); y += 44; if (y > 900) break; }
    g.fillStyle = 'rgba(203,187,232,.75)'; g.font = '22px Spectral, Georgia, serif'; g.fillText('Stick press: repeat · A/X: pause · B/Y: close', 40, 990);
    con.t.needsUpdate = true;
  };
  U.flashMark = () => { U.mark = 1; };
  U.show = on => { cap.m.visible = on; if (!on) { con.m.visible = false; orb.visible = false; ret.visible = false; } };
  const eye = new THREE.Vector3(), fwd = new THREE.Vector3(), to = new THREE.Vector3();
  U.update = dt => {
    if (!xr.session) return;
    /* The caption sits low and close, about 30 degrees below eye level, so it never covers
       what appears in front of you (cards, sigils, pentagrams sit at or above chest height). */
    const yOff = VR.rig.position.y, d = VR.dir(P.view), right = new THREE.Vector3().crossVectors(d, VR.UP);
    VR.camera.getWorldPosition(eye);
    const cp = d.clone().multiplyScalar(1.25); cp.y = Math.max(.62, eye.y - .74); cap.m.position.lerp(cp, Math.min(1, dt * 3)); cap.m.lookAt(eye);
    if (con.m.visible) { const cd = VR.dir(P.view - 38).multiplyScalar(1.5); cd.y = 1.35 + yOff; con.m.position.lerp(cd, Math.min(1, dt * 3)); con.m.lookAt(eye); }
    const gazeOn = S.gaze && P.active; orb.visible = gazeOn; ret.visible = gazeOn;
    if (U.mark > 0) { U.mark = Math.max(0, U.mark - dt * 1.5); cap.m.material.color.setRGB(1, 1 - .25 * U.mark, 1 - .1 * U.mark); } else cap.m.material.color.setRGB(1, 1, 1);
    if (!gazeOn) { U.dwell = 0; return; }
    orb.position.copy(cap.m.position).addScaledVector(right, .48);
    VR.camera.getWorldDirection(fwd); to.copy(orb.position).sub(eye).normalize();
    U.cool = Math.max(0, U.cool - dt);
    if (fwd.angleTo(to) < .06 && U.cool <= 0) { U.dwell += dt; if (U.dwell >= 1.6) { U.dwell = 0; U.cool = 1.2; P.next(); } } else U.dwell = Math.max(0, U.dwell - dt * 2);
    const k = U.dwell / 1.6; ret.scale.setScalar(1 + 2.5 * k); orb.scale.setScalar(.09 * (1 + k));
  };
  return U;
})();
P.on('pause', () => xrui.conductor(xrui.condOpen));
P.on('step', () => xrui.conductor(xrui.condOpen));

/* ---------- the operator (you, seen from the witness camera) ---------- */
const operator = (() => {
  const g = new THREE.Group();
  const robe = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.34, 0], [.3, .5], [.24, 1.1], [.2, 1.38], [0, 1.42]].map(v => new THREE.Vector2(v[0], v[1])), 24),
    new THREE.MeshStandardMaterial({ color: 0x1a1030, roughness: .8, emissive: 0x120828 }));
  const head = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), new THREE.MeshStandardMaterial({ color: 0x241640, roughness: .7 })); head.position.y = 1.56;
  const hood = new THREE.Mesh(new THREE.ConeGeometry(.17, .38, 16), robe.material); hood.position.y = 1.62;
  const glow = VR.sprite(0x7fd0ff, 1.4, .12); glow.position.y = 1.1;
  g.add(robe, head, hood, glow); g.visible = false; VR.scene.add(g); return g;
})();

/* ---------- camera ---------- */
const cam = { a: .6, yaw: 0, pitch: 0, dx: 0, dy: 0, drag: null };
const canvas = VR.renderer.domElement;
canvas.addEventListener('pointerdown', e => { cam.drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!cam.drag) return; cam.dx += (e.clientX - cam.drag.x) * .004; cam.dy += (e.clientY - cam.drag.y) * .003; cam.dy = Math.max(-.8, Math.min(.8, cam.dy)); cam.drag = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', () => { cam.drag = null; });
const tgt = new THREE.Vector3(), look = new THREE.Vector3(), curLook = new THREE.Vector3(0, 2, 0);
function updateCamera(dt) {
  if (xr.session) return;
  const C = VR.camera, k = Math.min(1, dt * 2.2);
  if (!cam.drag) { cam.dx *= Math.pow(.25, dt); cam.dy *= Math.pow(.25, dt); }
  const inRite = state.screen === 'rite' && (P.active || P.si >= 0);
  if (!inRite) { cam.a += dt * .025; const a = cam.a + cam.dx; tgt.set(Math.cos(a) * 30, Math.max(1.5, 8 + cam.dy * 10), Math.sin(a) * 30); look.set(0, 2.5, 0);
    C.position.lerp(tgt, k * .6); curLook.lerp(look, k); C.lookAt(curLook); return; }
  if (S.camera === 'fp') {
    tgt.set(0, 1.6, 0); C.position.lerp(tgt, k);
    const y = VR.yawFor(P.view) + P.look.y * .5 - cam.dx, p = P.look.p * .5 - cam.dy;
    cam.yaw = VR.lerp(cam.yaw, y, k); cam.pitch = VR.lerp(cam.pitch, p, k); C.rotation.set(cam.pitch, cam.yaw, 0);
    const d = VR.dir(VR.DEG ? (Math.PI / 2 - cam.yaw) / VR.DEG : 0); curLook.set(d.x * 4, 1.6, d.z * 4); return;
  }
  const back = P.view + 180 + 22 + cam.dx / VR.DEG * .5, dist = 8.5 - P.elev * 1.5, h = Math.max(1, 3 + P.elev * 4 + cam.dy * 5);
  const bd = VR.dir(back); tgt.set(bd.x * dist, h, bd.z * dist); C.position.lerp(tgt, k * .8);
  const fd = VR.dir(P.view); look.set(fd.x * 1.5, P.focus, fd.z * 1.5); curLook.lerp(look, k); C.lookAt(curLook);
  cam.yaw = C.rotation.y; cam.pitch = C.rotation.x;
}

/* ---------- loop ---------- */
let lastTime = performance.now(), T = 0;
VR.renderer.setAnimationLoop(() => {
  const now = performance.now(); const dt = Math.min((now - lastTime) / 1000, .05); lastTime = now; T += dt;
  P.update(dt);
  if (VR.world && VR.world.inst.update) try { VR.world.inst.update(dt, T); } catch (e) { console.error(e); VR.world.inst.update = null; }
  VR.fx.update(dt, T); pollXR(); updateCamera(dt); xrui.update(dt);
  operator.visible = !xr.session && state.screen === 'rite' && S.camera === 'witness'; operator.rotation.y = VR.yawFor(P.face);
  VR.camera.getWorldPosition(VR.EYE); VR.updateBeams(!!xr.session || S.camera === 'fp');
  VR.renderer.setClearColor(0x000000, xr.mode === 'ar' ? 0 : 1);
  if (state.screen === 'rite') $('#fill').style.width = (P.progress() * 100).toFixed(2) + '%';
  VR.renderer.render(VR.scene, VR.camera);
});

VR.app = { state, xr, show, renderHome };
VR.ready = boot();
})(window.VR);
