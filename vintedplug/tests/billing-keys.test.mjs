import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {assertBillingOwner,assertRestrictedKey,sealBillingKey,openBillingKey,BillingKeyStore,saveBillingKey} from '../lib/billing-keys.ts';
const master=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const key=(mode='test')=>['rk',mode,crypto.randomUUID().replaceAll('-','')].join('_');
function setup(){const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0004_free_toxin.sql',import.meta.url),'utf8'));return{db,store:new BillingKeyStore({prepare(sql){let args=[];return{bind(...v){args=v;return this;},async first(){return db.prepare(sql).get(...args)??null;},async run(){return db.prepare(sql).run(...args);}};}})};}

test('AES-GCM: zapis jest losowy i zaszyfrowany, a odczyt wymaga właściwego trybu i sekretu hostingu',async()=>{
 const m=master(),k=key(),one=await sealBillingKey(k,m,'test'),two=await sealBillingKey(k,m,'test');assert.notEqual(one,two);assert(!one.includes(k));assert.equal(await openBillingKey(one,m,'test'),k);
 await assert.rejects(()=>openBillingKey(one,master(),'test'),e=>e.status===503);
 await assert.rejects(()=>openBillingKey(one,m,'live'),e=>e.status===503);
 const parts=one.split('.');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);await assert.rejects(()=>openBillingKey(parts.join('.'),m,'test'),e=>e.status===503);
 for(const value of ['bad','v2.a.b','v1.a.b.extra','x'.repeat(2000)])await assert.rejects(()=>openBillingKey(value,m,'test'),e=>e.status===503);
});
test('właściciel, ograniczony typ klucza i tryb są sprawdzane przed kontaktem z dostawcą lub zapisem',async()=>{
 const {store}=setup(),calls=[];const base={uid:'owner',owner:'owner',mode:'test',key:key(),master:master(),store,validate:async()=>calls.push('validate')};
 assert.throws(()=>assertBillingOwner('other','owner'),e=>e.status===403);assert.throws(()=>assertBillingOwner('owner',undefined),e=>e.status===403);
 await assert.rejects(()=>saveBillingKey({...base,uid:'other'}),e=>e.status===403);
 for(const k of [key('live'),['sk','test','fixture1234567890'].join('_'),'publishable',''])await assert.rejects(()=>saveBillingKey({...base,key:k}),e=>e.status===400);
 await assert.rejects(()=>saveBillingKey({...base,master:'bad'}),e=>e.status===503);assert.deepEqual(calls,[]);assert.equal(await store.get('test','owner'),null);
 assert.doesNotThrow(()=>assertRestrictedKey(key('live'),'live'));
});
test('prawdziwy SQLite: klucz zapisuje się po walidacji, nie ma go w bazie wprost i nie jest czytelny przez innego właściciela/tryb',async()=>{
 const {db,store}=setup(),m=master(),k=key();let checked=false;
 await saveBillingKey({uid:'owner',owner:'owner',mode:'test',key:k,master:m,store,validate:async candidate=>{assert.equal(candidate,k);assert.equal(await store.get('test','owner'),null);checked=true;}});
 assert(checked);const record=await store.get('test','owner');assert(!record.ciphertext.includes(k));assert.equal(await openBillingKey(record.ciphertext,m,'test'),k);
 assert.equal(await store.get('test','other'),null);assert.equal(await store.get('live','owner'),null);assert(!JSON.stringify(db.prepare('SELECT * FROM vp_billing_keys').all()).includes(k));
});
test('błędny klucz nie nadpisuje działającego połączenia; ponowny poprawny zapis zastępuje tylko wybrany tryb',async()=>{
 const {store}=setup(),m=master(),first=key(),next=key(),live=key('live');const base={uid:'owner',owner:'owner',mode:'test',master:m,store,validate:async()=>{}};
 await saveBillingKey({...base,key:first});await saveBillingKey({...base,mode:'live',key:live});const before=(await store.get('test','owner')).ciphertext;
 await assert.rejects(()=>saveBillingKey({...base,key:next,validate:async()=>{throw Error('provider rejected');}}));assert.equal((await store.get('test','owner')).ciphertext,before);
 await saveBillingKey({...base,key:next});assert.equal(await openBillingKey((await store.get('test','owner')).ciphertext,m,'test'),next);assert.equal(await openBillingKey((await store.get('live','owner')).ciphertext,m,'live'),live);
});
