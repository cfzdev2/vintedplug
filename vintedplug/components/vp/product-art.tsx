export function ProductArt({kind="hoodie",variant=0}:{kind?:string;variant?:number}){
 const p=[["#eff6f8","#315e6d","#21434f"],["#f0f5f7","#303c43","#222e35"],["#edf5f8","#b4cbd3","#89a8b5"],["#f1f7fa","#5c7e91","#3c5a6e"],["#f2f7f9","#91a8b1","#6b8794"]];
 const [bg,fill,line]=p[Math.abs(variant)%p.length];
 return <svg viewBox="0 0 150 160" role="img" aria-label="Ilustracja zastępcza ubrania" className="product-art"><rect width="150" height="160" fill={bg}/><ellipse cx="76" cy="139" rx="43" ry="5" fill="#000" opacity=".07"/>
 {kind==="jeans"?<g fill={fill} stroke={line} strokeWidth="1.2"><path d="M47 23h56l5 112-25 2-8-76-8 76-25-2z"/><path d="M48 32h54M75 24v35M49 37q8 13 17 10M101 37q-8 13-17 10" fill="none"/></g>:<g fill={fill} stroke={line} strokeWidth="1.2"><path d="M51 29 29 42 16 88l19 8 12-31-3 69q30 7 62 0l-3-69 12 31 19-8-13-46-22-13z"/>
 {kind==="hoodie"?<><path d="M55 32q-3-25 20-25t20 25l-20 8z"/><path d="m60 29 15 7 15-7M69 37v25M81 37v25" fill="none" stroke="#c5d8e0"/><path d="m58 91 34 0 5 22q-22 7-44 0zM45 128q30 5 60 0" fill="none"/></>:kind==="shirt"?<><path d="m55 26 20 12-10 15-13-22M95 26 75 38l10 15 13-22" fill="#d4d9de"/><path d="M75 39v98M84 65h15v18H84z" fill="none"/>{[56,73,90,107,123].map(y=><circle key={y} cx="78" cy={y} r="1.1" fill="#eee" stroke="none"/>)}</>:<><path d="M54 29 59 18h32l5 11-21 10z"/><path d="M75 37v99M53 87l13-6M96 87l-13-6" fill="none" stroke="#b9d2dc"/><path d="M48 53h22v25H48M81 53h21v25H81" fill="none"/></>}
 <path d="m29 44 15 18M121 44l-15 18m-101 42 16 6m78 0 16-6" fill="none" opacity=".5"/></g>}</svg>;
}
