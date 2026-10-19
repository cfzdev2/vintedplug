"use client";

import {useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,ArrowUpRight,BookOpen,Camera,CheckCircle2,Clock3,ExternalLink,FileCheck2,Lightbulb,PackageSearch,Pencil,RotateCcw,Search,ShieldCheck,TrendingUp,Wallet,X} from "lucide-react";
import {ALL_GUIDE_CHAPTERS,initialGuideChapters,type GuideInput,type GuideEntryId} from "@/lib/earning-guide";
import {KNOWLEDGE_REVIEWED_AT,KNOWLEDGE_SOURCES,KNOWLEDGE_TOPICS,knowledgeMatches,type KnowledgeTopic} from "@/lib/knowledge-base";
import {EarningGuideCard,EarningGuideReader,GuideChapterEditor,type EarningGuideProps} from "./earning-guide";

const icons={sales:TrendingUp,money:Wallet,shield:ShieldCheck,review:FileCheck2,recovery:RotateCcw,stock:PackageSearch};
const categories=["Wszystkie","Moje metody","Sprzedaż","Finanse","Moderacja"];
const checkedDate=new Date(KNOWLEDGE_REVIEWED_AT+"T12:00:00Z").toLocaleDateString("pl-PL");

export function KnowledgeBase(props:EarningGuideProps){
 const [active,setActive]=useState<string|null>(null),[course,setCourse]=useState(false),[category,setCategory]=useState("Wszystkie"),[query,setQuery]=useState("");
 const top=useRef<HTMLDivElement>(null);
 const chapters=props.guide?.chapters??initialGuideChapters();
 const topic=KNOWLEDGE_TOPICS.find(t=>t.id===active);
 function open(id:string|null){setActive(id);requestAnimationFrame(()=>top.current?.scrollIntoView({block:"start"}));}
 if(course)return <EarningGuideReader {...props} onBack={()=>setCourse(false)}/>;
 const filtered=KNOWLEDGE_TOPICS.filter(t=>(category==="Wszystkie"||t.category===category)&&knowledgeMatches(t,query));
 const groups=[{id:"methods",title:"Metody autora",description:"Autorskie procesy, kroki i przykłady z praktyki.",topics:filtered.filter(t=>t.methodId)},{id:"guides",title:"Zasady i poradniki",description:"Regulamin Vinted, bezpieczeństwo i finanse.",topics:filtered.filter(t=>!t.methodId)}];
 return <div className="knowledge-base" ref={top}>
  {topic?<TopicReader key={topic.id} {...props} topic={topic} onBack={()=>open(null)} onOpen={open} onCourse={()=>setCourse(true)}/>:<>
   <section className="guide-intro knowledge-intro"><div><span className="section-kicker">BAZA WIEDZY VINTEDPLUG</span><h2>Wiedza, którą wykorzystasz<br/>przy kolejnej sprzedaży.</h2><p>Zasady Vinted, finanse i Twoje metody. Praktyczne kroki, źródła i przykłady w jednym miejscu.</p><div className="knowledge-intro-meta"><span><BookOpen size={14}/>6 tematów</span><span><Pencil size={14}/>3 metody autora</span><span><CheckCircle2 size={14}/>Źródła sprawdzone {checkedDate}</span></div></div><BookOpen size={70} strokeWidth={1}/></section>
   <div className="knowledge-toolbar"><div className="guide-filters filter-tabs" aria-label="Kategorie bazy wiedzy">{categories.map(c=><button key={c} className={category===c?"active":""} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="knowledge-search"><Search size={16}/><input aria-label="Szukaj w bazie wiedzy" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Szukaj, np. DAC7 lub ban"/>{query&&<button className="icon-btn" onClick={()=>setQuery("")} aria-label="Wyczyść wyszukiwanie"><X size={14}/></button>}</label></div>
   <p className="knowledge-result-count" role="status">{filtered.length} z 6 tematów</p>
   {groups.map(group=>!!group.topics.length&&<section key={group.id} className={`knowledge-topic-group ${group.id==="methods"?"knowledge-methods-group":""}`} aria-labelledby={`kb-group-${group.id}`}><div className="knowledge-group-heading"><h3 id={`kb-group-${group.id}`}>{group.id==="methods"&&<Pencil size={17}/>} {group.title}</h3><p>{group.description}</p></div><div className="guide-grid knowledge-topic-grid">{group.topics.map(t=>{const Icon=icons[t.icon],written=t.methodId&&!!chapters.find(c=>c.id===t.methodId)?.body.trim();return <button key={t.id} className={`panel guide-card knowledge-topic-card ${t.methodId?"knowledge-method-card":""}`} onClick={()=>open(t.id)}><div className="knowledge-card-top"><span className="guide-icon"><Icon size={23}/></span><span className={`knowledge-badge ${t.methodId?"author":""}`}>{t.methodId?"Metoda autora":"Ze źródłami"}</span></div><small>{t.minutes} min · {t.methodId?(written?"Treść dodana":"Do uzupełnienia"):t.category}</small><h3>{t.title}</h3><p>{t.description}</p><span className="text-button">{t.methodId&&!written?"Otwórz temat":"Przeczytaj"}<ArrowUpRight size={15}/></span></button>;})}</div></section>)}
   {!filtered.length&&<div className="panel knowledge-empty"><Search size={26}/><h3>Nie znaleziono tematu</h3><p>Spróbuj innej frazy lub pokaż wszystkie kategorie.</p><button className="btn secondary" onClick={()=>{setQuery("");setCategory("Wszystkie");}}>Pokaż wszystkie</button></div>}
   {!query&&(category==="Wszystkie"||category==="Sprzedaż"||category==="Moje metody")&&<div className="knowledge-course"><div className="knowledge-section-heading"><h3>Pełny poradnik zarabiania</h3><span>Wyszukiwanie → zakup → sprzedaż → wnioski</span></div><EarningGuideCard onOpen={()=>{setCourse(true);requestAnimationFrame(()=>top.current?.scrollIntoView({block:"start"}));}}/></div>}
   <QuickGuides/>
  </>}
 </div>;
}

function TopicReader({topic,onBack,onOpen,onCourse,...props}:EarningGuideProps&{topic:KnowledgeTopic;onBack:()=>void;onOpen:(id:string)=>void;onCourse:()=>void}){
 const [editing,setEditing]=useState<(GuideInput&{active:GuideEntryId})|null>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const chapters=props.guide?.chapters??initialGuideChapters(),chapter=chapters.find(c=>c.id===topic.methodId),definition=ALL_GUIDE_CHAPTERS.find(c=>c.id===topic.methodId),index=KNOWLEDGE_TOPICS.findIndex(t=>t.id===topic.id);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[]);
 function edit(){if(topic.methodId)setEditing({active:topic.methodId,revision:props.guide?.revision??0,chapters:chapters.map(c=>({...c}))});}
 return <div className="knowledge-reader">
  <div className="earning-topline"><button className="text-button" onClick={onBack}><ArrowLeft size={15}/>Wróć do bazy wiedzy</button><span>Oficjalne źródła · sprawdzono {checkedDate}</span></div>
  <header className="knowledge-reader-heading"><span className="section-kicker">{topic.category.toLocaleUpperCase("pl-PL")} · TEMAT {String(index+1).padStart(2,"0")} / 06</span><h2 tabIndex={-1} ref={heading}>{topic.title}</h2><p>{topic.description}</p><span className="knowledge-reading-time"><Clock3 size={14}/>{topic.minutes} min czytania</span></header>
  <div className="knowledge-reading-layout">
   <aside className="panel knowledge-toc"><h3>W tym temacie</h3><ol>{topic.sections.map((s,n)=><li key={s.title}><a href={`#kb-${topic.id}-${n}`}>{s.title}</a></li>)}{topic.methodId&&<li><a href={`#kb-${topic.id}-method`}>Treść autora</a></li>}</ol><button className="text-button" onClick={onBack}>Wszystkie tematy <ArrowRight size={14}/></button></aside>
   <article className="panel knowledge-article">
    <aside className="knowledge-takeaway"><Lightbulb size={20}/><p>{topic.takeaway}</p></aside>
    {topic.sections.map((section,n)=><section className="knowledge-section" key={section.title} id={`kb-${topic.id}-${n}`}><h3>{section.title}</h3>{section.paragraphs?.map(p=><p key={p}>{p}</p>)}{section.bullets&&<ul>{section.bullets.map(p=><li key={p}>{p}</li>)}</ul>}{section.table&&<div className="knowledge-table-scroll"><table><thead><tr>{section.table.headings.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{section.table.rows.map(row=><tr key={row[0]}>{row.map((cell,i)=>i===0?<th key={i} scope="row">{cell}</th>:<td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}{section.sources&&<div className="knowledge-sources" aria-label="Źródła tej części">{section.sources.map(id=><a key={id} href={KNOWLEDGE_SOURCES[id].url} target="_blank" rel="noreferrer">{KNOWLEDGE_SOURCES[id].label}<ExternalLink size={12}/></a>)}</div>}</section>)}
    {topic.methodId&&chapter&&definition&&<section className="knowledge-author-section" id={`kb-${topic.id}-method`}>
     <div className="knowledge-author-heading"><div><span className="section-kicker">MATERIAŁ AUTORSKI</span><h3>{props.canEdit?"Twoja metoda, Twoje przykłady":"Metoda autora i przykłady"}</h3></div>{props.canEdit&&<button className="btn secondary" disabled={props.demo} onClick={edit}><Pencil size={14}/>{chapter.body.trim()?"Edytuj treść":"Dodaj swoją metodę"}</button>}</div>
     {props.demo&&props.canEdit&&<div className="earning-demo-note"><span>Aby zapisać metodę, włącz własny panel.</span><button className="text-button" onClick={props.enableOwn}>Włącz własny panel <ArrowRight size={14}/></button></div>}
     {chapter.body.trim()?<div className="earning-prose">{chapter.body}</div>:<div className="earning-empty"><Pencil size={23} className="earning-empty-icon"/><h3>{props.canEdit?"Miejsce na Twój opis":"Metoda w przygotowaniu"}</h3><p>{props.canEdit?"Dodaj kroki oraz rzeczywisty przykład. Treść zostanie zapisana w Bazie wiedzy.":"W tym miejscu pojawią się kroki i przykłady autora."}</p>{props.canEdit&&<ul>{definition.prompts.map(p=><li key={p}>{p}</li>)}</ul>}</div>}
     {chapter.example.trim()&&<aside className="earning-example"><h3><Lightbulb size={17}/>Przykład z praktyki</h3><div className="earning-prose">{chapter.example}</div></aside>}
     {props.guide&&<p className="knowledge-author-date">Ostatni zapis materiałów autora: {new Date(props.guide.updatedAt).toLocaleString("pl-PL",{dateStyle:"short",timeStyle:"short",timeZone:"Europe/Warsaw"})}</p>}
     {topic.relatedCourse&&<button className="text-button knowledge-course-link" onClick={onCourse}>Przejdź do pełnego poradnika <BookOpen size={15}/></button>}
    </section>}
    <div className="earning-pagination"><button className="btn secondary" onClick={index===0?onBack:()=>onOpen(KNOWLEDGE_TOPICS[index-1].id)}><ArrowLeft size={14}/>{index===0?"Baza wiedzy":"Poprzedni"}</button><span>{index+1} / 6</span>{index<KNOWLEDGE_TOPICS.length-1?<button className="btn primary" onClick={()=>onOpen(KNOWLEDGE_TOPICS[index+1].id)}>Następny <ArrowRight size={14}/></button>:<button className="btn primary" onClick={onBack}>Wszystkie tematy <BookOpen size={14}/></button>}</div>
   </article>
  </div>
  {editing&&<GuideChapterEditor draft={editing} onSave={props.onSave} onClose={()=>setEditing(null)}/>}
 </div>;
}

const quickGuides=[
 {title:"Zdjęcia, które pokazują wszystko",icon:Camera,steps:["Pokaż przód, tył, metkę, detale oraz wady. Zadbaj o wyraźne zdjęcia całej rzeczy w naturalnym świetle.","Porównaj zdjęcia z przedmiotem: kolor i stan powinny odpowiadać rzeczywistości."]},
 {title:"Opis bez zbędnych pytań",icon:BookOpen,steps:["Podaj rzeczywistą markę, rozmiar z metki, wymiary oraz ślady użytkowania.","Sprawdź szablon lub wygenerowany tekst przed skopiowaniem go do ogłoszenia."]},
 {title:"Obrót, wynik i zapasy",icon:Wallet,steps:["Obrót w panelu to suma cen sprzedanych rzeczy w okresie. Wynik odejmuje ich zapisane koszty oraz wydatki konta z okresu.","Niesprzedane rzeczy są zapasami według zapisanych kosztów. Cena wystawienia nie jest przychodem."]},
 {title:"Negocjuj ze swoim minimum",icon:TrendingUp,steps:["Zapisz koszt zakupu, przygotowania i oczekiwany minimalny zarobek.","W Asystencie otwórz Negocjacje i sprawdź propozycję kupującego. Ostateczną cenę wybierasz sam."]},
 {title:"Kontrola zdjęcia po użyciu AI",icon:FileCheck2,steps:["Zachowaj oryginał i porównaj kolor, nadruk, fakturę, krój oraz widoczność wad.","Przed publikacją sprawdź aktualne instrukcje Vinted. Szczegóły zasad znajdziesz w temacie o ryzyku blokady powyżej."]},
 {title:"Bezpieczna komunikacja",icon:ShieldCheck,steps:["Sprawdzaj adres strony przed logowaniem. Nie przekazuj kupującym hasła, kodów weryfikacyjnych ani danych logowania do banku.","Przy problemie z ofertą odczytaj komunikat Vinted i korzystaj z oficjalnej pomocy."]},
];
function QuickGuides(){return <details className="panel knowledge-quick"><summary><span><BookOpen size={18}/>Szybkie wskazówki do codziennej pracy</span><span>6 krótkich porad</span></summary><div className="knowledge-quick-grid">{quickGuides.map(g=><section key={g.title}><g.icon size={20}/><h3>{g.title}</h3><ol>{g.steps.map(s=><li key={s}>{s}</li>)}</ol></section>)}</div></details>;}
