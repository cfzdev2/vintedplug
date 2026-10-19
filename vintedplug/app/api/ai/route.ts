import {env} from "cloudflare:workers";
import {owner,body,apiError,ownItem,ownUpload,reserveAI,saveUpload,HttpError} from "@/lib/server";
import {aiRequestInput,generateAIText,AITextError} from "@/lib/ai-text";
export const dynamic="force-dynamic";
export async function POST(req:Request){try{
 const uid=await owner(),data=aiRequestInput.parse(await body(req)),item=await ownItem(uid,data.itemId),image=data.kind==="image",model=image?env.OPENAI_IMAGE_MODEL:env.OPENAI_TEXT_MODEL;
 if(!env.OPENAI_API_KEY||!model||(image&&env.IMAGE_AI_ENABLED!=="true"))throw new HttpError(503,"Generowanie AI czeka na podłączenie dostawcy. Dane i zdjęcia możesz już zapisywać w panelu.");
 const refund=await reserveAI(uid,image?"image":"text");
 try{
  if(image){
   const file=await ownUpload(uid,data.imageId??item.imageIds[0]??""),object=await env.BUCKET?.get(file.key);if(!object)throw new HttpError(404,"Dodaj zdjęcie do tej rzeczy.");if(!item.imageIds.includes(file.id))throw new HttpError(400,"Wybierz zdjęcie przypisane do tej rzeczy.");
   const raw=new Uint8Array(await object.arrayBuffer());let binary="";for(let i=0;i<raw.length;i+=8192)binary+=String.fromCharCode(...raw.subarray(i,i+8192));
   const style={paper:"a plain warm white studio backdrop",stone:"a light neutral concrete backdrop",linen:"a natural beige linen backdrop"}[data.style??"paper"];
   const prompt=`Edit ONLY the background of this real second-hand garment photo to ${style}. Preserve the exact real garment: color, proportions, seams, logo, text, fabric and every visible stain, defect and sign of wear. Do not retouch or restore the item. Do not invent any missing part. Keep the full item visible.`;
   const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model,images:[{image_url:`data:${file.mime};base64,${btoa(binary)}`}],prompt,n:1,size:"1024x1024",output_format:"webp"}),signal:AbortSignal.timeout(120000)});
   if(!res.ok)throw new HttpError(502,"Dostawca AI nie wykonał edycji. Spróbuj ponownie później.");const out=await res.json() as {data?:{b64_json?:string}[]};const encoded=out.data?.[0]?.b64_json;if(!encoded||encoded.length>22_000_000)throw new HttpError(502,"Nieprawidłowy wynik edycji.");
   return Response.json(await saveUpload(uid,Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),"image/webp"));
  }
  return Response.json(await generateAIText({apiKey:env.OPENAI_API_KEY,model},item,{kind:data.kind==="listing"?"listing":"reply",keywords:data.keywords,question:data.question}),{headers:{"Cache-Control":"no-store"}});
 }catch(e){await refund();if(e instanceof AITextError)throw new HttpError(e.status,e.message);throw e;}
}catch(e){return apiError(e);}}
