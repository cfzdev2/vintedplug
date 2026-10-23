import {z} from "zod";
import {owner,body,apiError} from "@/lib/server";
import {prepareBackground} from "@/lib/server-image";
export const dynamic="force-dynamic";
const input=z.object({style:z.enum(["paper","stone","linen"])}).strict();
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{
 const uid=await owner(),{id}=await params,sourceId=z.string().min(1).max(80).parse(id),data=input.parse(await body(req,1000));
 return Response.json(await prepareBackground(uid,sourceId,data.style),{headers:{"Cache-Control":"no-store"}});
}catch(error){return apiError(error);}}
