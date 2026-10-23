import {BACKGROUNDS,type BackgroundStyle} from "./backgrounds.ts";

export const MAX_IMAGE_BYTES=8*1024*1024;
export type ImageAIConfig={apiKey:string};
export function imageAIConfig(env:{PHOTOROOM_API_KEY?:string;IMAGE_AI_ENABLED?:string}):ImageAIConfig|null{
 const apiKey=env.PHOTOROOM_API_KEY?.trim();return apiKey&&env.IMAGE_AI_ENABLED==="true"?{apiKey}:null;
}
export class ImageAIError extends Error{status:number;constructor(status:number,message:string){super(message);this.name="ImageAIError";this.status=status;}}
async function readImage(response:Response){
 const length=Number(response.headers.get("content-length")??0);
 if(length>MAX_IMAGE_BYTES){await response.body?.cancel();throw new ImageAIError(502,"Wynik przekracza 8 MB. Spróbuj ze zdjęciem o mniejszej rozdzielczości.");}
 const reader=response.body?.getReader();if(!reader)throw new ImageAIError(502,"Dostawca nie zwrócił zdjęcia.");
 const chunks:Uint8Array[]= [];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_IMAGE_BYTES){await reader.cancel();throw new ImageAIError(502,"Wynik przekracza 8 MB. Spróbuj ze zdjęciem o mniejszej rozdzielczości.");}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 if(bytes.length<33||![137,80,78,71,13,10,26,10].every((byte,n)=>bytes[n]===byte)||String.fromCharCode(...bytes.slice(12,16))!=="IHDR")throw new ImageAIError(502,"Dostawca zwrócił nieprawidłowy plik zdjęcia.");
 const view=new DataView(bytes.buffer),width=view.getUint32(16),height=view.getUint32(20);if(!width||!height||width>6000||height>6000)throw new ImageAIError(502,"Nieprawidłowe wymiary wyniku edycji.");
 return bytes;
}
export async function changeImageBackground(config:ImageAIConfig,input:{bytes:Uint8Array;mime:string;style:BackgroundStyle},fetcher:typeof fetch=fetch,signal:AbortSignal=AbortSignal.timeout(60_000)){
 if(!Object.hasOwn(BACKGROUNDS,input.style))throw new ImageAIError(400,"Wybierz jedno z dostępnych teł.");
 if(input.bytes.length<12||input.bytes.length>MAX_IMAGE_BYTES||!["image/jpeg","image/png","image/webp"].includes(input.mime))throw new ImageAIError(400,"Wybierz zdjęcie JPG, PNG lub WebP do 8 MB.");
 const body=new FormData(),extension=input.mime==="image/jpeg"?"jpg":input.mime==="image/png"?"png":"webp";
 body.append("image_file",new Blob([new Uint8Array(input.bytes).buffer],{type:input.mime}),`source.${extension}`);
 body.append("bg_color",BACKGROUNDS[input.style].color);body.append("format","png");body.append("size","hd");body.append("crop","false");
 try{
  // Exactly one request. No automatic retry or fallback to a billable generator.
  const response=await fetcher("https://sdk.photoroom.com/v1/segment",{method:"POST",headers:{"x-api-key":config.apiKey},body,signal,redirect:"error"});
  if(!response.ok){await response.body?.cancel();if(response.status===401||response.status===403)throw new ImageAIError(503,"Klucz Photoroom wymaga sprawdzenia przez właściciela panelu.");if(response.status===402||response.status===429)throw new ImageAIError(429,"Photoroom nie ma dostępnych kredytów lub osiągnął limit. Sprawdź panel dostawcy.");if(response.status===400||response.status===413||response.status===422)throw new ImageAIError(400,"Photoroom nie przyjął zdjęcia. Spróbuj innym plikiem JPG, PNG lub WebP.");throw new ImageAIError(503,"Photoroom jest chwilowo niedostępny. Spróbuj później.");}
  if(response.headers.get("content-type")?.split(";")[0].trim()!=="image/png"){await response.body?.cancel();throw new ImageAIError(502,"Dostawca nie zwrócił zdjęcia PNG.");}
  return {bytes:await readImage(response),mime:"image/png" as const};
 }catch(error){if(error instanceof ImageAIError)throw error;if(signal.aborted)throw new ImageAIError(504,"Upłynął czas oczekiwania na zdjęcie. Sprawdź zapisane wersje przed ponowieniem.");throw new ImageAIError(503,"Nie udało się połączyć z Photoroom. Spróbuj później.");}
}

// Authorization and quota lifetime are shared by the item-card and legacy Studio API.
export async function processBackground<T extends {id:string;originalId:string|null;mime:string}>(sourceId:string,style:BackgroundStyle,access:{
 own:(id:string)=>Promise<T>;config:()=>ImageAIConfig|null;read:(file:T)=>Promise<Uint8Array>;reserve:()=>Promise<()=>Promise<void>>;save:(bytes:Uint8Array,mime:string,originalId:string)=>Promise<{id:string;url:string}>;
},generate:typeof changeImageBackground=changeImageBackground){
 const source=await access.own(sourceId),originalId=source.originalId?(await access.own(source.originalId)).id:source.id,config=access.config();
 if(!config)throw new ImageAIError(503,"Zmiana tła czeka na podłączenie Photoroom przez właściciela panelu.");
 const bytes=await access.read(source);if(bytes.length>MAX_IMAGE_BYTES)throw new ImageAIError(400,"Zdjęcie może mieć maksymalnie 8 MB.");
 const refund=await access.reserve();try{const output=await generate(config,{bytes,mime:source.mime,style}),saved=await access.save(output.bytes,output.mime,originalId);return {...saved,sourceId,style};}catch(error){await refund();throw error;}
}
