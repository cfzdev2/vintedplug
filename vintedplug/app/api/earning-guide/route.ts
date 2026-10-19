import {and,eq} from "drizzle-orm";
import {getDb} from "@/db";
import {earningGuides} from "@/db/schema";
import {earningGuideInput} from "@/lib/earning-guide";
import {owner,body,apiError,HttpError,guideEditPermission} from "@/lib/server";
import {EARNING_GUIDE_ID} from "@/lib/guide-access";

export const dynamic="force-dynamic";
export async function PUT(req:Request){try{
 const uid=await owner(),db=getDb(),existing=await db.select().from(earningGuides).where(eq(earningGuides.id,EARNING_GUIDE_ID)).get();
 if(!await guideEditPermission(uid,existing?.owner))throw new HttpError(403,"Ten poradnik może edytować wyłącznie jego autor.");
 const input=earningGuideInput.parse(await body(req,300_000));
 const data={chapters:input.chapters,revision:input.revision+1,updatedAt:new Date().toISOString()};
 const rows=input.revision===0
  ?await db.insert(earningGuides).values({...data,id:EARNING_GUIDE_ID,owner:uid}).onConflictDoNothing({target:earningGuides.id}).returning()
  :await db.update(earningGuides).set(data).where(and(eq(earningGuides.id,EARNING_GUIDE_ID),eq(earningGuides.owner,uid),eq(earningGuides.revision,input.revision))).returning();
 if(!rows.length)throw new HttpError(409,"Poradnik zmienił się w innym oknie. Zachowaj swój tekst, odśwież panel i spróbuj ponownie.");
 const {owner:_,id:__,...result}=rows[0];
 return Response.json(result,{headers:{"Cache-Control":"no-store"}});
}catch(e){return apiError(e);}}
