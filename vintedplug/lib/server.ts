import {env} from "cloudflare:workers";
import {and,eq,desc} from "drizzle-orm";
import {getDb} from "@/db";
import {accounts,items,expenses,uploads,earningGuides} from "@/db/schema";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {ZodError} from "zod";
import {EARNING_GUIDE_ID,canEditEarningGuide} from "./guide-access";
import {normalizeGuideChapters} from "./earning-guide";
import {textAIConfig} from "./ai-text";
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export async function owner(){const u=await getChatGPTUser();if(!u)throw new HttpError(401,"Zaloguj się, aby korzystać z panelu.");return u.userId;}
export function apiError(e:unknown){
 if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status});
 if(e instanceof ZodError)return Response.json({error:e.issues[0]?.message??"Sprawdź wpisane dane."},{status:400});
 console.error("vintedplug request failed",e instanceof Error?e.name:"unknown");
 return Response.json({error:"Nie udało się wykonać operacji. Spróbuj ponownie."},{status:500});
}
export async function body(req:Request,maxLength=30_000){
 if(req.headers.get("sec-fetch-site")==="cross-site")throw new HttpError(403,"Niedozwolone źródło żądania.");
 if(!req.headers.get("content-type")?.includes("application/json"))throw new HttpError(415,"Wymagane dane JSON.");
 if(Number(req.headers.get("content-length")??0)>maxLength)throw new HttpError(413,"Za dużo danych.");
 const raw=await req.text();if(raw.length>maxLength)throw new HttpError(413,"Za dużo danych.");
 try{return JSON.parse(raw);}catch{throw new HttpError(400,"Nieprawidłowe dane.");}
}
export async function ownAccount(uid:string,id:string){const a=await getDb().select().from(accounts).where(and(eq(accounts.owner,uid),eq(accounts.id,id))).get();if(!a)throw new HttpError(404,"Nie znaleziono konta.");return a;}
export async function ownItem(uid:string,id:string){const i=await getDb().select().from(items).where(and(eq(items.owner,uid),eq(items.id,id))).get();if(!i)throw new HttpError(404,"Nie znaleziono rzeczy.");return i;}
export async function ownUpload(uid:string,id:string){const f=await getDb().select().from(uploads).where(and(eq(uploads.owner,uid),eq(uploads.id,id))).get();if(!f)throw new HttpError(404,"Nie znaleziono zdjęcia.");return f;}
export async function guideEditPermission(uid:string,boundOwner:string|undefined){
 if(boundOwner)return canEditEarningGuide(uid,boundOwner,"",undefined);
 const user=await getChatGPTUser();
 return !!user&&user.userId===uid&&canEditEarningGuide(uid,undefined,user.email,env.VP_GUIDE_AUTHOR_EMAIL);
}
export async function snapshot(uid:string){
 const db=getDb();const [a,i,e,g]=await Promise.all([db.select().from(accounts).where(eq(accounts.owner,uid)).orderBy(accounts.createdAt),db.select().from(items).where(eq(items.owner,uid)).orderBy(desc(items.createdAt)),db.select().from(expenses).where(eq(expenses.owner,uid)).orderBy(desc(expenses.date)),db.select().from(earningGuides).where(eq(earningGuides.id,EARNING_GUIDE_ID)).get()]);
 const strip=<T extends {owner:string}>(r:T)=>{const {owner:_,...rest}=r;return rest;};
 return {accounts:a.map(strip),items:i.map(strip),expenses:e.map(strip),earningGuide:g?{chapters:normalizeGuideChapters(g.chapters),revision:g.revision,updatedAt:g.updatedAt}:null,config:{guideEditor:await guideEditPermission(uid,g?.owner),textAI:!!textAIConfig(env),imageAI:!!(env.OPENAI_API_KEY&&env.OPENAI_IMAGE_MODEL&&env.IMAGE_AI_ENABLED==="true")}};
}
export async function saveUpload(uid:string,bytes:ArrayBuffer|Uint8Array,mime:string){
 if(!env.BUCKET)throw new HttpError(503,"Magazyn zdjęć jest chwilowo niedostępny.");
 const id=crypto.randomUUID(),key=`photos/${id}`;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});
 try{await getDb().insert(uploads).values({id,owner:uid,key,mime,bytes:bytes.byteLength,createdAt:new Date().toISOString()});}catch(e){await env.BUCKET.delete(key);throw e;}
 return {id,url:`/api/files/${id}`};
}
export async function reserveAI(uid:string,kind:"text"|"image"){
 if(!env.DB)throw new HttpError(503,"Baza danych jest niedostępna.");
 const day=new Date().toISOString().slice(0,10),id=`${uid}:${day}:${kind}`,limit=kind==="image"?3:20;
 const row=await env.DB.prepare("INSERT INTO vp_ai_usage (id,owner,day,kind,count) VALUES (?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET count=count+1 WHERE count<? RETURNING count").bind(id,uid,day,kind,limit).first();
 if(!row)throw new HttpError(429,`Dzienny limit ${kind==="image"?"3 edycji zdjęć":"20 generacji tekstu"} został wykorzystany.`);
 return async()=>{await env.DB!.prepare("UPDATE vp_ai_usage SET count=MAX(count-1,0) WHERE id=? AND owner=?").bind(id,uid).run();};
}
