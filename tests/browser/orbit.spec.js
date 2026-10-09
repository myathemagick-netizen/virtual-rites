import {test,expect} from '@playwright/test';
test('Earth visible from headset height, Platonic solids, Milky Way and teardown',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('./');await page.waitForFunction(()=>!!window.VR?.ready);await page.evaluate(()=>VR.ready);
 const result=await page.evaluate(async()=>{
  VR.renderer.setAnimationLoop(null);VR.settings.sound=false;VR.loadWorld('orbit');await VR.world.inst.earthReady;VR.world.inst.update(.016,20);
  const earth=VR.world.inst.earth,eye=new THREE.Vector3(0,1.6,0),center=earth.position.clone().sub(eye),angle=Math.atan2(center.y,Math.hypot(center.x,center.z)),radius=Math.asin(90/center.length());
  const names=['Tetrahedron','Cube','Octahedron','Dodecahedron','Icosahedron'];
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('off'));VR.camera.position.copy(eye);VR.camera.lookAt(earth.position.x,15,earth.position.z);VR.renderer.render(VR.scene,VR.camera);
  return {mapped:earth.material.uniforms.uMapped.value,upperLimb:(angle+radius)*180/Math.PI,solids:names.every(n=>!!VR.worldGroup.getObjectByName(n)),glass:VR.worldGroup.getObjectByName('Earth viewing window').material.transparent,galaxy:!!VR.worldGroup.getObjectByName('Milky Way dust band')};
 });expect(result.mapped).toBe(1);expect(result.upperLimb).toBeGreaterThan(10);expect(result.solids&&result.glass&&result.galaxy).toBe(true);
 await page.screenshot({path:info.outputPath('above-earth.png')});
 const cleanup=await page.evaluate(async()=>{const render=()=>VR.renderer.render(VR.scene,VR.camera);VR.loadWorld('room');render();const warm=VR.resourceSnapshot();for(let i=0;i<3;i++){VR.loadWorld('orbit');await VR.world.inst.earthReady;VR.world.inst.update(.016,0);render();VR.loadWorld('room');render();}const end=VR.resourceSnapshot();return {warm,end};});
 expect(cleanup.end.textures).toBe(cleanup.warm.textures);expect(cleanup.end.geometries).toBe(cleanup.warm.geometries);expect(errors).toEqual([]);
});
