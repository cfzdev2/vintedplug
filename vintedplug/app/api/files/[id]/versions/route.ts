import {and,eq,desc} from "drizzle-orm";
import {getDb} from "@/db";
import {uploads} from "@/db/schema";
import {owner,ownUpload,apiError} from "@/lib/server";
import {photoOriginal} from "@/lib/photos";
export const dynamic="force-dynamic";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){try{
 const uid=await owner(),{id}=await params,originalId=await photoOriginal(id,key=>ownUpload(uid,key)),original=await ownUpload(uid,originalId);
 const versions=await getDb().select({id:uploads.id,createdAt:uploads.createdAt}).from(uploads).where(and(eq(uploads.owner,uid),eq(uploads.originalId,originalId))).orderBy(desc(uploads.createdAt)).limit(30);
 // The selected version remains available even when more than 30 edits exist.
 if(id!==originalId&&!versions.some(v=>v.id===id)){const current=await ownUpload(uid,id);versions.push({id:current.id,createdAt:current.createdAt});}
 return Response.json({originalId,versions:[{id:original.id,createdAt:original.createdAt},...versions]},{headers:{"Cache-Control":"no-store"}});
}catch(e){return apiError(e);}}
