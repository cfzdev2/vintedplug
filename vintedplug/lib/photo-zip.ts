import {Zip,ZipPassThrough} from "fflate";
export function photoFileStem(name:string){return name.toLowerCase().replace(/ł/g,"l").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70).replace(/-+$/g,"")||"rzecz";}
export type ZipPhoto={position:number;blob:Blob};
export async function photoZip(name:string,photos:ZipPhoto[],signal?:AbortSignal):Promise<Blob>{
 if(!photos.length||photos.length>12)throw new Error("Wybierz od 1 do 12 zaakceptowanych zdjęć.");
 if(new Set(photos.map(p=>p.position)).size!==photos.length||photos.some(p=>!Number.isInteger(p.position)||p.position<1||p.position>12||p.blob.type!=="image/png"||!p.blob.size||p.blob.size>8*1024*1024))throw new Error("Nieprawidłowe zdjęcia do pobrania.");
 const chunks:BlobPart[]=[];let output:Blob|undefined,failure:Error|undefined;
 const archive=new Zip((error,data,final)=>{if(error){failure=error;return;}chunks.push(new Uint8Array(data).buffer);if(final)output=new Blob(chunks,{type:"application/zip"});});
 try{
  for(const photo of [...photos].sort((a,b)=>a.position-b.position)){
   if(signal?.aborted)throw new DOMException("Przerwano","AbortError");
   const entry=new ZipPassThrough(`${String(photo.position).padStart(2,"0")}-${photoFileStem(name)}.png`);archive.add(entry);
   const reader=photo.blob.stream().getReader();try{while(true){if(signal?.aborted)throw new DOMException("Przerwano","AbortError");const {done,value}=await reader.read();if(done)break;entry.push(value,false);}}finally{reader.releaseLock();}
   entry.push(new Uint8Array(),true);if(failure)throw failure;
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  archive.end();if(failure)throw failure;if(!output)throw new Error("Nie udało się utworzyć ZIP.");return output;
 }catch(error){archive.terminate();throw error;}
}
