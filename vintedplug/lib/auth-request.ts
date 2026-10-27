const postPaths=new Set(["/sign-up/email","/sign-in/email","/sign-out","/request-password-reset","/reset-password","/send-verification-email"]);
export function authRequestIssue(request:Request,origin:string):{status:number;message:string}|null{
 const url=new URL(request.url),path=url.pathname.slice("/api/auth".length);
 if(url.origin!==origin)return {status:403,message:"Niedozwolony adres logowania."};
 if(request.method==="GET")return ["/get-session","/verify-email","/ok"].includes(path)||/^\/reset-password\/[^/]+$/.test(path)?null:{status:404,message:"Nie znaleziono tej operacji."};
 if(request.method!=="POST")return {status:405,message:"Niedozwolona metoda."};
 if(!postPaths.has(path))return {status:404,message:"Nie znaleziono tej operacji."};
 if(request.headers.get("origin")!==origin||request.headers.get("sec-fetch-site")==="cross-site")return {status:403,message:"Odśwież stronę i spróbuj ponownie."};
 if(!request.headers.get("content-type")?.includes("application/json"))return {status:415,message:"Wymagane dane JSON."};
 if(Number(request.headers.get("content-length")??0)>16_384)return {status:413,message:"Za dużo danych."};
 return null;
}
