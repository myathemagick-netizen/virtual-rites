import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mediaPath } from './media-paths.js';
const VR=window.VR, entries=new Map();
const alive=e=>entries.get(e.id)===e && e.root.parent===VR.fx.state.root;
function remove(e) {
  entries.delete(e.id); e.abort.abort();
  if(e.source) { try { e.source.stop(); } catch {} e.source.disconnect(); }
  e.gain?.disconnect();
  if(e.video) { e.video.pause(); e.video.removeAttribute('src'); e.video.load(); }
  VR.disposeGroup(e.root); e.root.removeFromParent();
}
async function load(e,asset,a,ctx,ritual) {
  const url=VR.assetURL(mediaPath(ritual,a.asset));
  if(asset.type==='audio') {
    if(ctx.skip || !VR.audio.active || !VR.settings.sound || VR.silent) return;
    const ac=VR.audio.ctx; if(!ac) return;
    const response=await fetch(url,{signal:e.abort.signal}); if(!response.ok) throw new Error('Audio unavailable');
    const buffer=await ac.decodeAudioData(await response.arrayBuffer());
    if(!alive(e) || VR.audio.ctx!==ac || !VR.settings.sound || VR.player.paused) return;
    const gain=e.gain=ac.createGain(); gain.gain.value=a.volume ?? .5;
    e.source=ac.createBufferSource(); e.source.buffer=buffer; e.source.loop=!!a.loop;
    e.source.connect(gain); gain.connect(VR.audio.master); e.source.start(); return;
  }
  if(asset.type==='model') {
    if(VR.settings.simplified) return;
    const response=await fetch(url,{signal:e.abort.signal});
    if(!response.ok || Number(response.headers.get('content-length'))>20000000) throw new Error('Model unavailable or too large');
    const bytes=await response.arrayBuffer(),view=new DataView(bytes);
    if(bytes.byteLength>20000000 || bytes.byteLength<20 || view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2) throw new Error('Expected embedded GLB v2');
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,view.getUint32(12,true))));
    if([...(json.buffers || []),...(json.images || [])].some(value=>value.uri)) throw new Error('Models must embed all buffers and images');
    const model=(await new GLTFLoader().parseAsync(bytes,'')).scene;
    if(!alive(e)) { VR.disposeGroup(model); return; }
    let triangles=0; model.traverse(o=>{if(o.isMesh) triangles+=(o.geometry.index?.count || o.geometry.attributes.position.count)/3;});
    if(triangles>100000) { VR.disposeGroup(model); throw new Error('Model exceeds 100K triangles'); }
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
    if(!Number.isFinite(size.length()) || !size.length()) { VR.disposeGroup(model); throw new Error('Invalid model bounds'); }
    const factor=(a.size ?? 1)/Math.max(size.x,size.y,size.z),center=box.getCenter(new THREE.Vector3());
    model.scale.multiplyScalar(factor); model.position.copy(center.multiplyScalar(-factor)); e.root.add(model); return;
  }
  let texture;
  if(asset.type==='video' && !VR.calm() && !VR.reducedMotion && !VR.settings.simplified) {
    const video=document.createElement('video'); e.video=video; video.src=url; video.muted=true; video.playsInline=true; video.loop=!!a.loop;
    texture=new THREE.VideoTexture(video);
    video.play().catch(()=>{if(alive(e)) VR.toast('Video playback was blocked; captions remain available.');});
  } else {
    if(asset.type==='video') {
      if(!asset.poster) return;
      const poster={...ritual,assets:{poster:{file:asset.poster}}};
      texture=await new THREE.TextureLoader().loadAsync(VR.assetURL(mediaPath(poster,'poster')));
    } else texture=await new THREE.TextureLoader().loadAsync(url);
    if(!alive(e)) { texture.dispose(); return; }
  }
  texture.colorSpace=THREE.SRGBColorSpace;
  e.root.add(new THREE.Mesh(new THREE.PlaneGeometry(a.width ?? 1.5,a.size ?? 1.5),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,toneMapped:false})));
}
VR.media={entries,url:(r,id)=>VR.assetURL(mediaPath(r,id)),
  clear(id) {for(const e of [...entries.values()]) if(!id || e.id===id) remove(e);},
  clearStep() {for(const e of [...entries.values()]) if(e.lifetime==='step') remove(e);},
  stopAudio() {for(const e of [...entries.values()]) if(e.type==='audio') remove(e);},
  pause(on) {if(on) VR.media.stopAudio(); for(const e of entries.values()) if(e.video) {if(on) e.video.pause(); else e.video.play().catch(()=>{});}},
};
VR.actions.media=(a,ctx)=>{
  const ritual=VR.player.ritual,asset=ritual.assets?.[a.asset];
  if(!asset || (ctx.skip && (asset.type==='audio' || a.lifetime!=='ritual'))) return;
  const id=a.id || 'media-'+a.asset; VR.media.clear(id);
  const root=new THREE.Group(),p=VR.dir(VR.bearing(a.quarter ?? ctx.face)).multiplyScalar(a.distance ?? 3);
  root.position.set(p.x,a.height ?? 1.7,p.z); root.lookAt(0,root.position.y,0); VR.fx.state.root.add(root);
  const e={id,root,type:asset.type,lifetime:a.lifetime || 'step',abort:new AbortController()}; entries.set(id,e);
  e.ready=load(e,asset,a,ctx,ritual).catch(error=>{if(error.name!=='AbortError' && alive(e)) {e.error=error.message;VR.toast('Ritual media unavailable: '+a.asset);}});
};
VR.actions.mediaClear=a=>VR.media.clear(a.id);
