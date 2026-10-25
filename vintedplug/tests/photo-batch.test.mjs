import test from "node:test";
import assert from "node:assert/strict";
import {runPhotoQueue,replaceBatchPhotos,savePhotoBatch} from "../lib/photo-batch.ts";
const photos=[{sourceId:"a",blob:new Blob(["a"])},{sourceId:"b",blob:new Blob(["b"])}];
test("kolejka działa po jednej pozycji, zachowuje kolejność i pomija duplikaty",async()=>{
 let active=0,max=0;const events=[];
 await runPhotoQueue(["a","b","a","c"],new AbortController().signal,async id=>{active++;max=Math.max(max,active);await Promise.resolve();active--;return id+"-ready";},event=>events.push(event));
 assert.equal(max,1);assert.deepEqual(events.map(e=>[e.sourceId,e.type]),[["a","start"],["a","ready"],["b","start"],["b","ready"],["c","start"],["c","ready"]]);
});
test("błąd zdjęcia nie blokuje następnego, a ponowienie może obejmować tylko błąd",async()=>{
 const events=[];await runPhotoQueue(["a","b","c"],new AbortController().signal,async id=>{if(id==="b")throw new Error("uszkodzone");return id;},e=>events.push(e));
 assert.equal(events.find(e=>e.sourceId==="b"&&e.type==="error").message,"uszkodzone");assert(events.some(e=>e.sourceId==="c"&&e.type==="ready"));
 const retry=[];await runPhotoQueue(events.filter(e=>e.type==="error").map(e=>e.sourceId),new AbortController().signal,async id=>id,e=>retry.push(e));assert.deepEqual(retry.map(e=>e.sourceId),["b","b"]);
});
test("przerwanie przed startem i w trakcie nie uruchamia kolejnych zdjęć ani nie przyjmuje spóźnionego wyniku",async()=>{
 const stopped=new AbortController();stopped.abort();await runPhotoQueue(["a"],stopped.signal,async()=>assert.fail("processed"),()=>assert.fail("event"));
 const controller=new AbortController(),events=[],called=[];
 await runPhotoQueue(["a","b","c"],controller.signal,async id=>{called.push(id);if(id==="b")controller.abort();return id;},e=>events.push(e));
 assert.deepEqual(called,["a","b"]);assert.deepEqual(events.map(e=>[e.sourceId,e.type]),[["a","start"],["a","ready"],["b","start"]]);
});
test("podmiana serii zachowuje główne, kolejność, niezaznaczone zdjęcia i pełny limit 12",()=>{
 const ids=Array.from({length:12},(_,n)=>String(n)),copy=[...ids],result=replaceBatchPhotos(ids,[{sourceId:"0",id:"new-main"},{sourceId:"8",id:"new-8"}]);
 assert.equal(result.length,12);assert.equal(result[0],"new-main");assert.equal(result[8],"new-8");assert.equal(result[7],"7");assert.deepEqual(ids,copy);
 assert.throws(()=>replaceBatchPhotos(ids,[{sourceId:"missing",id:"new"}]),/zmienione/);
 assert.throws(()=>replaceBatchPhotos(ids,[{sourceId:"0",id:"same"},{sourceId:"1",id:"same"}]),/Nieprawidłowe/);
 assert.throws(()=>replaceBatchPhotos(ids,[{sourceId:"0",id:"1"}]),/innej pozycji/);
});
test("częściowy błąd uploadu nie zapisuje rzeczy, a ponowienie używa przesłanych plików",async()=>{
 const cache=new Map(),calls=[],commits=[];let fail=true;const item={id:"item",revision:1,imageIds:["a","b","c"],salePrice:12345,accountId:"owner-account"};
 const access={signal:new AbortController().signal,upload:async p=>{calls.push(p.sourceId);if(p.sourceId==="b"&&fail){fail=false;throw new Error("upload");}return "new-"+p.sourceId;},save:async value=>commits.push(value)};
 await assert.rejects(()=>savePhotoBatch(photos,cache,()=>item,access),/upload/);assert.equal(commits.length,0);assert.equal(cache.get("a"),"new-a");assert.deepEqual(item.imageIds,["a","b","c"]);
 await savePhotoBatch(photos,cache,()=>item,access);assert.deepEqual(calls,["a","b","b"]);assert.equal(commits.length,1);assert.deepEqual(commits[0].imageIds,["new-a","new-b","c"]);assert.equal(commits[0].salePrice,12345);assert.equal(commits[0].accountId,"owner-account");
});
test("konflikt zapisu pozostawia cache, a ponowienie bierze świeżą rewizję, pola i kolejność",async()=>{
 const cache=new Map(),uploads=[];let item={id:"i",revision:1,imageIds:["a","b","c"],name:"old",salePrice:100},saved,fail=true;
 const access={signal:new AbortController().signal,upload:async p=>{uploads.push(p.sourceId);return "new-"+p.sourceId;},save:async value=>{if(fail){fail=false;throw new Error("409");}saved=value;}};
 await assert.rejects(()=>savePhotoBatch(photos,cache,()=>item,access),/409/);
 item={...item,revision:2,imageIds:["c","b","a"],name:"edited",salePrice:900};await savePhotoBatch(photos,cache,()=>item,access);
 assert.deepEqual(uploads,["a","b"]);assert.equal(saved.revision,2);assert.equal(saved.name,"edited");assert.equal(saved.salePrice,900);assert.deepEqual(saved.imageIds,["c","new-b","new-a"]);
});
test("zmiana zdjęć zatrzymuje zapis przed uploadem, ale rozpoznany poprzedni zapis jest idempotentny",async()=>{
 const item={id:"i",revision:3,imageIds:["new-a","new-b","c"]},cache=new Map([["a","new-a"],["b","new-b"]]);
 const access={signal:new AbortController().signal,upload:async()=>assert.fail("uploaded"),save:async()=>assert.fail("saved again")};
 assert.equal((await savePhotoBatch(photos,cache,()=>item,access)).length,2);
 await assert.rejects(()=>savePhotoBatch(photos,new Map(),()=>item,access),/zmienione/);
});
test("przerwanie zapisu nie wysyła kolejnych plików i nie podmienia karty",async()=>{
 const controller=new AbortController(),cache=new Map(),called=[];
 await assert.rejects(()=>savePhotoBatch(photos,cache,()=>({id:"i",revision:1,imageIds:["a","b"]}),{signal:controller.signal,upload:async p=>{called.push(p.sourceId);controller.abort();return "new-a";},save:async()=>assert.fail("committed")}),error=>error.name==="AbortError");assert.deepEqual(called,["a"]);assert.equal(cache.get("a"),"new-a");
});
