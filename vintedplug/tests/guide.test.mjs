import test from "node:test";
import assert from "node:assert/strict";
import {canEditEarningGuide} from "../lib/guide-access.ts";
import {earningGuideInput,initialGuideChapters} from "../lib/earning-guide.ts";

test("pierwszy zapis poradnika jest zamknięty bez wskazanego autora",()=>{
 assert.equal(canEditEarningGuide("visitor",undefined,"visitor@example.com",undefined),false);
 assert.equal(canEditEarningGuide("visitor",undefined,"visitor@example.com","author@example.com"),false);
 assert.equal(canEditEarningGuide("author-id",undefined,"author@example.com","author@example.com"),true);
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
