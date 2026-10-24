// The optional paid provider supports solid colors only.
export const BACKGROUNDS={paper:{label:"Białe",color:"#ffffff"},stone:{label:"Jasnoszare",color:"#f1f3f4"},linen:{label:"Neutralny beż",color:"#f3ede5"}} as const;
export type BackgroundStyle=keyof typeof BACKGROUNDS;
export const PHOTO_BACKGROUNDS={...BACKGROUNDS,wood:{label:"Jasne drewno",color:"#c9ae88",image:"/backgrounds/light-oak.webp"},concrete:{label:"Beton",color:"#c5c6c5",image:"/backgrounds/concrete.webp"}} as const;
export type PhotoBackgroundStyle=keyof typeof PHOTO_BACKGROUNDS;
export type BackgroundResult={id:string;url:string;sourceId:string;style:PhotoBackgroundStyle};
export function isSolidBackground(style:PhotoBackgroundStyle):style is BackgroundStyle{return Object.hasOwn(BACKGROUNDS,style);}
// Center and cover the full canvas without stretching the texture.
export function backgroundPlacement(sourceWidth:number,sourceHeight:number,width:number,height:number){
 if([sourceWidth,sourceHeight,width,height].some(n=>!Number.isFinite(n)||n<=0))throw new Error("Nieprawidłowe wymiary tła.");
 const scale=Math.max(width/sourceWidth,height/sourceHeight),drawWidth=sourceWidth*scale,drawHeight=sourceHeight*scale;
 return {x:(width-drawWidth)/2,y:(height-drawHeight)/2,width:drawWidth,height:drawHeight};
}
