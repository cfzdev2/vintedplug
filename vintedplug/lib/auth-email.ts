import type {StandaloneAuthConfig} from "./auth-policy.ts";
export type AuthEmail={to:string;url:string;kind:"verify"|"reset"};
export type SendAuthEmail=(message:AuthEmail)=>Promise<void>;
export async function sendAuthEmail(config:StandaloneAuthConfig,message:AuthEmail,fetcher:typeof fetch=fetch){
 const url=new URL(message.url);
 if(url.origin!==config.origin||url.username||url.password)throw new Error("Invalid auth mail origin");
 const subject=message.kind==="verify"?"Potwierdź adres e-mail — vintedplug":"Ustaw nowe hasło — vintedplug";
 const text=message.kind==="verify"?`Cześć!\n\nPotwierdź adres e-mail, aby korzystać z vintedplug:\n${url.href}\n\nLink jest ważny przez godzinę. Jeśli nie zakładasz konta, zignoruj tę wiadomość.`:`Cześć!\n\nAby ustawić nowe hasło do vintedplug, otwórz:\n${url.href}\n\nLink jest ważny przez 30 minut. Jeśli nie prosisz o zmianę hasła, zignoruj tę wiadomość.`;
 const response=await fetcher("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${config.emailKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:config.emailFrom,to:[message.to],subject,text}),signal:AbortSignal.timeout(15_000)});
 if(!response.ok)throw new Error("Auth email delivery failed");
}
