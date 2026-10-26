import {BillingError,type BillingMode} from "./billing-policy.ts";

export function assertBillingOwner(uid:string,owner:string|undefined) {
  if(!owner||uid!==owner)throw new BillingError(403,"Tylko właściciel vintedplug może zmienić połączenie Stripe.");
}
export function assertRestrictedKey(key:string,mode:BillingMode) {
  if(!new RegExp(`^rk_${mode}_[A-Za-z0-9_]{10,400}$`).test(key))
    throw new BillingError(400,`Dodaj ograniczony klucz ${mode==="test"?"testowy rk_test_":"produkcyjny rk_live_"} z właściwego konta Stripe.`);
}
function encode(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");}
function decode(value:string){
  if(!/^[A-Za-z0-9_-]+$/.test(value))throw new Error("Invalid ciphertext");
  return Uint8Array.from(atob(value.replaceAll("-","+").replaceAll("_","/")),c=>c.charCodeAt(0));
}
async function wrappingKey(master:string){
  if(!/^[0-9a-f]{64}$/.test(master))throw new BillingError(503,"Bezpieczny zapis klucza wymaga konfiguracji właściciela hostingu.");
  const raw=Uint8Array.from(master.match(/../g)!,s=>parseInt(s,16));
  return crypto.subtle.importKey("raw",raw,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
function context(mode:BillingMode){return new TextEncoder().encode(`vintedplug:stripe-key:v1:${mode}`);}
export async function sealBillingKey(value:string,master:string,mode:BillingMode){
  assertRestrictedKey(value,mode);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:context(mode)},await wrappingKey(master),new TextEncoder().encode(value));
  return `v1.${encode(iv)}.${encode(new Uint8Array(encrypted))}`;
}
export async function openBillingKey(value:string,master:string,mode:BillingMode){
  try{
    if(value.length>1500)throw new Error("Invalid ciphertext");
    const [version,nonce,cipher,...rest]=value.split(".");if(version!=="v1"||!nonce||!cipher||rest.length)throw new Error("Invalid ciphertext");
    const iv=decode(nonce);if(iv.length!==12)throw new Error("Invalid nonce");
    const decrypted=await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:context(mode)},await wrappingKey(master),decode(cipher));
    const key=new TextDecoder().decode(decrypted);assertRestrictedKey(key,mode);return key;
  }catch{throw new BillingError(503,"Nie można odczytać połączenia Stripe. Właściciel może ponownie zapisać klucz w ustawieniach.");}
}
export class BillingKeyStore {
  db:D1Database;
  constructor(db:D1Database){this.db=db;}
  async get(mode:BillingMode,owner:string){
    return this.db.prepare("SELECT ciphertext FROM vp_billing_keys WHERE mode=? AND owner=?").bind(mode,owner).first<{ciphertext:string}>();
  }
  async save(mode:BillingMode,owner:string,ciphertext:string){
    await this.db.prepare("INSERT INTO vp_billing_keys (mode,owner,ciphertext,updated_at) VALUES (?,?,?,?) ON CONFLICT(mode) DO UPDATE SET owner=excluded.owner,ciphertext=excluded.ciphertext,updated_at=excluded.updated_at").bind(mode,owner,ciphertext,new Date().toISOString()).run();
  }
}
export async function saveBillingKey(input:{uid:string;owner:string|undefined;mode:BillingMode;key:string;master:string;store:BillingKeyStore;validate:(key:string)=>Promise<void>}){
  assertBillingOwner(input.uid,input.owner);
  assertRestrictedKey(input.key,input.mode);
  // Verify storage configuration before contacting Stripe; invalid credentials
  // never replace a previously working connection.
  const encrypted=await sealBillingKey(input.key,input.master,input.mode);
  await input.validate(input.key);
  await input.store.save(input.mode,input.uid,encrypted);
}
