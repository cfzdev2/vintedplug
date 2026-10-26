import {billingUser,billingStatus,billingService,billingResponseError} from "@/lib/billing-server";
import {assertSameOrigin,BillingError} from "@/lib/billing-policy";
export const dynamic="force-dynamic";
export async function POST(req:Request,{params}:{params:Promise<{action:string}>}){try{
 const user=await billingUser(),{action}=await params;
 if(!["checkout","portal","sync"].includes(action))throw new BillingError(404,"Nie znaleziono operacji.");
 const service=await billingService();assertSameOrigin(req,service.config.origin);
 if(!req.headers.get("content-type")?.includes("application/json"))throw new BillingError(415,"Wymagane dane JSON.");
 if(Number(req.headers.get("content-length")??0)>2000)throw new BillingError(413,"Za dużo danych.");
 const text=await req.text();if(text.length>2000)throw new BillingError(413,"Za dużo danych.");
 let data:unknown;try{data=JSON.parse(text);}catch{throw new BillingError(400,"Nieprawidłowe dane.");}
 if(!data||typeof data!=="object"||Array.isArray(data))throw new BillingError(400,"Nieprawidłowe dane.");
 const sessionId=(data as {sessionId?:unknown}).sessionId;
 if(sessionId!==undefined&&(typeof sessionId!=="string"||!/^cs_[a-zA-Z0-9_]{6,240}$/.test(sessionId)))throw new BillingError(400,"Nieprawidłowa płatność.");
 if(action==="sync"){
  await service.sync(user.userId,sessionId as string|undefined);
  return Response.json(await billingStatus(user.userId),{headers:{"Cache-Control":"no-store"}});
 }
 if(action==="checkout"&&(await billingStatus(user.userId)).owner)throw new BillingError(409,"Konto właściciela ma dostęp bez abonamentu.");
 const url=action==="checkout"?await service.checkout(user.userId,user.email):await service.portal(user.userId);
 return Response.json({url},{headers:{"Cache-Control":"no-store"}});
}catch(e){return billingResponseError(e);}}
