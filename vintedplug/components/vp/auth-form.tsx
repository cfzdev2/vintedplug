"use client";
import {useState} from "react";
import {ArrowLeft,ArrowRight,CheckCircle2,Eye,EyeOff,LoaderCircle,Mail} from "lucide-react";
export type AuthScreenMode="login"|"register"|"forgot"|"reset"|"logout";
const headings={login:["Witaj z powrotem.","Zaloguj się do swojej przestrzeni sprzedaży."],register:["Twoja sprzedaż. Twój panel.","Załóż konto i uporządkuj codzienną sprzedaż."],forgot:["Nie pamiętasz hasła?","Wyślemy Ci link do ustawienia nowego hasła."],reset:["Ustaw nowe hasło.","Po zmianie zaloguj się ponownie na wszystkich urządzeniach."],logout:["Wylogować Cię z panelu?","Twoje rzeczy i zapisane wyniki pozostaną na koncie."]};
function issue(code:string,status:number){
 if(status===429)return "Za dużo prób. Odczekaj chwilę i spróbuj ponownie.";
 if(code==="EMAIL_NOT_VERIFIED")return "Najpierw potwierdź adres e-mail linkiem z wiadomości.";
 if(["INVALID_EMAIL_OR_PASSWORD","INVALID_PASSWORD"].includes(code))return "Sprawdź adres e-mail i hasło.";
 if(["INVALID_TOKEN","TOKEN_EXPIRED"].includes(code))return "Link jest nieprawidłowy albo wygasł. Poproś o nowy.";
 if(code==="PASSWORD_TOO_SHORT")return "Hasło musi mieć co najmniej 12 znaków.";
 return status>=500?"Logowanie jest chwilowo niedostępne. Spróbuj ponownie.":"Nie udało się wykonać operacji. Sprawdź dane lub poproś o nowy link.";
}
export function AuthForm({mode,enabled,returnTo="/panel",token="",legacyHref="",verified=false}:{mode:AuthScreenMode;enabled:boolean;returnTo?:string;token?:string;legacyHref?:string;verified?:boolean}){
 const [email,setEmail]=useState(""),[name,setName]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[code,setCode]=useState(""),[done,setDone]=useState(false);
 const loginHref=`/logowanie?return_to=${encodeURIComponent(returnTo)}`,registerHref=`/rejestracja?return_to=${encodeURIComponent(returnTo)}`;
 async function post(path:string,body:Record<string,unknown>){
  const response=await fetch(`/api/auth/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(body)});
  if(response.ok)return;
  let value:{code?:string}={};try{value=await response.json();}catch{}
  setCode(typeof value.code==="string"?value.code:"");throw new Error(issue(value.code??"",response.status));
 }
 async function submit(){if(busy||!enabled)return;setError("");setCode("");
  if((mode==="register"||mode==="reset")&&password!==confirm){setError("Wpisane hasła nie są takie same.");return;}
  setBusy(true);try{
   const verifiedURL=`${location.origin}${loginHref}&verified=1`;
   if(mode==="register")await post("sign-up/email",{name:name.trim(),email:email.trim(),password,callbackURL:verifiedURL});
   if(mode==="login"){await post("sign-in/email",{email:email.trim(),password,rememberMe:true});location.assign(returnTo);return;}
   if(mode==="forgot")await post("request-password-reset",{email:email.trim(),redirectTo:`${location.origin}/nowe-haslo`});
   if(mode==="reset")await post("reset-password",{newPassword:password,token});
   if(mode==="logout"){await post("sign-out",{});location.assign(returnTo);return;}
   setPassword("");setConfirm("");setDone(true);
  }catch(e){setError(e instanceof Error?e.message:"Nie udało się połączyć z serwisem.");}finally{setBusy(false);}
 }
 return <section className="vp-auth-card"><div className="vp-auth-card-heading"><span className="eyebrow">TWOJA PRZESTRZEŃ VINTEDPLUG</span><h1>{headings[mode][0]}</h1><p>{headings[mode][1]}</p></div>
  {!enabled&&<div className="vp-auth-message"><p>Własne logowanie czeka na uruchomienie niezależnej wersji serwisu.</p>{legacyHref&&<a href={legacyHref} target="_top">Przejdź do obecnego logowania <ArrowRight size={15}/></a>}</div>}
  {verified&&!done&&<p className="vp-auth-success" role="status"><CheckCircle2 size={17}/>Adres został potwierdzony. Możesz się zalogować.</p>}
  {done?<div className="vp-auth-done"><span><Mail size={27}/></span><h2>{mode==="reset"?"Hasło zostało zmienione.":"Sprawdź swoją skrzynkę."}</h2><p>{mode==="reset"?"Zaloguj się, używając nowego hasła.":mode==="register"?"Jeśli adres wymaga potwierdzenia, otrzymasz wiadomość z linkiem. Jeśli masz już konto, przejdź do logowania lub odzyskiwania hasła.":"Jeśli istnieje konto z tym adresem, wyślemy link do ustawienia nowego hasła. Sprawdź też folder spam."}</p><a className="btn primary" href={loginHref}>Przejdź do logowania <ArrowRight size={16}/></a></div>:<form onSubmit={e=>{e.preventDefault();void submit();}} aria-busy={busy}>
   <fieldset disabled={!enabled||busy}>
    {mode==="register"&&<label>Twoje imię<input name="name" autoComplete="given-name" maxLength={80} required value={name} onChange={e=>setName(e.target.value)}/></label>}
    {["register","login","forgot"].includes(mode)&&<label>Adres e-mail<input type="email" name="email" autoComplete="email" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)} placeholder="ty@przyklad.pl"/></label>}
    {["register","login","reset"].includes(mode)&&<label>{mode==="reset"?"Nowe hasło":"Hasło"}<span className="vp-auth-password"><input type={visible?"text":"password"} name="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={mode==="login"?1:12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={visible?"Ukryj hasło":"Pokaż hasło"} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></span>{mode!=="login"&&<small>Co najmniej 12 znaków.</small>}</label>}
    {(mode==="register"||mode==="reset")&&<label>Powtórz hasło<input type="password" name="password-confirm" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}
    {mode==="login"&&<a className="vp-auth-forgot" href="/odzyskaj-haslo">Nie pamiętam hasła</a>}
    {error&&<p className="vp-auth-error" role="alert">{error}</p>}
    {code==="EMAIL_NOT_VERIFIED"&&<button className="text-button" type="button" onClick={async()=>{if(busy)return;setBusy(true);try{await post("send-verification-email",{email:email.trim(),callbackURL:`${location.origin}${loginHref}&verified=1`});setDone(true);}catch(e){setError(e instanceof Error?e.message:"Nie udało się wysłać linku.");}finally{setBusy(false);}}}>Wyślij ponownie link do potwierdzenia</button>}
    {mode==="reset"&&!token?<p className="vp-auth-error">Brakuje poprawnego linku. <a href="/odzyskaj-haslo">Poproś o nowy.</a></p>:<button className="btn primary" type="submit">{busy?<LoaderCircle size={17} className="spin"/>:<ArrowRight size={17}/>}{{login:"Zaloguj się",register:"Utwórz konto",forgot:"Wyślij link",reset:"Zapisz nowe hasło",logout:"Wyloguj się"}[mode]}</button>}
   </fieldset>
  </form>}
  <div className="vp-auth-switch">{mode==="login"?<>Nie masz konta? <a href={registerHref}>Zarejestruj się</a></>:mode==="register"?<>Masz już konto? <a href={loginHref}>Zaloguj się</a></>:<a href={mode==="logout"?"/panel":loginHref}><ArrowLeft size={14}/>{mode==="logout"?"Wróć do panelu":"Wróć do logowania"}</a>}</div>
 </section>;
}
