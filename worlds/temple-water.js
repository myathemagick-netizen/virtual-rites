// Downward oblique projection onto stone surfaces. No extra geometry or per-eye render target.
export function templeProjection(simplified){
 const uniforms={templeTime:{value:0},templeStrength:{value:.12}};
 return {uniforms,apply(material){
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 templePosition;varying vec3 templeNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\ntemplePosition=(modelMatrix*vec4(position,1.)).xyz;templeNormal=normalize(mat3(modelMatrix)*normal);');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
    varying vec3 templePosition;varying vec3 templeNormal;uniform float templeTime,templeStrength;
    float templeRipple(vec2 p){float a=sin(p.x+sin(p.y*1.4+templeTime*.09)*1.8+templeTime*.1);float b=sin(p.y+cos(p.x*1.3-templeTime*.08)*1.6);return pow(1.-abs(a*b),20.);}`)
    .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
     vec2 projected=(templePosition.xz+templePosition.y*vec2(.24,.18))*.55;
     float facing=max(dot(normalize(templeNormal),normalize(vec3(.24,1.,.18))),0.);
     float footprint=1.-smoothstep(18.,48.,length(templePosition.xz));
     totalEmissiveRadiance+=diffuseColor.rgb*vec3(.25,.7,.8)*templeRipple(projected)*facing*footprint*templeStrength;`);
  };
  material.customProgramCacheKey=()=> 'temple-projection-v1';
 },update(T){const quiet=VR.calm()||VR.reducedMotion||simplified;uniforms.templeTime.value=quiet?0:T;uniforms.templeStrength.value=quiet?.16:VR.settings.intensity==='soft'?.32:.6;}};
}

export function templeWater(simplified){
 const uniforms={time:{value:0},quiet:{value:1},strength:{value:.35}};
 const water=new THREE.Mesh(new THREE.PlaneGeometry(180,180,simplified?16:64,simplified?16:64),new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false,uniforms,
  vertexShader:`varying vec2 p;varying vec3 worldPosition;uniform float time;uniform float quiet;void main(){p=position.xy;vec3 v=position;v.z+=(sin(p.x*.17+time*.12)+cos(p.y*.21-time*.1))*.25*(1.-quiet);worldPosition=(modelMatrix*vec4(v,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,
  // Fade before the square mesh perimeter; view distance also softens the horizon in each XR eye.
  fragmentShader:`varying vec2 p;varying vec3 worldPosition;uniform float time;uniform float strength;void main(){float a=sin(p.x*.31+sin(p.y*.23+time*.06)*2.+time*.08);float b=cos(p.y*.29+sin(p.x*.21-time*.05)*2.-time*.07);float ridge=pow(1.-abs(a*b),16.);float distanceFade=exp(-pow(length(worldPosition-cameraPosition)*.018,2.));float edgeFade=1.-smoothstep(40.,80.,length(p));vec3 c=mix(vec3(.035,.29,.38),vec3(.42,.85,.9),ridge*.8*distanceFade);gl_FragColor=vec4(c,strength*edgeFade*distanceFade);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`
 }));water.rotation.x=-Math.PI/2;water.position.y=24;water.name='Ocean canopy';
 return {water,update(T){const quiet=VR.calm()||VR.reducedMotion||simplified;uniforms.quiet.value=quiet?1:0;uniforms.time.value=quiet?0:T;uniforms.strength.value=quiet?.3:.55;}};
}
