import {env} from "cloudflare:workers";
import {ownUpload,saveUpload,reserveAI,HttpError} from "./server";
import {imageAIConfig,processBackground,ImageAIError} from "./ai-image";
import type {BackgroundStyle} from "./backgrounds";
export async function prepareBackground(uid:string,sourceId:string,style:BackgroundStyle){
 try{return await processBackground(sourceId,style,{
  own:id=>ownUpload(uid,id),config:()=>imageAIConfig(env),
  read:async file=>{if(!env.BUCKET)throw new HttpError(503,"Magazyn zdjęć jest niedostępny.");const object=await env.BUCKET.get(file.key);if(!object)throw new HttpError(404,"Nie znaleziono zdjęcia.");if(object.size>8*1024*1024)throw new HttpError(400,"Zdjęcie może mieć maksymalnie 8 MB.");return new Uint8Array(await object.arrayBuffer());},
  reserve:()=>reserveAI(uid,"image"),save:(bytes,mime,originalId)=>saveUpload(uid,bytes,mime,originalId),
 });}catch(error){if(error instanceof ImageAIError)throw new HttpError(error.status,error.message);throw error;}
}
