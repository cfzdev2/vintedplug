import {requireUser,signOutPath} from "@/lib/identity";
import {snapshot} from "@/lib/server";
import {Panel} from "@/components/vp/panel";
import type {Workspace} from "@/lib/domain";
import {billingStatus} from "@/lib/billing-server";
import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
export default async function PanelPage(){
 const user=await requireUser("/panel");
 const billing=await billingStatus(user.userId);
 if(!billing.access)redirect("/abonament");
 const data=await snapshot(user.userId) as Workspace;
 return <Panel initial={data} billing={billing} displayName={user.fullName??"Sprzedawca"} email={user.email} signOutHref={signOutPath("/")}/>;
}
