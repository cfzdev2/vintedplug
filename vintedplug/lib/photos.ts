export type PhotoVersion={id:string;createdAt:string};
export type PhotoHistory={originalId:string;versions:PhotoVersion[]};
export function movePhoto(ids:string[],from:string,to:string){
 const a=ids.indexOf(from),b=ids.indexOf(to);if(a<0||b<0||a===b)return ids;
 const next=[...ids];next.splice(a,1);next.splice(b,0,from);return next;
}
export function replacePhoto(ids:string[],current:string,next:string){
 if(!ids.includes(current))return ids;
 return ids.filter(id=>id!==next||id===current).map(id=>id===current?next:id);
}
// Every edited upload points straight to the owner's immutable original.
export async function photoOriginal(sourceId:string,own:(id:string)=>Promise<{id:string;originalId:string|null}>){
 const source=await own(sourceId);if(!source.originalId)return source.id;
 const original=await own(source.originalId);return original.id;
}
export type PhotoEdits={rotation:number;ratio:number|null;zoom:number;x:number;y:number;brightness:number};
export const defaultPhotoEdits:PhotoEdits={rotation:0,ratio:null,zoom:1,x:50,y:50,brightness:100};
export function photoCrop(width:number,height:number,edits:PhotoEdits){
 const rotation=((Math.round(edits.rotation/90)*90)%360+360)%360;
 const w=rotation%180?height:width,h=rotation%180?width:height;
 const ratio=edits.ratio&&edits.ratio>0?edits.ratio:w/h;
 let cw=w,ch=h;if(cw/ch>ratio)cw=ch*ratio;else ch=cw/ratio;
 const zoom=Math.min(3,Math.max(1,edits.zoom));cw/=zoom;ch/=zoom;
 return {rotation,width:w,height:h,cropWidth:cw,cropHeight:ch,left:(w-cw)*Math.min(100,Math.max(0,edits.x))/100,top:(h-ch)*Math.min(100,Math.max(0,edits.y))/100};
}
export function photoPanAvailability(width:number,height:number,edits:PhotoEdits){
 const crop=photoCrop(width,height,edits);
 return {x:crop.width-crop.cropWidth>1,y:crop.height-crop.cropHeight>1};
}
