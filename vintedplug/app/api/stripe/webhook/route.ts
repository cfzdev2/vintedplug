import {billingService,billingResponseError} from "@/lib/billing-server";
import {verifyStripeEvent} from "@/lib/billing-service";
import {BillingError} from "@/lib/billing-policy";
export const dynamic="force-dynamic";
export async function POST(req:Request){try{
 const service=billingService();
 if(Number(req.headers.get("content-length")??0)>512_000)throw new BillingError(413,"Za dużo danych.");
 const payload=await req.text();if(payload.length>512_000)throw new BillingError(413,"Za dużo danych.");
 const signature=req.headers.get("stripe-signature");if(!signature)throw new BillingError(400,"Brak podpisu Stripe.");
 let event;try{event=await verifyStripeEvent(service.stripe,payload,signature,service.config.webhookSecret);}catch{throw new BillingError(400,"Nieprawidłowy podpis Stripe.");}
 await service.event(event);
 return Response.json({received:true},{headers:{"Cache-Control":"no-store"}});
}catch(e){const response=billingResponseError(e);if(response.status===409)return Response.json({error:"Aktualizacja w toku."},{status:503,headers:{"Retry-After":"5","Cache-Control":"no-store"}});return response;}}
