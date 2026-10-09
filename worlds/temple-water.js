export function templeWater(simplified){
 const uniforms={time:{value:0},quiet:{value:1},strength:{value:.35}};
 const water=new THREE.Mesh(new THREE.PlaneGeometry(180,180,simplified?16:64,simplified?16:64),new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false,uniforms,
  vertexShader:`varying vec2 p;uniform float time;uniform float quiet;void main(){p=position.xy;vec3 v=position;v.z+=(sin(p.x*.17+time*.12)+cos(p.y*.21-time*.1))*.25*(1.-quiet);gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,
  fragmentShader:`varying vec2 p;uniform float time;uniform float strength;void main(){float a=sin(p.x*.31+sin(p.y*.23+time*.06)*2.+time*.08);float b=cos(p.y*.29+sin(p.x*.21-time*.05)*2.-time*.07);float ridge=pow(1.-abs(a*b),16.);vec3 c=mix(vec3(.025,.24,.31),vec3(.22,.65,.7),ridge*.8);gl_FragColor=vec4(c,strength);}`
 }));water.rotation.x=-Math.PI/2;water.position.y=24;water.name='Ocean canopy';
 const causticUniforms={time:{value:0},strength:{value:.12}};
 const caustics=new THREE.Mesh(new THREE.CircleGeometry(13.4,64),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:causticUniforms,
  vertexShader:'varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 p;uniform float time;uniform float strength;void main(){vec2 q=p*.55;float a=sin(q.x+sin(q.y*1.4+time*.09)*1.8+time*.1),b=sin(q.y+cos(q.x*1.3-time*.08)*1.6);float light=pow(1.-abs(a*b),20.);float fade=1.-smoothstep(10.,13.4,length(p));gl_FragColor=vec4(vec3(.25,.7,.8)*light,strength*fade);}`
 }));caustics.rotation.x=-Math.PI/2;caustics.position.y=.016;caustics.name='Temple caustics';
 return {water,caustics,update(T){const quiet=VR.calm()||VR.reducedMotion||simplified;uniforms.quiet.value=quiet?1:0;uniforms.time.value=causticUniforms.time.value=quiet?0:T;uniforms.strength.value=quiet?.3:.55;causticUniforms.strength.value=quiet?.075:VR.settings.intensity==='soft'?.13:.22;}};
}
