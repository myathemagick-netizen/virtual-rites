import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export function templeModels(ctx,fallbacks,projection){
 if(ctx.simplified)return null;
 const holder=new THREE.Group();holder.name='Broken temple colonnade';holder.userData.status='loading';ctx.group.add(holder);
 const loadParts=async()=>{
  const root=(await new GLTFLoader().loadAsync(VR.assetURL('assets/models/drowned-temple/user-parts.glb'))).scene;
  if(holder.parent!==ctx.group){VR.disposeGroup(root);return;}
  const materials=new Set();root.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});materials.forEach(m=>{m.metalness=0;m.roughness=1;projection.apply(m);});
  const sizes={},counts={};
  for(const name of ['full-arch','pillar','arch-span']){const mesh=root.getObjectByName(name);if(!mesh?.isMesh){VR.disposeGroup(root);throw new Error('Missing supplied temple part');}mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox,center=box.getCenter(new THREE.Vector3());sizes[name]=box.getSize(new THREE.Vector3());mesh.geometry.translate(-center.x,-box.min.y,-center.z);counts[name]=0;}
  const place=(name,p)=>{
   const mesh=root.getObjectByName(name).clone(),size=sizes[name],group=new THREE.Group();group.name=`Temple part: ${name}`;group.userData.fallen=!!p.fallen;group.add(mesh);
   const uniform=p.height? p.height/size.y:p.width/size.x;group.scale.setScalar(uniform);
   if(p.fitHeight)group.scale.y=p.fitHeight/size.y;if(p.depth)group.scale.z=p.depth/size.z;
   group.position.copy(VR.dir(p.bearing).multiplyScalar(p.radius));group.position.y=p.y??-.78;group.rotation.set(p.rx??0,VR.yawFor(p.bearing)+(p.turn??0),p.rz??0);holder.add(group);
   if(p.fallen){group.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(group);group.position.y+=(-.88-box.min.y);}
   counts[name]++;
  };
  for(const bearing of [0,90,180,270])place('full-arch',{bearing,radius:19.5,width:8.8,fitHeight:10.6,depth:2.4});
  for(const bearing of [35,55])place('pillar',{bearing,radius:20,height:8.8});
  place('arch-span',{bearing:45,radius:19.7,width:6.8,fitHeight:3.05,depth:1.4,y:8.02});
  for(const bearing of [125,225,315])place('pillar',{bearing,radius:20,height:8.8});
  for(const bearing of [155,285])place('pillar',{bearing,radius:32,height:6.5,turn:.3});
  for(let i=0;i<3;i++){
   place('pillar',{bearing:65+i*130,radius:30+i*2,height:8,rz:Math.PI/2,turn:VR.hash(i+75)*Math.PI,fallen:true});
   place('arch-span',{bearing:120+i*110,radius:35+i,width:8,rx:Math.PI/2,turn:VR.hash(i+90)*Math.PI,fallen:true});
  }
  holder.userData.parts=counts;fallbacks.forEach(o=>o.visible=false);
 };
 const loadRuins=async()=>{
  const root=(await new GLTFLoader().loadAsync(VR.assetURL('assets/models/drowned-temple/ruins.glb'))).scene;
  if(holder.parent!==ctx.group){VR.disposeGroup(root);return;}
  root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());root.position.set(-center.x,-box.min.y,-center.z);
  root.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.metalness=0;m.roughness=1;projection.apply(m);});});
  for(let i=0;i<6;i++){const group=new THREE.Group();group.name='Scattered Meshy ruin';group.add(root.clone(true));group.scale.setScalar((4+VR.hash(i+60)*2)/size.x);group.position.copy(VR.dir(10+i*60).multiplyScalar(42+VR.hash(i+50)*10)).setY(-1.1);group.rotation.y=VR.hash(i+77)*Math.PI*2;holder.add(group);}holder.userData.ruins={count:6};
 };
 holder.userData.ready=Promise.allSettled([loadParts(),loadRuins()]).then(results=>{if(holder.parent!==ctx.group)return;holder.userData.status=results.every(r=>r.status==='fulfilled')?'ready':'fallback';results.forEach(r=>{if(r.status==='rejected')console.warn('[Virtual Rites] temple model unavailable; procedural fallback retained',r.reason.message);});});return holder;
}
