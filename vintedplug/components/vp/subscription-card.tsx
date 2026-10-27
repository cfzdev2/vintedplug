"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowRight,Check,CreditCard,ExternalLink,LoaderCircle,RefreshCw,ShieldCheck} from "lucide-react";
import type {BillingView} from "@/lib/billing-policy";

function date(timestamp:number){return timestamp?new Intl.DateTimeFormat("pl-PL",{day:"numeric",month:"long",year:"numeric",timeZone:"Europe/Warsaw"}).format(new Date(timestamp*1000)):"—";}
const labels:Record<string,string>={owner:"Konto właściciela",inactive:"Brak abonamentu",active:"Aktywny",past_due:"Płatność wymaga uwagi",unpaid:"Nieopłacony",canceled:"Zakończony",incomplete:"Dokończ płatność",incomplete_expired:"Płatność wygasła",trialing:"Okres próbny",paused:"Wstrzymany",invalid_plan:"Plan wymaga sprawdzenia"};
async function request<T>(path:string,data?:Record<string,unknown>):Promise<T>{
 const res=await fetch(path,{method:data?"POST":"GET",headers:data?{"Content-Type":"application/json"}:{},...(data?{body:JSON.stringify(data)}:{})});
 let value;try{value=await res.json();}catch{throw new Error("Nie udało się odczytać statusu abonamentu. Odśwież stronę.");}
 if(!res.ok)throw new Error(value&&typeof value==="object"&&"error" in value&&typeof value.error==="string"?value.error:"Nie udało się sprawdzić abonamentu.");return value as T;
}
export function SubscriptionCard({initial,standalone=false}:{initial:BillingView;standalone?:boolean}){
 const [state,setState]=useState(initial),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState(""),once=useRef(false);
 async function refresh(sessionId?:string,enterPanel=false){setBusy("sync");setError("");try{
  const next=state.configured?await request<BillingView>("/api/billing/sync",sessionId?{sessionId}:{}):await request<BillingView>("/api/billing");setState(next);
  if(enterPanel&&next.access){window.location.replace("/panel");return;}
  setNotice(next.access?"Dostęp jest aktywny. Możesz otworzyć panel.":"Płatność nie została jeszcze potwierdzona. Jeśli została wykonana, sprawdź status ponownie za chwilę.");
 }catch(e){setError(e instanceof Error?e.message:"Nie udało się sprawdzić abonamentu.");}finally{setBusy(null);}}
 useEffect(()=>{if(!standalone||once.current)return;once.current=true;const q=new URLSearchParams(window.location.search);
  if(q.get("billing")==="canceled")setNotice("Płatność została przerwana. Możesz wrócić do zakupu w dowolnej chwili.");
  if(q.get("billing")==="success"){
   setNotice("Sprawdzamy potwierdzenie płatności w Stripe…");const id=q.get("session_id");void refresh(id??undefined,true);
  }
  if(q.has("billing")||q.has("session_id"))window.history.replaceState(null,"",window.location.pathname);
 // Reconcile once on return. A query parameter alone never changes access.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[standalone]);
 async function open(action:"checkout"|"portal") {setBusy(action);setError("");try{
  const {url}=await request<{url:string}>(`/api/billing/${action}`,{});const target=new URL(url);
  if(target.protocol!=="https:"||!["checkout.stripe.com","billing.stripe.com"].includes(target.hostname))throw new Error("Nieprawidłowy adres płatności.");
  window.location.assign(url);
 }catch(e){setError(e instanceof Error?e.message:"Nie udało się otworzyć płatności.");setBusy(null);}}
 return <section className={`panel subscription-card ${standalone?"subscription-standalone":""}`} aria-busy={!!busy}>
  <div className="subscription-header"><span className="subscription-icon"><CreditCard size={23}/></span><div><span className="eyebrow">TWÓJ ABONAMENT</span><h2>vintedplug</h2></div>{state.mode==="test"&&state.configured&&<span className="subscription-test">Tryb testowy</span>}</div>
  <div className="subscription-price">29,90 <span>zł / miesiąc</span></div>
  <p className="subscription-intro">Jedna przestrzeń do organizacji rzeczy, przygotowania ogłoszeń i śledzenia zarobków.</p>
  <ul className="subscription-features">{["Magazyn i osobne finanse kont sprzedażowych","Tytuły, opisy i odpowiedzi AI · do 20 generacji dziennie","Lokalna obróbka zdjęć i gotowe tła","Baza wiedzy i eksport danych"].map(v=><li key={v}><Check size={16}/><span>{v}</span></li>)}</ul>
  <div className="subscription-details"><div><span>Status</span><strong>{labels[state.status]??"Do sprawdzenia"}</strong></div>
  {state.owner?<p>Jako właściciel masz dostęp bez opłacania abonamentu.</p>:<>
   {!!state.paidUntil&&<div><span>{state.access?"Dostęp opłacony do":"Ostatni opłacony okres do"}</span><strong>{date(state.paidUntil)}</strong></div>}
   {(state.cancelAtPeriodEnd||state.cancelAt>0)&&<p>Kolejna opłata nie zostanie pobrana. Dostęp pozostaje do końca opłaconego okresu.</p>}
   {state.status==="past_due"&&<p>Nie udało się pobrać kolejnej opłaty. Zaktualizuj metodę płatności w Stripe.</p>}
  </>}</div>
  {!state.configured&&<p className="subscription-notice">Płatności nie są jeszcze uruchomione. Abonament będzie dostępny po zakończeniu konfiguracji Stripe.</p>}
  {state.owner&&state.keySetup&&<StripeKeyForm state={state} onSaved={next=>{setState(next);setError("");setNotice("Połączenie Stripe zostało zapisane. Następny krok to sprawdzenie zakupu i dostarczania webhooków.");}}/>}
  {notice&&<p className="subscription-notice" role="status">{notice}</p>}{error&&<p className="subscription-error" role="alert">{error}</p>}
  <div className="subscription-actions">
   {state.canCheckout&&<button className="btn primary" disabled={!!busy} onClick={()=>open("checkout")}>{busy==="checkout"?<LoaderCircle className="spin" size={17}/>:<CreditCard size={17}/>}Kup dostęp · 29,90 zł / mies.</button>}
   {!state.owner&&state.hasCustomer&&state.configured&&<button className="btn secondary" disabled={!!busy} onClick={()=>open("portal")}>{busy==="portal"?<LoaderCircle className="spin" size={16}/>:<ExternalLink size={16}/>}Zarządzaj abonamentem</button>}
   {!state.owner&&<button className="text-button" disabled={!!busy} onClick={()=>refresh()}><RefreshCw size={15} className={busy==="sync"?"spin":""}/>Sprawdź status płatności</button>}
   {standalone&&state.access&&<a className="btn primary" href="/panel" target="_top">Otwórz panel<ArrowRight size={17}/></a>}
   {!standalone&&<a className="text-button" href="/abonament" target="_top">Szczegóły abonamentu<ArrowRight size={15}/></a>}
  </div>
  {!state.owner&&<p className="subscription-fineprint">Opłata odnawia się co miesiąc. Możesz zrezygnować z kolejnego odnowienia w ustawieniach abonamentu. Po wygaśnięciu dostęp do funkcji zostanie zablokowany, a Twoje dane pozostaną zapisane.</p>}
  <p className="subscription-security"><ShieldCheck size={15}/>Płatność obsługuje Stripe. Dane karty wpisujesz na stronie Stripe.</p>
 </section>;
}

function StripeKeyForm({state,onSaved}:{state:BillingView;onSaved:(next:BillingView)=>void}){
 const [key,setKey]=useState(""),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const setup=state.keySetup!;
 if(setup.managedExternally)return <p className="small muted">Klucz Stripe jest zarządzany w sekretach hostingu.</p>;
 return <form className="stripe-key-form" onSubmit={async event=>{
  event.preventDefault();if(saving)return;setSaving(true);setError("");
  try{const next=await request<BillingView>("/api/billing/setup",{key});setKey("");onSaved(next);}
  catch(e){setError(e instanceof Error?e.message:"Nie udało się zapisać połączenia Stripe.");}
  finally{setSaving(false);}
 }}>
  <div><h3>{setup.hasKey?"Połączenie Stripe":"Podłącz Stripe"}</h3><p>{setup.hasKey?"Klucz jest zapisany. Możesz zastąpić go nowym ograniczonym kluczem.":"Wklej ograniczony klucz API utworzony w swoim Stripe. To pole jest dostępne wyłącznie dla właściciela."}</p></div>
  <label htmlFor="stripe-api-key">{state.mode==="test"?"Klucz testowy Stripe":"Klucz produkcyjny Stripe"}</label>
  <input id="stripe-api-key" name="stripe-api-key" type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder={state.mode==="test"?"rk_test_…":"rk_live_…"} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={420} required disabled={saving||!setup.ready} aria-describedby="stripe-key-help"/>
  <p id="stripe-key-help">Przed zapisem sprawdzimy klucz w Stripe. Jest przesyłany do serwera przez HTTPS i zapisywany w postaci zaszyfrowanej. Panel nigdy nie wyświetla zapisanego klucza.</p>
  {!setup.ready&&<p className="subscription-notice">Bezpieczny zapis klucza czeka na konfigurację hostingu.</p>}
  {error&&<p className="subscription-error" role="alert">{error}</p>}
  <button className="btn secondary" disabled={saving||!setup.ready||!key.trim()}>{saving?<LoaderCircle className="spin" size={16}/>:<ShieldCheck size={16}/>}Zapisz i sprawdź klucz</button>
 </form>;
}
