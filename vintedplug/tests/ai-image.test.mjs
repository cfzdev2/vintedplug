import test from "node:test";
import assert from "node:assert/strict";
import {BACKGROUNDS} from "../lib/backgrounds.ts";
import {imageAIConfig,changeImageBackground,processBackground,ImageAIError,MAX_IMAGE_BYTES} from "../lib/ai-image.ts";

const png=Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==","base64"));
const config={apiKey:"local-test-secret"},input={bytes:png,mime:"image/png",style:"paper"};
const ok=()=>new Response(png,{headers:{"content-type":"image/png"}});
function fixture(overrides={}){const calls={own:[],read:0,reserve:0,refund:0,save:0,generate:0},access={
 own:async id=>{calls.own.push(id);return {id,originalId:id==="edit"?"original":null,mime:"image/png"};},config:()=>config,
 read:async()=>{calls.read++;return png;},reserve:async()=>{calls.reserve++;return async()=>{calls.refund++;};},
 save:async(bytes,mime,originalId)=>{calls.save++;calls.saved={bytes,mime,originalId};return {id:"new-photo",url:"/api/files/new-photo"};},...overrides,
 };const generate=async(...args)=>{calls.generate++;calls.input=args[1];return {bytes:png,mime:"image/png"};};return {calls,access,generate};}

test("zdjęcia wymagają osobnego klucza Photoroom i jawnego włączenia",()=>{
 assert.equal(imageAIConfig({GEMINI_API_KEY:"text-key",IMAGE_AI_ENABLED:"true"}),null);
 assert.equal(imageAIConfig({OPENAI_API_KEY:"other-key",OPENAI_IMAGE_MODEL:"model",IMAGE_AI_ENABLED:"true"}),null);
 assert.equal(imageAIConfig({PHOTOROOM_API_KEY:"photo-key"}),null);
 assert.equal(imageAIConfig({PHOTOROOM_API_KEY:"photo-key",IMAGE_AI_ENABLED:"false"}),null);
 assert.deepEqual(imageAIConfig({PHOTOROOM_API_KEY:" photo-key ",IMAGE_AI_ENABLED:"true"}),{apiKey:"photo-key"});
});
test("każdy kolor wysyła jeden plik bez danych konta i bez retuszu, kadrowania ani generowania produktu",async()=>{
 for(const style of Object.keys(BACKGROUNDS)){let calls=0;const output=await changeImageBackground(config,{...input,style},async(url,init)=>{
  calls++;assert.equal(url,"https://sdk.photoroom.com/v1/segment");assert.equal(init.method,"POST");assert.equal(init.redirect,"error");assert.equal(init.headers["x-api-key"],config.apiKey);
  assert.deepEqual([...init.body.keys()].sort(),["bg_color","crop","format","image_file","size"]);
  assert.equal(init.body.get("bg_color"),BACKGROUNDS[style].color);assert.equal(init.body.get("crop"),"false");assert.equal(init.body.get("size"),"hd");assert.equal(init.body.get("format"),"png");
  const file=init.body.get("image_file");assert.equal(file.name,"source.png");assert.deepEqual(new Uint8Array(await file.arrayBuffer()),png);return ok();
 });assert.equal(calls,1);assert.deepEqual(output,{bytes:png,mime:"image/png"});}
});
test("nieprawidłowy format, rozmiar lub styl nie wywołuje dostawcy",async()=>{
 for(const data of [{...input,mime:"image/svg+xml"},{...input,style:"custom-prompt"},{...input,bytes:new Uint8Array(5)},{...input,bytes:new Uint8Array(MAX_IMAGE_BYTES+1)}])await assert.rejects(()=>changeImageBackground(config,data,async()=>{assert.fail("provider called");}),error=>error instanceof ImageAIError&&error.status===400);
});
test("błędy dostawcy nie są automatycznie ponawiane i nie ujawniają jego odpowiedzi ani klucza",async()=>{
 for(const status of [400,401,402,403,413,422,429,500,503]){let calls=0;await assert.rejects(()=>changeImageBackground(config,input,async()=>{calls++;return new Response(`PRIVATE PROVIDER ERROR ${config.apiKey}`,{status});}),error=>error instanceof ImageAIError&&!error.message.includes(config.apiKey)&&!error.message.includes("PRIVATE"));assert.equal(calls,1);}
});
test("wynik musi być PNG o poprawnych wymiarach, a nie tekstem lub innym obrazem",async()=>{
 const invalidSize=png.slice();invalidSize.fill(0,16,20);
 for(const response of [new Response(png,{headers:{"content-type":"image/jpeg"}}),new Response("not a PNG",{headers:{"content-type":"image/png"}}),new Response(invalidSize,{headers:{"content-type":"image/png"}})])await assert.rejects(()=>changeImageBackground(config,input,async()=>response),error=>error instanceof ImageAIError&&error.status===502);
});
test("odpowiedź przekraczająca 8 MB jest przerywana również bez content-length",async()=>{
 const withLength=new Response(png,{headers:{"content-type":"image/png","content-length":String(MAX_IMAGE_BYTES+1)}});
 await assert.rejects(()=>changeImageBackground(config,input,async()=>withLength),error=>error.status===502);
 let canceled=false;
 const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(MAX_IMAGE_BYTES));controller.enqueue(new Uint8Array(1));},cancel(){canceled=true;}});
 await assert.rejects(()=>changeImageBackground(config,input,async()=>new Response(stream,{headers:{"content-type":"image/png"}})),error=>error.status===502);assert.equal(canceled,true);
});
test("timeout przerywa oczekiwanie bez kolejnego płatnego wywołania",async()=>{
 const controller=new AbortController();let calls=0;
 await assert.rejects(()=>changeImageBackground(config,input,async()=>{calls++;controller.abort();throw new Error("transport");},controller.signal),error=>error.status===504);assert.equal(calls,1);
});
test("brak własności zdjęcia lub oryginału zatrzymuje pracę przed kredytami i dostawcą",async()=>{
 for(const blocked of ["edit","original"]){const f=fixture({own:async id=>{if(id===blocked)throw new Error("404");return {id,originalId:"original",mime:"image/png"};}});
  await assert.rejects(()=>processBackground("edit","paper",f.access,f.generate),/404/);assert.equal(f.calls.reserve,0);assert.equal(f.calls.generate,0);assert.equal(f.calls.save,0);
 }
});
test("brak konfiguracji lub pliku nie rezerwuje limitu i nie wywołuje dostawcy",async()=>{
 for(const overrides of [{config:()=>null},{read:async()=>{throw new Error("missing file");}}]){const f=fixture(overrides);await assert.rejects(()=>processBackground("original","paper",f.access,f.generate));assert.equal(f.calls.reserve,0);assert.equal(f.calls.generate,0);}
});
test("wyczerpany limit nie uruchamia dostawcy ani zwrotu cudzej rezerwacji",async()=>{
 const f=fixture({reserve:async()=>{throw new Error("limit");}});await assert.rejects(()=>processBackground("original","paper",f.access,f.generate),/limit/);assert.equal(f.calls.generate,0);assert.equal(f.calls.refund,0);
});
test("sukces zapisuje osobny plik z trwałym oryginałem i kontekstem wyniku",async()=>{
 const f=fixture(),result=await processBackground("edit","linen",f.access,f.generate);
 assert.deepEqual(result,{id:"new-photo",url:"/api/files/new-photo",sourceId:"edit",style:"linen"});assert.deepEqual(f.calls.own,["edit","original"]);assert.equal(f.calls.saved.originalId,"original");assert.equal(f.calls.reserve,1);assert.equal(f.calls.save,1);assert.equal(f.calls.refund,0);
});
test("błąd dostawcy lub zapisu oddaje dokładnie jedną rezerwację panelu",async()=>{
 const providerFail=fixture();await assert.rejects(()=>processBackground("original","paper",providerFail.access,async()=>{throw new ImageAIError(503,"failed");}));assert.equal(providerFail.calls.refund,1);assert.equal(providerFail.calls.save,0);
 const saveFail=fixture({save:async()=>{throw new Error("database");}});await assert.rejects(()=>processBackground("original","paper",saveFail.access,saveFail.generate));assert.equal(saveFail.calls.refund,1);assert.equal(saveFail.calls.generate,1);
});
