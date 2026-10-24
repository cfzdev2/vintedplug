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

test("tekstury kryją cały kadr bez rozciągania, także dla pionowego i poziomego zdjęcia",async()=>{
 const {backgroundPlacement}=await import("../lib/backgrounds.ts");
 assert.deepEqual(backgroundPlacement(1024,1024,600,900),{x:-150,y:0,width:900,height:900});
 assert.deepEqual(backgroundPlacement(1024,1024,900,600),{x:0,y:-150,width:900,height:900});
 assert.deepEqual(backgroundPlacement(1200,800,600,400),{x:0,y:0,width:600,height:400});
 assert.throws(()=>backgroundPlacement(0,100,600,900));
});

test("kompozycja rysuje teksturę pod przedmiotem, buforuje ją i zachowuje wymiary zdjęcia",async()=>{
 const {composeLocalBackground}=await import("../lib/local-background.ts");
 const original={document:globalThis.document,createImageBitmap:globalThis.createImageBitmap,fetch:globalThis.fetch},calls=[];let fetched=0,closed=0;
 const foreground=new Blob(["foreground"]),texture=new Blob(["texture"]),canvas={width:0,height:0,getContext:()=>({fillStyle:"",fillRect:(...v)=>calls.push(["fill",...v]),drawImage:(...v)=>calls.push(["draw",...v])}),toBlob:callback=>callback(new Blob(["png"],{type:"image/png"}))};
 globalThis.document={createElement:()=>canvas};globalThis.fetch=async()=>{fetched++;return {ok:true,blob:async()=>texture};};globalThis.createImageBitmap=async blob=>blob===foreground?{kind:"foreground",width:600,height:900,close:()=>closed++}:{kind:"texture",width:1254,height:1254};
 try{
  await composeLocalBackground(foreground,"wood");assert.equal(canvas.width,600);assert.equal(canvas.height,900);assert.equal(calls[1][1].kind,"texture");assert.deepEqual(calls[1].slice(2),[-150,0,900,900]);assert.equal(calls[2][1].kind,"foreground");assert.deepEqual(calls[2].slice(2),[0,0]);
  await composeLocalBackground(foreground,"wood");assert.equal(fetched,1);
  calls.length=0;await composeLocalBackground(foreground,"paper");assert.equal(fetched,1);assert.equal(calls.length,2);assert.equal(calls[1][1].kind,"foreground");assert.equal(closed,3);
 }finally{Object.assign(globalThis,original);}
});

test("brak tekstury nie zapisuje zastępczego koloru i pozwala ponowić pobranie",async()=>{
 const {composeLocalBackground}=await import("../lib/local-background.ts");
 const original={document:globalThis.document,createImageBitmap:globalThis.createImageBitmap,fetch:globalThis.fetch};let fetched=0,closed=0,saved=0;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},drawImage(){}}),toBlob(){saved++;}})};
 globalThis.createImageBitmap=async()=>({width:600,height:900,close:()=>closed++});globalThis.fetch=async()=>{fetched++;return {ok:false};};
 try{for(let n=0;n<2;n++)await assert.rejects(()=>composeLocalBackground(new Blob(),"concrete"),/tekstury/);assert.equal(fetched,2);assert.equal(closed,2);assert.equal(saved,0);}finally{Object.assign(globalThis,original);}
});
