import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';
env.backends.onnx.wasm.numThreads=1;
env.allowLocalModels=false;
let model, work=Promise.resolve();
self.onmessage=({data})=>{
  work=work.then(async()=>{
    try {
      model ||= await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'wasm'});
      if(data.type==='prepare') {self.postMessage({id:data.id,ready:true});return;}
      const result=await model.generate(data.text,{voice:'bm_george',speed:.9});
      self.postMessage({id:data.id,samples:result.audio,rate:result.sampling_rate},[result.audio.buffer]);
    } catch(error) {self.postMessage({id:data.id,error:error.message});}
  });
};
