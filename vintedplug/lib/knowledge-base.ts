import type {GuideEntryId} from "./earning-guide";

export const KNOWLEDGE_REVIEWED_AT="2026-10-19";
export const KNOWLEDGE_SOURCES={
 terms:{label:"Vinted · Regulamin użytkownika",url:"https://www.vinted.pl/terms-and-conditions"},
 catalog:{label:"Vinted · Reguły katalogu",url:"https://www.vinted.pl/catalog-rules"},
 listings:{label:"Vinted · Ukryte i usunięte ogłoszenia",url:"https://www.vinted.pl/help/62"},
 recommendations:{label:"Vinted · Polecane treści",url:"https://www.vinted.pl/help/409"},
 appeals:{label:"Vinted · Odwołanie od decyzji moderacyjnej",url:"https://www.vinted.pl/help/1599"},
 dac7:{label:"KAS · Co warto wiedzieć o DAC7",url:"https://www.gov.pl/web/kas/co-warto-wiedziec-o-dyrektywie-dac7"},
 dac7faq:{label:"Ministerstwo Finansów · DAC7, pytania sprzedawców",url:"https://www.podatki.gov.pl/podatkowa-wspolpraca-miedzynarodowa/dpi-digital-platform-information"},
 privateSale:{label:"Ministerstwo Finansów · Zbycie rzeczy ruchomej",url:"https://www.podatki.gov.pl/podatki-osobiste/pit/informacje-podstawowe/co-jest-opodatkowane/zbycie-rzeczy-ruchomej"},
 business:{label:"Ministerstwo Finansów · Działalność nierejestrowana",url:"https://www.podatki.gov.pl/poradniki-i-informatory/dzialalnosc-nierejestrowana"},
 businessRules:{label:"Biznes.gov.pl · Warunki działalności nierejestrowej",url:"https://biznes.gov.pl/pl/firma/zakladanie-firmy/chce-wiedziec-jak-zalozyc-wlasna-firme/dzialalnosc-nierejestrowa-oraz-inne-sytuacje-w-ktorych-nie-trzeba-rejestrowac-firmy"},
} as const;
type SourceId=keyof typeof KNOWLEDGE_SOURCES;
export type KnowledgeSection={title:string;paragraphs?:string[];bullets?:string[];sources?:SourceId[];table?:{headings:string[];rows:string[][]}};
export type KnowledgeTopic={id:string;title:string;description:string;category:"Sprzedaż"|"Finanse"|"Moderacja"|"Moje metody";minutes:number;icon:"sales"|"money"|"shield"|"review"|"recovery"|"stock";takeaway:string;sections:KnowledgeSection[];methodId?:GuideEntryId;methodPrompts?:string[];relatedCourse?:boolean};

export const KNOWLEDGE_TOPICS:KnowledgeTopic[]=[
 {
  id:"listing-review",title:"Moja metoda: sprawdzanie ogłoszeń",description:"Miejsce na Twój proces przygotowania ofert i obserwacje dotyczące weryfikacji.",category:"Moje metody",minutes:3,icon:"review",methodId:"review",
  takeaway:"Opisz sprawdzony przez Ciebie proces oraz jego wyniki. Obserwację autora warto odróżnić od oficjalnej zasady Vinted.",
  sections:[
   {title:"Punkt wyjścia",paragraphs:["Przed wysłaniem oferty porównaj kategorię, markę, rozmiar i stan z rzeczywistym przedmiotem. Uzupełnij potrzebne dowody autentyczności. Jeśli ogłoszenie jest ukryte, zacznij od poprawek wymienionych w wiadomości Vinted."],sources:["listings"]},
   {title:"Jak dokumentować własny test",bullets:["Zapisz datę, kategorię rzeczy, komplet zdjęć i treść komunikatu.","Porównuj podobne przypadki; zanotuj także oferty, w których metoda nie pomogła.","Unikaj obietnicy pominięcia kontroli. Opisz kroki przygotowania oferty oraz zaobserwowany wynik."]},
  ],
 },
 {
  id:"after-ban",title:"Moja metoda: po banie i nowe konto",description:"Odwołanie, dokumentacja sprawy i warunki dozwolonego powrotu na platformę.",category:"Moje metody",minutes:4,icon:"recovery",methodId:"recovery",
  takeaway:"Zacznij od decyzji i odwołania. Możliwość utworzenia nowego konta zależy od reguł oraz okoliczności blokady.",
  sections:[
   {title:"Odwołanie krok po kroku",bullets:["Otwórz link z oficjalnego powiadomienia o decyzji.","Wskaż, z czym się nie zgadzasz, i dołącz dowody odnoszące się do podanej przyczyny.","Vinted podaje termin 6 miesięcy od powiadomienia i jedno odwołanie od danej decyzji moderacyjnej. Zachowaj kopię zgłoszenia i odpowiedzi."],sources:["appeals"]},
   {title:"Kiedy nowe konto jest dopuszczone",paragraphs:["Regulamin zasadniczo pozwala na jedno konto. Wyraźny wyjątek obejmuje nowe konto po zablokowaniu poprzedniego z powodu bezprawnego przejęcia. Dopuszcza też oddzielne konto zwykłe i Pro, gdy Pro jest dostępne. Vinted może uniemożliwić utworzenie nowego konta po blokadzie. Sprawdź decyzję i uzyskane instrukcje wsparcia, zanim zaczniesz ponownie."],sources:["terms"]},
   {title:"Przygotuj opis swojej sprawy",bullets:["Przyczyna i data blokady → dowody → odwołanie → odpowiedź Vinted → dalsze kroki.","W przykładzie usuń dane osobowe i pokaż, na jakiej podstawie dalsze korzystanie było dozwolone."]},
  ],
 },
 {
  id:"stock-sourcing",title:"Moja metoda: pozyskiwanie towaru",description:"Twoje źródła, filtry, kryteria zakupu i rzeczywiste przykłady okazji.",category:"Moje metody",minutes:4,icon:"stock",methodId:"method",relatedCourse:true,
  takeaway:"Kupno oceniaj po pełnym koszcie i rzeczywistym wyniku. Wybierz kanał sprzedaży, który dopuszcza Twój model handlu.",
  sections:[
   {title:"Co powinna opisywać metoda",bullets:["Źródło rzeczy i kategorie, na których się znasz.","Frazy, filtry i sposób ręcznego sprawdzania okazji.","Kontrolę autentyczności, stanu i kosztów przygotowania.","Maksymalną cenę zakupu, budżet oraz powody, dla których odpuszczasz.","Rzeczywisty przykład: zakup + dostawa + przygotowanie → sprzedaż → wynik i czas."]},
   {title:"Wspólna treść z poradnikiem",paragraphs:["Ten opis korzysta z rozdziału „Moja metoda wyszukiwania” w poradniku zarabiania. Edycja w dowolnym z tych miejsc aktualizuje ten sam materiał. W pełnym poradniku znajdziesz też ustawienia wyszukiwania, personalizację i ocenę okazji."]},
  ],
 },
 {
  id:"rules-sales",title:"Regulamin a skuteczna sprzedaż",description:"Co poprawić w ofercie i czego unikać, żeby sprzedawać zgodnie z zasadami.",category:"Sprzedaż",minutes:4,icon:"sales",
  takeaway:"Zacznij od poprawnej oferty, a efekty zmian oceniaj na własnych wynikach sprzedaży.",
  sections:[
   {title:"Najpierw sprawdź model sprzedaży",paragraphs:["Standardowe konto Vinted jest przeznaczone do sprzedaży niekomercyjnej. Reguły wykluczają na nim rzeczy kupione lub pozyskane z zamiarem odsprzedaży. Zarejestrowanie firmy albo działalność nierejestrowana nie zmieniają zasad platformy. Przy handlu sprawdź dostępność i warunki Vinted Pro dla swojego kraju."],sources:["catalog"]},
   {title:"Ułatw kupującemu znalezienie rzeczy",paragraphs:["Vinted wskazuje m.in. filtry, kategorię, markę, rozmiar, opis, cenę i stan jako parametry rekomendacji. Liczą się również interakcje oraz czas wystawienia; płatne promocje mogą zwiększać widoczność. To opis czynników, nie obietnica pozycji ani sprzedaży."],sources:["recommendations"]},
   {title:"Praktyczny plan pracy z ofertą",bullets:["Zbuduj tytuł z typu rzeczy, rzeczywistej marki i cechy istotnej dla kupującego.","Uzupełnij wymiary i pokaż stan na własnych, wyraźnych zdjęciach.","Zapisz cenę, koszty i minimum negocjacyjne w karcie rzeczy.","Testuj jedną zmianę naraz: zanotuj datę, cenę i wynik. Ceny innych ogłoszeń traktuj jako oferty, a nie dowód zakończonej sprzedaży."]},
   {title:"Czego nie robić dla zasięgów",bullets:["Nie dodawaj obcych marek ani nadmiaru niepowiązanych hasztagów. Wybierz właściwą kategorię.","Nie korzystaj z nieautoryzowanych botów do obsługi Vinted. Regulamin zabrania też usuwania i ponownego wystawiania tych samych przedmiotów."],sources:["listings","terms"]},
  ],
 },
 {
  id:"money-tax",title:"Limity, płatności i podatki",description:"DAC7, prywatna sprzedaż, działalność i Portfel Vinted. Polska, 2026 r.",category:"Finanse",minutes:6,icon:"money",
  takeaway:"Próg raportowania DAC7, limit działalności i weryfikacja płatności mają różne cele. Nie wyznaczają jednej kwoty sprzedaży wolnej od podatku.",
  sections:[
   {title:"DAC7: kiedy platforma raportuje sprzedaż towarów",paragraphs:["Raportowanie obejmuje co najmniej 30 transakcji LUB wynagrodzenie przekraczające 2000 euro w roku kalendarzowym na danej platformie. Przy 29 transakcjach i dokładnie 2000 euro oba warunki wyłączenia są spełnione; przy 30 transakcjach albo kwocie powyżej 2000 euro już nie.","DAC7 nie wprowadza nowego podatku. Raport przekazuje operator, a sprzedawca dostarcza wymagane dane. Samo wystawienie 30 ogłoszeń nie oznacza 30 zrealizowanych transakcji."],sources:["dac7","dac7faq"]},
   {title:"Prywatna rzecz a towar kupiony do handlu",paragraphs:["Dla prywatnej sprzedaży poza działalnością okres pół roku liczysz od końca miesiąca nabycia. Po jego upływie sprzedaż rzeczy nie podlega PIT. Przy wcześniejszej sprzedaży wykazujesz przychód i koszty w PIT-36, także gdy wystąpiła strata; podatek zależy od dochodu. Tej zasady nie przenoś na handel w ramach działalności."],sources:["privateSale"]},
   {title:"Działalność nierejestrowana w 2026 r.",paragraphs:["Limit to 10 813,50 zł przychodu należnego na kwartał, czyli 225% płacy minimalnej. To przychód, a nie zarobek po kosztach. Warunki obejmują m.in. niewykonywanie działalności gospodarczej przez ostatnie 60 miesięcy; są też pozostałe wymogi opisane w źródle. Po przekroczeniu limitu działalność staje się gospodarczą od dnia przekroczenia; wpis do CEIDG należy zgłosić w ciągu 7 dni."],sources:["businessRules"]},
   {title:"Rozliczenie i dokumenty",paragraphs:["Działalność nierejestrowaną rozliczasz w PIT-36 do 30 kwietnia kolejnego roku, wykazując przychody, udokumentowane koszty i dochód albo stratę. Dla PIT liczą się pieniądze otrzymane lub postawione do dyspozycji; limit działalności opiera się na kwotach należnych. VAT i kasa fiskalna mają oddzielne warunki oraz wyjątki — zwłaszcza zależne od rodzaju towaru."],bullets:["W vintedplug zapisuj daty i pełny koszt rzeczy oraz przechowuj dowody zakupu.","Porównuj eksport z historią platformy i płatności. Wynik dashboardu jest obliczeniem po zapisanych kosztach, przed podatkiem; aplikacja nie składa PIT ani raportu DAC7.","Rozpatruj swoją działalność jako całość. Oddzielne dashboardy kont nie tworzą osobnych limitów działalności jednej osoby."],sources:["business"]},
   {title:"Portfel i weryfikacja tożsamości",paragraphs:["Dostawca Portfela może wymagać dodatkowej weryfikacji KYC po osiągnięciu jego progów albo w innym momencie wymaganym przepisami i procedurami. Progi zależą od dostawcy. Brak zakończenia weryfikacji może wstrzymać korzystanie z Portfela i wypłaty. Nie utożsamiaj KYC z progiem DAC7; dane przekazuj w oficjalnym procesie."],sources:["terms"]},
   {title:"Jak czytać progi",table:{headings:["Zagadnienie","Co sprawdzasz"],rows:[["DAC7 · rok","Liczbę transakcji i wynagrodzenie na platformie"],["Prywatna sprzedaż · pół roku","Datę nabycia i charakter sprzedaży"],["Działalność nierejestrowana · kwartał","Przychód należny i pozostałe warunki"],["KYC · Portfel","Wymogi wskazanego dostawcy płatności"]]},paragraphs:["Materiał dotyczy Polski i stanu sprawdzonego 19.10.2026. Przy wyborze sposobu rozliczenia uwzględnij swoje pozostałe dochody i działalność; indywidualną sytuację możesz omówić z księgowym lub Krajową Informacją Skarbową."]},
  ],
 },
 {
  id:"avoid-blocks",title:"Jak ograniczać ryzyko blokady",description:"Checklista zgodnych ogłoszeń, komunikaty moderacji i reakcja na problem.",category:"Moderacja",minutes:3,icon:"shield",
  takeaway:"Najpierw usuń przyczynę wskazaną przez Vinted. Żadna checklista nie gwarantuje, że konto lub oferta nie zostaną sprawdzone.",
  sections:[
   {title:"Przed publikacją",bullets:["Sprawdź, czy przedmiot i charakter sprzedaży są dozwolone dla Twojego konta.","Użyj własnych zdjęć: cały przedmiot, metki, detale i widoczne wady. Nie przypisuj rzeczy do niepowiązanej marki.","Przedmiot powinien być w Twoim posiadaniu i dostępny do sprzedaży. Nie twórz duplikatów oferty."],sources:["catalog","listings"]},
   {title:"Zdjęcia AI: sprawdź regułę publikacji",paragraphs:["Odczytana wersja publicznych Reguł katalogu wymaga wiernego pokazania rzeczy i wskazuje zakaz edytowania zdjęć. Przed publikacją efektu ze Studia sprawdź aktualną regułę oraz instrukcję w formularzu Vinted. Samo oznaczenie AI nie przesądza o dopuszczalności konkretnej przeróbki. Zachowuj oryginały."],sources:["catalog"]},
   {title:"Ukrycie oferty i usunięcie to różne sytuacje",paragraphs:["Ukryte ogłoszenie popraw zgodnie z komunikatem. Vinted wskazuje, że po wymaganych zmianach może ponownie stać się widoczne. Przy usunięciu sprawdź uzasadnienie i dostępną ścieżkę odwołania. Ponawianie tego samego problemu może prowadzić do kolejnych ograniczeń."],sources:["listings"]},
   {title:"Zachowaj dowody",bullets:["Zapisz komunikat, datę, identyfikator oferty i zdjęcia przed zmianą.","Opisz, co poprawiłeś. Jeśli decyzja jest błędna, przygotuj konkretne dowody zamiast wysyłać wiele sprzecznych zgłoszeń."]},
  ],
 },
];

export function knowledgeMatches(topic:KnowledgeTopic,query:string){
 const normalize=(s:string)=>s.toLocaleLowerCase("pl-PL").normalize("NFD").replace(/\p{Diacritic}/gu,"").replaceAll("ł","l");
 const terms=normalize(query).trim().split(/\s+/).filter(Boolean);
 const text=normalize([topic.title,topic.description,topic.category,topic.takeaway,...topic.sections.flatMap(s=>[s.title,...(s.paragraphs??[]),...(s.bullets??[]),...(s.table?.rows.flat()??[])])].join(" "));
 return terms.every(term=>text.includes(term));
}
