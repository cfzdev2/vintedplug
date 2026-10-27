import {redirect} from "next/navigation";
import {standaloneEnabled,standaloneReady} from "@/lib/auth-server";
import {getCurrentUser,signInPath} from "@/lib/identity";
import {safeAuthReturn} from "@/lib/auth-policy";
import {AuthForm,type AuthScreenMode} from "./auth-form";
export async function AuthScreen({mode,params}:{mode:AuthScreenMode;params:Promise<Record<string,string|string[]|undefined>>}){
 const query=await params,returnTo=safeAuthReturn(typeof query.return_to==="string"?query.return_to:undefined,mode==="logout"?"/":"/panel");
 const standalone=standaloneEnabled(),enabled=standalone&&standaloneReady();
 if(enabled&&["login","register"].includes(mode)&&await getCurrentUser())redirect(returnTo);
 return <AuthForm mode={mode} enabled={enabled} returnTo={returnTo} token={typeof query.token==="string"&&query.token.length<=1024?query.token:""} verified={query.verified==="1"} legacyHref={!standalone?signInPath(returnTo):""}/>;
}
