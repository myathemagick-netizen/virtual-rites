export function eclipseCorona(position) {
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{time:{value:0},quiet:{value:VR.calm()||VR.reducedMotion||VR.settings.simplified?1:0},soft:{value:VR.settings.intensity==='soft'?1:0}},
    vertexShader:'varying vec2 uvLocal;void main(){uvLocal=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 uvLocal;uniform float time;uniform float quiet;uniform float soft;
      void main(){vec2 p=(uvLocal-.5)*2.;float r=length(p),a=atan(p.y,p.x);
      float t=time*(1.-quiet);float bend=.12*sin(r*13.-t*.16)+.07*sin(a*5.+t*.12);
      float fingers=pow(max(0.,cos(a*28.+bend*10.)),18.);
      float wisps=pow(max(0.,cos(a*17.-r*9.+t*.09)),7.);
      float outward=smoothstep(.17,.24,r)*(1.-smoothstep(.32,.94,r));
      float rays=(fingers*.42+wisps*.12)*outward*exp(-r*2.);
      float halo=exp(-abs(r-(.19+.005*sin(a*9.+t*.18)))*95.)*.45;
      float shift=(.005+.006*pow(max(0.,sin(t*.65)),8.))*(1.-quiet);
      float scan=sin(floor(p.y*45.)*2.7+t*.35)*shift;
      float red=exp(-abs(length(p+vec2(shift+scan,0.))-.184)*170.);
      float cyan=exp(-abs(length(p-vec2(shift+scan,0.))-.184)*170.);
      vec3 tint=mix(vec3(1.,.43,.12),vec3(.78,.12,.48),.5+.5*sin(a*3.+r*8.));
      vec3 light=tint*(rays+halo)+vec3(1.,.08,.12)*red*.28+vec3(.08,.8,1.)*cyan*.28;
      float gate=smoothstep(.158,.17,r)*(1.-smoothstep(.94,1.,r));
      gl_FragColor=vec4(light*gate*mix(1.,.48,max(quiet,soft)),gate);}`});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(250,250),material);mesh.name='Black Sun spectral corona';mesh.position.copy(position);mesh.lookAt(0,0,0);
  return {mesh,update(T){const quiet=VR.calm()||VR.reducedMotion||VR.settings.simplified;material.uniforms.quiet.value=quiet?1:0;material.uniforms.soft.value=VR.settings.intensity==='soft'?1:0;material.uniforms.time.value=T;}};
}

export function symbolOrbit(radius,index,simplified) {
  const group=new THREE.Group();group.name=['Zodiac orbit','Planetary orbit','Alchemical orbit','Angelic-inspired sigil orbit'][index];
  group.add(new THREE.Mesh(new THREE.TorusGeometry(radius,.045+index*.015,6,simplified?80:160),VR.addMat(index===1?0xff7ab8:0xffc53d,.55)));
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;
  const c=canvas.getContext('2d');c.strokeStyle=c.fillStyle='#ffe5ad';c.lineWidth=2.4;c.lineCap='round';c.textAlign='center';c.textBaseline='middle';c.font='40px "Segoe UI Symbol", "DejaVu Sans", sans-serif';
  const families=[['♈','♉','♊','♋','♌','♍','♎','♏'],['☉','☽','☿','♀','♂','♃','♄','♁']];
  for(let i=0;i<8;i++){c.save();c.translate(i*64+32,32);
    if(index<2)c.fillText(families[index][i],0,0);
    else if(index===2){c.beginPath();if(i<4){const s=i%2?-1:1;c.moveTo(0,-18*s);c.lineTo(19,16*s);c.lineTo(-19,16*s);c.closePath();if(i>1){c.moveTo(-16,3*s);c.lineTo(16,3*s);}}else{c.arc(0,-4,13,0,Math.PI*2);c.moveTo(0,9);c.lineTo(0,23);c.moveTo(-8,17);c.lineTo(8,17);if(i%2){c.moveTo(-13,-4);c.lineTo(13,-4);}}c.stroke();}
    else{ // Original geometric marks, inspired by angelic scripts; not a historical alphabet.
      c.beginPath();c.moveTo(-17,-18);c.lineTo(0,16);c.lineTo(16,-12);c.moveTo(-17,0);c.lineTo(17,0);if(i%2){c.moveTo(0,-22);c.lineTo(0,22);}else{c.moveTo(-13,20);c.lineTo(13,-20);}c.stroke();c.beginPath();c.arc((i%3-1)*12,-18,3,0,Math.PI*2);c.stroke();
    }c.restore();}
  const atlas=VR.canvasTex(canvas);group.userData.family=index;
  for(let i=0;i<(simplified?4:8);i++){
    const slot=simplified?i*2:i;
    const geo=new THREE.PlaneGeometry(.95,.95),uv=geo.attributes.uv;for(let j=0;j<uv.count;j++)uv.setX(j,(uv.getX(j)+slot)/8);
    const mat=new THREE.MeshBasicMaterial({map:atlas,transparent:true,depthWrite:false,side:THREE.DoubleSide,color:0xffdda4,toneMapped:false});
    const glyph=new THREE.Mesh(geo,mat);glyph.name='Orbit symbol';const a=slot/8*Math.PI*2;glyph.position.set(Math.cos(a)*radius,Math.sin(a)*radius,0);group.add(glyph);
  }return group;
}
