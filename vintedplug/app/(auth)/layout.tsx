import type {Metadata} from "next";
import "../auth.css";
export const metadata:Metadata={title:"Twoje konto — vintedplug",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function AuthLayout({children}:{children:React.ReactNode}){return <main className="vp-auth-page"><header><a className="brand" href="/"><img className="brand-logo" src="/brand/vintedplug-logo-128.webp" alt="" width={38} height={38}/><span className="brand-name">vinted<span>plug</span></span></a><a href="/">Wróć na stronę główną</a></header><div className="vp-auth-body">{children}<p className="vp-auth-footer">Jedna przestrzeń. Twoje rzeczy i Twoje wyniki.</p></div></main>;}
