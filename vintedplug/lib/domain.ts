import {z} from "zod/v3";
import type {EarningGuide} from "./earning-guide";
export const STATUSES={draft:"Szkic",listed:"Wystawione",sold:"Sprzedane",returned:"Zwrot"} as const;
export type Status=keyof typeof STATUSES;
export function itemStatusOptions(previousStatus?:string):Status[]{
 const options:Status[]=["draft","listed"];
 if(previousStatus)options.push("sold");
 if(previousStatus==="sold"||previousStatus==="returned")options.push("returned");
 return options;
}
export function itemStatusIssue(status:Status,previousStatus?:string){
 if(itemStatusOptions(previousStatus).includes(status))return null;
 return previousStatus?"Zwrot możesz oznaczyć dopiero po zapisanej sprzedaży.":"Nową rzecz dodaj jako szkic lub wystawioną. Sprzedaż oznaczysz później w magazynie.";
}
const money=z.number().int().min(0).max(100_000_000);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+"T12:00:00Z");return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;},"Nieprawidłowa data");
export const accountInput=z.object({id:z.string().max(80).optional(),name:z.string().trim().min(1).max(60),handle:z.string().trim().max(80).default(""),color:z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#006676")});
export const itemInput=z.object({
 id:z.string().max(80).optional(),revision:z.number().int().positive().optional(),accountId:z.string().min(1).max(80),name:z.string().trim().min(1).max(140),brand:z.string().trim().max(80).default(""),category:z.string().max(80).default("Inne"),size:z.string().max(30).default(""),condition:z.string().max(50).default("Bardzo dobry"),
 description:z.string().max(5000).default(""),measurements:z.string().max(1000).default(""),flaws:z.string().max(1000).default(""),location:z.string().max(100).default(""),purchasePrice:money,extraCost:money,listPrice:money,salePrice:money.nullable(),minimumProfit:money,status:z.enum(["draft","listed","sold","returned"]),purchaseDate:date,listDate:date.nullable(),saleDate:date.nullable(),imageIds:z.array(z.string().max(80)).max(12).default([]),illustration:z.enum(["hoodie","jacket","shirt","jeans"]).default("hoodie"),
}).superRefine((v,c)=>{if(v.status==="sold"&&(!v.saleDate||v.salePrice===null||v.salePrice<=0))c.addIssue({code:z.ZodIssueCode.custom,message:"Dla sprzedaży podaj cenę i datę.",path:["salePrice"]});});
export const expenseInput=z.object({id:z.string().max(80).optional(),accountId:z.string().min(1).max(80),label:z.string().trim().min(1).max(140),amount:money.refine(n=>n>0),date,category:z.string().max(60).default("Inne")});
export type Account={id:string;name:string;handle:string;color:string;createdAt:string};
export type Item=Omit<z.infer<typeof itemInput>,"id"|"revision">&{id:string;revision:number;createdAt:string;updatedAt:string};
export type Expense=z.infer<typeof expenseInput>&{id:string;createdAt:string};
export type Workspace={accounts:Account[];items:Item[];expenses:Expense[];earningGuide:EarningGuide|null;config:{textAI:boolean;imageAI:boolean;guideEditor:boolean}};
export const emptyWorkspace:Workspace={accounts:[],items:[],expenses:[],earningGuide:null,config:{textAI:false,imageAI:false,guideEditor:false}};
export function today(){return new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Warsaw"}).format(new Date());}
export function formatMoney(cents:number,digits=2){return new Intl.NumberFormat("pl-PL",{style:"currency",currency:"PLN",minimumFractionDigits:digits,maximumFractionDigits:digits}).format(cents/100);}
export function parseMoney(input:string){const s=input.trim().replace(/\s/g,"").replace(",",".");if(!/^\d+(\.\d{0,2})?$/.test(s))throw new Error("Podaj kwotę z maksymalnie dwoma miejscami po przecinku.");const [whole,dec=""]=s.split(".");const n=Number(whole)*100+Number(dec.padEnd(2,"0"));if(!Number.isSafeInteger(n)||n>100_000_000)throw new Error("Kwota jest zbyt duża.");return n;}
export function itemCost(i:Pick<Item,"purchasePrice"|"extraCost">){return i.purchasePrice+i.extraCost;}
export function itemProfit(i:Item){return i.status==="sold"?(i.salePrice??0)-itemCost(i):null;}
export type Period={from:string;to:string};
export function inPeriod(d:string|null,p:Period){return !!d&&d>=p.from&&d<=p.to;}
export function metrics(items:Item[],expenses:Expense[],p:Period){
 const sold=items.filter(i=>i.status==="sold"&&inPeriod(i.saleDate,p)),revenue=sold.reduce((s,i)=>s+(i.salePrice??0),0),soldCost=sold.reduce((s,i)=>s+itemCost(i),0),overhead=expenses.filter(e=>inPeriod(e.date,p)).reduce((s,e)=>s+e.amount,0),purchases=items.filter(i=>inPeriod(i.purchaseDate,p)).reduce((s,i)=>s+itemCost(i),0),inventory=items.filter(i=>i.status!=="sold").reduce((s,i)=>s+itemCost(i),0);
 return {revenue,profit:revenue-soldCost-overhead,overhead,purchases,spending:purchases+overhead,soldCount:sold.length,activeCount:items.filter(i=>i.status==="listed").length,draftCount:items.filter(i=>i.status==="draft").length,returnedCount:items.filter(i=>i.status==="returned").length,inventoryCount:items.filter(i=>i.status!=="sold").length,inventory,cashflow:revenue-purchases-overhead,margin:revenue?Math.round((revenue-soldCost-overhead)/revenue*100):null};
}
export function monthPeriod(d=today()):Period{return {from:d.slice(0,7)+"-01",to:new Date(Date.UTC(Number(d.slice(0,4)),Number(d.slice(5,7)),0)).toISOString().slice(0,10)};}
export function customPeriodIssue(from:string,to:string){
 if(!date.safeParse(from).success||!date.safeParse(to).success)return "Wybierz prawidłową datę początku i końca okresu.";
 return to<from?"Data końca nie może być wcześniejsza niż data początku.":null;
}
export function reportPeriod(kind:string,data:Pick<Workspace,"items"|"expenses">,from:string,to:string,day=today()):Period{
 if(kind==="month")return monthPeriod(day);
 if(kind==="previous"){const d=new Date(day+"T12:00:00Z");d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-1);return monthPeriod(d.toISOString().slice(0,10));}
 if(kind==="30"){const d=new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-29);return {from:d.toISOString().slice(0,10),to:day};}
 if(kind==="all"){const dates=[...data.items.map(i=>i.purchaseDate),...data.items.map(i=>i.saleDate).filter((d):d is string=>!!d),...data.expenses.map(e=>e.date),day].sort();return {from:dates[0],to:dates[dates.length-1]};}
 // Keep consumers safe while custom date inputs are incomplete; the UI hides the report and export until valid.
 return customPeriodIssue(from,to)?{from:day,to:day}:{from,to};
}
export function descriptionTemplate(i:Item){return [i.name,[i.brand&&`Marka: ${i.brand}`,i.size&&`Rozmiar z metki: ${i.size}`,`Stan: ${i.condition}`].filter(Boolean).join("\n"),i.measurements&&`Wymiary:\n${i.measurements}`,i.flaws&&`Wady / ślady użytkowania: ${i.flaws}`].filter(Boolean).join("\n\n");}
export function replyTemplate(i:Item,q:string){
 if(/wymiar|szerok|długo|dlugo|pasie|rękaw|rekaw/i.test(q))return i.measurements?`Cześć! Wymiary tej rzeczy: ${i.measurements}.`:"[Uzupełnij wymiary w karcie rzeczy, aby przygotować odpowiedź].";
 if(/wady|wadę|wada|plam|uszkodz|przetar/i.test(q))return i.flaws?`Cześć! Zapisane ślady użytkowania: ${i.flaws}.`:"[Potwierdź stan rzeczy i uzupełnij pole Wady. Brak wpisu nie oznacza braku wad].";
 if(/rozmiar|metce/i.test(q))return i.size?`Cześć! Na metce jest rozmiar ${i.size}.${i.measurements?` Wymiary: ${i.measurements}.`:""}`:"[Uzupełnij rozmiar w karcie rzeczy].";
 return "Cześć! Dzięki za wiadomość. [Uzupełnij odpowiedź po sprawdzeniu informacji].";
}
