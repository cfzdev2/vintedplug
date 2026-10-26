import {env} from "cloudflare:workers";
import {billingUser,billingStatus,billingKeyStore,billingResponseError} from "@/lib/billing-server";
import {assertBillingOwner,saveBillingKey} from "@/lib/billing-keys";
import {billingConfig,stripeClient} from "@/lib/billing-service";
import {assertSameOrigin,assertCheckoutPrice,BillingError} from "@/lib/billing-policy";
export const dynamic="force-dynamic";
export async function POST(req:Request){try{
 const user=await billingUser();assertBillingOwner(user.userId,env.VP_BILLING_OWNER_ID);
 if(!env.VP_APP_ORIGIN)throw new BillingError(503,"Brakuje adresu aplikacji w konfiguracji hostingu.");
 assertSameOrigin(req,new URL(env.VP_APP_ORIGIN).origin);
 if(env.STRIPE_SECRET_KEY)throw new BillingError(409,"Klucz Stripe jest już zarządzany w sekretach hostingu.");
 if(!req.headers.get("content-type")?.includes("application/json"))throw new BillingError(415,"Wymagane dane JSON.");
 if(Number(req.headers.get("content-length")??0)>2000)throw new BillingError(413,"Za dużo danych.");
 const raw=await req.text();if(raw.length>2000)throw new BillingError(413,"Za dużo danych.");
 let data:unknown;try{data=JSON.parse(raw);}catch{throw new BillingError(400,"Nieprawidłowe dane.");}
 if(!data||typeof data!=="object"||!("key" in data)||typeof data.key!=="string")throw new BillingError(400,"Wpisz ograniczony klucz Stripe.");
 const key=data.key.trim(),mode=env.STRIPE_MODE==="live"?"live":"test";
 await saveBillingKey({uid:user.userId,owner:env.VP_BILLING_OWNER_ID,mode,key,master:env.VP_BILLING_KEYRING_SECRET??"",store:billingKeyStore(),validate:async value=>{
  const config=billingConfig({...env,STRIPE_SECRET_KEY:value});if(!config)throw new BillingError(503,"Dokończ konfigurację ceny i webhooka w hostingu.");
  try{assertCheckoutPrice(await stripeClient(config).prices.retrieve(config.priceId),config.priceId,mode);}
  catch(e){if(e instanceof BillingError)throw e;throw new BillingError(400,"Stripe nie potwierdził klucza. Sprawdź konto, tryb testowy/produkcyjny i uprawnienie Prices: Read.");}
 }});
 return Response.json(await billingStatus(user.userId),{headers:{"Cache-Control":"no-store"}});
}catch(e){return billingResponseError(e);}}
