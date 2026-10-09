import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
test('Drowned Temple loads, keeps the ritual floor clear, provides quiet modes and disposes',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 await expect(page.locator('#worldList button')).toHaveCount(6);
 const result=await page.evaluate(async()=>{
  VR.renderer.setAnimationLoop(null);VR.settings.sound=false;VR.loadWorld('drowned-temple');await VR.world.inst.models.userData.ready;VR.world.inst.update(.016,25);
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('off'));VR.camera.position.set(0,1.6,0);const target=VR.dir(60).multiplyScalar(22).setY(8);VR.camera.lookAt(target);VR.renderer.render(VR.scene,VR.camera);
  const inst=VR.world.inst,clearance=Math.min(...inst.pillars.map(p=>Math.hypot(p.position.x,p.position.z)-1.2));
  return {models:inst.models.userData.status,arch:inst.models.userData.arch,ruins:inst.models.userData.ruins,clearance,canopy:VR.worldGroup.getObjectByName('Ocean canopy').position.y,fish:VR.worldGroup.getObjectByName('Distant fish school').count,resources:VR.resourceSnapshot()};
 });expect(result.clearance).toBeGreaterThan(12);expect(result.canopy).toBe(24);expect(result.fish).toBe(24);
 expect(result.models).toBe('ready');expect(result.arch.count).toBe(12);expect(result.ruins.count).toBe(18);
 expect(result.arch.width).toBeCloseTo(8.6);expect(result.arch.depth).toBeLessThanOrEqual(1);
 await page.screenshot({path:info.outputPath('drowned-temple.png')});
 const checks=await page.evaluate(async()=>{
  const inst=VR.world.inst;VR.settings.intensity='low';inst.update(1,50);const quiet=inst.water.water.material.uniforms.quiet.value===1&&inst.projection.uniforms.templeTime.value===0;
  VR.settings.intensity='full';VR.reducedMotion=true;inst.update(1,60);const reduced=inst.water.water.material.uniforms.quiet.value===1&&inst.projection.uniforms.templeTime.value===0;VR.reducedMotion=false;
  const render=()=>VR.renderer.render(VR.scene,VR.camera);VR.loadWorld('room');render();const warm=VR.resourceSnapshot();for(let i=0;i<3;i++){VR.loadWorld('drowned-temple');await VR.world.inst.models.userData.ready;VR.world.inst.update(.016,0);render();VR.loadWorld('room');render();}const end=VR.resourceSnapshot();
  VR.loadWorld('drowned-temple');const lateReady=VR.world.inst.models.userData.ready;VR.loadWorld('room');await lateReady;render();const late=VR.resourceSnapshot();
  VR.settings.simplified=true;VR.loadWorld('drowned-temple');VR.world.inst.update(.016,80);render();const simpleFish=VR.worldGroup.getObjectByName('Distant fish school').count,simpleQuiet=VR.world.inst.water.water.material.uniforms.quiet.value===1;
  return {quiet,reduced,warm,end,late,simpleModels:VR.world.inst.models===null,simpleFish,simpleQuiet};
 });expect(checks.quiet&&checks.reduced&&checks.simpleQuiet).toBe(true);expect(checks.simpleFish).toBe(8);expect(checks.end.geometries).toBe(checks.warm.geometries);expect(checks.end.textures).toBe(checks.warm.textures);expect(errors).toEqual([]);
 expect(checks.simpleModels).toBe(true);expect(checks.late.geometries).toBe(checks.warm.geometries);expect(checks.late.textures).toBe(checks.warm.textures);
 writeFileSync(info.outputPath('drowned-temple-resources.json'),JSON.stringify({result,checks},null,2));
});
