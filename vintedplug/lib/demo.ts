import {type Workspace,type Item,today} from "./domain";
export function demoWorkspace():Workspace{
 const now=today(),month=now.slice(0,7),previous=new Date(Date.UTC(Number(now.slice(0,4)),Number(now.slice(5,7))-2,15)).toISOString().slice(0,7);
 const rows:[string,string,string,string,number,number,number,string][]=[
 ["Bluza Carhartt z haftem","Carhartt","XL","hoodie",5500,13900,0,"listed"],
 ["Kurtka Nike z wysoką stójką","Nike","M","jacket",6500,15900,0,"listed"],
 ["Koszula Ralph Lauren oxford","Ralph Lauren","L","shirt",4000,11900,0,"draft"],
 ["Jeansy Levi’s 501 straight","Levi’s","W32","jeans",5000,12900,11900,"sold"],
 ["Bluza Champion reverse weave","Champion","L","hoodie",3500,11900,10900,"sold"],
 ["Kurtka vintage w kolorze khaki","Vintage","L","jacket",4500,14900,13900,"sold"],
 ["Koszula Tommy Hilfiger","Tommy Hilfiger","M","shirt",2500,9900,8900,"sold"],
 ["Jeansy Levi’s 505 regular","Levi’s","W34","jeans",4000,11900,10900,"sold"],
 ["Bluza Nike crewneck","Nike","M","hoodie",3000,9900,9500,"sold"],
 ["Kurtka Carhartt workwear","Carhartt","XL","jacket",9500,27900,24900,"sold"],
 ["Koszula Polo Ralph Lauren","Ralph Lauren","L","shirt",3500,12900,12000,"sold"],
 ["Bluza vintage college","Vintage","L","hoodie",2800,10900,0,"listed"],
 ["Jeansy Wrangler regular","Wrangler","W32","jeans",3200,9900,0,"listed"],
 ["Kurtka przejściowa Reebok","Reebok","M","jacket",4500,12900,0,"listed"],
 ];
 const items=rows.map((r,n)=>({id:`demo-${n}`,accountId:n>11?"demo-vintage":"demo-main",name:r[0],brand:r[1],size:r[2],illustration:r[3],category:r[3]==="jacket"?"Kurtki":r[3]==="shirt"?"Koszule":r[3]==="jeans"?"Spodnie":"Bluzy",condition:"Bardzo dobry",description:"",measurements:"Szerokość pod pachami: 60 cm\nDługość całkowita: 72 cm",flaws:"Drobne ślady użytkowania widoczne na zdjęciach.",location:`Pudło ${n%2?"A":"B"}`,purchasePrice:r[4],extraCost:500,listPrice:r[5],salePrice:r[6]||null,minimumProfit:3500,status:r[7],purchaseDate:`${previous}-${String(n+10).padStart(2,"0")}`,listDate:`${month}-01`,saleDate:r[6]?`${month}-${String(1+n%Math.max(1,Number(now.slice(-2)))).padStart(2,"0")}`:null,imageIds:[],createdAt:now,updatedAt:now,revision:1})) as Item[];
 return {accounts:[{id:"demo-main",name:"Moja szafa",handle:"@vintedplug",color:"#006676",createdAt:now},{id:"demo-vintage",name:"Vintage finds",handle:"@vintage.finds",color:"#65adbf",createdAt:now}],items,expenses:[{id:"demo-exp-1",accountId:"demo-main",label:"Opakowania i taśma",amount:3500,date:month+"-03",category:"Pakowanie",createdAt:now},{id:"demo-exp-2",accountId:"demo-main",label:"Podbicie ogłoszeń",amount:1500,date:month+"-08",category:"Promowanie",createdAt:now}],earningGuide:null,config:{textAI:false,imageAI:false,guideEditor:false}};
}
