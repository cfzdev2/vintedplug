import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import Stripe from 'stripe';
import {BillingStore} from '../lib/billing-store.ts';
import {BillingService,billingConfig,subscriptionPatch,verifyStripeEvent} from '../lib/billing-service.ts';
import {subscriptionAccess,billingView,assertCheckoutPrice,assertSameOrigin,assertPanelAccess,validStripeURL} from '../lib/billing-policy.ts';

const now=()=>Math.floor(Date.now()/1000);
const config={key:['rk','test','fixture'].join('_'),priceId:'price_monthly',webhookSecret:'whsec_fixture',origin:'https://vintedplug.test',mode:'test'};
const price={id:config.priceId,unit_amount:2990,currency:'pln',type:'recurring',active:true,livemode:false,tax_behavior:'inclusive',recurring:{interval:'month',interval_count:1,usage_type:'licensed'}};
function setup(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(readFileSync(new URL('../drizzle/0003_military_grandmaster.sql',import.meta.url),'utf8'));
 const db={prepare(sql){let args=[];return{bind(...a){args=a;return this;},async first(){return sqlite.prepare(sql).get(...args)??null;},async run(){return sqlite.prepare(sql).run(...args);}};}};
 return {sqlite,store:new BillingStore(db)};
}
function subscription(owner='alice',overrides={}){
 const end=now()+86400;
 return {id:'sub_alice',customer:'cus_alice',created:now(),status:'active',livemode:false,pause_collection:null,cancel_at:null,cancel_at_period_end:false,metadata:{vp_app:'vintedplug',vp_owner:owner},items:{data:[{id:'si_alice',quantity:1,price:{...price},current_period_end:end}],has_more:false},latest_invoice:{id:'in_alice',status:'paid',currency:'pln',amount_paid:2990,lines:{has_more:false,data:[{parent:{type:'subscription_item_details',subscription_item_details:{subscription:'sub_alice',subscription_item:'si_alice'}},quantity:1,amount:2990,pricing:{price_details:{price:config.priceId}},period:{end}}]}},...overrides};
}
async function bound(store,owner='alice',customer='cus_alice'){
 const row=await store.lock(owner,'test');const updated=await store.write(row,{customer_id:customer});await store.release(updated);return updated;
}
function fixture(store){
 const calls={customers:0,sessions:0,lists:0};let subs=[],session={id:'cs_test_alice',status:'open',expires_at:now()+3600,url:'https://checkout.stripe.com/c/pay/fixture',mode:'subscription',livemode:false,client_reference_id:'alice',customer:'cus_alice'};
 const stripe={prices:{retrieve:async()=>price},customers:{create:async()=>{calls.customers++;return{id:'cus_alice'};}},subscriptions:{list:async()=>{calls.lists++;return{data:subs,has_more:false};}},checkout:{sessions:{retrieve:async()=>session,create:async(params,options)=>{calls.sessions++;calls.params=params;calls.options=options;return session;}}},billingPortal:{sessions:{create:async params=>{calls.portal=params;return{url:'https://billing.stripe.com/p/session/fixture'};}}}};
 return{service:new BillingService(config,store,stripe),calls,setSubs:v=>subs=v,setSession:v=>session={...session,...v}};
}

test('abonament kosztuje dokładnie 2990 groszy miesięcznie; odrzuca inny plan, walutę, ilość i tryb',()=>{
 assert.doesNotThrow(()=>assertCheckoutPrice(price,config.priceId,'test'));
 for(const p of [{unit_amount:299},{currency:'eur'},{recurring:{interval:'year',interval_count:1}},{livemode:true},{active:false},{tax_behavior:'exclusive'},{id:'price_other'}])assert.throws(()=>assertCheckoutPrice({...price,...p},config.priceId,'test'));
 assert.equal(billingConfig({...config,STRIPE_MODE:'test'}),null);
 assert(billingConfig({STRIPE_MODE:'test',STRIPE_SECRET_KEY:config.key,STRIPE_PRICE_ID:config.priceId,STRIPE_WEBHOOK_SECRET:config.webhookSecret,VP_APP_ORIGIN:config.origin}));
 assert.equal(billingConfig({STRIPE_MODE:'live',STRIPE_SECRET_KEY:config.key,STRIPE_PRICE_ID:config.priceId,STRIPE_WEBHOOK_SECRET:config.webhookSecret,VP_APP_ORIGIN:config.origin}),null);
});
test('dostęp wynika z opłaconego okresu; rezygnacja nie skraca go, a brak odnowienia nie wydłuża',async()=>{
 const {store}=setup();const row=await bound(store);const paid=subscriptionPatch(subscription(),row,config);
 assert(subscriptionAccess({...row,...paid}));
 const canceledLater=subscriptionPatch(subscription('alice',{cancel_at_period_end:true}),{...row,...paid},config);assert(subscriptionAccess({...row,...canceledLater}));
 const nextFailed=subscription('alice',{status:'past_due',latest_invoice:{status:'open'}});const failed=subscriptionPatch(nextFailed,{...row,...paid},config);assert.equal(failed.paid_until,paid.paid_until);
 assert(!subscriptionAccess({...row,...failed},paid.paid_until+1));
 const zero=subscription('alice');zero.latest_invoice.amount_paid=0;assert.equal(subscriptionPatch(zero,row,config).paid_until,0);
 const changed=subscription();changed.items.data[0].price.unit_amount=100;assert.equal(subscriptionPatch(changed,{...row,...paid},config).paid_until,0);
 const canceled=subscriptionPatch(subscription('alice',{status:'canceled'}),{...row,...paid},config);assert(!subscriptionAccess({...row,...canceled}));
 for(const status of ['trialing','incomplete','unpaid','paused','incomplete_expired'])assert(!subscriptionAccess({...row,...paid,status}));
});
test('Endive: opłacona pozycja musi należeć do właściwej subskrypcji i jej elementu',async()=>{
 const {store}=setup();const row=await bound(store);
 const s=subscription();const line=s.latest_invoice.lines.data[0];
 assert(!('subscription' in line));
 assert(subscriptionAccess({...row,...subscriptionPatch(s,row,config)}));
 for(const mutate of [
  l=>{l.parent.subscription_item_details.subscription='sub_other';},
  l=>{l.parent.subscription_item_details.subscription_item='si_other';},
  l=>{l.parent.type='invoice_item_details';},
  l=>{l.subscription='sub_alice';delete l.parent;},
  l=>{l.pricing.price_details.price='price_other';},
 ]){
  const invalid=structuredClone(s);mutate(invalid.latest_invoice.lines.data[0]);
  assert.equal(subscriptionPatch(invalid,row,config).paid_until,0);
 }
});
test('SQLite: właściciele oraz tryby test/live mają osobne rekordy; lease chroni przed równoległym i spóźnionym zapisem',async()=>{
 const {store,sqlite}=setup();const a=await store.lock('alice','test');await assert.rejects(()=>store.lock('alice','test'),e=>e.status===409);
 const b=await store.lock('bob','test');assert.notEqual(a.id,b.id);await store.release(b);
 assert.equal(await store.byCustomer('cus_alice','test'),null);
 await store.write(a,{customer_id:'cus_alice'});assert.equal((await store.byCustomer('cus_alice','test')).owner,'alice');assert.equal(await store.byCustomer('cus_alice','live'),null);
 sqlite.prepare('UPDATE vp_billing SET lease_until=0 WHERE id=?').run(a.id);const newer=await store.lock('alice','test');await assert.rejects(()=>store.write(a,{status:'active'}),e=>e.status===409);
 await store.release(a);assert.equal((await store.get('alice','test')).lease_token,newer.lease_token);await store.release(newer);
});
test('checkout wiąże użytkownika przed płatnością, ponowne kliknięcia używają tej samej sesji i nigdy ceny z przeglądarki',async()=>{
 const {store}=setup(),f=fixture(store);
 assert.equal(await f.service.checkout('alice','alice@example.test'),'https://checkout.stripe.com/c/pay/fixture');
 await f.service.checkout('alice','changed@example.test');assert.equal(f.calls.customers,1);assert.equal(f.calls.sessions,1);
 assert.equal((await store.get('alice','test')).customer_id,'cus_alice');assert.deepEqual(f.calls.params.line_items,[{price:config.priceId,quantity:1}]);assert.equal(f.calls.params.client_reference_id,'alice');assert(!('payment_method_types' in f.calls.params));assert(f.calls.params.integration_identifier);assert(f.calls.options.idempotencyKey);
 f.setSubs([subscription()]);await assert.rejects(()=>f.service.checkout('alice','a@example.test'),e=>e.status===409);assert.equal(f.calls.sessions,1);
});
test('utracona odpowiedź checkout ponawia ten sam klucz idempotencji; zakończona płatność nie tworzy drugiej',async()=>{
 const {store}=setup(),f=fixture(store),create=f.service.stripe.checkout.sessions.create;const keys=[];let fail=true;
 f.service.stripe.checkout.sessions.create=async(params,options)=>{keys.push(options.idempotencyKey);if(fail){fail=false;throw Error('network');}return create(params,options);};
 await assert.rejects(()=>f.service.checkout('alice','a@example.test'));await f.service.checkout('alice','a@example.test');assert.equal(keys[0],keys[1]);
 f.setSession({status:'complete'});await assert.rejects(()=>f.service.checkout('alice','a@example.test'),e=>e.status===409);assert.equal(keys.length,2);
});
test('powrót z innego checkout i próba wejścia do portalu innego użytkownika są odrzucane',async()=>{
 const {store}=setup();await bound(store);const f=fixture(store);f.setSubs([subscription()]);f.setSession({client_reference_id:'bob'});
 await assert.rejects(()=>f.service.sync('alice','cs_test_bob'),e=>e.status===404);assert.equal((await store.get('alice','test')).paid_until,0);
 await assert.rejects(()=>f.service.portal('bob'),e=>e.status===404);await f.service.portal('alice');assert.equal(f.calls.portal.customer,'cus_alice');
 assert.equal(billingView(await store.get('alice','test'),false,true,'test').access,false);assert.equal(billingView(null,true,false,'test').access,true);
});
test('webhook obsługuje aktywację, duplikaty, odnowienie, błędy i spóźnione anulowanie przez odczyt aktualnego Stripe',async()=>{
 const {store}=setup();await bound(store);const f=fixture(store);f.setSubs([subscription()]);
 const event=(id,type,extra={})=>({id,type,livemode:false,data:{object:{customer:'cus_alice',...extra}}});
 await f.service.event(event('evt_unpaid','checkout.session.completed',{payment_status:'unpaid'}));assert.equal(f.calls.lists,0);assert(!subscriptionAccess(await store.get('alice','test')));
 await f.service.event(event('evt_paid','invoice.paid'));assert(subscriptionAccess(await store.get('alice','test')));const lists=f.calls.lists;
 await f.service.event(event('evt_paid','invoice.paid'));assert.equal(f.calls.lists,lists);
 const renewed=subscription();renewed.items.data[0].current_period_end+=86400;renewed.latest_invoice.lines.data[0].period.end+=86400;f.setSubs([renewed]);await f.service.event(event('evt_renew','invoice.paid'));assert.equal((await store.get('alice','test')).paid_until,renewed.items.data[0].current_period_end);
 f.setSubs([subscription('alice',{status:'past_due',latest_invoice:{status:'open'}})]);await f.service.event(event('evt_fail','invoice.payment_failed'));assert.equal((await store.get('alice','test')).status,'past_due');
 f.setSubs([renewed]);await f.service.event(event('evt_old_deleted','customer.subscription.deleted'));assert.equal((await store.get('alice','test')).status,'active');
 f.setSubs([subscription('alice',{status:'canceled'})]);await f.service.event(event('evt_canceled','customer.subscription.deleted'));assert(!subscriptionAccess(await store.get('alice','test')));
 await assert.rejects(()=>f.service.event({...event('evt_live','invoice.paid'),livemode:true}),e=>e.status===400);
});
test('nieznany customer, cudza subskrypcja i zmieniony plan nie nadają dostępu; ponowienie po awarii nie gubi webhooka',async()=>{
 const {store}=setup();await bound(store);const f=fixture(store);const event={id:'evt_retry',type:'invoice.paid',livemode:false,data:{object:{customer:'cus_alice'}}};
 f.setSubs([subscription('bob')]);await f.service.event({...event,id:'evt_other_owner'});assert(!subscriptionAccess(await store.get('alice','test')));
 const invalid=subscription();invalid.items.data[0].quantity=2;f.setSubs([invalid]);await f.service.event({...event,id:'evt_invalid'});assert.equal((await store.get('alice','test')).status,'invalid_plan');
 const list=f.service.stripe.subscriptions.list;f.service.stripe.subscriptions.list=async()=>{throw Error('provider timeout');};await assert.rejects(()=>f.service.event(event));assert.equal(await store.seen(event.id,'test'),false);
 f.service.stripe.subscriptions.list=list;f.setSubs([subscription()]);await f.service.event(event);assert(subscriptionAccess(await store.get('alice','test')));
});
test('podpis Stripe jest weryfikowany na surowym body; odrzuca zmianę payloadu i stary podpis',async()=>{
 const client=new Stripe(config.key);const secret='whsec_'+crypto.randomUUID(),payload=JSON.stringify({id:'evt_fixture',type:'invoice.paid',data:{object:{}},livemode:false});
 const signature=client.webhooks.generateTestHeaderString({payload,secret});assert.equal((await verifyStripeEvent(client,payload,signature,secret)).id,'evt_fixture');
 await assert.rejects(()=>verifyStripeEvent(client,payload+' ',signature,secret));const old=client.webhooks.generateTestHeaderString({payload,secret,timestamp:now()-600});await assert.rejects(()=>verifyStripeEvent(client,payload,old,secret));
});
test('CSRF i przekierowania: odrzuca obcą domenę, brak Origin oraz adres podszywający się pod Stripe',()=>{
 assert.doesNotThrow(()=>assertSameOrigin(new Request(config.origin,{headers:{Origin:config.origin}}),config.origin));
 for(const headers of [{},{Origin:'https://attacker.test'},{Origin:config.origin,'sec-fetch-site':'cross-site'}])assert.throws(()=>assertSameOrigin(new Request(config.origin,{headers}),config.origin));
 assert.equal(validStripeURL('https://checkout.stripe.com/c/pay/test','checkout'),'https://checkout.stripe.com/c/pay/test');
 for(const url of ['https://checkout.stripe.com.attacker.test/x','http://checkout.stripe.com/x','https://attacker.test/x','javascript:alert(1)'])assert.throws(()=>validStripeURL(url,'checkout'));
});

test('serwer blokuje panel kodem 402 bez płatności; brak konfiguracji nie daje darmowego dostępu',()=>{
 for(const configured of [true,false])assert.throws(()=>assertPanelAccess(billingView(null,false,configured,'test')),e=>e.status===402);
 assert.doesNotThrow(()=>assertPanelAccess(billingView(null,true,false,'test')));
});
