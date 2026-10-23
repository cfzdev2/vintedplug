"use client";
import {useEffect,useState} from "react";
import {Plus,Pencil,Upload,LoaderCircle,Camera} from "lucide-react";
import {toast} from "sonner";
import type {Item,Workspace} from "@/lib/domain";
import {replacePhoto} from "@/lib/photos";
import {api,errorMessage,type Save} from "./forms";
import {BackgroundTool} from "./background-tool";
import {ProductArt} from "./product-art";

export function PhotoStudio({items,config,demo,save,addItem,editItem}:{items:Item[];config:Workspace["config"];demo:boolean;save:Save;addItem:()=>void;editItem:(item:Item)=>void}){
 const [id,setId]=useState(items[0]?.id??""),[photoId,setPhotoId]=useState(""),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false);
 const item=items.find(value=>value.id===id),sourceId=item?.imageIds.includes(photoId)?photoId:item?.imageIds[0]??"";
 useEffect(()=>{if(!items.some(value=>value.id===id))setId(items[0]?.id??"");},[items,id]);
 async function upload(file:File){if(!item||busy||uploading)return;setUploading(true);try{
  if(item.imageIds.length>=12)throw new Error("Najpierw odłącz jedno ze zdjęć w karcie rzeczy (maks. 12).");if(file.size>8*1024*1024)throw new Error("Zdjęcie może mieć maksymalnie 8 MB.");
  const form=new FormData();form.append("file",file);const photo=await api<{id:string}>("/api/files",{method:"POST",body:form});await save("item.save",{...item,imageIds:[photo.id,...item.imageIds]});setPhotoId(photo.id);
 }catch(error){toast.error(errorMessage(error));}finally{setUploading(false);}}
 return <section className="panel photo-studio"><div className="panel-heading"><div><span className="section-kicker">STUDIO ZDJĘĆ AI</span><h2>Przygotuj zdjęcia do ogłoszenia</h2><p>Wybierz rzecz i zdjęcie, porównaj wynik, a potem zapisz wybraną wersję.</p></div><Camera size={22}/></div><div className="photo-studio-toolbar"><label>Rzecz do przygotowania<select value={id} disabled={busy||uploading} onChange={e=>{setId(e.target.value);setPhotoId("");}}><option value="" disabled>Wybierz rzecz</option>{items.map(value=><option value={value.id} key={value.id}>{value.name}</option>)}</select></label>{item&&<label>Zdjęcie do edycji<select value={sourceId} disabled={busy||uploading||!sourceId} onChange={e=>setPhotoId(e.target.value)}>{!sourceId&&<option value="">Najpierw dodaj zdjęcie</option>}{item.imageIds.map((imageId,n)=><option value={imageId} key={imageId}>Zdjęcie {n+1}{n===0?" · główne":""}</option>)}</select></label>}<div className="photo-studio-actions">{item?<><button type="button" className="btn secondary" disabled={busy||uploading} onClick={()=>editItem(item)}><Pencil size={15}/>Edytuj i uporządkuj zdjęcia</button><label className={`btn secondary upload-label ${demo||busy||uploading||item.imageIds.length>=12?"disabled":""}`}>{uploading?<LoaderCircle className="spin" size={15}/>:<Upload size={15}/>}Dodaj zdjęcie<input type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={demo||busy||uploading||item.imageIds.length>=12} onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void upload(file);e.currentTarget.value="";}}/></label></>:<button type="button" className="btn primary" onClick={addItem}><Plus size={15}/>Dodaj rzecz</button>}</div></div>{item&&sourceId?<BackgroundTool key={`${item.id}:${sourceId}:${item.revision}`} sourceId={sourceId} available={config.imageAI} demo={demo} onBusy={setBusy} onUse={async result=>{await save("item.save",{...item,imageIds:replacePhoto(item.imageIds,sourceId,result.id)});setPhotoId(result.id);}}/>:<div className="photo-studio-empty">{demo&&item?<ProductArt kind={item.illustration}/>:<Camera size={35}/>}<h3>{item?"Dodaj zdjęcie tej rzeczy":"Wybierz rzecz z magazynu"}</h3><p>{demo?"To przykładowa ilustracja. Własne zdjęcia przygotujesz we własnym panelu.":"Po dodaniu zdjęcia możesz zmienić tło lub skorzystać z kadrowania, obrotu i jasności."}</p></div>}</section>;
}
