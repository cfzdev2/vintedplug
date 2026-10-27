export class AuthIdentityStore{
 db:D1Database;
 constructor(db:D1Database){this.db=db;}
 async ownerForVerifiedUser(user:{id:string;emailVerified:boolean}){
  if(!user.emailVerified)throw new Error("Email verification required");
  const existing=await this.db.prepare("SELECT owner FROM vp_auth_identity WHERE auth_user_id=?").bind(user.id).first<{owner:string}>();
  if(existing)return existing.owner;
  const owner=`vp_${crypto.randomUUID()}`;
  await this.db.prepare("INSERT INTO vp_auth_identity (auth_user_id,owner,created_at) VALUES (?,?,?) ON CONFLICT(auth_user_id) DO NOTHING").bind(user.id,owner,new Date().toISOString()).run();
  const saved=await this.db.prepare("SELECT owner FROM vp_auth_identity WHERE auth_user_id=?").bind(user.id).first<{owner:string}>();
  if(!saved)throw new Error("Identity mapping unavailable");
  return saved.owner;
 }
}

// A single conditional UPSERT enforces the window under concurrent requests.
export function authRateStorage(db:D1Database){return {async consume(key:string,rule:{window:number;max:number}){
 const now=Date.now(),cutoff=now-rule.window*1000;
 const row=await db.prepare("INSERT INTO vp_auth_rate_limit (id,key,count,last_request) VALUES (?,?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN last_request<=? THEN 1 ELSE count+1 END,last_request=CASE WHEN last_request<=? THEN excluded.last_request ELSE last_request END WHERE last_request<=? OR count<? RETURNING count,last_request").bind(crypto.randomUUID(),key,now,cutoff,cutoff,cutoff,rule.max).first();
 return {allowed:!!row,retryAfter:row?null:rule.window};
}};}
