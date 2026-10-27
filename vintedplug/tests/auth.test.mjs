import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {drizzle} from 'drizzle-orm/d1';
import {createStandaloneAuth} from '../lib/standalone-auth.ts';
import {AuthIdentityStore,authRateStorage} from '../lib/auth-store.ts';
import {authMode,standaloneAuthConfig,safeAuthReturn,resolveIdentity} from '../lib/auth-policy.ts';
import {authRequestIssue} from '../lib/auth-request.ts';
import {sendAuthEmail} from '../lib/auth-email.ts';

const origin='https://vintedplug.example.test';
const config={origin,secret:crypto.randomUUID()+crypto.randomUUID(),emailKey:'re_fixture_not_real',emailFrom:'vintedplug <konto@example.test>',secure:true};
function setup(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
 sqlite.exec(readFileSync(new URL('../drizzle/0005_condemned_jigsaw.sql',import.meta.url),'utf8'));
 const db={prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(column){const row=sqlite.prepare(sql).get(...args);return column?(row?.[column]??null):(row??null);},async all(){const stmt=sqlite.prepare(sql);return {success:true,results:stmt.columns().length?stmt.all(...args):(stmt.run(...args),[])};},async raw(){const stmt=sqlite.prepare(sql);stmt.setReturnArrays(true);return stmt.all(...args);},async run(){return {success:true,results:[],meta:sqlite.prepare(sql).run(...args)};}};},async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.all());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 const emails=[];const auth=createStandaloneAuth(drizzle(db),db,config,async message=>{emails.push(message);});
 const call=(path,body,cookie='',extra={})=>auth.handler(new Request(origin+'/api/auth'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json','cf-connecting-ip':'198.51.100.1',...(cookie?{Cookie:cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})}));
 return {sqlite,db,auth,emails,call};
}
const credentials={name:'Testowy Sprzedawca',email:'seller@example.test',password:'TestoweHaslo-2026!'};
function cookie(response){return response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');}
async function verified(f){
 const signup=await f.call('/sign-up/email',credentials);assert.equal(signup.status,200);
 const response=await f.auth.handler(new Request(f.emails.find(m=>m.kind==='verify').url));assert(response.status<400);
 const login=await f.call('/sign-in/email',{email:credentials.email,password:credentials.password});assert.equal(login.status,200);return cookie(login);
}

test('własne logowanie: konfiguracja fail-closed, bez przekierowań poza serwis i bez fallbacku do nagłówków Sites',async()=>{
 assert.equal(authMode({}),'sites');assert.equal(authMode({VP_AUTH_MODE:'standalone'}),'standalone');assert.throws(()=>authMode({VP_AUTH_MODE:'invalid'}));
 const env={VP_AUTH_MODE:'standalone',VP_APP_ORIGIN:origin,BETTER_AUTH_SECRET:config.secret,RESEND_API_KEY:config.emailKey,AUTH_EMAIL_FROM:config.emailFrom};
 assert(standaloneAuthConfig(env));
 for(const patch of [{VP_APP_ORIGIN:'http://vintedplug.example.test'},{VP_APP_ORIGIN:'https://evil@vintedplug.example.test'},{VP_APP_ORIGIN:origin+'/panel'},{BETTER_AUTH_SECRET:'short'},{RESEND_API_KEY:''},{AUTH_EMAIL_FROM:'x\r\nBcc:attacker@example.test'}])assert.throws(()=>standaloneAuthConfig({...env,...patch}));
 assert(standaloneAuthConfig({...env,VP_APP_ORIGIN:'http://localhost:5173'},true));
 assert.throws(()=>standaloneAuthConfig({...env,VP_APP_ORIGIN:'http://localhost:5173'},false));
 for(const value of ['//evil.test','/\\evil.test','https://evil.test','/api/auth/sign-out','/logowanie','/callback'])assert.equal(safeAuthReturn(value),'/panel');
 assert.equal(safeAuthReturn('/abonament?billing=canceled'),'/abonament?billing=canceled');
 let sites=0;assert.equal(await resolveIdentity('standalone',async()=>{sites++;return {userId:'owner'};},async()=>null),null);assert.equal(sites,0);
 await assert.rejects(()=>resolveIdentity('standalone',async()=>{sites++;return {};},async()=>{throw Error('DB unavailable');}));assert.equal(sites,0);
});
test('prawdziwy Better Auth i SQLite/D1: rejestracja hashuje hasło; bez potwierdzenia e-maila nie wydaje sesji',async()=>{
 const f=setup();const signup=await f.call('/sign-up/email',{...credentials,owner:'foreign-owner'});assert.equal(signup.status,200);assert.equal(cookie(signup),'');
 const user=f.sqlite.prepare('SELECT * FROM vp_auth_user').get();assert.equal(user.email_verified,0);
 const stored=f.sqlite.prepare('SELECT password FROM vp_auth_account').get().password;assert.notEqual(stored,credentials.password);assert(!stored.includes(credentials.password));
 const denied=await f.call('/sign-in/email',{email:credentials.email,password:credentials.password});assert.equal(denied.status,403);assert.equal(cookie(denied),'');
 assert(f.emails.some(m=>m.kind==='verify'));assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM vp_auth_session').get().n,0);
 const duplicate=await f.call('/sign-up/email',credentials);assert.equal(duplicate.status,200);assert.equal(cookie(duplicate),'');assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM vp_auth_user').get().n,1);
});
test('potwierdzenie i logowanie: sesja ma HttpOnly/Secure/SameSite, obce hasło i zmienione cookie nie działają',async()=>{
 const f=setup(),session=await verified(f);
 const logged=await f.call('/get-session',null,session);assert.equal(logged.status,200);const data=await logged.json();assert.equal(data.user.email,credentials.email);assert.equal(data.user.emailVerified,true);
 const second=await f.call('/sign-in/email',{email:credentials.email,password:credentials.password});const headers=second.headers.getSetCookie().join(';');assert.match(headers,/httponly/i);assert.match(headers,/secure/i);assert.match(headers,/samesite=lax/i);
 const bad=await f.call('/sign-in/email',{email:credentials.email,password:'wrong-password'});assert.equal(bad.status,401);
 const tampered=await f.call('/get-session',null,session.replace(/=./,'=X'));assert.equal(await tampered.json(),null);
 f.sqlite.prepare('UPDATE vp_auth_session SET expires_at=?').run(Date.now()-1000);assert.equal(await (await f.call('/get-session',null,session)).json(),null);
});
test('reset hasła: link jednorazowy, stare hasło i wszystkie poprzednie sesje przestają działać',async()=>{
 const f=setup(),session=await verified(f);
 const reset=await f.call('/request-password-reset',{email:credentials.email,redirectTo:origin+'/nowe-haslo'});assert.equal(reset.status,200);
 const mail=f.emails.find(m=>m.kind==='reset');assert(mail);
 const redirect=await f.auth.handler(new Request(mail.url));const token=new URL(redirect.headers.get('location')).searchParams.get('token');assert(token);
 const weak=await f.call('/reset-password',{token,newPassword:'short'});assert.equal(weak.status,400);
 const password='Nowe-Testowe-Haslo-2026!';assert.equal((await f.call('/reset-password',{token,newPassword:password})).status,200);
 assert.equal(await (await f.call('/get-session',null,session)).json(),null);
 assert.equal((await f.call('/sign-in/email',{email:credentials.email,password:credentials.password})).status,401);
 assert.equal((await f.call('/sign-in/email',{email:credentials.email,password})).status,200);
 assert.equal((await f.call('/reset-password',{token,newPassword:'Jeszcze-Inne-Haslo!'})).status,400);
});
test('ochrona Origin i callbacków: obca strona nie rejestruje użytkownika ani nie wylogowuje sesji',async()=>{
 const f=setup();const attack=await f.call('/sign-up/email',credentials,'',{Origin:'https://evil.test'});assert.equal(attack.status,403);assert.equal(f.emails.length,0);
 const foreign=await f.call('/sign-up/email',{...credentials,callbackURL:'https://evil.test/steal'});assert.equal(foreign.status,403);
 const request=(path,headers={},method='POST')=>new Request(origin+'/api/auth'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers}});
 assert.equal(authRequestIssue(request('/sign-in/email'),origin),null);
 for(const req of [request('/sign-out',{Origin:'https://evil.test'}),request('/sign-up/email',{'sec-fetch-site':'cross-site'})])assert.equal(authRequestIssue(req,origin).status,403);
 assert.equal(authRequestIssue(request('/delete-user'),origin).status,404);assert.equal(authRequestIssue(request('/sign-out',{},'GET'),origin).status,404);
});
test('mapowanie właścicieli: stabilne ID, oddzielne konta i jawne powiązanie migracyjne bez dopasowania po e-mailu',async()=>{
 const f=setup();await verified(f);const user=f.sqlite.prepare('SELECT * FROM vp_auth_user').get();const store=new AuthIdentityStore(f.db);
 await assert.rejects(()=>store.ownerForVerifiedUser({id:user.id,emailVerified:false}));
 const owners=await Promise.all(Array.from({length:8},()=>store.ownerForVerifiedUser({id:user.id,emailVerified:true})));assert.equal(new Set(owners).size,1);
 f.sqlite.prepare('UPDATE vp_auth_identity SET owner=? WHERE auth_user_id=?').run('legacy-site-owner',user.id);
 assert.equal(await store.ownerForVerifiedUser({id:user.id,emailVerified:true}),'legacy-site-owner');
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM vp_auth_identity').get().n,1);
});
test('limiter w SQLite przy równoległych próbach nie pozwala przekroczyć limitu; nowe okno działa',async()=>{
 const f=setup(),storage=authRateStorage(f.db),rule={window:60,max:5};
 const result=await Promise.all(Array.from({length:20},()=>storage.consume('client:sign-in',rule)));assert.equal(result.filter(r=>r.allowed).length,5);
 f.sqlite.prepare('UPDATE vp_auth_rate_limit SET last_request=?').run(Date.now()-61000);assert((await storage.consume('client:sign-in',rule)).allowed);
 assert((await storage.consume('other-client:sign-in',rule)).allowed);
});
test('poczta: wyłącznie link serwisu i stały endpoint dostawcy, bez logowania lub zwracania sekretów',async()=>{
 let captured;await sendAuthEmail(config,{kind:'verify',to:'test@example.test',url:origin+'/api/auth/verify-email?token=synthetic'},async(url,request)=>{captured={url,request};return new Response('{}',{status:200});});
 assert.equal(captured.url,'https://api.resend.com/emails');const body=JSON.parse(captured.request.body);assert.equal(body.to[0],'test@example.test');assert(body.text.includes(origin));assert(!body.text.includes(config.emailKey));
 await assert.rejects(()=>sendAuthEmail(config,{kind:'reset',to:'test@example.test',url:'https://evil.test/token'}));
 await assert.rejects(()=>sendAuthEmail(config,{kind:'reset',to:'test@example.test',url:origin+'/reset'},async()=>new Response('provider secrets',{status:500})),e=>!e.message.includes('provider secrets'));
});
