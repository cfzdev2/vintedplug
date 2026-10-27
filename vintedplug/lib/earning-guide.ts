import {z} from "zod/v3";

export const CHAPTER_IDS=["setup","recommendations","method","opportunity","selling","results"] as const;
export type ChapterId=typeof CHAPTER_IDS[number];
export const METHOD_IDS=["review","recovery"] as const;
export const GUIDE_ENTRY_IDS=[...CHAPTER_IDS,...METHOD_IDS] as const;
export type GuideEntryId=typeof GUIDE_ENTRY_IDS[number];
export type ChapterDefinition={id:GuideEntryId;title:string;description:string;prompts:string[];starter:string;source?:{label:string;url:string}};

export const EARNING_CHAPTERS:(ChapterDefinition&{id:ChapterId})[]=[
 {id:"setup",title:"Ustaw Vinted pod swoją niszę",description:"Marki, rozmiary, kategorie i budżet, od których zaczynasz.",prompts:["Jakie rzeczy znasz i potrafisz wycenić?","Jakie filtry ustawiasz?","Ile możesz przeznaczyć na jeden zakup?"],starter:"Zacznij od kategorii rzeczy, które potrafisz ocenić: ich stan, rozmiar i cenę. Zapisz swój budżet na zakupy oraz maksymalny koszt jednej rzeczy.\n\nW wyszukiwarce ustaw kategorię, markę, rozmiar, stan i zakres ceny odpowiednie do tego, czego szukasz. Vinted zapisuje używane filtry i może podpowiedzieć je przy kolejnym wyszukiwaniu.\n\nPrzygotuj kilka konkretnych wyszukiwań. Obok każdego zanotuj, jakich rzeczy szukasz i do jakiej ceny warto je dalej sprawdzać.",source:{label:"Vinted: wyszukiwanie przedmiotów",url:"https://www.vinted.pl/help/35"}},
 {id:"recommendations",title:"Dopasuj polecane oferty",description:"Co wiadomo o personalizacji i jak sprawdzać własne obserwacje.",prompts:["Jak ustawiasz swoje preferencje?","Jak oceniasz trafność polecanych rzeczy?","Które zmiany przetestowałeś i na ilu przykładach?"],starter:"Vinted opisuje personalizację na podstawie preferencji konta, historii oraz interakcji z ofertami. W wyszukiwaniu znaczenie mają też wybrane filtry i wpisana fraza.\n\nSprawdź ustawienia personalizacji na swoim koncie. Wybieraj preferencje odpowiadające rzeczom, których faktycznie szukasz, i korzystaj z dopasowanych filtrów.\n\nPraktyczny eksperyment: zanotuj ustawienia, przeglądaj wybrany typ rzeczy i porównuj trafność kolejnych rekomendacji. Własne wyniki opisuj jako obserwacje z testu. Opis Vinted nie wskazuje konkretnej liczby kliknięć ani czasu, który gwarantuje zmianę rekomendacji.",source:{label:"Vinted: polecane treści i personalizacja",url:"https://www.vinted.pl/help/409"}},
 {id:"method",title:"Moja metoda wyszukiwania",description:"Twój proces krok po kroku. Tutaj powstaje sedno poradnika.",prompts:["Od czego zaczynasz sesję szukania okazji?","Jakich fraz, marek i filtrów używasz?","Jak przechodzisz między wynikami, profilami i polecanymi?","Co sprawdzasz przed kontaktem ze sprzedającym?","Kiedy kupujesz, a kiedy odpuszczasz?"],starter:""},
 {id:"opportunity",title:"Sprawdź, czy to okazja",description:"Stan, pełny koszt zakupu i założenia dotyczące sprzedaży.",prompts:["Po czym rozpoznajesz rzecz wartą zakupu?","Jak porównujesz ceny i sprawdzasz szczegóły?","Ile chcesz zarobić i jaki zostawiasz zapas na negocjacje?"],starter:"Zanim kupisz, sprawdź zdjęcia, metki, wymiary i opis wad. Jeśli istotnego szczegółu brakuje, zapytaj sprzedającego.\n\nPolicz pełny koszt: cena zakupu, dostawa, opłaty i ewentualne przygotowanie rzeczy. Przyjmij ostrożną cenę sprzedaży, a następnie odejmij zapisane koszty. Cena wystawienia podobnej oferty jest tylko punktem porównania; nie potwierdza, za ile rzecz faktycznie się sprzedała.\n\nZapisz maksymalną cenę zakupu i minimalny oczekiwany wynik. W vintedplug możesz później porównać swoje założenia z rzeczywistą sprzedażą."},
 {id:"selling",title:"Od zakupu do sprzedaży",description:"Przygotowanie rzeczy, ogłoszenie i codzienna organizacja.",prompts:["Jak przygotowujesz rzecz i zdjęcia?","Co musi znaleźć się w Twoim ogłoszeniu?","Jak ustalasz cenę i prowadzisz negocjacje?"],starter:"Po zakupie dodaj rzecz do właściwego konta w panelu. Zapisz datę, koszt zakupu oraz koszty dodatkowe, żeby później sprawdzić rzeczywisty wynik.\n\nPrzygotuj zdjęcia, wymiary, opis stanu i wad. Uzupełnij kartę rzeczy, a następnie skorzystaj z Asystenta sprzedaży oraz Studia zdjęć.\n\nPo wystawieniu zmień status rzeczy. Gdy dojdzie do sprzedaży, wpisz faktyczną cenę i datę. Dashboard danego konta pokaże obrót oraz wynik po zapisanych kosztach."},
 {id:"results",title:"Przykłady i wnioski",description:"Rzeczy z Twojej praktyki: zakup, koszty, sprzedaż i czas.",prompts:["Co znalazłeś i jak to wyszukałeś?","Ile zapłaciłeś łącznie z kosztami?","Za ile i po ilu dniach rzecz się sprzedała?","Co nie wyszło i co zmieniłeś przy następnym zakupie?"],starter:""},
];

export const AUTHOR_METHODS:ChapterDefinition[]=[
 {id:"review",title:"Moja metoda: sprawdzanie ogłoszeń",description:"Własne obserwacje dotyczące przygotowania i moderacji ofert.",prompts:["Jak przygotowujesz zdjęcia, metki, kategorię i opis?","Jakie komunikaty otrzymałeś i jakie poprawki pomogły?","Co jest Twoją obserwacją, a co potwierdza oficjalna instrukcja?","W jakim okresie i na ilu własnych ofertach sprawdzałeś ten proces?"],starter:""},
 {id:"recovery",title:"Moja metoda: po banie i nowe konto",description:"Twój przebieg odwołania i powrotu dopuszczonego przez Vinted.",prompts:["Jaki powód blokady wskazało Vinted?","Jakie dowody dołączyłeś do odwołania i jaki był wynik?","Jakie instrukcje dotyczące dalszego korzystania z konta dostałeś od wsparcia?","Jeśli utworzenie nowego konta było dozwolone, na jakiej podstawie? Usuń z przykładu dane osobowe."],starter:""},
];
export const ALL_GUIDE_CHAPTERS=[...EARNING_CHAPTERS,...AUTHOR_METHODS];
export const guideChapterInput=z.object({id:z.enum(GUIDE_ENTRY_IDS),body:z.string().max(6000,"Treść rozdziału może mieć do 6000 znaków."),example:z.string().max(2000,"Przykład może mieć do 2000 znaków.")}).strict();
export const earningGuideInput=z.object({
 revision:z.number().int().min(0).max(2_000_000_000),
 chapters:z.array(guideChapterInput).length(GUIDE_ENTRY_IDS.length,"Zapis wymaga wszystkich rozdziałów i metod. Odśwież panel, zachowując swój tekst."),
}).strict().superRefine((v,c)=>{
 if(new Set(v.chapters.map(ch=>ch.id)).size!==GUIDE_ENTRY_IDS.length)c.addIssue({code:z.ZodIssueCode.custom,message:"Każdy rozdział musi wystąpić dokładnie raz.",path:["chapters"]});
});
export type GuideChapter=z.infer<typeof guideChapterInput>;
export type GuideInput=z.infer<typeof earningGuideInput>;
export type EarningGuide={chapters:GuideChapter[];revision:number;updatedAt:string};
export function initialGuideChapters():GuideChapter[]{return ALL_GUIDE_CHAPTERS.map(c=>({id:c.id,body:c.starter,example:""}));}
// Upgrade the earlier six-chapter document at read time, without overwriting
// stored text, revision or authorship. Every write must include the new methods.
export function normalizeGuideChapters(saved:readonly GuideChapter[]):GuideChapter[]{
 return initialGuideChapters().map(fallback=>{const chapter=saved.find(c=>c.id===fallback.id);return chapter?{...chapter}:fallback;});
}
