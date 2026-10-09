import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('ritual image lifetime, quiet video poster and narration without browser voices',async({page})=>{
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 const result=await page.evaluate(async(r)=>{
  VR.settings.sound=false;VR.settings.simplified=true;
  VR.player.ritual=r;
  VR.actions.media(r.steps[0].actions[0],{face:'east'});await VR.media.entries.get('focus').ready;
  const image=VR.media.entries.get('focus').root.children.length;
  VR.media.clearStep();const cleared=VR.media.entries.size;
  const persistent={...r.steps[0].actions[0],id:undefined,lifetime:'ritual'};
  VR.actions.media(persistent,{face:'east'});VR.actions.media(persistent,{face:'east'});
  await VR.media.entries.get('media-focus').ready;VR.media.clearStep();const retained=VR.media.entries.size;VR.media.clear();
  r.assets.video={type:'video',file:'unused.mp4',poster:'focus.svg'};
  VR.actions.media({do:'media',asset:'video',id:'quiet'},{face:'east'});await VR.media.entries.get('quiet').ready;
  const quiet=!!VR.media.entries.get('quiet').root.children[0]?.material.map && !VR.media.entries.get('quiet').video;
  VR.media.clear();return {image,cleared,quiet,retained};
 },JSON.parse(readFileSync('examples/media-demo.json')));expect(result).toEqual({image:1,cleared:0,quiet:true,retained:1});
 await page.evaluate(async()=>{
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel(){},speak(){}},configurable:true});
  VR.settings.sound=true;VR.silent=false;VR.audio.start();
  const context=VR.audio.ctx,create=context.createBufferSource.bind(context);context.createBufferSource=()=>{const node=create();window.recordedNarrationNode=node;return node;};
  VR.say('Pronunciation sample',false,{url:VR.assetURL('assets/narration/pilot/lbrp-pronunciation.mp3')});
 });await expect.poll(()=>page.evaluate(()=>VR.narration.busy)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.recordedNarrationNode?.buffer?.length || 0)).toBeGreaterThan(2400);
 await page.evaluate(()=>{VR.audio.stop();VR.media.clear();});
 await expect.poll(()=>page.evaluate(()=>VR.narration.busy)).toBe(false);
 expect(await page.evaluate(()=>VR.media.entries.size)).toBe(0);
});
test('all recorded narration assets decode with browser speech unavailable',async({page})=>{
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 const count=await page.evaluate(async()=>{
  const manifest=await fetch(VR.assetURL('assets/narration/manifest.json')).then(r=>r.json()),ac=new AudioContext();
  try{for(const file of Object.values(manifest.clips)){const r=await fetch(VR.assetURL('assets/narration/'+file));if(!r.ok)throw Error(file);const b=await ac.decodeAudioData(await r.arrayBuffer());if(b.duration<=0)throw Error('Empty clip: '+file);}return Object.keys(manifest.clips).length;}finally{await ac.close();}
 });expect(count).toBe(98);
});
test('local voice worker fallback queues PCM and stops on exit',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});
  window.Worker=class {
   postMessage(data){setTimeout(()=>this.onmessage?.({data:data.type==='prepare'?{id:data.id}:{id:data.id,samples:new Float32Array(24000),rate:24000}}),10);}
   terminate(){}
  };
 });
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 await page.locator('#toIntent').click();await page.locator('[data-mode="practice"]').click();await page.locator('#beginBtn').click();
 await page.evaluate(async()=>{VR.settings.localNarration=true;await VR.narration.prepareLocal();VR.say('Test local voice.');});
 await expect.poll(()=>page.evaluate(()=>VR.narration.localReady)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>VR.narration.busy)).toBe(true);
 await page.evaluate(()=>VR.audio.stop());
 expect(await page.evaluate(()=>VR.narration.busy)).toBe(false);
});
test('a failed local voice worker can be retried',async({page})=>{
 await page.addInitScript(()=>{
  let attempts=0;
  window.Worker=class {constructor(){this.attempt=++attempts;}postMessage(data){setTimeout(()=>{if(this.attempt===1)this.onerror?.();else this.onmessage?.({data:{id:data.id,ready:true}});},5);}terminate(){}};
 });
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 await page.evaluate(async()=>{VR.settings.localNarration=true;await VR.narration.prepareLocal();});
 expect(await page.evaluate(()=>VR.narration.state)).toBe('failed');
 await page.evaluate(()=>VR.narration.prepareLocal());
 expect(await page.evaluate(()=>VR.narration.localReady)).toBe(true);
});
