import {removeLocalBackground,composeLocalBackground} from "./local-background";
import type {PhotoBackgroundStyle} from "./backgrounds";
import type {LocalBackgroundProgress} from "./local-background-core";
import type {AcceptedPhoto} from "./photo-batch";
export async function prepareBatchPhoto(sourceId:string,style:PhotoBackgroundStyle,signal:AbortSignal,onProgress:(value:LocalBackgroundProgress)=>void){
 const response=await fetch(`/api/files/${encodeURIComponent(sourceId)}`,{signal:AbortSignal.any([signal,AbortSignal.timeout(45_000)])});
 if(!response.ok)throw new Error(response.status===401?"Zaloguj się ponownie, aby wczytać zdjęcie.":"Nie udało się wczytać zdjęcia. Możesz ponowić tę pozycję.");
 if(Number(response.headers.get("content-length")??0)>8*1024*1024)throw new Error("Zdjęcie przekracza 8 MB.");
 const image=await response.blob();if(image.size>8*1024*1024)throw new Error("Zdjęcie przekracza 8 MB.");
 const cutout=await removeLocalBackground(image,onProgress,signal);if(signal.aborted)throw new DOMException("Przerwano","AbortError");
 const result=await composeLocalBackground(cutout,style);if(signal.aborted)throw new DOMException("Przerwano","AbortError");return result;
}
export async function uploadBatchPhoto(photo:AcceptedPhoto,signal:AbortSignal){
 const form=new FormData();form.append("file",photo.blob,"vintedplug-seria.png");form.append("sourceId",photo.sourceId);
 const response=await fetch("/api/files",{method:"POST",body:form,signal:AbortSignal.any([signal,AbortSignal.timeout(60_000)])}),data=await response.json().catch(()=>({error:response.status===413?"Zdjęcie przekracza limit wysyłania.":"Nie udało się zapisać zdjęcia. Spróbuj ponownie."})) as {id?:string;url?:string;error?:string};
 if(!response.ok||!data.id||data.url!==`/api/files/${data.id}`)throw new Error(data.error??"Nie udało się zapisać zdjęcia. Spróbuj ponownie.");return data.id;
}
