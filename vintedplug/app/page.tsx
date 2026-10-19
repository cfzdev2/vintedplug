import {requireChatGPTUser,chatGPTSignOutPath} from "./chatgpt-auth";
import {snapshot} from "@/lib/server";
import {Panel} from "@/components/vp/panel";
import type {Workspace} from "@/lib/domain";
export const dynamic="force-dynamic";
export default async function Home(){
 const user=await requireChatGPTUser("/");
 const data=await snapshot(user.userId) as Workspace;
 return <Panel initial={data} displayName={user.fullName??"Sprzedawca"} email={user.email} signOutHref={chatGPTSignOutPath("/")}/>;
}
