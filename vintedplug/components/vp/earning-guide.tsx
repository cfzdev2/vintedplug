"use client";
import {useRef,useState} from "react";
import {ArrowLeft,ArrowRight,ArrowUpRight,BookOpen,Check,ChevronRight,ExternalLink,FileText,Lightbulb,LoaderCircle,Pencil} from "lucide-react";
import {toast} from "sonner";
import {EARNING_CHAPTERS,ALL_GUIDE_CHAPTERS,earningGuideInput,initialGuideChapters,type ChapterId,type GuideEntryId,type EarningGuide,type GuideInput} from "@/lib/earning-guide";
import {Modal,errorMessage} from "./forms";

export type EarningGuideProps={guide:EarningGuide|null;canEdit:boolean;demo:boolean;enableOwn:()=>void;onSave:(input:GuideInput)=>Promise<void>};

export function EarningGuideCard({onOpen}:{onOpen:()=>void}){
 return <section className="earning-feature">
  <div className="earning-feature-copy"><span className="section-kicker">PORADNIK VINTEDPLUG</span><h2>Zarabianie na Vinted.<br/>Od szukania do sprzedaży.</h2><p>Poznaj ustawienia wyszukiwania, personalizację i autorską metodę znajdowania okazji.</p><div className="earning-tags"><span><BookOpen size={13}/>6 rozdziałów</span><span><Pencil size={13}/>Metoda i przykłady</span></div><button className="btn primary" onClick={onOpen}>Otwórz poradnik <ArrowUpRight size={16}/></button></div>
  <div className="earning-feature-outline" aria-hidden="true">{[EARNING_CHAPTERS[0],EARNING_CHAPTERS[1],EARNING_CHAPTERS[2]].map((c,n)=><div key={c.id}><span>{String(n+1).padStart(2,"0")}</span><strong>{c.title}</strong>{n===2?<Pencil size={15}/>:<ChevronRight size={16}/>}</div>)}<p>+ ocena okazji, sprzedaż i przykłady z praktyki</p></div>
 </section>;
}

export function EarningGuideReader({guide,canEdit,demo,enableOwn,onSave,onBack}:EarningGuideProps&{onBack:()=>void}){
 const [active,setActive]=useState<ChapterId>("setup"),[editing,setEditing]=useState<(GuideInput&{active:ChapterId})|null>(null);
 const articleRef=useRef<HTMLElement>(null),chapters=guide?.chapters??initialGuideChapters(),index=EARNING_CHAPTERS.findIndex(c=>c.id===active),definition=EARNING_CHAPTERS[index],chapter=chapters.find(c=>c.id===active)!;
 const filled=EARNING_CHAPTERS.filter(c=>chapters.find(ch=>ch.id===c.id)?.body.trim()).length;
 function openChapter(id:ChapterId){setActive(id);requestAnimationFrame(()=>articleRef.current?.scrollIntoView({behavior:"smooth",block:"start"}));}
 function edit(){setEditing({active,revision:guide?.revision??0,chapters:chapters.map(c=>({...c}))});}
 return <div className="earning-reader">
  <div className="earning-topline"><button className="text-button" onClick={onBack}><ArrowLeft size={15}/>Wróć do bazy wiedzy</button><span>{guide?`Zapisano ${new Date(guide.updatedAt).toLocaleString("pl-PL",{dateStyle:"short",timeStyle:"short",timeZone:"Europe/Warsaw"})}`:canEdit?"Materiał startowy · dodaj własną metodę":"Materiał startowy"}</span></div>
  <div className="earning-reader-heading"><div><span className="section-kicker">PORADNIK VINTEDPLUG</span><h2>Zarabianie na Vinted</h2><p>Wyszukiwanie, własna metoda i decyzje oparte na kosztach.</p></div><span className="earning-count"><FileText size={16}/>{filled} z 6 rozdziałów z treścią</span></div>
  {demo&&canEdit&&<div className="earning-demo-note"><span>Aby edytować poradnik i zapisywać zmiany, przejdź do własnego panelu.</span><button className="text-button" onClick={enableOwn}>Włącz własny panel <ArrowRight size={14}/></button></div>}
  <div className="earning-layout">
   <nav className="panel earning-contents" aria-label="Rozdziały poradnika"><h3>Spis treści</h3>{EARNING_CHAPTERS.map((c,n)=>{const ready=!!chapters.find(ch=>ch.id===c.id)?.body.trim();return <button key={c.id} className={c.id===active?"active":""} aria-current={c.id===active?"step":undefined} onClick={()=>openChapter(c.id)}><span className="earning-chapter-number">{String(n+1).padStart(2,"0")}</span><span><strong>{c.title}</strong><small>{ready?"Czytaj rozdział":"Do uzupełnienia"}</small></span>{ready&&<Check size={13}/>}</button>;})}</nav>
   <article className="panel earning-article" ref={articleRef}>
    <div className="earning-article-header"><span className="section-kicker">ROZDZIAŁ {String(index+1).padStart(2,"0")} / 06</span>{canEdit&&<button className="btn secondary" disabled={demo} onClick={edit}><Pencil size={14}/>{chapter.body.trim()?"Edytuj rozdział":"Dodaj swoją treść"}</button>}</div>
    <h2>{definition.title}</h2><p className="earning-chapter-description">{definition.description}</p>
    {chapter.body.trim()?<div className="earning-prose">{chapter.body}</div>:<div className="earning-empty"><span className="earning-empty-icon"><Pencil size={22}/></span><h3>{!canEdit?"Rozdział w przygotowaniu":active==="method"?"Tutaj opisz swoją metodę":"Dodaj przykłady z własnej praktyki"}</h3><p>{!canEdit?"W tym miejscu pojawią się kroki i przykłady autora poradnika.":active==="method"?"Zapisz dokładnie, co robisz i co sprawdziło się u Ciebie. Poniższe pytania pomogą ułożyć instrukcję.":"Uzupełnij rozdział rzeczywistymi zakupami i wynikami. Możesz opisać także nietrafione decyzje i wnioski."}</p>{canEdit&&<ul>{definition.prompts.map(p=><li key={p}>{p}</li>)}</ul>}{!demo&&canEdit&&<button className="btn primary" onClick={edit}><Pencil size={15}/>Uzupełnij rozdział</button>}</div>}
    {chapter.example.trim()&&<aside className="earning-example"><h3><Lightbulb size={17}/>Z praktyki</h3><div className="earning-prose">{chapter.example}</div></aside>}
    {definition.source&&<div className="earning-source"><a href={definition.source.url} target="_blank" rel="noreferrer">{definition.source.label}<ExternalLink size={13}/></a><span>Źródło materiału startowego · sprawdzono 19.10.2026</span></div>}
    <div className="earning-pagination"><button className="btn secondary" disabled={index===0} onClick={()=>openChapter(EARNING_CHAPTERS[index-1].id)}><ArrowLeft size={14}/>Poprzedni</button><span>{index+1} / 6</span>{index<EARNING_CHAPTERS.length-1?<button className="btn primary" onClick={()=>openChapter(EARNING_CHAPTERS[index+1].id)}>Następny <ArrowRight size={14}/></button>:<button className="btn primary" onClick={onBack}>Baza wiedzy <BookOpen size={14}/></button>}</div>
   </article>
  </div>
  {editing&&<GuideChapterEditor draft={editing} onSave={onSave} onClose={()=>setEditing(null)}/>}
 </div>;
}

export function GuideChapterEditor({draft,onSave,onClose}:{draft:GuideInput&{active:GuideEntryId};onSave:EarningGuideProps["onSave"];onClose:()=>void}){
 const initial=draft.chapters.find(c=>c.id===draft.active)!,definition=ALL_GUIDE_CHAPTERS.find(c=>c.id===draft.active)!;
 const [body,setBody]=useState(initial.body),[example,setExample]=useState(initial.example),[busy,setBusy]=useState(false);
 const dirty=body!==initial.body||example!==initial.example;
 function close(){if(!busy&&(!dirty||window.confirm("Masz niezapisane zmiany w rozdziale. Porzucić je?")))onClose();}
 return <Modal open onClose={close} wide title={`Edytuj: ${definition.title}`} description="Zapisz swoje kroki i przykład. Zapisana treść będzie widoczna w poradniku."><form onSubmit={async e=>{e.preventDefault();setBusy(true);try{const input=earningGuideInput.parse({revision:draft.revision,chapters:draft.chapters.map(c=>c.id===draft.active?{...c,body,example}:c)});await onSave(input);toast.success("Zapisano rozdział poradnika.");onClose();}catch(e){toast.error(errorMessage(e));}finally{setBusy(false);}}}>
  <div className="earning-editor-prompts"><strong>Co możesz opisać</strong><ul>{definition.prompts.map(p=><li key={p}>{p}</li>)}</ul></div>
  <div className="form-fields earning-editor"><label>Treść rozdziału<textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={6000} rows={12} placeholder="Opisz kolejne kroki swoim językiem…" autoFocus disabled={busy}/><span className="earning-character-count">{body.length} / 6000</span></label><label>Przykład z praktyki <span className="optional">opcjonalnie</span><textarea value={example} onChange={e=>setExample(e.target.value)} maxLength={2000} rows={4} placeholder="Co znalazłeś, za ile kupiłeś i jak zakończyła się sprzedaż?" disabled={busy}/><span className="earning-character-count">{example.length} / 2000</span></label></div>
  <div className="modal-actions"><button type="button" className="btn secondary" onClick={close} disabled={busy}>Anuluj</button><button className="btn primary" disabled={busy}>{busy?<LoaderCircle size={16} className="spin"/>:<Check size={16}/>}Zapisz rozdział</button></div>
 </form></Modal>;
}
