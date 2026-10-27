import Stripe from "stripe";
import {BILLING_APP, BillingError, MONTHLY_PRICE, assertCheckoutPrice, validPrice, canStartSubscription, validStripeURL, type BillingMode, type BillingRecord} from "./billing-policy.ts";
import {BillingStore} from "./billing-store.ts";

export type BillingConfig = {key: string; priceId: string; webhookSecret: string; origin: string; mode: BillingMode; portalConfig?: string};
export function billingConfig(env: {STRIPE_SECRET_KEY?:string; STRIPE_PRICE_ID?:string; STRIPE_WEBHOOK_SECRET?:string; STRIPE_MODE?:string; VP_APP_ORIGIN?:string; STRIPE_PORTAL_CONFIGURATION_ID?:string}): BillingConfig|null {
  const mode = env.STRIPE_MODE === "live" ? "live" : "test";
  if (env.STRIPE_MODE && !["test","live"].includes(env.STRIPE_MODE)) return null;
  if (!env.STRIPE_SECRET_KEY || !new RegExp(`^[sr]k_${mode}_`).test(env.STRIPE_SECRET_KEY) || !env.STRIPE_PRICE_ID?.startsWith("price_") || !env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) return null;
  let origin: URL; try { origin = new URL(env.VP_APP_ORIGIN ?? ""); } catch { return null; }
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;
  return {key:env.STRIPE_SECRET_KEY, priceId:env.STRIPE_PRICE_ID, webhookSecret:env.STRIPE_WEBHOOK_SECRET, origin:origin.origin, mode, portalConfig:env.STRIPE_PORTAL_CONFIGURATION_ID || undefined};
}
export function stripeClient(config: BillingConfig) {
  return new Stripe(config.key, {httpClient:Stripe.createFetchHttpClient(), maxNetworkRetries:1, timeout:15_000});
}
export async function verifyStripeEvent(client: Stripe, payload: string, signature: string, secret: string) {
  return client.webhooks.constructEventAsync(payload, signature, secret, 300, Stripe.createSubtleCryptoProvider());
}
function objectId(value: string|{id:string}|null|undefined) { return typeof value === "string" ? value : value?.id ?? null; }

export function subscriptionPatch(sub: Stripe.Subscription|null, row: BillingRecord, config: Pick<BillingConfig,"priceId"|"mode">): Partial<BillingRecord> {
  if (!sub) return {subscription_id:null,status:"inactive",paid_until:0,period_end:0,cancel_at:0,cancel_at_period_end:0,price_id:null};
  const item = sub.items.data[0];
  const planOK = sub.livemode === (config.mode === "live") && sub.items.data.length === 1 && !sub.items.has_more &&
    item?.quantity === 1 && validPrice(item.price, config.priceId, config.mode);
  let paidUntil = sub.id === row.subscription_id ? row.paid_until : 0;
  const invoice = typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
  if (planOK && invoice?.status === "paid" && invoice.currency === "pln" && invoice.amount_paid >= MONTHLY_PRICE && !invoice.lines.has_more) {
    // Endive links a recurring invoice line through parent, not the legacy
    // top-level subscription field. Bind both the subscription and its item.
    const line = invoice.lines.data.find(l => l.parent?.type === "subscription_item_details" &&
      objectId(l.parent.subscription_item_details?.subscription) === sub.id &&
      l.parent.subscription_item_details?.subscription_item === item.id &&
      objectId(l.pricing?.price_details?.price) === config.priceId && l.quantity === 1 && l.amount >= MONTHLY_PRICE);
    if (line && Number.isSafeInteger(line.period.end)) paidUntil = Math.max(paidUntil, Math.min(line.period.end,item.current_period_end));
  }
  const status = !planOK ? "invalid_plan" : sub.pause_collection ? "paused" : sub.status;
  if (!["active","past_due"].includes(status)) paidUntil = 0;
  return {subscription_id:sub.id,status,price_id:item?.price.id ?? null,paid_until:paidUntil,
    period_end:item?.current_period_end ?? 0,cancel_at:sub.cancel_at ?? 0,cancel_at_period_end:sub.cancel_at_period_end ? 1 : 0};
}

// Resolve a webhook via its Stripe Customer ID, which is bound to a signed-in
// user before checkout. Never match users by the email submitted at checkout.
export class BillingService {
  config: BillingConfig; store: BillingStore; stripe: Stripe;
  constructor(config: BillingConfig, store: BillingStore, stripe = stripeClient(config)) { this.config=config; this.store=store; this.stripe=stripe; }
  async latest(row: BillingRecord) {
    if (!row.customer_id) return row;
    const list = await this.stripe.subscriptions.list({customer:row.customer_id,status:"all",limit:100,expand:["data.latest_invoice"]});
    if (list.has_more) throw new BillingError(503,"Nie udało się jednoznacznie sprawdzić abonamentu. Skontaktuj się z obsługą.");
    const owned = list.data.filter(s => s.metadata.vp_app === BILLING_APP && s.metadata.vp_owner === row.owner);
    const open = owned.filter(s => !["canceled","incomplete_expired"].includes(s.status));
    if (open.length > 1) throw new BillingError(409,"Na koncie jest więcej niż jeden abonament. Skontaktuj się z obsługą.");
    const sub = open[0] ?? owned.sort((a,b)=>b.created-a.created)[0] ?? null;
    return this.store.write(row,subscriptionPatch(sub,row,this.config));
  }
  async sync(owner: string, sessionId?: string) {
    let row = await this.store.lock(owner,this.config.mode);
    try {
      if (sessionId) {
        const session = await this.stripe.checkout.sessions.retrieve(sessionId);
        if (session.client_reference_id !== owner || objectId(session.customer) !== row.customer_id || session.mode !== "subscription" || session.livemode !== (this.config.mode === "live"))
          throw new BillingError(404,"Nie znaleziono płatności przypisanej do Twojego konta.");
      }
      row = await this.latest(row); return row;
    } finally { await this.store.release(row); }
  }
  async checkout(owner: string, email: string) {
    let row = await this.store.lock(owner,this.config.mode);
    try {
      row = await this.latest(row);
      if (!canStartSubscription(row)) throw new BillingError(409,"Masz już rozpoczęty abonament. Otwórz zarządzanie abonamentem, aby sprawdzić płatność.");
      assertCheckoutPrice(await this.stripe.prices.retrieve(this.config.priceId),this.config.priceId,this.config.mode);
      if (!row.customer_id) {
        const customer = await this.stripe.customers.create({email,metadata:{vp_app:BILLING_APP,vp_owner:owner}}, {idempotencyKey:`vp-customer:${row.id}`});
        row = await this.store.write(row,{customer_id:customer.id});
      }
      // The same open session is reused across tabs and retries. Persist the
      // attempt before talking to Stripe so a dropped response cannot duplicate it.
      if (row.checkout_id) {
        const prior = await this.stripe.checkout.sessions.retrieve(row.checkout_id);
        if (prior.status === "open" && prior.expires_at > Date.now()/1000 && prior.url) return validStripeURL(prior.url,"checkout");
        if (prior.status === "complete") {
          row = await this.latest(row);
          if (!row.subscription_id || !canStartSubscription(row)) throw new BillingError(409,"Sprawdzamy rozpoczęty abonament. Odśwież jego status.");
        }
        row = await this.store.write(row,{checkout_id:null,checkout_attempt:null});
      }
      const attempt = row.checkout_attempt ?? crypto.randomUUID();
      if (!row.checkout_attempt) row = await this.store.write(row,{checkout_attempt:attempt});
      const session = await this.stripe.checkout.sessions.create({mode:"subscription",customer:row.customer_id!,client_reference_id:owner,
        line_items:[{price:this.config.priceId,quantity:1}],locale:"pl",
        integration_identifier:"vintedplug_monthly_qmzvxrta",
        metadata:{vp_app:BILLING_APP,vp_owner:owner},subscription_data:{metadata:{vp_app:BILLING_APP,vp_owner:owner}},
        success_url:`${this.config.origin}/abonament?billing=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:`${this.config.origin}/abonament?billing=canceled`,
      },{idempotencyKey:`vp-checkout:${row.id}:${attempt}`});
      row = await this.store.write(row,{checkout_id:session.id});
      return validStripeURL(session.url,"checkout");
    } finally { await this.store.release(row); }
  }
  async portal(owner: string) {
    const row = await this.store.get(owner,this.config.mode);
    if (!row?.customer_id) throw new BillingError(404,"Nie masz jeszcze płatności do zarządzania.");
    const session = await this.stripe.billingPortal.sessions.create({customer:row.customer_id,return_url:`${this.config.origin}/abonament`,...(this.config.portalConfig ? {configuration:this.config.portalConfig} : {})});
    return validStripeURL(session.url,"portal");
  }
  async event(event: Stripe.Event) {
    if (event.livemode !== (this.config.mode === "live")) throw new BillingError(400,"Nieprawidłowy tryb zdarzenia Stripe.");
    if (await this.store.seen(event.id,this.config.mode)) return;
    const supported = ["checkout.session.completed","checkout.session.async_payment_succeeded","checkout.session.async_payment_failed","checkout.session.expired","customer.subscription.created","customer.subscription.updated","customer.subscription.deleted","customer.subscription.paused","customer.subscription.resumed","invoice.paid","invoice.payment_failed","invoice.payment_action_required","invoice.voided","invoice.marked_uncollectible"];
    if (supported.includes(event.type)) {
      const object = event.data.object as unknown as {customer?:string|{id:string}|null;payment_status?:string};
      const customerId = objectId(object.customer);
      const row = customerId ? await this.store.byCustomer(customerId,this.config.mode) : null;
      if (row) {
        // An unpaid checkout completion must never itself provision access.
        if (!event.type.startsWith("checkout.session.") || object.payment_status === "paid") await this.sync(row.owner);
      }
    }
    await this.store.remember(event.id,this.config.mode,event.type);
  }
}
