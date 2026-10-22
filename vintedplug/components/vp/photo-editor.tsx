"use client";
import {useEffect,useRef,useState} from "react";
import {RotateCcw,RotateCw,LoaderCircle,Undo2,Save} from "lucide-react";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import {defaultPhotoEdits,photoCrop,type PhotoEdits} from "@/lib/photos";

// Draw directly from the decoded source, avoiding cumulative JPEG re-encoding.
export function renderPhoto(canvas:HTMLCanvasElement,image:HTMLImageElement,edits:PhotoEdits,maxSide:number){
 const crop=photoCrop(image.naturalWidth,image.naturalHeight,edits),scale=Math.min(1,maxSide/Math.max(crop.cropWidth,crop.cropHeight));
 canvas.width=Math.max(1,Math.round(crop.cropWidth*scale));canvas.height=Math.max(1,Math.round(crop.cropHeight*scale));
 const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Przeglądarka nie obsługuje edycji zdjęć.");
 ctx.save();ctx.scale(scale,scale);ctx.translate(-crop.left,-crop.top);ctx.translate(crop.width/2,crop.height/2);ctx.rotate(crop.rotation*Math.PI/180);
 ctx.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2);ctx.restore();
 // Pixel processing also works in browsers without CanvasRenderingContext2D.filter.
 if(edits.brightness!==100){const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),factor=edits.brightness/100;for(let n=0;n<pixels.data.length;n+=4){pixels.data[n]*=factor;pixels.data[n+1]*=factor;pixels.data[n+2]*=factor;}ctx.putImageData(pixels,0,0);}
}
export function PhotoEditor({id,onClose,onSave}:{id:string;onClose:()=>void;onSave:(file:Blob)=>Promise<void>}){
 const [edits,setEdits]=useState<PhotoEdits>({...defaultPhotoEdits}),[ready,setReady]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const source=useRef<HTMLImageElement|null>(null),canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let active=true;const image=new Image();image.onload=()=>{if(active){source.current=image;setReady(true);}};image.onerror=()=>{if(active)setError("Nie udało się wczytać zdjęcia. Zamknij edytor i spróbuj ponownie.");};image.src=`/api/files/${id}`;return()=>{active=false;source.current=null;image.onload=null;image.onerror=null;};},[id]);
 useEffect(()=>{if(ready&&canvas.current&&source.current)try{renderPhoto(canvas.current,source.current,edits,900);}catch(e){setError(e instanceof Error?e.message:"Nie udało się przygotować podglądu.");}},[ready,edits]);
 function change(key:keyof PhotoEdits,value:number|null){setEdits(previous=>({...previous,[key]:value}));}
 async function save(){if(!source.current||saving)return;setSaving(true);setError("");try{
  const output=document.createElement("canvas");renderPhoto(output,source.current,edits,2400);
  const blob=await new Promise<Blob>((resolve,reject)=>output.toBlob(result=>result?resolve(result):reject(new Error("Nie udało się zapisać zdjęcia.")),"image/webp",.94));
  if(blob.size>8*1024*1024)throw new Error("Wersja jest większa niż 8 MB. Wybierz mniejszy kadr.");
  await onSave(blob);onClose();
 }catch(e){setError(e instanceof Error?e.message:"Nie udało się zapisać wersji. Spróbuj ponownie.");}finally{setSaving(false);}}
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent className="vp-modal photo-editor-modal" showCloseButton={!saving} onEscapeKeyDown={e=>{if(saving)e.preventDefault();}} onPointerDownOutside={e=>{if(saving)e.preventDefault();}}><DialogHeader><DialogTitle>Edytuj zdjęcie</DialogTitle><DialogDescription>Zapiszesz osobną wersję. Oryginał będzie nadal dostępny.</DialogDescription></DialogHeader><div className="photo-editor-body"><div className="photo-editor-preview">{!ready&&!error&&<LoaderCircle className="spin" size={24}/>}<canvas ref={canvas} hidden={!ready} aria-label="Podgląd zdjęcia po edycji" role="img"/></div><div className="photo-editor-controls"><div className="photo-rotate-actions"><button className="btn secondary" type="button" disabled={!ready||saving} onClick={()=>change("rotation",edits.rotation-90)}><RotateCcw size={16}/>W lewo</button><button className="btn secondary" type="button" disabled={!ready||saving} onClick={()=>change("rotation",edits.rotation+90)}><RotateCw size={16}/>W prawo</button></div><label>Proporcje kadru<select value={edits.ratio??"original"} disabled={saving} onChange={e=>change("ratio",e.target.value==="original"?null:Number(e.target.value))}><option value="original">Całe zdjęcie</option><option value="1">Kwadrat · 1:1</option><option value="0.8">Pionowo · 4:5</option><option value={.75}>Pionowo · 3:4</option></select></label>{([{key:"zoom",label:"Przybliżenie",min:1,max:3,step:.05,value:`${edits.zoom.toFixed(2)}×`},{key:"x",label:"Położenie w poziomie",min:0,max:100,step:1,value:`${edits.x}%`},{key:"y",label:"Położenie w pionie",min:0,max:100,step:1,value:`${edits.y}%`},{key:"brightness",label:"Jasność",min:80,max:120,step:1,value:`${edits.brightness}%`}] as const).map(field=><label key={field.key}><span>{field.label}<output>{field.value}</output></span><input type="range" aria-label={field.label} min={field.min} max={field.max} step={field.step} value={edits[field.key]} disabled={!ready||saving} onInput={e=>change(field.key,Number(e.currentTarget.value))}/></label>)}<button type="button" className="text-button" disabled={saving} onClick={()=>setEdits({...defaultPhotoEdits})}><Undo2 size={14}/>Wyzeruj edycję</button><p className="small muted">Przesunięcie działa tam, gdzie zdjęcie wychodzi poza kadr. Sprawdź, czy jasność wiernie pokazuje kolor i stan rzeczy.</p></div></div>{error&&<p className="photo-error" role="alert">{error}</p>}<div className="modal-actions"><button className="btn secondary" type="button" disabled={saving} onClick={onClose}>Anuluj</button><button className="btn primary" type="button" disabled={!ready||saving} onClick={()=>void save()}>{saving?<LoaderCircle className="spin" size={16}/>:<Save size={16}/>}Zapisz nową wersję</button></div></DialogContent></Dialog>;
}
