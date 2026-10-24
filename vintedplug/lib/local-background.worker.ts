import {LOCAL_MODEL,LOCAL_MODEL_REVISION,applyForegroundMask,fitLocalImage,type LocalBackgroundProgress} from "./local-background-core";
import {env,pipeline,RawImage,type ImageSegmentationPipeline} from "@huggingface/transformers";

type WorkerRequest={jobId:number;image:Blob;forceCPU?:boolean};
const worker=self as unknown as {onmessage:((event:MessageEvent<WorkerRequest>)=>void)|null;postMessage:(message:unknown)=>void};
let segmenter:ImageSegmentationPipeline|null=null,backend:"webgpu"|"wasm"="wasm",running=false;
worker.onmessage=async({data})=>{
 if(running)return;running=true;const {jobId,image,forceCPU}=data;
 const progress=(value:LocalBackgroundProgress)=>worker.postMessage({jobId,type:"progress",value});
 try{
  progress({phase:"loading"});
  env.allowLocalModels=false;env.useBrowserCache=typeof caches!=="undefined";
  if(env.backends.onnx.wasm){env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;}
  if(!segmenter){
   if(!forceCPU){try{const gpu=(navigator as Navigator&{gpu?:{requestAdapter:()=>Promise<{features:{has:(name:string)=>boolean}}|null>}}).gpu;const adapter=await gpu?.requestAdapter();if(adapter?.features.has("shader-f16"))backend="webgpu";}catch{backend="wasm";}}
   segmenter=await pipeline("image-segmentation",LOCAL_MODEL,{revision:LOCAL_MODEL_REVISION,dtype:"fp16",device:backend,progress_callback:(event)=>{
    const value=event as {status:string;progress?:number};if(value.status==="progress")progress({phase:"download",percent:Math.min(100,Math.max(0,value.progress??0)),backend});else if(value.status==="done"||value.status==="ready")progress({phase:"prepare",backend});
   }});
  }
  progress({phase:"processing",backend});
  let source=await RawImage.fromBlob(image);const size=fitLocalImage(source.width,source.height);if(size.width!==source.width||size.height!==source.height)source=await source.resize(size.width,size.height);
  source.rgba();const masks=await segmenter(source.clone()),mask=masks[0]?.mask;
  if(!mask||mask.channels!==1||mask.width!==source.width||mask.height!==source.height)throw new Error("Invalid foreground mask");
  const pixels=applyForegroundMask(source.data,mask.data),cutout=await new RawImage(pixels,source.width,source.height,4).toBlob("image/png");
  if(!(cutout instanceof Blob)||!cutout.size)throw new Error("Empty cutout");
  progress({phase:"ready",backend});worker.postMessage({jobId,type:"result",cutout});
 }catch(error){
  const message=error instanceof Error?error.message:String(error),network=/fetch|network|download|load file|resolve|status|HTTP/i.test(message);
  worker.postMessage({jobId,type:"error",detail:(error instanceof Error?error.stack??message:message).slice(0,1800),code:network?"DOWNLOAD_FAILED":backend==="webgpu"?"GPU_FAILED":"PROCESSING_FAILED"});
 }finally{running=false;}
};
