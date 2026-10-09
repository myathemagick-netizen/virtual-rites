import {test,expect} from '@playwright/test';
test('Black Sun corona, symbol families, quiet modes and cleanup',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 const result=await page.evaluate(()=>{
  VR.renderer.setAnimationLoop(null);VR.settings.sound=false;VR.loadWorld('black-sun');VR.world.inst.update(.016,30);
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('off'));
  const corona=VR.worldGroup.getObjectByName('Black Sun spectral corona'),families=[],symbols=[];VR.worldGroup.traverse(o=>{if(o.userData.family!==undefined)families.push(o);if(o.name==='Orbit symbol')symbols.push(o);});
  VR.camera.position.set(0,2,0);const target=VR.dir(90).multiplyScalar(170).setY(52);VR.camera.lookAt(target);VR.renderer.render(VR.scene,VR.camera);
  const before=families.map(o=>o.rotation.z);VR.settings.intensity='low';VR.world.inst.update(1,100);const quiet=corona.material.uniforms.quiet.value===1&&families.every((o,i)=>o.rotation.z===before[i]);
  VR.settings.intensity='full';VR.reducedMotion=true;VR.world.inst.update(1,101);const reduced=corona.material.uniforms.quiet.value===1;VR.reducedMotion=false;VR.world.inst.update(.016,30);VR.renderer.render(VR.scene,VR.camera);
  return {families:families.length,symbols:symbols.length,quiet,reduced};
 });expect(result).toEqual({families:4,symbols:32,quiet:true,reduced:true});
 await page.screenshot({path:info.outputPath('black-sun-temple.png')});
 const cleanup=await page.evaluate(()=>{const render=()=>VR.renderer.render(VR.scene,VR.camera);VR.loadWorld('room');render();const warm=VR.resourceSnapshot();for(let i=0;i<3;i++){VR.loadWorld('black-sun');VR.world.inst.update(.016,10);render();VR.loadWorld('room');render();}const end=VR.resourceSnapshot();return {warm,end};});
 expect(cleanup.end.geometries).toBe(cleanup.warm.geometries);expect(cleanup.end.textures).toBe(cleanup.warm.textures);expect(errors).toEqual([]);
});
