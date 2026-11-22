export type AuthMode="sites"|"standalone";
export type AuthEnvironment={VP_AUTH_MODE?:string;VP_APP_ORIGIN?:string;BETTER_AUTH_SECRET?:string;RESEND_API_KEY?:string;AUTH_EMAIL_FROM?:string};
type AuthSetting=keyof AuthEnvironment|"DB";
export class AuthConfigurationError extends Error{
 readonly setting:AuthSetting;
 constructor(message:string,setting:AuthSetting){super(message);this.setting=setting;}
}
export function authMode(env:Pick<AuthEnvironment,"VP_AUTH_MODE">):AuthMode{
 if(!env.VP_AUTH_MODE||env.VP_AUTH_MODE==="sites")return "sites";
 if(env.VP_AUTH_MODE==="standalone")return "standalone";
 throw new AuthConfigurationError("Nieprawidłowa konfiguracja logowania.","VP_AUTH_MODE");
}
export function safeAuthReturn(value:string|undefined,fallback="/panel"){
 if(!value?.startsWith("/")||value.startsWith("//")||value.includes("\\"))return fallback;
 try{const u=new URL(value,"https://vintedplug.invalid");if(u.origin!=="https://vintedplug.invalid"||/^\/(?:api|logowanie|rejestracja|odzyskaj-haslo|nowe-haslo|wyloguj|signin-with-chatgpt|signout-with-chatgpt|callback)(?:\/|$)/.test(u.pathname))return fallback;return u.pathname+u.search;}catch{return fallback;}
}
export function standaloneAuthConfig(env:AuthEnvironment,development=false){
 if(authMode(env)!=="standalone")throw new AuthConfigurationError("Własne logowanie nie jest aktywne na tej wersji strony.","VP_AUTH_MODE");
 let u:URL;try{u=new URL(env.VP_APP_ORIGIN??"");}catch{throw new AuthConfigurationError("Logowanie czeka na konfigurację adresu serwisu.","VP_APP_ORIGIN");}
 const local=development&&u.protocol==="http:"&&["localhost","127.0.0.1","terminal.local"].includes(u.hostname);
 if((u.protocol!=="https:"&&!local)||u.username||u.password||u.pathname!=="/"||u.search||u.hash)throw new AuthConfigurationError("Logowanie wymaga kanonicznego adresu HTTPS.","VP_APP_ORIGIN");
 if(!env.BETTER_AUTH_SECRET||env.BETTER_AUTH_SECRET.length<32)throw new AuthConfigurationError("Logowanie czeka na konfigurację sekretu sesji.","BETTER_AUTH_SECRET");
 const emailKey=env.RESEND_API_KEY?.trim(),from=env.AUTH_EMAIL_FROM;
 if(!emailKey?.startsWith("re_")||emailKey.length<=3||/\s/.test(emailKey))throw new AuthConfigurationError("Logowanie czeka na konfigurację poczty transakcyjnej.","RESEND_API_KEY");
 if(!from||/[\r\n]/.test(from)||!from.includes("@"))throw new AuthConfigurationError("Logowanie czeka na konfigurację nadawcy poczty.","AUTH_EMAIL_FROM");
 return {origin:u.origin,secret:env.BETTER_AUTH_SECRET,emailKey,emailFrom:from.trim(),secure:!local};
}
export type StandaloneAuthConfig=ReturnType<typeof standaloneAuthConfig>;
export type AppUser={userId:string;displayName:string;email:string;fullName:string|null};
export async function resolveIdentity(mode:AuthMode,sites:()=>Promise<AppUser|null>,standalone:()=>Promise<AppUser|null>){
 // Never fall back to platform headers when standalone authentication fails.
 return mode==="standalone"?standalone():sites();
}
