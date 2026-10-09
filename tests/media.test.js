import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRitual } from '../js/validation.js';
import { safeAssetPath, mediaPath } from '../js/media-paths.js';
test('local ritual assets resolve and the example validates',()=>{
 const r=JSON.parse(readFileSync('examples/media-demo.json'));
 validateRitual(r);assert.equal(mediaPath(r,'focus'),'rituals/media-demo/focus.svg');
 for(const path of ['../x','https://example.com/x','a//b','/x','a/%2e%2e/x','a\\b'])assert.equal(safeAssetPath(path),false);
});
test('invalid media references and dimensions fail before playback',()=>{
 const r=JSON.parse(readFileSync('examples/media-demo.json'));
 for(const change of [v=>v.assets.focus.file='../x.svg',v=>v.steps[0].actions[0].asset='absent',v=>v.steps[0].actions[0].volume=2,v=>v.steps[0].actions[0].size=31,v=>v.steps[0].narration='focus']){
  const copy=structuredClone(r);change(copy);assert.throws(()=>validateRitual(copy));
 }
});
