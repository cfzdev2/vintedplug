import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db";
import {accounts,items,expenses} from "@/db/schema";
import {accountInput,itemInput,expenseInput,itemStatusIssue} from "@/lib/domain";
import {owner,body,apiError,ownAccount,ownItem,ownUpload,snapshot,HttpError} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(){try{return Response.json(await snapshot(await owner()),{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
export async function POST(req:Request){try{
 const uid=await owner(),input=await body(req),db=getDb(),now=new Date().toISOString();
 const action=z.enum(["account.save","account.delete","item.save","item.delete","expense.save","expense.delete"]).parse(input.action);
 if(action==="account.save"){
  const data=accountInput.parse(input.data);
  if(data.id){await ownAccount(uid,data.id);await db.update(accounts).set({name:data.name,handle:data.handle,color:data.color}).where(and(eq(accounts.id,data.id),eq(accounts.owner,uid)));}
  else{const all=await db.select({id:accounts.id}).from(accounts).where(eq(accounts.owner,uid));if(all.length>=30)throw new HttpError(400,"Możesz dodać maksymalnie 30 kont.");await db.insert(accounts).values({...data,id:crypto.randomUUID(),owner:uid,createdAt:now});}
 }else if(action==="account.delete"){
  const id=z.string().max(80).parse(input.data.id),a=await ownAccount(uid,id);if(input.data.confirmName!==a.name)throw new HttpError(400,"Potwierdź nazwę usuwanego konta.");
  await db.batch([db.delete(items).where(and(eq(items.accountId,id),eq(items.owner,uid))),db.delete(expenses).where(and(eq(expenses.accountId,id),eq(expenses.owner,uid))),db.delete(accounts).where(and(eq(accounts.id,id),eq(accounts.owner,uid)))]);
 }else if(action==="item.save"){
  const {id,revision,...data}=itemInput.parse(input.data);await ownAccount(uid,data.accountId);for(const imageId of data.imageIds)await ownUpload(uid,imageId);
  if(id){const old=await ownItem(uid,id);if(revision!==old.revision)throw new HttpError(409,"Ta rzecz została zmieniona w innym oknie. Odśwież panel i spróbuj ponownie.");
   const statusIssue=itemStatusIssue(data.status,old.status);if(statusIssue)throw new HttpError(400,statusIssue);
   const r=await db.update(items).set({...data,updatedAt:now,revision:old.revision+1}).where(and(eq(items.id,id),eq(items.owner,uid),eq(items.revision,revision))).returning({id:items.id});if(!r.length)throw new HttpError(409,"Dane się zmieniły. Odśwież panel przed zapisem.");
  }else{const statusIssue=itemStatusIssue(data.status);if(statusIssue)throw new HttpError(400,statusIssue);await db.insert(items).values({...data,id:crypto.randomUUID(),owner:uid,createdAt:now,updatedAt:now,revision:1});}
 }else if(action==="item.delete"){
  const id=z.string().max(80).parse(input.data.id);await ownItem(uid,id);await db.delete(items).where(and(eq(items.id,id),eq(items.owner,uid)));
 }else if(action==="expense.save"){
  const {id,...data}=expenseInput.parse(input.data);await ownAccount(uid,data.accountId);
  if(id){const old=await db.select().from(expenses).where(and(eq(expenses.id,id),eq(expenses.owner,uid))).get();if(!old)throw new HttpError(404,"Nie znaleziono wydatku.");await db.update(expenses).set(data).where(and(eq(expenses.id,id),eq(expenses.owner,uid)));}
  else await db.insert(expenses).values({...data,id:crypto.randomUUID(),owner:uid,createdAt:now});
 }else if(action==="expense.delete")await db.delete(expenses).where(and(eq(expenses.id,z.string().max(80).parse(input.data.id)),eq(expenses.owner,uid)));
 return Response.json(await snapshot(uid),{headers:{"Cache-Control":"no-store"}});
}catch(e){return apiError(e);}}
