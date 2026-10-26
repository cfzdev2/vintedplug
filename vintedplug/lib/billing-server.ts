import {env} from "cloudflare:workers";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {BillingStore} from "./billing-store";
import {BillingService,billingConfig} from "./billing-service";
import {BillingError,billingView,assertPanelAccess,type BillingMode} from "./billing-policy";

export async function billingUser() {
  const user=await getChatGPTUser();
  if(!user)throw new BillingError(401,"Zaloguj się, aby korzystać z panelu.");
  return user;
}
export function isBillingOwner(uid:string) { return !!env.VP_BILLING_OWNER_ID && uid===env.VP_BILLING_OWNER_ID; }
export function billingStore() {
  if(!env.DB)throw new BillingError(503,"Baza abonamentów jest chwilowo niedostępna.");
  return new BillingStore(env.DB);
}
export function billingService() {
  const config=billingConfig(env);
  if(!config)throw new BillingError(503,"Płatności czekają na konfigurację Stripe przez właściciela vintedplug.");
  return new BillingService(config,billingStore());
}
export async function billingStatus(uid:string) {
  const config=billingConfig(env),mode:BillingMode=env.STRIPE_MODE==="live"?"live":"test",owner=isBillingOwner(uid);
  const row=owner?null:await billingStore().get(uid,mode);
  return billingView(row,owner,!!config,mode);
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
