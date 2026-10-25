"use client";
import {Check} from "lucide-react";
import {BACKGROUNDS,PHOTO_BACKGROUNDS,type PhotoBackgroundStyle} from "@/lib/backgrounds";
export function BackgroundPresets({value,onChange,disabled=false,solidOnly=false}:{value:PhotoBackgroundStyle;onChange:(value:PhotoBackgroundStyle)=>void;disabled?:boolean;solidOnly?:boolean}){
 return <><div className="background-presets">{Object.entries(solidOnly?BACKGROUNDS:PHOTO_BACKGROUNDS).map(([key,preset])=><button type="button" key={key} aria-pressed={value===key} title={PHOTO_BACKGROUNDS[key as PhotoBackgroundStyle].hint} disabled={disabled} onClick={()=>onChange(key as PhotoBackgroundStyle)}><span style={{backgroundColor:preset.color,backgroundImage:"thumbnail" in preset?`url(${preset.thumbnail})`:"image" in preset?`url(${preset.image})`:undefined,backgroundSize:"cover",backgroundPosition:"center"}}>{value===key&&<Check size={17}/>}</span><strong>{preset.label}</strong></button>)}</div><p className="background-style-hint">{PHOTO_BACKGROUNDS[value].hint}</p></>;
}
