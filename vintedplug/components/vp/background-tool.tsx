"use client";
import {useEffect,useRef,useState} from "react";
import {Check,Download,LoaderCircle,Sparkles,CheckCircle2,X} from "lucide-react";
import {BACKGROUNDS,type BackgroundStyle,type BackgroundResult} from "@/lib/backgrounds";
import {composeLocalBackground,removeLocalBackground} from "@/lib/local-background";
import type {LocalBackgroundProgress} from "@/lib/local-background-core";

type Preview={key:string;url:string;sourceId:string;style:BackgroundStyle;provider:"local"|"photoroom";blob?:Blob;saved?:BackgroundResult};
function progressLabel(progress:LocalBackgroundProgress|null){
 if(progress?.phase==="download")return `Pobieram model${progress.percent!==undefined?` · ${Math.round(progress.percent)}%`:"…"}`;
 if(progress?.phase==="prepare")return "Uruchamiam model…";
 if(progress?.phase==="processing")return progress.backend==="wasm"?"Wycinam tło · tryb zgodności…":"Wycinam tło na urządzeniu…";
 return "Przygotowuję lokalne AI…";
}
export function BackgroundTool({sourceId,available,demo=false,onUse,onBusy}:{sourceId:string;available:boolean;demo?:boolean;onUse:(result:BackgroundResult)=>Promise<void>|void;onBusy?:(busy:boolean)=>void}){
 const [provider,setProvider]=useState<"local"|"photoroom">("local"),[style,setStyle]=useState<BackgroundStyle>("paper"),[busy,setBusy]=useState(false),[applying,setApplying]=useState(false),[composing,setComposing]=useState(false),[error,setError]=useState(""),[preview,setPreview]=useState<Preview|null>(null),[cutout,setCutout]=useState<Blob|null>(null),[progress,setProgress]=useState<LocalBackgroundProgress|null>(null),[loaded,setLoaded]=useState(""),[broken,setBroken]=useState("");
 const previewSequence=useRef(0),lock=useRef(false),controller=useRef<AbortController|null>(null),current=preview?.sourceId===sourceId&&preview?.style===style&&preview?.provider===provider,working=busy||applying||composing;
 useEffect(()=>()=>controller.current?.abort(),[]);
 useEffect(()=>{const url=preview?.provider==="local"?preview.url:null;return()=>{if(url)URL.revokeObjectURL(url);};},[preview?.url]);
 useEffect(()=>{
  if(provider!=="local"||!cutout)return;let canceled=false;setComposing(true);setError("");
  composeLocalBackground(cutout,BACKGROUNDS[style].color).then(blob=>{if(canceled)return;setLoaded("");setBroken("");setPreview({key:String(++previewSequence.current),url:URL.createObjectURL(blob),sourceId,style,provider:"local",blob});}).catch(error=>{if(!canceled)setError(error instanceof Error?error.message:"Nie udało się przygotować koloru tła.");}).finally(()=>{if(!canceled)setComposing(false);});
  return()=>{canceled=true;};
 },[cutout,style,provider,sourceId]);
 async function generate(){
  if(lock.current||demo||!sourceId||(provider==="photoroom"&&!available))return;
  lock.current=true;const task=new AbortController();controller.current=task;setBusy(true);onBusy?.(true);setError("");setProgress(null);
  try{
   if(provider==="local"){
    const source=await fetch(`/api/files/${encodeURIComponent(sourceId)}`,{signal:task.signal});if(!source.ok)throw new Error("Nie udało się wczytać zdjęcia z panelu.");const image=await source.blob();
    if(image.size>8*1024*1024)throw new Error("Zdjęcie może mieć maksymalnie 8 MB.");
    const result=await removeLocalBackground(image,value=>{if(!task.signal.aborted)setProgress(value);},task.signal);if(!task.signal.aborted)setCutout(result);
   }else{
    const response=await fetch(`/api/files/${encodeURIComponent(sourceId)}/background`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({style}),signal:AbortSignal.any([task.signal,AbortSignal.timeout(75_000)])}),data:unknown=await response.json();
    if(!response.ok)throw new Error(data&&typeof data==="object"&&"error" in data&&typeof data.error==="string"?data.error:"Nie udało się zmienić tła.");
    const next=data as BackgroundResult;if(!next.id||next.sourceId!==sourceId||next.style!==style||next.url!==`/api/files/${next.id}`)throw new Error("Nieprawidłowy wynik edycji zdjęcia.");setLoaded("");setBroken("");setPreview({key:next.id,url:next.url,sourceId,style,provider:"photoroom",saved:next});
   }
  }catch(error){if(task.signal.aborted)setError("Przerwano przetwarzanie. Zdjęcie w karcie pozostało bez zmian.");else setError(error instanceof Error&&error.name==="TimeoutError"?"Upłynął czas oczekiwania. Sprawdź zapisane wersje zdjęcia przed ponowieniem.":error instanceof Error?error.message:"Nie udało się zmienić tła.");}
  finally{controller.current=null;lock.current=false;setBusy(false);onBusy?.(false);}
 }
 async function useResult(){
  if(lock.current||!preview||!current||working||loaded!==preview.key||broken===preview.key)return;
  lock.current=true;setApplying(true);onBusy?.(true);setError("");try{
   let saved=preview.saved;
   if(!saved){if(!preview.blob)throw new Error("Brak pliku wyniku.");const form=new FormData();form.append("file",preview.blob,"vintedplug-tlo.png");form.append("sourceId",sourceId);
    const response=await fetch("/api/files",{method:"POST",body:form}),data=await response.json().catch(()=>({error:response.status===413?"Zdjęcie przekracza limit wysyłania. Zmniejsz je w edytorze i spróbuj ponownie.":"Nie udało się zapisać zdjęcia. Możesz spróbować ponownie."})) as {id?:string;url?:string;error?:string};if(!response.ok||!data.id||data.url!==`/api/files/${data.id}`)throw new Error(data.error??"Nie udało się zapisać zdjęcia. Możesz spróbować ponownie.");
    saved={id:data.id,url:data.url,sourceId,style};setPreview(value=>value?.key===preview.key?{...value,saved}:value);
   }
   await onUse(saved);
  }catch(error){setError(error instanceof Error?error.message:"Nie udało się wybrać wersji zdjęcia.");}finally{lock.current=false;setApplying(false);onBusy?.(false);}
 }
 return <div className="background-tool"><section className="background-options" aria-label="Ustawienia nowego tła"><div><h3>Wybierz jednolite tło</h3><p>Wytnij przedmiot i porównaj wynik z oryginałem.</p></div><label className="background-provider">Tryb zmiany tła<select value={provider} disabled={working} onChange={event=>{setProvider(event.target.value as typeof provider);setPreview(null);setError("");}}><option value="local">Na urządzeniu · bez opłat</option><option value="photoroom" disabled={!available}>Photoroom · {available?"opcjonalnie":"do podłączenia"}</option></select></label><div className="background-presets">{Object.entries(BACKGROUNDS).map(([key,value])=><button type="button" key={key} aria-pressed={style===key} disabled={busy||applying} onClick={()=>setStyle(key as BackgroundStyle)}><span style={{background:value.color}}>{style===key&&<Check size={17}/>}</span><strong>{value.label}</strong></button>)}</div><button type="button" className="btn primary full" disabled={working||!sourceId||demo||(provider==="photoroom"&&!available)||(provider==="local"&&!!cutout)} onClick={()=>void generate()}>{busy||composing?<LoaderCircle className="spin" size={17}/>:cutout&&provider==="local"?<CheckCircle2 size={17}/>:<Sparkles size={17}/>} {busy?(provider==="local"?progressLabel(progress):"Zmieniam tło…"):composing?"Przygotowuję kolor…":provider==="local"?(cutout?"Gotowe · wybierz kolor":"Wytnij tło na urządzeniu"):"Zmień tło z Photoroom"}</button>{busy&&provider==="local"&&<button type="button" className="btn secondary full" onClick={()=>controller.current?.abort()}><X size={15}/>Przerwij</button>}{demo&&<p className="small muted">Własne zdjęcia przygotujesz po włączeniu własnego panelu.</p>}{provider==="local"?<><p className="small muted">Bez opłat za zdjęcie i bez klucza API. Pierwszy start pobiera około 220 MB modelu oraz pliki silnika. Przeglądarka może zachować je na kolejne użycia.</p><p className="small muted">Wycinanie odbywa się na Twoim urządzeniu. Bez przyspieszenia graficznego, zwłaszcza na telefonie, może potrwać kilka minut. Kolory tła zmienisz potem od razu. Wynik zapiszesz przyciskiem „Użyj tej wersji”.</p><a className="text-button" href="/licenses/local-background.txt" target="_blank" rel="noreferrer">Informacje o modelu i licencjach</a></>:<p className="small muted">Tryb opcjonalny. Limit panelu: 3 edycje dziennie UTC. Każde przetworzenie korzysta z kredytów Photoroom; zmiana koloru wymaga nowego wywołania.</p>}<p className="small muted">Porównaj krawędzie, rękawy, metki i widoczne wady. Przy publikacji skorzystaj z oznaczenia edycji AI dostępnego na platformie.</p></section><section className="background-comparison" aria-label="Porównanie zdjęcia przed i po zmianie tła"><div className="background-images"><figure><figcaption>Przed zmianą</figcaption><div><img src={`/api/files/${sourceId}`} alt="Zdjęcie przed zmianą tła"/></div></figure><figure><figcaption>{preview?`Po zmianie · ${BACKGROUNDS[preview.style].label}`:"Po zmianie"}</figcaption><div>{preview?<img src={preview.url} alt="Zdjęcie po zmianie tła" onLoad={()=>setLoaded(preview.key)} onError={()=>setBroken(preview.key)}/>:<div className="background-placeholder"><Sparkles size={30}/><p>{busy?(provider==="local"?progressLabel(progress):"Przygotowuję nowe tło…"):"Tutaj pojawi się wynik"}</p>{busy&&progress?.phase==="download"&&progress.percent!==undefined&&<progress max={100} value={progress.percent} aria-label="Pobieranie modelu AI"/>}</div>}</div></figure></div>{error&&<p className="background-error" role="alert">{error}{preview&&" Poprzedni wynik pozostaje do porównania."}</p>}{broken===preview?.key&&preview&&<p className="background-error" role="alert">Nie udało się wyświetlić wyniku. Wybór tej wersji został wstrzymany.</p>}{preview&&!current&&<p className="note small">{provider==="local"?"Przygotowuję wynik dla aktualnie wybranego tła.":"Wybrano inny kolor. Kliknij „Zmień tło z Photoroom”, aby przygotować nową wersję."}</p>}{preview&&<div className="background-result-actions"><a className="btn secondary" href={preview.provider==="local"?preview.url:`${preview.url}?download=1`} download={`vintedplug-tlo-${preview.style}.png`}><Download size={15}/>Pobierz wynik</a><button type="button" className="btn primary" disabled={!current||working||loaded!==preview.key||broken===preview.key} onClick={()=>void useResult()}>{applying?<LoaderCircle className="spin" size={15}/>:<CheckCircle2 size={15}/>}Użyj tej wersji</button></div>}<p className="small muted">Wynik nie zastępuje zdjęcia automatycznie. Wybierz wersję dopiero po porównaniu.</p></section></div>;
}
