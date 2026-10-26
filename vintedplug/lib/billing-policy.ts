export const MONTHLY_PRICE = 2990;
export const BILLING_APP = "vintedplug";
export type BillingMode = "test" | "live";
export class BillingError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.name = "BillingError"; this.status = status; }
}
export type BillingRecord = {
  id: string; owner: string; mode: string; customer_id: string | null;
  subscription_id: string | null; status: string; price_id: string | null;
  paid_until: number; period_end: number; cancel_at: number; cancel_at_period_end: number;
  checkout_id: string | null; checkout_attempt: string | null;
  lease_token: string | null; lease_until: number; updated_at: string;
};
export type BillingView = {
  owner: boolean; access: boolean; configured: boolean; mode: BillingMode;
  status: string; paidUntil: number; cancelAt: number; cancelAtPeriodEnd: boolean;
  hasCustomer: boolean; hasSubscription: boolean; canCheckout: boolean;
  price: number; currency: "PLN"; interval: "month";
};
export function subscriptionAccess(row: BillingRecord | null, now = Date.now() / 1000) {
  return !!row && ["active", "past_due"].includes(row.status) && row.paid_until > now;
}
export function canStartSubscription(row: BillingRecord | null) {
  return !row?.subscription_id || ["canceled", "incomplete_expired"].includes(row.status);
}
export function billingView(row: BillingRecord | null, owner: boolean, configured: boolean, mode: BillingMode): BillingView {
  return { owner, access: owner || subscriptionAccess(row), configured, mode,
    status: owner ? "owner" : row?.status ?? "inactive", paidUntil: row?.paid_until ?? 0,
    cancelAt: row?.cancel_at ?? 0, cancelAtPeriodEnd: !!row?.cancel_at_period_end,
    hasCustomer: !!row?.customer_id, hasSubscription: !!row?.subscription_id,
    canCheckout: !owner && configured && canStartSubscription(row),
    price: MONTHLY_PRICE, currency: "PLN", interval: "month" };
}
export function assertPanelAccess(view: BillingView) {
  if (!view.access) throw new BillingError(402, "Twój abonament nie jest aktywny. Otwórz zakładkę Abonament, aby uzyskać dostęp.");
}
type PriceLike = { id: string; unit_amount: number | null; currency: string; type: string; active: boolean; livemode: boolean; tax_behavior?: string | null; recurring: { interval: string; interval_count: number; usage_type?: string } | null };
export function validPrice(price: PriceLike, priceId: string, mode: BillingMode) {
  return price.id === priceId && price.unit_amount === MONTHLY_PRICE && price.currency === "pln" &&
    price.type === "recurring" && price.livemode === (mode === "live") &&
    price.recurring?.interval === "month" && price.recurring.interval_count === 1 &&
    (!price.recurring.usage_type || price.recurring.usage_type === "licensed");
}
export function assertCheckoutPrice(price: PriceLike, priceId: string, mode: BillingMode) {
  if (!price.active || !validPrice(price, priceId, mode) || price.tax_behavior === "exclusive")
    throw new BillingError(503, "Cena abonamentu w Stripe musi wynosić 29,90 zł miesięcznie, bez podatku doliczanego do tej kwoty.");
}
export function assertSameOrigin(req: Request, origin: string) {
  if (req.headers.get("origin") !== origin || req.headers.get("sec-fetch-site") === "cross-site")
    throw new BillingError(403, "Niedozwolone źródło żądania.");
}
export function validStripeURL(value: string | null | undefined, kind: "checkout" | "portal") {
  if (!value) throw new BillingError(502, "Stripe nie zwrócił adresu płatności. Spróbuj ponownie.");
  const u = new URL(value);
  if (u.protocol !== "https:" || u.hostname !== (kind === "checkout" ? "checkout.stripe.com" : "billing.stripe.com") || u.username || u.password)
    throw new BillingError(502, "Nieprawidłowy adres płatności.");
  return value;
}
