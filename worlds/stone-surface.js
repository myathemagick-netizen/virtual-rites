// Deterministic, seamless mineral grain; shared only inside one world instance.
export function stoneMaps(simplified) {
  const size=simplified?128:512, color=new Uint8Array(size*size*4), relief=new Uint8Array(size*size*4);
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  const noise=(u,v,n)=>{
    const x=u*n,y=v*n,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
    const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=hash(ix%n,iy%n),b=hash((ix+1)%n,iy%n),c=hash(ix%n,(iy+1)%n),d=hash((ix+1)%n,(iy+1)%n);
    return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;
  };
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,i=(y*size+x)*4;
    const broad=noise(u,v,4),grain=noise(u,v,32),fine=noise(u,v,128),pit=Math.pow(Math.max(0,(.38-grain)/.38),2);
    const lichen=Math.max(0,(noise(u,v,16)-.67)/.33),value=166+broad*35+fine*19-pit*32;
    color[i]=value+lichen*13;color[i+1]=value+lichen*15;color[i+2]=value-6-lichen*14;color[i+3]=255;
    const height=110+grain*64+fine*30-pit*55;relief[i]=relief[i+1]=relief[i+2]=height;relief[i+3]=255;
  }
  const make=(bytes,srgb)=>{const t=new THREE.DataTexture(bytes,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=Math.min(4,VR.renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;return t;};
  return {map:make(color,true),bumpMap:simplified?null:make(relief,false)};
}

export function weatheredStone(w,h,d,seed,rough,simplified) {
  const geo=new THREE.BoxGeometry(w,h,d,simplified?2:6,simplified?4:12,simplified?2:6),p=geo.attributes.position,uv=geo.attributes.uv,n=geo.attributes.normal;
  const colors=[],radius=Math.min(w,h,d)*.13,core=new THREE.Vector3(w/2-radius,h/2-radius,d/2-radius),q=new THREE.Vector3(),base=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),t=y/h+.5;
    // Keep UV density in metres rather than stretching one tile over each face.
    if(Math.abs(n.getX(i))>.5)uv.setXY(i,z*.8,y*.8);else if(Math.abs(n.getY(i))>.5)uv.setXY(i,x*.8,z*.8);else uv.setXY(i,x*.8,y*.8);
    base.set(Math.max(-core.x,Math.min(core.x,x)),Math.max(-core.y,Math.min(core.y,y)),Math.max(-core.z,Math.min(core.z,z)));
    q.set(x,y,z).sub(base).normalize().multiplyScalar(radius).add(base);
    const ripple=Math.sin(x*2.1+seed)*Math.cos(y*1.3+z*2.4+seed*.7),chip=VR.hash(x*13+y*7+z*19+seed*31)-.5;
    const variation=1+rough*(ripple*.22+chip*.2);
    p.setXYZ(i,q.x*variation*(1-.08*t),q.y+chip*rough*Math.min(h,2)*.12,q.z*variation*(1-.08*t));
    const moss=Math.max(0,1-t*4)*(.3+.7*VR.hash(seed+z*5+x*7));
    const shade=.87+VR.hash(seed+x+y+z)*.10;
    colors.push(shade*(1-moss*.22),shade*(1-moss*.12),shade*(1-moss*.28));
  }
  geo.computeVertexNormals();
  // Smooth duplicated face-edge vertices after beveling, retaining texture seams.
  const sums=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');
  for(let i=0;i<p.count;i++){const k=key(i),sum=sums.get(k)||new THREE.Vector3();sum.add(new THREE.Vector3().fromBufferAttribute(n,i));sums.set(k,sum);}
  sums.forEach(sum=>sum.normalize());for(let i=0;i<p.count;i++)n.setXYZ(i,...sums.get(key(i)).toArray());
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.translate(0,h/2,0);geo.computeBoundingBox();geo.computeBoundingSphere();return geo;
}
