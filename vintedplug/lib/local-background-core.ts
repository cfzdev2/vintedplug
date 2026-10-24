export const LOCAL_MODEL="onnx-community/BEN2-ONNX";
export const LOCAL_MODEL_REVISION="c552aa82688edce09f0ac9d2e31ad53d9d629010";
export const LOCAL_MAX_SIDE=2400;
export type LocalBackgroundProgress={phase:"loading"|"download"|"prepare"|"processing"|"ready";percent?:number;backend?:"webgpu"|"wasm"};
export function fitLocalImage(width:number,height:number,maxSide=LOCAL_MAX_SIDE){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width*height>40_000_000)throw new Error("Zdjęcie ma nieprawidłowe wymiary lub przekracza 40 megapikseli.");
 const scale=Math.min(1,maxSide/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
// Preserve RGB and existing transparency; the model only supplies an alpha mask.
export function applyForegroundMask(rgba:Uint8ClampedArray|Uint8Array,mask:Uint8ClampedArray|Uint8Array){
 if(rgba.length!==mask.length*4)throw new Error("Maska nie pasuje do zdjęcia.");
 const output=new Uint8ClampedArray(rgba);for(let n=0;n<mask.length;n++)output[n*4+3]=Math.round(rgba[n*4+3]*mask[n]/255);return output;
}
