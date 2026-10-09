import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
test('weathered stones share maps, preserve layout and release resources',async({page},info)=>{
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 const result=await page.evaluate(()=>{
  VR.renderer.setAnimationLoop(null);VR.settings.sound=false;VR.settings.simplified=false;VR.loadWorld('stonehenge',true);
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('off'));
  const stones=[];VR.worldGroup.traverse(o=>{if(o.name==='Weathered Stonehenge stone')stones.push(o);});
  const maps=new Set(stones.map(o=>o.material.map)),bumps=new Set(stones.map(o=>o.material.bumpMap));
  VR.camera.position.copy(VR.dir(180).multiplyScalar(2.5)).setY(2);const target=VR.dir(180).multiplyScalar(8.4);VR.camera.lookAt(target.x,3.4,target.z);VR.renderer.render(VR.scene,VR.camera);
  return {stones:stones.length,maps:maps.size,bumps:bumps.size,size:stones[0].material.map.image.width,triangles:stones.reduce((sum,o)=>sum+o.geometry.index.count/3,0),resources:VR.resourceSnapshot()};
 });expect(result.stones).toBeGreaterThan(60);expect(result.maps).toBe(1);expect(result.bumps).toBe(1);expect(result.size).toBe(512);expect(result.triangles).toBeLessThan(100000);
 await page.screenshot({path:info.outputPath('stonehenge-weathered.png')});
 const cleanup=await page.evaluate(()=>{
  const render=()=>VR.renderer.render(VR.scene,VR.camera);VR.loadWorld('room');render();const warm=VR.resourceSnapshot();
  for(let i=0;i<3;i++){VR.loadWorld('stonehenge');render();VR.loadWorld('room');render();}const end=VR.resourceSnapshot();
  VR.settings.simplified=true;VR.loadWorld('stonehenge');render();let stone;VR.worldGroup.traverse(o=>{if(o.name==='Weathered Stonehenge stone')stone=o;});
  return {warm,end,simplifiedMap:stone.material.map.image.width,simplifiedBump:stone.material.bumpMap===null};
 });expect(cleanup.end.geometries).toBe(cleanup.warm.geometries);expect(cleanup.end.textures).toBe(cleanup.warm.textures);expect(cleanup.simplifiedMap).toBe(128);expect(cleanup.simplifiedBump).toBe(true);
 writeFileSync(info.outputPath('stonehenge-resources.json'),JSON.stringify({result,cleanup},null,2));
});
