import {BillingError, type BillingRecord, type BillingMode} from "./billing-policy.ts";

// All writes for one customer use a short database lease. A delayed Stripe call
// cannot overwrite a later reconciliation after its lease has expired.
export class BillingStore {
  db: D1Database;
  constructor(db: D1Database) { this.db = db; }
  id(owner: string, mode: BillingMode) { return `${mode}:${owner}`; }
  async get(owner: string, mode: BillingMode) {
    return this.db.prepare("SELECT * FROM vp_billing WHERE id=? AND owner=? AND mode=?").bind(this.id(owner, mode), owner, mode).first<BillingRecord>();
  }
  async byCustomer(customer: string, mode: BillingMode) {
    return this.db.prepare("SELECT * FROM vp_billing WHERE customer_id=? AND mode=?").bind(customer, mode).first<BillingRecord>();
  }
  async lock(owner: string, mode: BillingMode) {
    const id = this.id(owner, mode), now = Math.floor(Date.now()/1000), token = crypto.randomUUID();
    await this.db.prepare("INSERT INTO vp_billing (id,owner,mode,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(id, owner, mode, new Date().toISOString()).run();
    const row = await this.db.prepare("UPDATE vp_billing SET lease_token=?,lease_until=? WHERE id=? AND owner=? AND lease_until<=? RETURNING *").bind(token, now+120, id, owner, now).first<BillingRecord>();
    if (!row) throw new BillingError(409, "Trwa aktualizacja abonamentu. Odczekaj chwilę i spróbuj ponownie.");
    return row;
  }
  async write(row: BillingRecord, patch: Partial<BillingRecord>) {
    const allowed = ["customer_id","subscription_id","status","price_id","paid_until","period_end","cancel_at","cancel_at_period_end","checkout_id","checkout_attempt"] as const;
    const keys = allowed.filter(k => Object.hasOwn(patch, k));
    if (!keys.length) return row;
    const result = await this.db.prepare(`UPDATE vp_billing SET ${keys.map(k=>`${k}=?`).join(",")},updated_at=? WHERE id=? AND owner=? AND lease_token=? AND lease_until>? RETURNING *`)
      .bind(...keys.map(k=>patch[k] as string|number|null), new Date().toISOString(), row.id, row.owner, row.lease_token, Math.floor(Date.now()/1000)).first<BillingRecord>();
    if (!result) throw new BillingError(409, "Aktualizacja abonamentu wygasła. Spróbuj ponownie.");
    return result;
  }
  async release(row: BillingRecord) {
    await this.db.prepare("UPDATE vp_billing SET lease_token=NULL,lease_until=0 WHERE id=? AND owner=? AND lease_token=?").bind(row.id,row.owner,row.lease_token).run();
  }
  async seen(id: string, mode: BillingMode) { return !!await this.db.prepare("SELECT id FROM vp_billing_events WHERE id=?").bind(`${mode}:${id}`).first(); }
  async remember(id: string, mode: BillingMode, type: string) {
    await this.db.prepare("INSERT INTO vp_billing_events (id,type,processed_at) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING").bind(`${mode}:${id}`,type,new Date().toISOString()).run();
  }
}
