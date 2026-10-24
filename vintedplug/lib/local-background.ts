import type {LocalBackgroundProgress} from "./local-background-core";

export function localBackgroundSupported(){return typeof Worker!=="undefined"&&typeof OffscreenCanvas!=="undefined"&&typeof WebAssembly!=="undefined";}
let shared:Worker|null=null,active=false,sequence=0;
export async function removeLocalBackground(image:Blob,onProgress:(value:LocalBackgroundProgress)=>void,signal:AbortSignal):Promise<Blob>{
 if(!localBackgroundSupported())throw new Error("Ta przeglądarka nie obsługuje lokalnego usuwania tła. Otwórz panel w aktualnym Chrome, Edge lub Safari.");
 if(active)throw new Error("Poczekaj na zakończenie poprzedniej edycji zdjęcia.");
 active=true;
 async function run(forceCPU=false):Promise<Blob>{
  if(signal.aborted)throw new DOMException("Przerwano","AbortError");
  shared??=new Worker("/local-ai/background.worker.js?v=1",{type:"module"});const current=shared,jobId=++sequence;
  return new Promise((resolve,reject)=>{
   const clean=()=>{current.removeEventListener("message",message);current.removeEventListener("error",failed);signal.removeEventListener("abort",abort);clearTimeout(timeout);};
   const stop=()=>{current.terminate();if(shared===current)shared=null;};
   const abort=()=>{clean();stop();reject(new DOMException("Przerwano","AbortError"));};
   const failed=()=>{clean();stop();reject(new Error("Nie udało się uruchomić modelu w przeglądarce. Odśwież stronę i spróbuj ponownie."));};
   const timeout=setTimeout(()=>{clean();stop();reject(new Error("Przetwarzanie trwało zbyt długo. Spróbuj mniejszym zdjęciem lub na komputerze."));},300_000);
   const message=(event:MessageEvent)=>{const data=event.data;if(data.jobId!==jobId)return;if(data.type==="progress"){onProgress(data.value);return;}if(data.type==="result"){clean();resolve(data.cutout);return;}if(data.type==="error"){
    clean();stop();console.warn("Local background model failed",data.detail??data.code);if(data.code==="GPU_FAILED"&&!forceCPU){onProgress({phase:"prepare",backend:"wasm"});run(true).then(resolve,reject);}else reject(new Error(data.code==="DOWNLOAD_FAILED"?"Nie udało się pobrać modelu AI. Sprawdź połączenie z internetem i spróbuj ponownie.":"Model nie zakończył edycji na tym urządzeniu. Spróbuj na komputerze lub użyj opcjonalnego Photoroom."));
   }};
   current.addEventListener("message",message);current.addEventListener("error",failed);signal.addEventListener("abort",abort,{once:true});current.postMessage({jobId,image,forceCPU});
  });
 }
 try{return await run();}finally{active=false;}
}
export async function composeLocalBackground(cutout:Blob,color:string):Promise<Blob>{
 const image=await createImageBitmap(cutout);try{
  const canvas=document.createElement("canvas");canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext("2d");if(!context)throw new Error("Brak obsługi podglądu zdjęć.");
  context.fillStyle=color;context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Nie udało się przygotować zdjęcia.")),"image/png"));
  if(blob.size>8*1024*1024)throw new Error("Wynik przekracza 8 MB. Zmniejsz zdjęcie w edytorze i spróbuj ponownie.");return blob;
 }finally{image.close();}
}
