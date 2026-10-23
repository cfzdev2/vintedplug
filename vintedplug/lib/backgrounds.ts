export const BACKGROUNDS={paper:{label:"Białe",color:"#ffffff"},stone:{label:"Jasnoszare",color:"#f1f3f4"},linen:{label:"Neutralny beż",color:"#f3ede5"}} as const;
export type BackgroundStyle=keyof typeof BACKGROUNDS;
export type BackgroundResult={id:string;url:string;sourceId:string;style:BackgroundStyle};
