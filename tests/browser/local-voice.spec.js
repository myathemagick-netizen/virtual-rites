import {test,expect} from '@playwright/test';
test('optional real Kokoro WASM voice preparation and playback',async({page})=>{
 test.skip(!process.env.VR_LOCAL_VOICE,'Explicit opt-in: downloads the speech model');test.setTimeout(300000);
 await page.addInitScript(()=>{const Base=window.Worker;window.Worker=class extends Base {constructor(...args){super(...args);this.addEventListener('message',({data})=>{if(data.samples){window.localVoiceFrames=data.samples.length;window.localVoiceNonzero=data.samples.some(x=>Math.abs(x)>.001);}});}};});
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 await page.evaluate(async()=>{VR.settings.localNarration=true;await VR.narration.prepareLocal();});
 expect(await page.evaluate(()=>VR.narration.state)).toBe('ready');
 await page.locator('#toIntent').click();await page.locator('[data-mode="practice"]').click();await page.locator('#beginBtn').click();
 await page.evaluate(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});VR.say('A calm voice guides this practice.');});
 await expect.poll(()=>page.evaluate(()=>VR.narration.busy)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>VR.narration.busy),{timeout:90000}).toBe(false);
 expect(await page.evaluate(()=>window.localVoiceFrames)).toBeGreaterThan(2400);
 expect(await page.evaluate(()=>window.localVoiceNonzero)).toBe(true);
 await page.evaluate(()=>VR.audio.stop());
});
