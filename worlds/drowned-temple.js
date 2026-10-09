import {stoneMaps,weatheredStone} from './stone-surface.js';
import {templeWater} from './temple-water.js';
VR.registerWorld({id:'drowned-temple',name:'The Drowned Temple',blurb:'An air-filled sanctuary beneath the ocean, with weathered arches, drifting fish and sunlight rippling across the stone.',
 build(ctx){
  const g=ctx.group,K=VR.kit,dir=VR.dir,hash=VR.hash;
  // Match the distant background to the scattering color so fog has no visible boundary.
  ctx.setFog(0x073847,.04);const sky=K.sky(g,{top:0x185c73,mid:0x0b3c51,horizon:0x073847,glow:0x205e6b,glowBearing:55,glowPower:4,opposite:0x073847,oppositeAmount:0,below:0x073847});
  sky.material.fragmentShader=sky.material.fragmentShader.replace('uHor*.55','uHor').replace('gl_FragColor=vec4(c,1.);','gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n');
  g.add(new THREE.HemisphereLight(0x9dd9e4,0x112a2a,1.1));const sun=new THREE.DirectionalLight(0xc3edf0,1.5);sun.position.copy(dir(55).multiplyScalar(35)).setY(50);g.add(sun);
  const maps=stoneMaps(ctx.simplified),stone=new THREE.MeshStandardMaterial({color:0x6d8989,map:maps.map,bumpMap:maps.bumpMap,bumpScale:.05,roughness:.98,vertexColors:true});
  const floorMat=new THREE.MeshStandardMaterial({color:0x526967,map:maps.map,bumpMap:maps.bumpMap,bumpScale:.025,roughness:.95});
  const floorGeo=new THREE.CircleGeometry(13.5,64),uv=floorGeo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*9,uv.getY(i)*9);
  const floor=new THREE.Mesh(floorGeo,floorMat);floor.rotation.x=-Math.PI/2;floor.name='Clear temple ritual floor';g.add(floor);
  const terrace=new THREE.Mesh(new THREE.CylinderGeometry(14.3,15.3,.7,48),floorMat);terrace.position.y=-.4;g.add(terrace);
  const edgeMat=new THREE.MeshBasicMaterial({color:0x76b8ba,transparent:true,opacity:.22});
  for(const r of [8.5,12.8,13.4]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.025,5,96),edgeMat);ring.rotation.x=Math.PI/2;ring.position.y=.025;g.add(ring);}
  const arches=[],pillars=[];
  for(let i=0;i<12;i++){
   const b=i*30,p=dir(b).multiplyScalar(16.5),geo=weatheredStone(1.5,11.5,1.7,i+1,.18,ctx.simplified);
   const column=new THREE.Mesh(geo,stone);column.position.copy(p);column.rotation.y=VR.yawFor(b);column.name='Temple perimeter pillar';g.add(column);pillars.push(column);
   const archGeo=new THREE.TorusGeometry(3.5,.5,ctx.simplified?5:8,ctx.simplified?16:32,Math.PI),colors=[];for(let v=0;v<archGeo.attributes.position.count;v++)colors.push(.9,.94,.92);archGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
   const arch=new THREE.Mesh(archGeo,stone);arch.position.copy(dir(b+15).multiplyScalar(16)).setY(11.5);arch.rotation.y=VR.yawFor(b+15);arch.name='Weathered temple arch';g.add(arch);arches.push(arch);
  }
  for(let i=0;i<(ctx.simplified?8:18);i++){const b=i*23,p=dir(b).multiplyScalar(30+hash(i+12)*25),ruin=new THREE.Mesh(weatheredStone(1.8,4+hash(i+30)*7,1.8,i+80,.24,ctx.simplified),stone);ruin.position.copy(p);ruin.rotation.y=b;ruin.rotation.z=(hash(i+44)-.5)*.35;g.add(ruin);}
  const water=templeWater(ctx.simplified);g.add(water.water,water.caustics);
  const shafts=new THREE.Group();shafts.name='Submerged sun shafts';g.add(shafts);
  const shaftMat=new THREE.MeshBasicMaterial({color:0x8fe8eb,transparent:true,opacity:ctx.simplified?.025:.035,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  for(let i=0;i<(ctx.simplified?2:4);i++){const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,2.1,22,8,1,true),shaftMat);beam.position.copy(dir(35+i*85).multiplyScalar(12)).setY(12);beam.rotation.z=.12;shafts.add(beam);}
  const count=ctx.simplified?8:24,fishMat=new THREE.MeshStandardMaterial({color:0x193b49,roughness:.8,metalness:.05});
  const bodies=new THREE.InstancedMesh(new THREE.SphereGeometry(.35,8,4),fishMat,count),tails=new THREE.InstancedMesh(new THREE.ConeGeometry(.26,.65,3),fishMat,count);bodies.name='Distant fish school';tails.name='Fish tails';g.add(bodies,tails);
  bodies.frustumCulled=tails.frustumCulled=false;
  const matrix=new THREE.Matrix4(),tailMatrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(1.5,.6,.45),tailTurn=new THREE.Matrix4().makeRotationZ(-Math.PI/2);
  const particles=K.motes(g,{count:ctx.simplified?80:260,radius:38,height:20,palette:[0x74aab5,0xb5d7d5,0x81b9c5],size:.035,speed:.12});
  return {water,pillars,update(dt,T){const quiet=VR.calm()||VR.reducedMotion||ctx.simplified,t=quiet?0:T;water.update(T);
   for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+t*.012,radius=28+hash(i+150)*8;position.set(Math.cos(angle)*radius,6+hash(i+240)*9+(quiet?0:Math.sin(t*.15+i)*.35),Math.sin(angle)*radius);rotation.setFromAxisAngle(VR.UP,-angle-Math.PI/2);matrix.compose(position,rotation,scale);bodies.setMatrixAt(i,matrix);tailMatrix.compose(position,rotation,new THREE.Vector3(1,1,1)).multiply(new THREE.Matrix4().makeTranslation(-.7,0,0)).multiply(tailTurn);tails.setMatrixAt(i,tailMatrix);}bodies.instanceMatrix.needsUpdate=tails.instanceMatrix.needsUpdate=true;
   if(!quiet)particles.update(dt,T);
  }};
 }
});
