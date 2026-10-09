const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
import { safeAssetPath } from './media-paths.js';
const fail = message => { throw new Error('Invalid ritual: ' + message); };

export function validateRitual(r, actions) {
  if (!object(r) || r.format !== 'virtual-rites/1') fail('expected virtual-rites/1');
  if (typeof r.id !== 'string' || !r.id.trim() || typeof r.title !== 'string' || !r.title.trim()) fail('id and title are required');
  if (!Array.isArray(r.steps) || !r.steps.length) fail('steps must be a nonempty array');
  if (r.sequences !== undefined && !object(r.sequences)) fail('sequences must be an object');
  const seqs = r.sequences || {};
  checkValues(r);
  if (r.assetRoot !== undefined && !safeAssetPath(r.assetRoot)) fail('unsafe asset folder');
  if (r.assets !== undefined) {
    if (!object(r.assets) || Object.keys(r.assets).length > 64) fail('assets must be an object with at most 64 entries');
    const extensions = {image:/\.(png|jpe?g|webp|svg|avif)$/i,audio:/\.(mp3|wav|ogg|m4a)$/i,video:/\.(mp4|webm)$/i,model:/\.glb$/i};
    for (const [id,a] of Object.entries(r.assets)) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || !object(a) || !Object.hasOwn(extensions,a.type) || !safeAssetPath(a.file) || !extensions[a.type].test(a.file)) fail('invalid media asset');
      if (a.poster !== undefined && (!safeAssetPath(a.poster) || !extensions.image.test(a.poster))) fail('invalid video poster');
    }
  }
  let count = 0, leaves = 0;
  const visit = (list, stack) => {
    if (!Array.isArray(list)) fail('sequence must be an array');
    for (const s of list) {
      if (!object(s)) fail('step must be an object');
      for (const field of ['title', 'text', 'say', 'describe', 'hebrew', 'phase']) {
        if (s[field] !== undefined && typeof s[field] !== 'string') fail(field + ' must be a string');
      }
      if (++count > 4096) fail('expanded ritual exceeds 4096 entries');
      if (s.duration !== undefined && (typeof s.duration !== 'number' || !Number.isFinite(s.duration) || s.duration <= 0)) fail('duration must be positive and finite');
      if (s.use !== undefined) {
        if (typeof s.use !== 'string' || !Object.hasOwn(seqs, s.use)) fail('missing sequence');
        if (stack.includes(s.use) || stack.length >= 6) fail('cyclic or excessively nested sequence');
        visit(seqs[s.use], [...stack, s.use]);
      } else leaves++;
      if (s.actions !== undefined) {
        if (!Array.isArray(s.actions)) fail('actions must be an array');
        for (const a of s.actions) {
          if (!object(a) || typeof a.do !== 'string' || (actions && !Object.hasOwn(actions, a.do))) fail('unknown action');
          if (a.do === 'media') {
            if (!Object.hasOwn(r.assets || {},a.asset)) fail('missing media asset');
            if (a.lifetime !== undefined && !['step','ritual'].includes(a.lifetime)) fail('invalid media lifetime');
            for (const field of ['width','size','distance']) if (a[field] !== undefined && (typeof a[field] !== 'number' || a[field] <= 0 || a[field] > 30)) fail('invalid media dimensions');
            if (a.height !== undefined && (typeof a.height !== 'number' || Math.abs(a.height) > 30)) fail('invalid media height');
            if (a.volume !== undefined && (typeof a.volume !== 'number' || a.volume < 0 || a.volume > 1)) fail('invalid media volume');
            if (a.loop !== undefined && typeof a.loop !== 'boolean') fail('invalid media loop');
          }
          if (a.degrees !== undefined && (typeof a.degrees !== 'number' || Math.abs(a.degrees) > 3600)) fail('degrees exceeds geometry budget');
          for (const field of ['colors', 'names', 'notes', 'chord']) {
            if (a[field] !== undefined && a[field] !== false && !Array.isArray(a[field])) fail(field + ' must be an array');
          }
          if (a.colors && !a.colors.length) fail('colors must not be empty');
          checkValues(a);
        }
      }
      for (const field of ['narration','descriptionAudio']) if (s[field] !== undefined && r.assets?.[s[field]]?.type !== 'audio') fail('narration must reference an audio asset');
      checkValues(s);
    }
  };
  visit(r.steps, []);
  if (!leaves) fail('ritual expands to no steps');
  return r;
}

function checkValues(value, depth = 0) {
  if (depth > 20) fail('data nesting exceeds limit');
  if (typeof value === 'number' && !Number.isFinite(value)) fail('nonfinite number');
  if (typeof value === 'string' && value.length > 32768) fail('text exceeds size limit');
  if (Array.isArray(value) && value.length > 4096) fail('array exceeds size limit');
  if (Array.isArray(value) || object(value)) {
    for (const [key, v] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) fail('unsafe key');
      checkValues(v, depth + 1);
    }
  }
}

export function validateLibrary(list, extension) {
  if (!Array.isArray(list) || list.length > 256 || list.some(f => typeof f !== 'string' || !new RegExp('^[a-zA-Z0-9_-]+\\.' + extension + '$').test(f))) {
    throw new Error('Invalid library index');
  }
  return list;
}
