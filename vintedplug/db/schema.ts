import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import type {GuideChapter} from "../lib/earning-guide";
export const accounts=sqliteTable("vp_accounts",{
 id:text("id").primaryKey(),owner:text("owner").notNull(),name:text("name").notNull(),handle:text("handle").notNull().default(""),color:text("color").notNull().default("#087f72"),createdAt:text("created_at").notNull(),
},t=>[index("vp_accounts_owner").on(t.owner)]);
export const items=sqliteTable("vp_items",{
 id:text("id").primaryKey(),owner:text("owner").notNull(),accountId:text("account_id").notNull().references(()=>accounts.id,{onDelete:"cascade"}),
 name:text("name").notNull(),brand:text("brand").notNull().default(""),category:text("category").notNull().default("Inne"),size:text("size").notNull().default(""),condition:text("condition").notNull().default("Bardzo dobry"),
 description:text("description").notNull().default(""),measurements:text("measurements").notNull().default(""),flaws:text("flaws").notNull().default(""),location:text("location").notNull().default(""),
 purchasePrice:integer("purchase_price").notNull().default(0),extraCost:integer("extra_cost").notNull().default(0),listPrice:integer("list_price").notNull().default(0),salePrice:integer("sale_price"),minimumProfit:integer("minimum_profit").notNull().default(0),
 status:text("status").notNull().default("draft"),purchaseDate:text("purchase_date").notNull(),listDate:text("list_date"),saleDate:text("sale_date"),
 imageIds:text("image_ids",{mode:"json"}).$type<string[]>().notNull().default([]),illustration:text("illustration").notNull().default("hoodie"),
 createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull(),revision:integer("revision").notNull().default(1),
},t=>[index("vp_items_owner_account").on(t.owner,t.accountId)]);
export const expenses=sqliteTable("vp_expenses",{
 id:text("id").primaryKey(),owner:text("owner").notNull(),accountId:text("account_id").notNull().references(()=>accounts.id,{onDelete:"cascade"}),label:text("label").notNull(),amount:integer("amount").notNull(),date:text("date").notNull(),category:text("category").notNull().default("Inne"),createdAt:text("created_at").notNull(),
},t=>[index("vp_expenses_owner_account").on(t.owner,t.accountId)]);
export const uploads=sqliteTable("vp_uploads",{
 id:text("id").primaryKey(),owner:text("owner").notNull(),key:text("key").notNull(),mime:text("mime").notNull(),bytes:integer("bytes").notNull(),createdAt:text("created_at").notNull(),originalId:text("original_id"),
},t=>[index("vp_uploads_owner").on(t.owner)]);
export const aiUsage=sqliteTable("vp_ai_usage",{id:text("id").primaryKey(),owner:text("owner").notNull(),day:text("day").notNull(),kind:text("kind").notNull(),count:integer("count").notNull().default(0)});
export const earningGuides=sqliteTable("vp_earning_guides",{
 id:text("id").primaryKey(),owner:text("owner").notNull(),chapters:text("chapters",{mode:"json"}).$type<GuideChapter[]>().notNull(),revision:integer("revision").notNull().default(1),updatedAt:text("updated_at").notNull(),
});
export const billing=sqliteTable("vp_billing",{
 id:text("id").primaryKey(),owner:text("owner").notNull(),mode:text("mode").notNull(),
 customerId:text("customer_id").unique(),subscriptionId:text("subscription_id").unique(),
 status:text("status").notNull().default("inactive"),priceId:text("price_id"),
 paidUntil:integer("paid_until").notNull().default(0),periodEnd:integer("period_end").notNull().default(0),
 cancelAt:integer("cancel_at").notNull().default(0),cancelAtPeriodEnd:integer("cancel_at_period_end").notNull().default(0),
 checkoutId:text("checkout_id"),checkoutAttempt:text("checkout_attempt"),
 leaseToken:text("lease_token"),leaseUntil:integer("lease_until").notNull().default(0),updatedAt:text("updated_at").notNull(),
},t=>[index("vp_billing_owner_mode").on(t.owner,t.mode)]);
export const billingEvents=sqliteTable("vp_billing_events",{
 id:text("id").primaryKey(),type:text("type").notNull(),processedAt:text("processed_at").notNull(),
});
