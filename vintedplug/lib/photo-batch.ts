export type BatchEvent<T>={sourceId:string;type:"start"}|{sourceId:string;type:"ready";value:T}|{sourceId:string;type:"error";message:string};
export function batchAbort(){return new DOMException("Przerwano","AbortError");}
export async function runPhotoQueue<T>(ids:string[],signal:AbortSignal,process:(id:string)=>Promise<T>,emit:(event:BatchEvent<T>)=>void){
 for(const sourceId of [...new Set(ids)]){
  if(signal.aborted)break;emit({sourceId,type:"start"});
  try{const value=await process(sourceId);if(signal.aborted)break;emit({sourceId,type:"ready",value});}
  catch(error){if(signal.aborted)break;emit({sourceId,type:"error",message:error instanceof Error?error.message:"Nie udało się przygotować zdjęcia."});}
 }
}
export type PhotoReplacement={sourceId:string;id:string};
export function replaceBatchPhotos(ids:string[],replacements:PhotoReplacement[]){
 const sources=new Set(replacements.map(r=>r.sourceId)),targets=new Set(replacements.map(r=>r.id));
 if(sources.size!==replacements.length||targets.size!==replacements.length||replacements.some(r=>!r.sourceId||!r.id))throw new Error("Nieprawidłowe wersje zdjęć.");
 for(const r of replacements){
  if(!ids.includes(r.sourceId)){if(ids.includes(r.id))continue;throw new Error("Zdjęcia rzeczy zostały zmienione. Odśwież dane i sprawdź serię przed zapisem.");}
  if(r.id!==r.sourceId&&ids.includes(r.id))throw new Error("Ta wersja zdjęcia jest już przypisana do innej pozycji.");
 }
 const map=new Map(replacements.map(r=>[r.sourceId,r.id]));return ids.map(id=>map.get(id)??id);
}
export type AcceptedPhoto={sourceId:string;blob:Blob};
// Keep successful uploads across retries; link all accepted versions in one item save.
export async function savePhotoBatch<T extends {id:string;revision:number;imageIds:string[]}>(photos:AcceptedPhoto[],cache:Map<string,string>,readItem:()=>T,access:{signal:AbortSignal;upload:(photo:AcceptedPhoto)=>Promise<string>;save:(item:T)=>Promise<void>;onUpload?:(sourceId:string)=>void}){
 if(!photos.length)throw new Error("Zaakceptuj co najmniej jeden wynik.");
 if(new Set(photos.map(p=>p.sourceId)).size!==photos.length)throw new Error("Powtórzone zdjęcie w serii.");
 const first=readItem();
 for(const p of photos)if(!first.imageIds.includes(p.sourceId)&&!(cache.has(p.sourceId)&&first.imageIds.includes(cache.get(p.sourceId)!)))throw new Error("Zdjęcia rzeczy zostały zmienione. Odśwież dane i sprawdź serię przed zapisem.");
 for(const p of photos){
  if(access.signal.aborted)throw batchAbort();
  if(!cache.has(p.sourceId)){const id=await access.upload(p);if(!id||id===p.sourceId)throw new Error("Nieprawidłowa wersja zdjęcia.");cache.set(p.sourceId,id);}
  access.onUpload?.(p.sourceId);
 }
 if(access.signal.aborted)throw batchAbort();
 const latest=readItem();if(latest.id!==first.id)throw new Error("Wybrano inną rzecz. Rozpocznij nową serię.");
 const replacements=photos.map(p=>({sourceId:p.sourceId,id:cache.get(p.sourceId)!})),imageIds=replaceBatchPhotos(latest.imageIds,replacements);
 if(imageIds.some((id,n)=>id!==latest.imageIds[n]))await access.save({...latest,imageIds});
 return replacements;
}
