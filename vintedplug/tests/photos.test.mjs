import test from "node:test";
import assert from "node:assert/strict";
import {movePhoto,replacePhoto,photoOriginal,photoCrop,photoPanAvailability,defaultPhotoEdits} from "../lib/photos.ts";

test("kolejność i wybór głównego nie gubią zdjęć",()=>{
 const ids=["a","b","c","d"];
 assert.deepEqual(movePhoto(ids,"c","a"),["c","a","b","d"]);
 assert.deepEqual(movePhoto(ids,"a","d"),["b","c","d","a"]);
 assert.deepEqual(movePhoto(ids,"b","c"),["a","c","b","d"]);
 assert.deepEqual(movePhoto(ids,"missing","a"),ids);
 assert.deepEqual(ids,["a","b","c","d"]);
});
test("nowa lub przywrócona wersja zajmuje miejsce wybranego zdjęcia bez duplikatów",()=>{
 assert.deepEqual(replacePhoto(["a","b","c"],"b","edited"),["a","edited","c"]);
 assert.deepEqual(replacePhoto(["original","a","edited","c"],"edited","original"),["a","original","c"]);
 assert.deepEqual(replacePhoto(["edited","a","original"],"edited","original"),["original","a"]);
 assert.deepEqual(replacePhoto(["a","b"],"missing","original"),["a","b"]);
 assert.deepEqual(replacePhoto(["a","b"],"a","a"),["a","b"]);
});
test("kolejne edycje odwołują się do trwałego oryginału i sprawdzają jego właściciela",async()=>{
 const read=[],own=async id=>{read.push(id);return {id,originalId:id==="edit"?"original":null};};
 assert.equal(await photoOriginal("edit",own),"original");assert.deepEqual(read,["edit","original"]);
 assert.equal(await photoOriginal("original",own),"original");
 await assert.rejects(()=>photoOriginal("foreign",async()=>{throw new Error("404");}),/404/);
 await assert.rejects(()=>photoOriginal("edit",async id=>{if(id==="original")throw new Error("404");return {id,originalId:"original"};}),/404/);
});
test("obrót, proporcje, przybliżenie i skrajne położenia zachowują kadr wewnątrz zdjęcia",()=>{
 const base=photoCrop(1200,800,defaultPhotoEdits);assert.deepEqual(base,{rotation:0,width:1200,height:800,cropWidth:1200,cropHeight:800,left:0,top:0});
 const rotated=photoCrop(1200,800,{...defaultPhotoEdits,rotation:-90});assert.equal(rotated.width,800);assert.equal(rotated.height,1200);assert.equal(rotated.rotation,270);
 for(const rotation of [-90,0,90,180,450])for(const ratio of [null,1,.8,.75])for(const zoom of [.5,1,2,5])for(const x of [-10,0,50,100,120]){
  const crop=photoCrop(1200,800,{...defaultPhotoEdits,rotation,ratio,zoom,x,y:x});
  assert.ok(crop.left>=0&&crop.top>=0);assert.ok(crop.left+crop.cropWidth<=crop.width+.001);assert.ok(crop.top+crop.cropHeight<=crop.height+.001);
  if(ratio)assert.ok(Math.abs(crop.cropWidth/crop.cropHeight-ratio)<.001);
 }
});
test("suwaki położenia są dostępne tylko w osiach z miejscem na przesunięcie",()=>{
 assert.deepEqual(photoPanAvailability(1200,800,defaultPhotoEdits),{x:false,y:false});
 assert.deepEqual(photoPanAvailability(1200,800,{...defaultPhotoEdits,ratio:1}),{x:true,y:false});
 assert.deepEqual(photoPanAvailability(1200,800,{...defaultPhotoEdits,ratio:1,rotation:90}),{x:false,y:true});
 for(const rotation of [0,90,180,270])for(const ratio of [null,1,.8,.75]){
  const edits={...defaultPhotoEdits,rotation,ratio,zoom:1.15};
  assert.deepEqual(photoPanAvailability(1200,800,edits),{x:true,y:true});
  const start=photoCrop(1200,800,{...edits,x:0,y:0}),end=photoCrop(1200,800,{...edits,x:100,y:100});
  assert.ok(end.left>start.left);assert.ok(end.top>start.top);
 }
 // Resetting the editor returns to an uncropped image and disabled position sliders.
 assert.deepEqual(photoPanAvailability(800,1200,{...defaultPhotoEdits}),{x:false,y:false});
});
