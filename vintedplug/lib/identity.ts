import {env} from "cloudflare:workers";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from "@/app/chatgpt-auth";
import {authMode,resolveIdentity,safeAuthReturn} from "./auth-policy";
import {standaloneAuth} from "./auth-server";
import {AuthIdentityStore} from "./auth-store";
export async function getCurrentUser(){return resolveIdentity(authMode(env),getChatGPTUser,async()=>{
 const session=await standaloneAuth().api.getSession({headers:await headers(),query:{disableCookieCache:true}});
 if(!session?.user.emailVerified||!env.DB)return null;
 const userId=await new AuthIdentityStore(env.DB).ownerForVerifiedUser(session.user);
 return {userId,displayName:session.user.name||"Sprzedawca",fullName:session.user.name||null,email:session.user.email};
});}
export function signInPath(returnTo="/panel"){return authMode(env)==="standalone"?`/logowanie?return_to=${encodeURIComponent(safeAuthReturn(returnTo))}`:chatGPTSignInPath(returnTo);}
export function signOutPath(returnTo="/"){return authMode(env)==="standalone"?`/wyloguj?return_to=${encodeURIComponent(safeAuthReturn(returnTo,"/"))}`:chatGPTSignOutPath(returnTo);}
export async function requireUser(returnTo:string){const user=await getCurrentUser();if(!user)redirect(signInPath(returnTo));return user;}
