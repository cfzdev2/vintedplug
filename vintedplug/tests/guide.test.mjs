import test from "node:test";
import assert from "node:assert/strict";
import {canEditEarningGuide} from "../lib/guide-access.ts";
import {CHAPTER_IDS,GUIDE_ENTRY_IDS,earningGuideInput,initialGuideChapters,normalizeGuideChapters} from "../lib/earning-guide.ts";

test("pierwszy zapis poradnika jest zamknięty bez wskazanego autora",()=>{
 assert.equal(canEditEarningGuide("visitor",undefined,"visitor@example.com",undefined),false);
 assert.equal(canEditEarningGuide("visitor",undefined,"visitor@example.com","author@example.com"),false);
 assert.equal(canEditEarningGuide("author-id",undefined,"author@example.com","author@example.com"),true);
});

test("odczyt wcześniejszego poradnika dodaje miejsca na metody bez zmiany zapisanej treści",()=>{
 const original=initialGuideChapters().filter(c=>CHAPTER_IDS.includes(c.id));
 original.find(c=>c.id==="method").body="Moja istniejąca metoda pozyskiwania";
 original.find(c=>c.id==="setup").body="";
 const before=JSON.stringify(original),upgraded=normalizeGuideChapters(original);
 assert.equal(upgraded.length,GUIDE_ENTRY_IDS.length);
 assert.equal(upgraded.find(c=>c.id==="method").body,"Moja istniejąca metoda pozyskiwania");
 assert.equal(upgraded.find(c=>c.id==="setup").body,"");
 assert.equal(upgraded.find(c=>c.id==="review").body,"");
 assert.equal(upgraded.find(c=>c.id==="recovery").example,"");
 assert.equal(JSON.stringify(original),before);
 assert.equal(earningGuideInput.safeParse({revision:3,chapters:upgraded}).success,true);
 // A stale client cannot save its old six chapters and erase the new methods.
 assert.equal(earningGuideInput.safeParse({revision:3,chapters:original}).success,false);
});

test("zapis jednego rozdziału zachowuje pozostałe metody autora",()=>{
 const chapters=initialGuideChapters();
 chapters.find(c=>c.id==="review").body="Moja checklista zdjęć i metek";
 chapters.find(c=>c.id==="recovery").example="Historia mojego odwołania";
 const roundTrip=earningGuideInput.parse({revision:4,chapters:normalizeGuideChapters(chapters)});
 assert.equal(roundTrip.chapters.find(c=>c.id==="review").body,"Moja checklista zdjęć i metek");
 assert.equal(roundTrip.chapters.find(c=>c.id==="recovery").example,"Historia mojego odwołania");
});
test("po pierwszym zapisie autorstwo jest związane z ID, a nie adresem e-mail",()=>{
 assert.equal(canEditEarningGuide("visitor","author-id","author@example.com","author@example.com"),false);
 assert.equal(canEditEarningGuide("author-id","author-id","changed@example.com",undefined),true);
});
test("zapis zachowuje metodę i pozostałe rozdziały, odrzuca niekompletne i obce pola",()=>{
 const chapters=initialGuideChapters();
 chapters.find(c=>c.id==="method").body="1. Moje filtry\n2. Sprawdzam ofertę";
 chapters.find(c=>c.id==="results").example="Moja rzeczywista transakcja";
 const input={revision:2,chapters},saved=earningGuideInput.parse(input);
 assert.equal(saved.chapters.find(c=>c.id==="method").body,chapters.find(c=>c.id==="method").body);
 assert.equal(saved.chapters.find(c=>c.id==="results").example,"Moja rzeczywista transakcja");
 assert.equal(earningGuideInput.safeParse({...input,owner:"visitor"}).success,false);
 assert.equal(earningGuideInput.safeParse({...input,chapters:chapters.slice(1)}).success,false);
 assert.equal(earningGuideInput.safeParse({...input,chapters:chapters.map(c=>c.id==="results"?{...c,id:"method"}:c)}).success,false);
 assert.equal(earningGuideInput.safeParse({...input,chapters:chapters.map(c=>({...c,body:"a".repeat(6001)}))}).success,false);
});
