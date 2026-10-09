import * as THREE from 'three';

// Preserve the world authoring API while bundling every executable module.
window.THREE = THREE;
window.VR = window.VR || {};
window.VR.assetURL = path => import.meta.env.BASE_URL + path;
const worlds = import.meta.glob('../worlds/*.js');
window.VR.loadWorldModule = async file => {
  const load = worlds['../worlds/' + file];
  if (!load) throw new Error('Unknown world module: ' + file);
  await load();
};
const modules = import.meta.glob(['./*.js', '!./*.worker.js']);
try {
  for (const file of ['core', 'effects', 'sigil', 'tarot', 'cosmos', 'journal', 'media', 'narration', 'player', 'app']) {
    await modules[`./${file}.js`]();
  }
} catch (error) {
  console.error('[Virtual Rites] startup failed', error);
  const notice = document.getElementById('notices');
  notice.setAttribute('role', 'alert');
  notice.textContent = 'The ritual space could not start. This version requires WebGL2 and a current browser with graphics acceleration enabled. Your saved journal remains in this browser.';
  document.getElementById('toIntent').disabled = true;
}
