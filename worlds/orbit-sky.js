export function galaxyBand(simplified){
 const canvas=document.createElement('canvas');canvas.width=simplified?512:1024;canvas.height=256;const c=canvas.getContext('2d');
 for(let i=0;i<220;i++){const x=VR.hash(i+200)*canvas.width,y=128+(VR.hash(i+400)-.5)*30,r=15+VR.hash(i+600)*35;
  for(const wrap of [-canvas.width,0,canvas.width]){const grad=c.createRadialGradient(x+wrap,y,0,x+wrap,y,r);grad.addColorStop(0,'rgba(210,205,255,.10)');grad.addColorStop(.4,'rgba(120,143,210,.055)');grad.addColorStop(1,'rgba(80,100,180,0)');c.fillStyle=grad;c.fillRect(x+wrap-r,y-r,r*2,r*2);}}
 c.globalCompositeOperation='destination-out';c.lineWidth=7;c.strokeStyle='rgba(0,0,0,.7)';c.beginPath();for(let x=0;x<=canvas.width;x++){const y=128+Math.sin(x/canvas.width*Math.PI*12)*4;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
 const mat=new THREE.MeshBasicMaterial({map:VR.canvasTex(canvas),transparent:true,opacity:.85,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false});
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(550,48,24),mat);mesh.rotation.set(.9,.3,.4);mesh.name='Milky Way dust band';return mesh;
}
