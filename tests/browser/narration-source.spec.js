import {test,expect} from '@playwright/test';
test('explicit narration choices persist and do not silently switch providers',async({page})=>{
 await page.addInitScript(()=>{
  window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
  window.spokenCount=0;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{name:'Test',lang:'en'}],cancel(){},speak(u){window.spokenCount++;u.onstart?.();setTimeout(()=>u.onend?.(),10);}},configurable:true});
  window.Worker=class {postMessage(data){setTimeout(()=>this.onmessage?.({data:data.type==='prepare'?{id:data.id,ready:true}:{id:data.id,samples:new Float32Array(24000),rate:24000}}),5);}terminate(){}};
 });
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 await page.locator('#openSettings').click();await page.locator('#set-narrationSource').selectOption('browser');
 await page.reload();await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 expect(await page.evaluate(()=>VR.settings.narrationSource)).toBe('browser');
 await page.locator('#toIntent').click();await page.locator('[data-mode="practice"]').click();await page.locator('#beginBtn').click();
 await page.evaluate(()=>VR.say('Ah-teh.'));await expect.poll(()=>page.evaluate(()=>window.spokenCount)).toBe(1);
 await page.evaluate(()=>{VR.settings.narrationSource='recorded';VR.say('No recording exists for this custom text.');});
 await expect.poll(()=>page.evaluate(()=>VR.narration.busy)).toBe(false);expect(await page.evaluate(()=>window.spokenCount)).toBe(1);
 await page.evaluate(async()=>{VR.settings.narrationSource='local';VR.settings.localNarration=true;await VR.narration.prepareLocal();VR.say('Ah-teh.');});
 await expect.poll(()=>page.evaluate(()=>VR.narration.busy)).toBe(true);expect(await page.evaluate(()=>window.spokenCount)).toBe(1);
 await page.evaluate(()=>VR.audio.stop());
});
