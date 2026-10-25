import test from "node:test";import assert from "node:assert/strict";import{unzipSync}from"fflate";
import {photoZip,photoFileStem} from "../lib/photo-zip.ts";
const png=Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==","base64")),blob=new Blob([png],{type:"image/png"});
test("ZIP zawiera wyłącznie przekazane wyniki, w kolejności i z bezpiecznymi nazwami",async()=>{
 const result=await photoZip("../Żółta bluza / XL",[{position:5,blob},{position:1,blob}]),files=unzipSync(new Uint8Array(await result.arrayBuffer()));
 assert.equal(result.type,"application/zip");assert.deepEqual(Object.keys(files),["01-zolta-bluza-xl.png","05-zolta-bluza-xl.png"]);for(const bytes of Object.values(files))assert.deepEqual(bytes,png);
 assert.equal(photoFileStem("../../"),"rzecz");assert.equal(photoFileStem("a".repeat(200)).length,70);
});
test("ZIP odrzuca pusty wybór, błędne pozycje, duplikaty i nieprawidłowe pliki",async()=>{
 for(const photos of [[],[{position:0,blob}],[{position:1,blob},{position:1,blob}],[{position:1,blob:new Blob(["x"],{type:"text/plain"})}],[{position:1,blob:new Blob([new Uint8Array(8*1024*1024+1)],{type:"image/png"})}]])await assert.rejects(()=>photoZip("item",photos));
});
test("anulowany eksport nie tworzy ZIP",async()=>{const task=new AbortController();task.abort();await assert.rejects(()=>photoZip("item",[{position:1,blob}],task.signal),error=>error.name==="AbortError");});
