import {env} from "cloudflare:workers";
import {owner,ownUpload,apiError,HttpError} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{
 const uid=await owner(),{id}=await params,file=await ownUpload(uid,id),object=await env.BUCKET?.get(file.key);if(!object)throw new HttpError(404,"Nie znaleziono zdjęcia.");
 const headers:Record<string,string>={"Content-Type":file.mime,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
 if(new URL(req.url).searchParams.get("download")==="1"){const extension=file.mime==="image/png"?"png":file.mime==="image/webp"?"webp":"jpg";headers["Content-Disposition"]=`attachment; filename="vintedplug-${file.id.replace(/[^a-zA-Z0-9-]/g,"")}.${extension}"`;}
 return new Response(object.body,{headers});
}catch(e){return apiError(e);}}
