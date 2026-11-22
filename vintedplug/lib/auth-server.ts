import {env} from "cloudflare:workers";
import {drizzle} from "drizzle-orm/d1";
import {AuthConfigurationError,authMode,standaloneAuthConfig} from "./auth-policy";
import {sendAuthEmail} from "./auth-email";
import {createStandaloneAuth} from "./standalone-auth";
import {queueStandaloneTask} from "./standalone-context";
export function standaloneEnabled(){return authMode(env)==="standalone";}
export function standaloneSetupIssue(){
 try{standaloneAuthConfig(env,import.meta.env.DEV);return env.DB?null:"DB";}
 catch(error){return error instanceof AuthConfigurationError?error.setting:"AUTH_SETUP";}
}
export function standaloneAuth(){
 const config=standaloneAuthConfig(env,import.meta.env.DEV);
 if(!env.DB)throw new Error("Auth database unavailable");
 return createStandaloneAuth(drizzle(env.DB),env.DB,config,async message=>{queueStandaloneTask(()=>sendAuthEmail(config,message));});
}
