import {env} from "cloudflare:workers";
import {standaloneAuth,standaloneEnabled} from "@/lib/auth-server";
import {standaloneAuthConfig} from "@/lib/auth-policy";
import {authRequestIssue} from "@/lib/auth-request";
export const dynamic="force-dynamic";
const safeHeaders={"Cache-Control":"no-store","Referrer-Policy":"no-referrer"};
async function handle(req:Request){try{
 if(!standaloneEnabled())return Response.json({error:"Własne logowanie nie jest jeszcze uruchomione."},{status:404,headers:safeHeaders});
 const config=standaloneAuthConfig(env,import.meta.env.DEV),issue=authRequestIssue(req,config.origin);
 if(issue)return Response.json({error:issue.message},{status:issue.status,headers:safeHeaders});
 let body:string|undefined;
 if(req.method==="POST"){body=await req.text();if(new TextEncoder().encode(body).byteLength>16_384)return Response.json({error:"Za dużo danych."},{status:413,headers:safeHeaders});}
 // vinext wraps the route request; workerd's Request constructor needs its URL.
 const authRequest=new Request(req.url,{method:req.method,headers:req.headers,body});
 const response=await standaloneAuth().handler(authRequest);
 if(response.status>=500)return Response.json({error:"Nie udało się wykonać operacji. Spróbuj ponownie."},{status:503,headers:safeHeaders});
 const result=new Response(response.body,response);for(const [key,value] of Object.entries(safeHeaders))result.headers.set(key,value);return result;
}catch(error){console.error("vintedplug auth request failed",error instanceof Error?error.name:"unknown");return Response.json({error:"Logowanie jest chwilowo niedostępne."},{status:503,headers:safeHeaders});}}
export const GET=handle;
export const POST=handle;
