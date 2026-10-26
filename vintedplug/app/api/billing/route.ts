import {billingUser,billingStatus,billingResponseError} from "@/lib/billing-server";
export const dynamic="force-dynamic";
export async function GET(){try{
 const user=await billingUser();return Response.json(await billingStatus(user.userId),{headers:{"Cache-Control":"no-store"}});
}catch(e){return billingResponseError(e);}}
