import {env} from "cloudflare:workers";
import {owner,body,apiError,ownItem,ownAccount,reserveAI,HttpError} from "@/lib/server";
import {aiRequestInput,generateAIText,AITextError,textAIConfig} from "@/lib/ai-text";
import {resolveAIContext} from "@/lib/ai-context";
import {prepareBackground} from "@/lib/server-image";
export const dynamic="force-dynamic";
export async function POST(req:Request){try{
 const uid=await owner(),data=aiRequestInput.parse(await body(req)),context=await resolveAIContext(data,{ownAccount:id=>ownAccount(uid,id),ownItem:id=>ownItem(uid,id)});
 if(data.kind==="image"){
  const item=context.item!,sourceId=data.imageId??item.imageIds[0]??"";
  if(!sourceId||!item.imageIds.includes(sourceId))throw new HttpError(400,"Wybierz zdjęcie przypisane do tej rzeczy.");
  return Response.json(await prepareBackground(uid,sourceId,data.style??"paper"),{headers:{"Cache-Control":"no-store"}});
 }
 const config=textAIConfig(env);if(!config)throw new HttpError(503,"Generowanie tekstów czeka na podłączenie klucza Gemini przez właściciela panelu.");
 const refund=await reserveAI(uid,"text");try{
  return Response.json(await generateAIText(config,context.facts,{kind:data.kind==="listing"?"listing":"reply",keywords:data.keywords,question:data.question,listingStyle:data.listingStyle}),{headers:{"Cache-Control":"no-store"}});
 }catch(e){await refund();if(e instanceof AITextError)throw new HttpError(e.status,e.message);throw e;}
}catch(e){return apiError(e);}}
