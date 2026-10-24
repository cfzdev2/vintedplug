import test from "node:test";
import assert from "node:assert/strict";
import {fitLocalImage,applyForegroundMask,LOCAL_MODEL,LOCAL_MODEL_REVISION} from "../lib/local-background-core.ts";
test("lokalny model jest przypięty do konkretnej wersji",()=>{
 assert.equal(LOCAL_MODEL,"onnx-community/BEN2-ONNX");assert.match(LOCAL_MODEL_REVISION,/^[0-9a-f]{40}$/);
});
test("przygotowanie zdjęcia zachowuje proporcje i nie powiększa małych plików",()=>{
 assert.deepEqual(fitLocalImage(4000,6000),{width:1600,height:2400});assert.deepEqual(fitLocalImage(6000,4000),{width:2400,height:1600});assert.deepEqual(fitLocalImage(600,800),{width:600,height:800});
 for(const [w,h] of [[0,500],[-1,500],[NaN,100],[9000,9000]])assert.throws(()=>fitLocalImage(w,h));
});
test("maska zmienia wyłącznie przezroczystość, zachowując kolor, detale i istniejącą alfę",()=>{
 const pixels=new Uint8ClampedArray([10,20,30,255,40,50,60,128,70,80,90,0,100,110,120,255]),copy=pixels.slice();
 const output=applyForegroundMask(pixels,new Uint8Array([255,128,255,0]));assert.deepEqual([...output],[10,20,30,255,40,50,60,64,70,80,90,0,100,110,120,0]);assert.deepEqual(pixels,copy);
 assert.throws(()=>applyForegroundMask(pixels,new Uint8Array([255])),/Maska/);
});
