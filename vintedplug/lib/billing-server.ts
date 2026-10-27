import {env} from "cloudflare:workers";
import {getCurrentUser} from "./identity";
import {BillingStore} from "./billing-store";
import {BillingService,billingConfig} from "./billing-service";
import {BillingError,billingView,assertPanelAccess,type BillingMode} from "./billing-policy";
import {BillingKeyStore,openBillingKey} from "./billing-keys";

export async function billingUser() {
  const user=await getCurrentUser();
  if(!user)throw new BillingError(401,"Zaloguj się, aby korzystać z panelu.");
  return user;
}
export function isBillingOwner(uid:string) { return !!env.VP_BILLING_OWNER_ID && uid===env.VP_BILLING_OWNER_ID; }
export function billingStore() {
  if(!env.DB)throw new BillingError(503,"Baza abonamentów jest chwilowo niedostępna.");
  return new BillingStore(env.DB);
}
export function billingKeyStore(){
  if(!env.DB)throw new BillingError(503,"Bezpieczny magazyn kluczy jest chwilowo niedostępny.");
  return new BillingKeyStore(env.DB);
}
export async function currentBillingConfig(){
  let key=env.STRIPE_SECRET_KEY;
  if(!key&&env.VP_BILLING_OWNER_ID&&env.VP_BILLING_KEYRING_SECRET){
    const mode=env.STRIPE_MODE==="live"?"live":"test",stored=await billingKeyStore().get(mode,env.VP_BILLING_OWNER_ID);
    if(stored)key=await openBillingKey(stored.ciphertext,env.VP_BILLING_KEYRING_SECRET,mode);
  }
  return billingConfig({...env,STRIPE_SECRET_KEY:key});
}
export async function billingService() {
  const config=await currentBillingConfig();
  if(!config)throw new BillingError(503,"Płatności czekają na konfigurację Stripe przez właściciela vintedplug.");
  return new BillingService(config,billingStore());
}
export async function billingStatus(uid:string) {
  const mode:BillingMode=env.STRIPE_MODE==="live"?"live":"test",owner=isBillingOwner(uid);
  let config;try{config=await currentBillingConfig();}catch(e){if(!owner)throw e;config=null;}
  const row=owner?null:await billingStore().get(uid,mode);
  const view=billingView(row,owner,!!config,mode);
  if(owner)view.keySetup={ready:!!env.VP_BILLING_KEYRING_SECRET&&!!env.STRIPE_PRICE_ID&&!!env.STRIPE_WEBHOOK_SECRET&&!!env.VP_APP_ORIGIN,hasKey:!!config,managedExternally:!!env.STRIPE_SECRET_KEY};
  return view;
}
export async function paidUserId() {
  const user=await billingUser();
  assertPanelAccess(await billingStatus(user.userId));
  return user.userId;
}
export function billingResponseError(error:unknown) {
  const status=error instanceof BillingError?error.status:502;
  // Stripe errors can contain request IDs, customer fields or external bodies.
  // Return only our messages; never serialize provider errors or configuration.
  if(!(error instanceof BillingError))console.error("vintedplug billing failed",error instanceof Error?error.name:"unknown");
  return Response.json({error:error instanceof BillingError?error.message:"Nie udało się połączyć ze Stripe. Spróbuj ponownie."},{status,headers:{"Cache-Control":"no-store",...(status===409?{"Retry-After":"5"}:{})}});
}
