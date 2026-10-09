import {chromium} from '@playwright/test';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.goto('http://127.0.0.1:5173/virtual-rites/');await page.evaluate(()=>VR.ready);
await page.evaluate(async()=>{
 const {GLTFLoader}=await import('/virtual-rites/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
 VR.renderer.setAnimationLoop(null);VR.scene.clear();VR.scene.background=new THREE.Color(0x28343e);VR.scene.fog=null;
 document.querySelectorAll('.screen').forEach(s=>s.classList.add('off'));
 VR.scene.add(new THREE.HemisphereLight(0xffffff,0x445566,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(4,8,8);VR.scene.add(light);
 for(const [i,kind] of ['arch','ruins'].entries()){
  const root=(await new GLTFLoader().loadAsync(VR.assetURL(`assets/models/drowned-temple/${kind}.glb`))).scene;
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const wrapper=new THREE.Group();wrapper.add(root);root.position.set(-center.x,-box.min.y,-center.z);wrapper.scale.setScalar(5/Math.max(size.x,size.y,size.z));wrapper.position.x=i?3:-3;VR.scene.add(wrapper);
 }
 VR.scene.add(VR.camera);VR.camera.position.set(0,4,14);VR.camera.lookAt(0,2,0);VR.renderer.render(VR.scene,VR.camera);
});
await page.screenshot({path:'docs/captures/temple-meshy-preview.png'});await browser.close();
