// Small CPU boid schools retain WebGL/XR support without a compute renderer.
export function templeFish(ctx){
 const count=ctx.simplified?16:96,schoolSize=ctx.simplified?8:32,positions=[],velocities=[],forces=[];
 const mat=new THREE.MeshStandardMaterial({color:0x74939b,roughness:.9,side:THREE.DoubleSide});
 const bodyGeo=new THREE.SphereGeometry(.3,8,4);bodyGeo.scale(1.6,.6,.38);
 const tailGeo=new THREE.BufferGeometry();tailGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.45,.28,0,-.45,-.28,0],3));tailGeo.computeVertexNormals();
 const bodies=new THREE.InstancedMesh(bodyGeo,mat,count),tails=new THREE.InstancedMesh(tailGeo,mat,count);
 bodies.name='Distant fish school';tails.name='Fish tails';bodies.frustumCulled=tails.frustumCulled=false;ctx.group.add(bodies,tails);
 for(let i=0;i<count;i++){const school=Math.floor(i/schoolSize),b=school*120+VR.hash(i+10)*10;positions.push(VR.dir(b).multiplyScalar(34+VR.hash(i+50)*7).setY(7+school*3+VR.hash(i+40)*3));velocities.push(VR.dir(b+90).multiplyScalar(.8));forces.push(new THREE.Vector3());}
 const center=new THREE.Vector3(),separation=new THREE.Vector3(),alignment=new THREE.Vector3(),cohesion=new THREE.Vector3(),delta=new THREE.Vector3();
 const matrix=new THREE.Matrix4(),tailMatrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),unit=new THREE.Vector3(1,1,1),tailOffset=new THREE.Matrix4().makeTranslation(-.4,0,0),swing=new THREE.Matrix4(),forward=new THREE.Vector3(1,0,0),direction=new THREE.Vector3();
 let phase=0;
 return {count,positions,velocities,update(dt,T){
  const quiet=VR.calm()||VR.reducedMotion||ctx.simplified,step=Math.min(Math.max(dt,0),.05);
  if(!quiet){phase+=step;
   for(let i=0;i<count;i++){
    const school=Math.floor(i/schoolSize);center.copy(VR.dir(school*120+T*.7)).multiplyScalar(38).setY(9+school*3);
    separation.set(0,0,0);alignment.set(0,0,0);cohesion.set(0,0,0);let neighbours=0;
    for(let j=school*schoolSize;j<Math.min(count,(school+1)*schoolSize);j++){if(i===j)continue;delta.copy(positions[i]).sub(positions[j]);const d=delta.lengthSq();if(d>36||d<.0001)continue;neighbours++;alignment.add(velocities[j]);cohesion.add(positions[j]);if(d<2)separation.addScaledVector(delta,1/d);}
    const force=forces[i].copy(center).sub(positions[i]).multiplyScalar(.16).addScaledVector(separation,1.4);
    if(neighbours){force.addScaledVector(alignment.divideScalar(neighbours).sub(velocities[i]),.65);force.addScaledVector(cohesion.divideScalar(neighbours).sub(positions[i]),.1);}
    force.clampLength(0,2);
   }
   for(let i=0;i<count;i++){velocities[i].addScaledVector(forces[i],step).clampLength(.4,1.6);positions[i].addScaledVector(velocities[i],step);const r=Math.hypot(positions[i].x,positions[i].z);if(r<26||r>50){const target=Math.max(26,Math.min(50,r));positions[i].x*=target/r;positions[i].z*=target/r;}positions[i].y=THREE.MathUtils.clamp(positions[i].y,4,19);}
  }
  for(let i=0;i<count;i++){direction.copy(velocities[i]).normalize();rotation.setFromUnitVectors(forward,direction);matrix.compose(positions[i],rotation,unit);bodies.setMatrixAt(i,matrix);swing.makeRotationY(quiet?0:Math.sin(phase*4.5+i*1.7)*.45);tailMatrix.copy(matrix).multiply(tailOffset).multiply(swing);tails.setMatrixAt(i,tailMatrix);}
  bodies.instanceMatrix.needsUpdate=tails.instanceMatrix.needsUpdate=true;
 }};
}
