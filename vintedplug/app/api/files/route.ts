import {owner,apiError,saveUpload,HttpError} from "@/lib/server";
export const dynamic="force-dynamic";
export async function POST(req:Request){try{
 const uid=await owner();if(req.headers.get("sec-fetch-site")==="cross-site")throw new HttpError(403,"Niedozwolone źródło.");
 if(Number(req.headers.get("content-length")??0)>9*1024*1024)throw new HttpError(413,"Zdjęcie może mieć maksymalnie 8 MB.");
 const data=await req.formData(),file=data.get("file");if(!(file instanceof File)||file.size>8*1024*1024||file.size<12)throw new HttpError(400,"Dodaj zdjęcie JPG, PNG lub WebP do 8 MB.");
 const bytes=await file.arrayBuffer(),b=new Uint8Array(bytes);let mime="";
 if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)mime="image/jpeg";
 if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)mime="image/png";
 if(String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP")mime="image/webp";
 if(!mime)throw new HttpError(400,"Obsługujemy zdjęcia JPG, PNG i WebP.");return Response.json(await saveUpload(uid,bytes,mime),{status:201});
}catch(e){return apiError(e);}}
