import { safeAssetPath } from './media-paths.js';
const VR=window.VR;
let manifest={},epoch=0,chain=Promise.resolve(),pending=0,source,utterance,worker,serial=0;
const jobs=new Map();
const available=()=>VR.audio.active && VR.settings.sound && !VR.silent;
const N=VR.narration={
  get busy(){return pending>0;},
  get localReady(){return !!worker && N.state==='ready';},
  state:'off',
  async load(){try {const r=await fetch(VR.assetURL('assets/narration/manifest.json'));if(r.ok) manifest=(await r.json()).clips || {};} catch{}},
  stop(){
    epoch++;chain=Promise.resolve();pending=0;
    if(source){try {source.stop();}catch{} source.disconnect();source=null;}
    if(utterance){utterance.onend?.();utterance=null;} window.speechSynthesis?.cancel();
  },
  disableLocal(){N.stop();worker?.terminate();worker=null;N.state='off';jobs.forEach(j=>j.reject(new Error('Local voice stopped')));jobs.clear();},
  async prepareLocal(){
    if(!VR.settings.localNarration || N.localReady || N.state==='loading') return;
    if(!worker){
      worker=new Worker(new URL('./local-tts.worker.js',import.meta.url),{type:'module'});
      worker.onmessage=({data})=>{const j=jobs.get(data.id);if(!j)return;jobs.delete(data.id);data.error?j.reject(new Error(data.error)):j.resolve(data);};
      worker.onerror=()=>{jobs.forEach(j=>j.reject(new Error('Local voice worker failed')));jobs.clear();worker?.terminate();worker=null;N.state='failed';};
    }
    N.state='loading';VR.toast('Preparing the local voice. The first download is large; prepare it before entering VR.',10000);
    try{await request('prepare');if(worker){N.state='ready';VR.toast('Local narration voice is ready.');}}
    catch{if(VR.settings.localNarration){worker?.terminate();worker=null;N.state='failed';VR.toast('Local voice could not load. Recorded clips and captions remain available.');}}
  },
  say(text,queue=false,options={}){
    if(!text || !available())return;
    if(!queue)N.stop();const generation=epoch;pending++;
    const valid=()=>generation===epoch && available();
    const task=async()=>{
      if(!valid())return;
      const clip=options.url || (safeAssetPath(manifest[text])?VR.assetURL('assets/narration/'+manifest[text]):null);
      if(clip){
        try{const ctx=VR.audio.ctx,r=await fetch(clip);if(!r.ok || !ctx)throw new Error('Clip unavailable');
          const b=await ctx.decodeAudioData(await r.arrayBuffer());if(valid() && VR.audio.ctx===ctx)await play(b,ctx);return;
        }catch{if(!valid())return;}
      }
      const synth=window.speechSynthesis,voices=synth?.getVoices() || [];
      if(synth && voices.length){
        try{
          await new Promise((resolve,reject)=>{
            const u=utterance=new SpeechSynthesisUtterance(text);u.rate=.8;u.pitch=.72;u.volume=.95;
            u.voice=voices.find(v=>/Daniel|Arthur|Oliver/i.test(v.name)) || voices.find(v=>/^en/i.test(v.lang)) || voices[0];
            let started=false;const timer=setTimeout(()=>{if(!started){synth.cancel();reject(new Error('Voice did not start'));}},2500);
            u.onstart=()=>{started=true;clearTimeout(timer);};
            u.onend=()=>{clearTimeout(timer);resolve();};u.onerror=()=>{clearTimeout(timer);reject(new Error('Voice failed'));};synth.speak(u);
          });return;
        }catch{if(!valid())return;}
      }
      if(VR.settings.localNarration && N.localReady){
        const words=String(text).split(/\s+/);let part='';const parts=[];
        for(const word of words){if(part.length+word.length>350 && part){parts.push(part);part='';}part+=(part?' ':'')+word;}if(part)parts.push(part);
        for(const chunk of parts){
          const data=await request('speak',chunk);if(!valid())return;const ctx=VR.audio.ctx;if(!ctx)return;
          const b=ctx.createBuffer(1,data.samples.length,data.rate);b.copyToChannel(data.samples,0);await play(b,ctx);
        }
      }else if(!N.warned){N.warned=true;VR.toast('No narration voice is ready. Download the local voice in Comfort and access, or add recorded clips.',10000);}
    };
    chain=chain.then(task).catch(()=>{if(generation===epoch)VR.toast('Narration could not play; captions remain available.');}).finally(()=>{if(generation===epoch)pending=Math.max(0,pending-1);});
  },
};
function request(type,text){return new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{jobs.delete(id);reject(new Error('Local voice timed out'));},type==='prepare'?300000:60000);jobs.set(id,{resolve:data=>{clearTimeout(timer);resolve(data);},reject:error=>{clearTimeout(timer);reject(error);}});worker.postMessage({id,type,text});});}
function play(buffer,ctx){return new Promise(resolve=>{
  const node=source=ctx.createBufferSource(),gain=ctx.createGain();node.buffer=buffer;gain.gain.value=.95;node.connect(gain);gain.connect(ctx.destination);
  node.onended=()=>{node.disconnect();gain.disconnect();if(source===node)source=null;resolve();};node.start();
});}
VR.say=N.say;VR.stopSpeech=N.stop;N.load();
if(VR.settings.localNarration)N.prepareLocal();
