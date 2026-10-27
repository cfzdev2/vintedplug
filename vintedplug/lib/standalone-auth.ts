import {betterAuth} from "better-auth";
import {drizzleAdapter} from "@better-auth/drizzle-adapter";
import {authSchema} from "../db/auth-schema.ts";
import type {StandaloneAuthConfig} from "./auth-policy.ts";
import type {SendAuthEmail} from "./auth-email.ts";
import {authRateStorage} from "./auth-store.ts";

export function createStandaloneAuth(database:Parameters<typeof drizzleAdapter>[0],db:D1Database,config:StandaloneAuthConfig,send:SendAuthEmail){
 return betterAuth({
  appName:"vintedplug",baseURL:config.origin,basePath:"/api/auth",secret:config.secret,
  database:drizzleAdapter(database,{provider:"sqlite",schema:authSchema,transaction:false}),
  trustedOrigins:[config.origin],logger:{disabled:true},telemetry:{enabled:false},
  emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128,requireEmailVerification:true,autoSignIn:false,revokeSessionsOnPasswordReset:true,resetPasswordTokenExpiresIn:1800,
   sendResetPassword:async({user,url})=>send({to:user.email,url,kind:"reset"})},
  emailVerification:{sendOnSignUp:true,sendOnSignIn:true,autoSignInAfterVerification:false,expiresIn:3600,
   sendVerificationEmail:async({user,url})=>send({to:user.email,url,kind:"verify"})},
  session:{expiresIn:60*60*24*7,updateAge:60*60*24,cookieCache:{enabled:false}},
  advanced:{cookiePrefix:"vintedplug",useSecureCookies:config.secure,defaultCookieAttributes:{httpOnly:true,sameSite:"lax",path:"/"},ipAddress:{ipAddressHeaders:["cf-connecting-ip"]}},
  rateLimit:{enabled:true,window:60,max:60,customStorage:authRateStorage(db),customRules:{"/sign-in/email":{window:60,max:5},"/sign-up/email":{window:600,max:5},"/request-password-reset":{window:600,max:3},"/send-verification-email":{window:600,max:3}}},
 });
}
