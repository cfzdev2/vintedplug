import {env} from "cloudflare:workers";
import {owner,ownUpload,apiError,HttpError} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){try{
 const uid=await owner(),{id}=await params,file=await ownUpload(uid,id),object=await env.BUCKET?.get(file.key);if(!object)throw new HttpError(404,"Nie znaleziono zdjęcia.");
 return new Response(object.body,{headers:{"Content-Type":file.mime,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}catch(e){return apiError(e);}}
