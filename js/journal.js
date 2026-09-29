/* Virtual Rites — journal
   Sessions are stored only in this browser (localStorage key "vr.journal").
   Export writes a JSON file you keep; import merges one back in. */
(function (VR) {
'use strict';
const KEY = 'journal', OUTCOME_AFTER_DAYS = 3;
const all = () => VR.store.get(KEY, []);
const write = l => { if (!VR.store.set(KEY, l)) VR.toast('The journal could not be saved. Browser storage may be full or disabled.'); };
function clean(s) {
  const c = JSON.parse(JSON.stringify(s)); delete c.lastCards;
  if (c.sigil) c.sigil = { intent: c.sigil.intent, letters: c.sigil.letters, method: c.sigil.method, pts: c.sigil.pts };
  return c;
}
VR.journal = {
  all,
  save(s) { const l = all().filter(x => x.id !== s.id); l.unshift(clean(s)); write(l); },
  update(id, patch) { const l = all(); const i = l.findIndex(x => x.id === id); if (i < 0) return; l[i] = Object.assign({}, l[i], patch); write(l); },
  remove(id) { write(all().filter(x => x.id !== id)); },
  pending() { const cut = Date.now() - OUTCOME_AFTER_DAYS * 864e5; return all().filter(s => !s.outcome && s.intent && new Date(s.endedAt || s.createdAt).getTime() < cut); },
  exportFile() {
    const data = { format: 'virtual-rites-journal/1', exported: new Date().toISOString(), sessions: all(), sigils: VR.sigil.lib.all() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `virtual-rites-journal-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
  importFile(file) {
    return file.text().then(t => { const d = JSON.parse(t); const incoming = Array.isArray(d) ? d : d.sessions || [];
      const l = all(), ids = new Set(l.map(x => x.id)); let added = 0; incoming.forEach(s => { if (s && s.id && !ids.has(s.id)) { l.push(s); added++; } });
      l.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))); write(l);
      if (d.sigils) { const sl = VR.sigil.lib.all(), sid = new Set(sl.map(x => x.id)); d.sigils.forEach(x => { if (x && x.id && !sid.has(x.id)) sl.push(x); }); VR.store.set('sigils', sl); }
      return added; });
  }
};
})(window.VR);
