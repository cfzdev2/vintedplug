import {LandingPage} from "@/components/vp/landing-page";
import type {Metadata} from "next";
import "./landing.css";

export const metadata:Metadata={
 title:"vintedplug — Mniej chaosu. Więcej kontroli nad sprzedażą.",
 description:"Magazyn, finanse kont sprzedażowych, opisy AI i studio zdjęć. Przygotuj ogłoszenia na Vinted i śledź zysk w jednym panelu. 29,90 zł miesięcznie.",
 openGraph:{title:"vintedplug — Twoje rzeczy. Twój zysk. Mniej chaosu.",description:"Jedna przestrzeń do przygotowania ogłoszeń i śledzenia zarobków ze sprzedaży.",locale:"pl_PL",type:"website"},
};
export default function Home(){return <LandingPage/>;}
