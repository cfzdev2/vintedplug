"use client";
import {useEffect,useRef,useState} from "react";
import {Sparkles,LoaderCircle,ArrowDownToLine} from "lucide-react";
import type {ListingDraft,ListingFacts,ListingStyle} from "@/lib/ai-text";

export type FormListingRequest={kind:"listing";accountId:string;draft:ListingFacts;keywords:string;listingStyle:ListingStyle};
export function ItemListingAssistant({accountId,facts,active,available,demo,disabled,onApply,request}:{accountId:string;facts:ListingFacts;active:boolean;available:boolean;demo:boolean;disabled:boolean;onApply:(result:ListingDraft)=>void;request:(input:FormListingRequest,signal:AbortSignal)=>Promise<ListingDraft>}){
 const [style,setStyle]=useState<ListingStyle>("natural"),[keywords,setKeywords]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[result,setResult]=useState<{draft:ListingDraft;key:string}|null>(null);
 const generation=useRef<AbortController|null>(null);
 const key=JSON.stringify({accountId,facts,style,keywords:keywords.trim()}),stale=!!result&&result.key!==key;
 useEffect(()=>{generation.current?.abort();generation.current=null;setBusy(false);setError(null);},[key,active,disabled]);
 useEffect(()=>()=>generation.current?.abort(),[]);
 async function generate(){
  if(busy||disabled||!active||demo||!available||!accountId||!facts.name.trim())return;
  const controller=new AbortController();generation.current=controller;setBusy(true);setError(null);
  try{const draft=await request({kind:"listing",accountId,draft:facts,keywords:keywords.trim(),listingStyle:style},controller.signal);if(!controller.signal.aborted&&generation.current===controller)setResult({draft,key});}
  catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Nie udało się przygotować ogłoszenia.");}
  finally{if(generation.current===controller){generation.current=null;setBusy(false);}}
 }
 return <section className="item-ai-box" aria-label="Generator ogłoszenia w karcie rzeczy" aria-busy={busy}>
  <div className="item-ai-heading"><span className="item-ai-symbol"><Sparkles size={19}/></span><div><h3>Przygotuj ogłoszenie</h3><p>AI korzysta z aktualnych pól tej karty. Zdjęcie nie jest analizowane.</p></div></div>
  <div className="form-grid"><label>Wersja opisu<select value={style} onChange={e=>setStyle(e.target.value as ListingStyle)} disabled={busy||disabled}><option value="natural">Naturalna</option><option value="short">Krótka</option><option value="detailed">Szczegółowa — długi opis + hasztagi</option></select></label></div>
  <p className="small muted">{style==="detailed"?"Około 130–190 słów i 8–12 pasujących hasztagów.":style==="short"?"Krótki opis z najważniejszymi informacjami.":"Zwykły język jednej osoby, stan i czytelne wymiary."}</p>
  <label>Dodatkowe cechy i słowa kluczowe <span className="optional">opcjonalnie</span><textarea value={keywords} onChange={e=>setKeywords(e.target.value)} disabled={busy||disabled} maxLength={500} rows={2} placeholder="np. ciepła, przejściowa, bez kaptura"/></label>
  <p className="small muted">Możesz zostawić puste. Dopisuj tylko prawdziwe cechy rzeczy.</p>
  <button type="button" className="btn primary" disabled={busy||disabled||demo||!available||!accountId||!facts.name.trim()} onClick={generate}>{busy?<LoaderCircle size={16} className="spin"/>:<Sparkles size={16}/>} {busy?"Generuję…":"Generuj tytuł i opis"}</button>
  {(demo||!available||!facts.name.trim())&&<p className="small muted">{demo?"Generowanie AI jest dostępne we własnym panelu. Szablon poniżej działa również w demo.":!available?"Generowanie AI czeka na podłączenie Gemini.":"Wpisz nazwę rzeczy, aby rozpocząć generowanie."}</p>}
  {error&&<p className="item-ai-error" role="alert">Nowa generacja nie powiodła się. {error} Dotychczasowy tytuł i opis są zachowane.{result&&" Poniżej pozostaje wcześniejsza propozycja."}</p>}
  {result&&<div className="item-ai-proposal"><span className="section-kicker">PROPOZYCJA AI</span><strong>{result.draft.title}</strong><textarea aria-label="Propozycja opisu AI" readOnly value={result.draft.description} rows={style==="detailed"?10:6}/><p className="small muted">{stale?"Dane lub ustawienia się zmieniły. Wygeneruj ponownie, aby zastosować wynik do aktualnej karty.":"Sprawdź tekst. Zastosowanie zastąpi nazwę rzeczy i opis w formularzu; zapis nastąpi po zatwierdzeniu karty."}</p><button type="button" className="btn secondary" disabled={stale||disabled||busy} onClick={()=>{if(!stale){onApply(result.draft);setResult(null);}}}><ArrowDownToLine size={15}/>Zastosuj tytuł i opis</button></div>}
 </section>;
}
