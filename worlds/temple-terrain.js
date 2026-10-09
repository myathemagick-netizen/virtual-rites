// One terrain draw and one shared rubble draw; the level ritual floor stays clear.
export function templeTerrain(ctx,material){
 const simple=ctx.simplified,segments=simple?64:160,rings=simple?12:32;
 const positions=[],colors=[],uvs=[],indices=[];
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,r=15.5+j/rings*65,x=Math.sin(a)*r,z=Math.cos(a)*r;
  const rise=Math.max(0,(r-25)/55);
  const ridge=Math.pow(.5+.5*Math.sin(a*5+.8),2);
  const y=-.8+rise*(3+ridge*11)+rise*(Math.sin(x*.21)*Math.cos(z*.17)*2.3);
  positions.push(x,y,z);uvs.push(x*.24,z*.24);
  const shade=.65+.2*VR.hash(i+j*segments);colors.push(shade*.8,shade,shade*.96);
  if(j<rings&&i<segments){const n=j*(segments+1)+i;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
 const ground=new THREE.Mesh(geo,material);ground.name='Sloping temple seabed';ctx.group.add(ground);
 const rockGeo=new THREE.IcosahedronGeometry(1,simple?0:1),p=rockGeo.attributes.position,c=[];
 for(let i=0;i<p.count;i++){const h=VR.hash(i+871);p.setXYZ(i,p.getX(i)*(1+h*.25),p.getY(i)*(1+h*.2),p.getZ(i)*(1+h*.25));c.push(.65+h*.2,.72+h*.2,.7+h*.2);}
 rockGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));rockGeo.computeVertexNormals();
 const count=simple?32:160,rocks=new THREE.InstancedMesh(rockGeo,material,count),dummy=new THREE.Object3D();rocks.name='Scattered seabed rocks';
 for(let i=0;i<count;i++){
  const a=VR.hash(i+21)*Math.PI*2,r=21+VR.hash(i+321)*45,x=Math.sin(a)*r,z=Math.cos(a)*r,rise=Math.max(0,(r-25)/55),ridge=Math.pow(.5+.5*Math.sin(a*5+.8),2);
  const y=-.8+rise*(3+ridge*11)+rise*Math.sin(x*.21)*Math.cos(z*.17)*2.3;
  const size=.5+VR.hash(i+891)*2.2;dummy.position.set(x,y,z);dummy.scale.set(size*1.4,size*.7,size);dummy.rotation.set(VR.hash(i+431),a,VR.hash(i+531));dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
 }
 rocks.computeBoundingSphere();ctx.group.add(rocks);
 return {ground,rocks};
}
