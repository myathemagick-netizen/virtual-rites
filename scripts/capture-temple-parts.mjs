import {chromium} from '@playwright/test';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}});await page.goto('http://127.0.0.1:5173/virtual-rites/');await page.evaluate(()=>VR.ready);
await page.evaluate(async()=>{
 const {GLTFLoader}=await import('/virtual-rites/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
 const root=(await new GLTFLoader().loadAsync(VR.assetURL('assets/models/drowned-temple/user-parts.glb'))).scene;
 VR.renderer.setAnimationLoop(null);VR.scene.clear();VR.scene.fog=null;VR.scene.background=new THREE.Color(0x28343e);
 document.querySelectorAll('.screen').forEach(s=>s.classList.add('off'));VR.scene.add(new THREE.HemisphereLight(0xffffff,0x445566,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(4,8,8);VR.scene.add(light);
 for(const [i,name] of ['full-arch','pillar','arch-span'].entries()){
  const mesh=root.getObjectByName(name),box=new THREE.Box3().setFromObject(mesh),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const group=new THREE.Group();group.add(mesh);mesh.position.set(-center.x,-box.min.y,-center.z);group.scale.setScalar(i===2?4/size.x:5/size.y);group.position.x=(i-1)*5;group.rotation.y=.1;VR.scene.add(group);
 }
 const camera=new THREE.OrthographicCamera(-9,9,7,-3,.1,100);camera.position.set(0,3,14);camera.lookAt(0,2,0);VR.renderer.render(VR.scene,camera);
});await page.screenshot({path:'docs/captures/temple-separated-parts.png'});await browser.close();
