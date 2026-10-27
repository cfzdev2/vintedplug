import type {z} from "zod/v3";
import type {aiRequestInput,ListingFacts} from "./ai-text";
type StoredAIItem=ListingFacts&{imageIds:string[]};

// Access functions must be scoped to the authenticated user by the API route.
export async function resolveAIContext(input:z.infer<typeof aiRequestInput>,access:{ownAccount:(id:string)=>Promise<unknown>;ownItem:(id:string)=>Promise<StoredAIItem>}):Promise<{item:StoredAIItem|null;facts:ListingFacts}>{
 if(input.kind==="listing"&&input.draft){
  await access.ownAccount(input.accountId!);
  return {item:null,facts:input.draft};
 }
 const item=await access.ownItem(input.itemId!);
 return {item,facts:item};
}
