import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// One import per asset/world; clones share owned geometry and PBR textures.
export function templeModels(ctx,arches,ruins,projection){
 if(ctx.simplified)return null;
 const holder=new THREE.Group();holder.name='Imported temple architecture';holder.userData.status='loading';ctx.group.add(holder);
 const load=async(kind,fallbacks)=>{
  const gltf=await new GLTFLoader().loadAsync(VR.assetURL(`assets/models/drowned-temple/${kind}.glb`)),root=gltf.scene;
  if(holder.parent!==ctx.group){VR.disposeGroup(root);return;}
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  let triangles=0;root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  if(![size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0)||triangles>30000){VR.disposeGroup(root);throw new Error(`Invalid ${kind} geometry`);}
  const scale=Math.min(7/size.y,6/size.x,4/size.z);
  const fitted=kind==='arch'?new THREE.Vector3(8.6/size.x,3.8/size.y,1/size.z):new THREE.Vector3(scale,scale,scale);
  const normalized=new THREE.Group();normalized.add(root);root.position.set(-center.x,-box.min.y,-center.z);normalized.scale.copy(fitted);
  root.traverse(o=>{if(!o.isMesh)return;const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m.metalness=0;m.roughness=1;projection.apply(m);});});
  fallbacks.forEach((fallback,i)=>{
   const clone=normalized.clone(true);clone.name=kind==='arch'?'Meshy weathered arch':'Meshy ruin cluster';clone.position.copy(fallback.position);
   clone.rotation.copy(fallback.rotation);
   if(kind==='ruins'){clone.rotation.z=0;clone.rotation.y=VR.hash(i+83)*Math.PI*2;clone.scale.multiplyScalar(.75+VR.hash(i+61)*.25);}
   holder.add(clone);fallback.visible=false;
  });
  holder.userData[kind]={triangles,count:fallbacks.length,width:size.x*fitted.x,height:size.y*fitted.y,depth:size.z*fitted.z};
 };
 holder.userData.ready=Promise.allSettled([load('arch',arches),load('ruins',ruins)]).then(results=>{
  if(holder.parent!==ctx.group)return;
  holder.userData.status=results.every(r=>r.status==='fulfilled')?'ready':'fallback';
  results.forEach(r=>{if(r.status==='rejected')console.warn('[Virtual Rites] temple model unavailable; retaining procedural asset',r.reason.message);});
 });
 return holder;
}
