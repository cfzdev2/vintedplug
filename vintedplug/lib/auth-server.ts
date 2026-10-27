import {env} from "cloudflare:workers";
import {drizzle} from "drizzle-orm/d1";
import {authMode,standaloneAuthConfig} from "./auth-policy";
import {sendAuthEmail} from "./auth-email";
import {createStandaloneAuth} from "./standalone-auth";
import {queueStandaloneTask} from "./standalone-context";
export function standaloneEnabled(){return authMode(env)==="standalone";}
export function standaloneReady(){try{standaloneAuthConfig(env,import.meta.env.DEV);return !!env.DB;}catch{return false;}}
export function standaloneAuth(){
 const config=standaloneAuthConfig(env,import.meta.env.DEV);
 if(!env.DB)throw new Error("Auth database unavailable");
 return createStandaloneAuth(drizzle(env.DB),env.DB,config,async message=>{queueStandaloneTask(()=>sendAuthEmail(config,message));});
}
