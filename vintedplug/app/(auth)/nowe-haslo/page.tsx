import {AuthScreen} from "@/components/vp/auth-screen";
export const dynamic="force-dynamic";
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <AuthScreen mode="reset" params={searchParams}/>;}
