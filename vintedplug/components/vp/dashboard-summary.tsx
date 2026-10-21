"use client";
import {ArrowUpRight,ArrowDownLeft,TrendingUp,TrendingDown,Package,Shirt,CheckCircle2,Pencil,RefreshCw,CalendarDays,ChevronRight,Info} from "lucide-react";
import {formatMoney,type Period,metrics} from "@/lib/domain";

type Values=ReturnType<typeof metrics>;
function fullDate(value:string){return new Date(value+"T12:00:00Z").toLocaleDateString("pl-PL",{day:"numeric",month:"short",year:"numeric"});}

export function FinancialSummary({values:m,period,accountName}:{values:Values;period:Period;accountName:string}){
 const cards=[
  {label:"Obrót",value:m.revenue,icon:ArrowUpRight,detail:"Suma cen sprzedanych rzeczy",className:"",now:false},
  {label:"Zysk",value:m.profit,icon:m.profit<0?TrendingDown:TrendingUp,detail:m.margin===null?"Po kosztach · przed podatkiem":`${m.margin}% marży · przed podatkiem`,className:"profit",now:false},
  {label:"Wydatki",value:m.spending,icon:ArrowDownLeft,detail:"Zakupy towaru + koszty konta",className:"",now:false},
  {label:"Pieniądze w towarze",value:m.inventory,icon:Package,detail:`Koszt niesprzedanych rzeczy: ${m.inventoryCount}`,className:"inventory",now:true},
 ];
 return <section className="report-summary" aria-label={`Podsumowanie: ${accountName}`}>
  <div className="report-heading"><div><span className="section-kicker">PODSUMOWANIE SPRZEDAŻY</span><h2>{accountName}</h2></div><p><CalendarDays size={14}/><span>{fullDate(period.from)} – {fullDate(period.to)}</span></p></div>
  <div className="metrics-grid">{cards.map(c=><section className={`metric-card ${c.className}`} key={c.label} aria-label={c.label}><div className="metric-top"><span>{c.label}</span><span className="metric-icon"><c.icon size={18}/></span></div><div className={`metric-value ${c.value<0?"loss":""}`}>{formatMoney(c.value)}</div><div className="metric-detail"><span className={`metric-time ${c.now?"now":""}`}>{c.now?"TERAZ":"W OKRESIE"}</span><span>{c.detail}</span></div></section>)}</div>
  <details className="report-explainer"><summary><Info size={14}/>Jak czytać te liczby?</summary><div className="report-explainer-body"><dl><div><dt>Obrót</dt><dd>Sprzedaże według daty sprzedaży w wybranym okresie.</dd></div><div><dt>Zysk</dt><dd>Obrót minus koszt sprzedanych rzeczy i dodatkowe wydatki konta. Przed podatkiem i kosztami, których nie zapisano.</dd></div><div><dt>Wydatki</dt><dd>Zakupy z danego okresu wraz z kosztami rzeczy: {formatMoney(m.purchases)}. Dodatkowe wydatki konta: {formatMoney(m.overhead)}. Zakup niesprzedanej rzeczy nie pomniejsza jeszcze zysku.</dd></div><div><dt>Pieniądze w towarze</dt><dd>Koszt zakupu i dodatkowe koszty wszystkich niesprzedanych rzeczy, w tym szkiców i zwrotów. To stan teraz, niezależny od zakresu dat.</dd></div></dl></div></details>
 </section>;
}

export function InventorySummary({values:m,openItems,openSales}:{values:Values;openItems:(status:"listed"|"draft"|"returned")=>void;openSales:()=>void}){
 const entries=[
  {label:"Wystawione",value:m.activeCount,scope:"Stan teraz",icon:Shirt,action:()=>openItems("listed")},
  {label:"Sprzedane",value:m.soldCount,scope:"Wybrany okres",icon:CheckCircle2,action:openSales},
  {label:"Szkice",value:m.draftCount,scope:"Stan teraz",icon:Pencil,action:()=>openItems("draft")},
  {label:"Zwroty",value:m.returnedCount,scope:"Stan teraz",icon:RefreshCw,action:()=>openItems("returned")},
 ];
 return <section className="inventory-summary" aria-label="Przedmioty i sprzedaże">{entries.map(e=><button key={e.label} onClick={e.action} className="inventory-summary-button"><span className="inventory-summary-icon"><e.icon size={18}/></span><span className="inventory-summary-text"><span>{e.label}</span><small>{e.scope}</small></span><strong>{e.value}</strong><ChevronRight size={15}/></button>)}</section>;
}
