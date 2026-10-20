import test from "node:test";
import assert from "node:assert/strict";
import {metrics,parseMoney,itemInput,itemProfit,descriptionTemplate,itemStatusOptions,itemStatusIssue} from "../lib/domain.ts";
const period={from:"2026-10-01",to:"2026-10-31"};
const item={id:"item-a",accountId:"account-a",name:"Bluza",brand:"",category:"Bluzy",size:"L",condition:"Dobry",description:"",measurements:"",flaws:"Mała plama",location:"",purchasePrice:4500,extraCost:500,listPrice:9000,salePrice:null,minimumProfit:2500,status:"listed",purchaseDate:"2026-10-02",listDate:"2026-10-03",saleDate:null,imageIds:[],illustration:"hoodie",createdAt:"2026-10-02",updatedAt:"2026-10-02",revision:1};
test("niesprzedany zakup zwiększa wydatki i zapasy, nie pomniejsza wyniku sprzedaży",()=>{
 const m=metrics([item],[],period);assert.equal(m.revenue,0);assert.equal(m.spending,5000);assert.equal(m.inventory,5000);assert.equal(m.profit,0);assert.equal(m.cashflow,-5000);
});
test("sprzedaż pomniejsza wynik o koszt rzeczy dokładnie raz",()=>{
 const sold={...item,status:"sold",salePrice:9000,saleDate:"2026-10-10"};
 const m=metrics([sold],[{amount:1000,date:"2026-10-12"}],period);
 assert.equal(m.revenue,9000);assert.equal(m.profit,3000);assert.equal(m.inventory,0);assert.equal(m.spending,6000);assert.equal(m.cashflow,3000);
});
test("sprzedaż rzeczy zakupionej w poprzednim okresie uwzględnia jej koszt we wyniku",()=>{
 const m=metrics([{...item,purchaseDate:"2026-09-05",status:"sold",salePrice:9000,saleDate:"2026-10-10"}],[],period);
 assert.equal(m.profit,4000);assert.equal(m.spending,0);assert.equal(m.cashflow,9000);
});
test("zwrot wycofuje sprzedaż ze zestawienia i przywraca rzecz do zapasów",()=>{
 const returned={...item,status:"returned",salePrice:9000,saleDate:"2026-10-10"};const m=metrics([returned],[],period);
 assert.equal(m.revenue,0);assert.equal(m.profit,0);assert.equal(m.inventory,5000);assert.equal(itemProfit(returned),null);
});
test("zestawienia kont pozostają oddzielne po przeniesieniu rzeczy",()=>{
 const sold={...item,status:"sold",salePrice:9000,saleDate:"2026-10-10",accountId:"account-b"};
 assert.equal(metrics([sold].filter(i=>i.accountId==="account-a"),[],period).revenue,0);
 assert.equal(metrics([sold].filter(i=>i.accountId==="account-b"),[],period).revenue,9000);
});
test("zmiana ceny lub usunięcie sprzedaży przelicza wynik bez dodatkowych wpisów",()=>{
 const sold={...item,status:"sold",salePrice:8000,saleDate:"2026-10-10"};assert.equal(metrics([sold],[],period).profit,3000);assert.equal(metrics([],[],period).profit,0);
});
test("daty sprzedaży i wydatków ograniczają wyniki, zapasy pokazują stan teraz",()=>{
 const m=metrics([{...item,status:"sold",salePrice:9000,saleDate:"2026-09-30"},item],[{amount:900,date:"2026-09-30"}],period);
 assert.equal(m.revenue,0);assert.equal(m.overhead,0);assert.equal(m.inventory,5000);
});
test("kwoty są parsowane jako dokładne grosze",()=>{
 assert.equal(parseMoney("133,14"),13314);assert.equal(parseMoney("0.29"),29);assert.equal(parseMoney("1 234,50"),123450);assert.throws(()=>parseMoney("1,005"));assert.throws(()=>parseMoney("-5"));
});
test("walidacja wymaga ceny i daty sprzedaży oraz prawidłowych dat kalendarza",()=>{
 assert.equal(itemInput.safeParse({...item,status:"sold"}).success,false);
 assert.equal(itemInput.safeParse({...item,purchaseDate:"2026-02-31"}).success,false);
 assert.equal(itemInput.safeParse({...item,status:"sold",salePrice:9000,saleDate:"2026-10-10"}).success,true);
});
test("szablon zachowuje wady i nie dopisuje deklaracji oryginalności",()=>{
 const text=descriptionTemplate(item);assert.ok(text.includes("Mała plama"));assert.ok(!text.includes("oryginalna"));assert.ok(!text.includes("bez wad"));
});
test("nowa rzecz może być szkicem lub wystawiona i nie wymaga szczegółów ogłoszenia",()=>{
 const {id,revision,...newItem}=item;
 for(const status of ["draft","listed"]){
  const parsed=itemInput.parse({...newItem,status,measurements:"",flaws:"",description:""});
  assert.equal(itemStatusIssue(parsed.status),null);
 }
 // Nawet kompletne dane sprzedaży nie pozwalają ominąć pierwszego zapisu w magazynie.
 for(const status of ["sold","returned"]){
  const parsed=itemInput.parse({...newItem,status,salePrice:9000,saleDate:"2026-10-10"});
  assert.ok(itemStatusIssue(parsed.status));
  assert.ok(!itemStatusOptions().includes(status));
 }
});
test("zwrot wymaga wcześniej zapisanej sprzedaży, nie wystarczy wybrać jej w tym samym formularzu",()=>{
 for(const previous of ["draft","listed"]){
  assert.equal(itemStatusIssue("sold",previous),null);
  assert.ok(itemStatusIssue("returned",previous));
  assert.ok(!itemStatusOptions(previous).includes("returned"));
 }
 assert.equal(itemStatusIssue("returned","sold"),null);
});
test("sprzedaż, zwrot i ponowne wystawienie przeliczają ten sam przedmiot bez podwójnego obrotu",()=>{
 const sold=itemInput.parse({...item,status:"sold",salePrice:9000,saleDate:"2026-10-10"});
 assert.equal(itemStatusIssue(sold.status,item.status),null);
 assert.equal(metrics([sold],[],period).revenue,9000);
 const returned=itemInput.parse({...sold,status:"returned",salePrice:null,saleDate:null});
 assert.equal(itemStatusIssue(returned.status,sold.status),null);
 assert.equal(metrics([returned],[],period).revenue,0);
 assert.equal(metrics([returned],[],period).inventory,5000);
 const relisted=itemInput.parse({...returned,status:"listed"});
 assert.equal(itemStatusIssue(relisted.status,returned.status),null);
 assert.ok(itemStatusIssue("returned",relisted.status));
 const resold=itemInput.parse({...relisted,status:"sold",salePrice:8500,saleDate:"2026-10-20"});
 assert.equal(itemStatusIssue(resold.status,relisted.status),null);
 assert.equal(metrics([resold],[],period).revenue,8500);
 assert.equal(metrics([resold],[],period).profit,3500);
});
test("istniejące sprzedaże i zwroty pozostają edytowalne, status można też skorygować",()=>{
 assert.equal(itemStatusIssue("sold","sold"),null);
 assert.equal(itemStatusIssue("returned","returned"),null);
 for(const previous of ["sold","returned"]){
  assert.equal(itemStatusIssue("draft",previous),null);
  assert.equal(itemStatusIssue("listed",previous),null);
 }
});
