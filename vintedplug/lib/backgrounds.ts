// The optional paid provider supports solid colors only.
export const BACKGROUNDS={paper:{label:"Białe",color:"#ffffff"},stone:{label:"Jasnoszare",color:"#f1f3f4"},linen:{label:"Neutralny beż",color:"#f3ede5"}} as const;
export type BackgroundStyle=keyof typeof BACKGROUNDS;
export const PHOTO_BACKGROUNDS={
 paper:{...BACKGROUNDS.paper,hint:"Do ciemnych i kolorowych rzeczy. Proste tło, na którym łatwo obejrzeć kształt ubrania."},
 stone:{...BACKGROUNDS.stone,hint:"Spokojna opcja do większości kolorów. Sprawdź, czy krawędzie rzeczy wyraźnie odcinają się od szarości."},
 linen:{...BACKGROUNDS.linen,hint:"Ciepłe, jednolite tło do granatu, czerni i nasyconych kolorów."},
 wood:{label:"Jasne drewno",color:"#c9ae88",image:"/backgrounds/light-oak.webp",thumbnail:"/backgrounds/light-oak-thumb.webp",hint:"Naturalny wygląd zdjęcia na płasko. Pasuje do jeansu, bluz i codziennych ubrań."},
 concrete:{label:"Beton",color:"#c5c6c5",image:"/backgrounds/concrete.webp",thumbnail:"/backgrounds/concrete-thumb.webp",hint:"Chłodna, neutralna powierzchnia do streetwearu i butów. Zostaw widoczne wszystkie detale rzeczy."},
 flax:{label:"Naturalny len",color:"#d7cdbb",image:"/backgrounds/natural-linen.webp",thumbnail:"/backgrounds/natural-linen-thumb.webp",hint:"Delikatna tkanina do ciemnych ubrań, koszul i dodatków. Przy jasnych rzeczach porównaj kontrast."},
 rug:{label:"Dywan ecru",color:"#e7e1d6",image:"/backgrounds/ecru-rug.webp",thumbnail:"/backgrounds/ecru-rug-thumb.webp",hint:"Miękkie tło do zdjęć na płasko: swetry, bluzy i dzianiny. Najczytelniejsze przy ciemniejszych rzeczach."},
 walnut:{label:"Ciemne drewno",color:"#635043",image:"/backgrounds/dark-walnut.webp",thumbnail:"/backgrounds/dark-walnut-thumb.webp",hint:"Do jasnych ubrań i dodatków. Ciemne brązy i czerń mogą zlewać się z tłem."},
 graphite:{label:"Grafit matowy",color:"#414447",image:"/backgrounds/matte-graphite.webp",thumbnail:"/backgrounds/matte-graphite-thumb.webp",hint:"Kontrast do bieli, ecru i pasteli. Dobre, gdy jasna rzecz ginie na białym tle."},
} as const;
export type PhotoBackgroundStyle=keyof typeof PHOTO_BACKGROUNDS;
export type BackgroundResult={id:string;url:string;sourceId:string;style:PhotoBackgroundStyle};
export function isSolidBackground(style:PhotoBackgroundStyle):style is BackgroundStyle{return Object.hasOwn(BACKGROUNDS,style);}
// Center and cover the full canvas without stretching the texture.
export function backgroundPlacement(sourceWidth:number,sourceHeight:number,width:number,height:number){
 if([sourceWidth,sourceHeight,width,height].some(n=>!Number.isFinite(n)||n<=0))throw new Error("Nieprawidłowe wymiary tła.");
 const scale=Math.max(width/sourceWidth,height/sourceHeight),drawWidth=sourceWidth*scale,drawHeight=sourceHeight*scale;
 return {x:(width-drawWidth)/2,y:(height-drawHeight)/2,width:drawWidth,height:drawHeight};
}
