import {requireUser,signOutPath} from "@/lib/identity";
import {billingStatus} from "@/lib/billing-server";
import {SubscriptionCard} from "@/components/vp/subscription-card";
export const dynamic="force-dynamic";
export default async function SubscriptionPage(){
 const user=await requireUser("/abonament"),status=await billingStatus(user.userId);
 return <main className="subscription-page"><header className="subscription-page-header"><a className="brand" href="/" target="_top"><img className="brand-logo" src="/brand/vintedplug-logo-128.webp" alt="" width={38} height={38}/><span className="brand-name">vinted<span>plug</span></span></a><a className="text-button" href={signOutPath("/abonament")} target="_top">Wyloguj się</a></header><div className="subscription-page-content"><div className="subscription-page-heading"><span className="eyebrow">TWOJA PRZESTRZEŃ SPRZEDAŻY</span><h1>{status.access?"Twój dostęp do vintedplug.":"Uporządkuj sprzedaż. Miej kontrolę nad zarobkiem."}</h1><p>Zalogowano jako <strong>{user.email}</strong>. Abonament zostanie przypisany do tego konta.</p></div><SubscriptionCard initial={status} standalone/></div></main>;
}
