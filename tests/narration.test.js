import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeAssetPath} from '../js/media-paths.js';
test('all static narration phrases have reusable deployed clips and stay within budget',()=>{
 const script=JSON.parse(readFileSync('assets/narration/script.json'));
 const manifest=JSON.parse(readFileSync('assets/narration/manifest.json'));
 const receipt=JSON.parse(readFileSync('assets/narration/generation-receipt.json'));
 const staticEntries=script.entries.filter(e=>!e.dynamic);assert.equal(staticEntries.length,98);
 for(const e of staticEntries){const path=manifest.clips[e.text];assert.equal(path,e.file);assert.ok(safeAssetPath(path));assert.ok(readFileSync('assets/narration/'+path).length>100);}
 assert.equal(receipt.clips.length,98);assert.ok(receipt.clips.reduce((sum,c)=>sum+c.credits,0)<=receipt.budget);
 for(const e of script.entries.filter(e=>e.dynamic))assert.equal(manifest.clips[e.text],undefined);
});
