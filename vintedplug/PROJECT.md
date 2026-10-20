# vintedplug — pierwsza wersja

Panel sprzedażowy po polsku: oddzielne konta i dashboardy, rzeczy, sprzedaże, dodatkowe wydatki, zdjęcia, kalkulator negocjacji, szablony, moduły AI i baza wiedzy.

## Uruchomiona architektura pierwszej wersji

- React 19 + TypeScript i API zgodne z Next.js, uruchamiane przez Vinext na Cloudflare Workers.
- Tailwind CSS, komponenty dialogów shadcn/ui, ikony Lucide i wykresy Recharts.
- Trwała relacyjna baza D1 i magazyn plików R2, provisionowane przez Sites.
- Prywatne logowanie przez ChatGPT. Dane sprzedaży i pliki są ograniczone do zalogowanego właściciela. Autorski poradnik jest wspólnym materiałem Bazy wiedzy; jego zapis wymaga uprawnień autora.
- Kwoty jako całkowita liczba groszy; wyniki są wyliczane z aktualnych rekordów.

Supabase pozostaje rekomendacją dla docelowej wersji SaaS. Nie jest jeszcze podłączony. W tej prywatnej wersji użyto trwałej bazy i logowania hostingu, aby panel był od razu użyteczny. Stripe nie jest jeszcze podłączony i panel nie pobiera płatności.

## Dane i finanse

Tryb przykładowy działa wyłącznie w pamięci bieżącej sesji. Dane demonstracyjne nigdy nie są zapisywane jako rzeczywiste transakcje. „Włącz własny panel” przełącza na dane zapisywane w bazie. Local storage przechowuje tylko preferencję trybu.

Koszt rzeczy = zakup + dodatkowy koszt rzeczy. Wynik w okresie = sprzedaże w okresie − koszt sprzedanych rzeczy − dodatkowe wydatki konta w okresie. Wydatki = zakupy w okresie + dodatkowe koszty konta. Wartość zapasów pokazuje koszt niesprzedanych rzeczy teraz. Wyniki są przed podatkiem i nieujętymi kosztami.

Zwrot w tej wersji wycofuje daną sprzedaż ze zestawień i przywraca rzecz do zapasów. Nie jest osobnym przepływem finansowym z datą refundacji. Rozliczanie zwrotów w różnych okresach jest osobnym zadaniem dalszego rozwoju.

Nową rzecz można dodać jako „Szkic” lub „Wystawione”. „Sprzedane” pojawia się przy edycji zapisanej rzeczy, a „Zwrot” dopiero przy rzeczy zapisanej jako sprzedana (lub już zwróconej, aby nadal dało się ją edytować). Po zwrocie można wrócić do szkicu, ponownie wystawić rzecz lub zapisać kolejną sprzedaż. Reguły są wspólne dla formularza, serwera i trybu demo. Przy sprzedaży i zwrocie sekcja szczegółów ogłoszenia jest ukryta, ale jej wartości pozostają w formularzu i nie giną przy zapisie ani przełączaniu statusu. Wymiary, wady i opis są opcjonalne.

Edycja rzeczy ma kontrolę rewizji, aby wykrywać równoczesne zmiany w kilku oknach. Usunięcie konta wymaga wpisania jego nazwy i usuwa jego rzeczy oraz wydatki. Zdjęcia są prywatne, a format i rozmiar pliku sprawdzane po stronie serwera.

## AI

Szablony opisów/odpowiedzi i kalkulator negocjacji działają bez dostawcy AI; są wyraźnie oznaczone jako szablony.

Generowanie tekstu korzysta z Gemini: wymagany jest serwerowy sekret `GEMINI_API_KEY`, a opcjonalny `GEMINI_TEXT_MODEL` domyślnie wskazuje `gemini-3.5-flash-lite`. Klucz OpenAI nie jest używany do tekstów i nie ma automatycznego przełączania na płatnego dostawcę. Model ma Free Tier według cennika Google sprawdzonego 19.10.2026; dostępność i rzeczywiste limity zależą od projektu w Google AI Studio. Aby testować bez opłat, właściciel wybiera projekt Free Tier bez włączania płatnego rozliczania. Panel nie zmienia planu Google ani nie gwarantuje określonego darmowego limitu. Edycja zdjęć pozostaje osobną, domyślnie wyłączoną integracją OpenAI, wymagającą `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL` i `IMAGE_AI_ENABLED=true`. Właściciel konfiguruje wartości z `.env.example` przez sekrety hostingu; klucze nie trafiają do repozytorium, przeglądarki ani odpowiedzi API.

Trasy stosują limity serwerowe 20 generacji tekstu i 3 edycji zdjęć na dzień UTC na użytkownika. Nieudane żądanie zwraca limit. Włączenie prawdziwych modeli wymaga sprawdzenia ich zgodności, uprawnień konta, kosztu i jakości. Nie wykonywano płatnych wywołań AI podczas budowy tej wersji.

Publikowanie przez Sites: po kompilacji, przed utworzeniem archiwum, usuń wyłącznie wygenerowany `dist/server/.dev.vars`. Plugin Cloudflare kopiuje tam lokalne sekrety na potrzeby uruchomienia deweloperskiego; ten plik nie może znaleźć się w archiwum hostingu. Źródłowa `.dev.vars` pozostaje lokalnie i jest ignorowana przez Git. Uruchom usunięcie jako ostatnią komendę source helpera, po `build-site.mjs`, przed pakowaniem. Sprawdź, czy gotowy pakiet nie zawiera wartości lokalnych kluczy. Produkcja otrzymuje sekrety z konfiguracji Sites.

## Asystent: słowa kluczowe i edycja tekstu — 19 października 2026

W trybie „Ogłoszenie” Asystent ma opcjonalne pole dodatkowych cech i słów kluczowych (do 500 znaków). Sprzedawca może dopisać tam prawdziwe cechy przedmiotu, np. „ciepła, przejściowa, na jesienne dni”; mają być wykorzystane również wtedy, gdy nie są powtórzone w karcie. W razie sprzeczności pierwszeństwo mają zapisane dane z karty, zwłaszcza marka, rozmiar, stan, wady i wymiary. Pola nadal są cytowanymi danymi, nie instrukcjami do wykonania. Puste pole jest dozwolone. Frazy są przechowywane w pamięci widoku osobno dla każdej rzeczy, a nie w bazie. Nie są używane przez deterministyczny szablon. Tytuł i opis, zarówno z szablonu, jak i z AI, można poprawić przed skopiowaniem lub przeniesieniem do formularza rzeczy. Zapis następuje po zatwierdzeniu formularza.

`lib/ai-text.ts` zawiera walidację żądania, konstrukcję danych i instrukcji, żądanie Gemini GenerateContent z JSON Schema dla ogłoszenia oraz kontrolę odpowiedzi. Do modelu trafiają wyłącznie dane opisowe rzeczy, bez kosztu zakupu, minimum zarobku ani danych konta. Niekompletne wyniki, odmowy, puste pola, błędna kategoria i przekroczenia długości nie są przyjmowane jako gotowy tekst. Błędy dostawcy są zamieniane na własne komunikaty, bez zwracania surowych szczegółów. Dotychczasowe autoryzowanie rzeczy i limity serwerowe z refundacją nieudanego żądania pozostają aktywne. Zmiana rzeczy, trybu lub rewizji unieważnia oczekujący wynik, aby nie przypisać go do innego przedmiotu.

Integrację tekstową przełączono z OpenAI na Gemini na polecenie właściciela. Gemini dostaje instrukcję systemową i osobno dane przedmiotu; klucz jest wysyłany w nagłówku `x-goog-api-key`, nigdy w URL. Przyjmowany jest wyłącznie jeden ukończony wynik `STOP`; części oznaczone jako myślenie są pomijane, a blokada lub przerwany wynik nie stają się gotowym ogłoszeniem. Wywołanie nie używa narzędzi, wyszukiwania ani historii innych generacji. Błąd limitu Gemini jest widoczny jako błąd, bez ponawiania u innego dostawcy.

Podstawa dokumentacji (19.10.2026): `https://ai.google.dev/api/generate-content`, `https://ai.google.dev/gemini-api/docs/generate-content/structured-output`, `https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite`, `https://ai.google.dev/gemini-api/docs/pricing`. Testy Gemini używają atrap; nie potwierdzają jakości tekstów ani limitów konkretnego konta. W konfiguracji hostingu na etapie tej zmiany brakowało `GEMINI_API_KEY`; bezpieczne dodanie sekretu i test rzeczywistego generowania pozostają wymagane przed oznaczeniem AI jako działającego. Klucza nie należy przekazywać w czacie ani repozytorium. Wcześniej utworzony lokalny klucz OpenAI został uwierzytelniony, ale próbę generowania zatrzymał brak salda (`credit_balance_exhausted`); nie jest wykorzystywany przez generator Gemini.

## Rozbudowanie opisów — 20 października 2026

Asystent ogłoszeń ma wybór wersji: naturalna (domyślna), krótka i szczegółowa. `listingStyle` jest walidowanym enumem API, przekazywanym przez trasę do generatora i jawnie w danych żądania modelu. Starsze żądania bez tego pola zachowują wersję naturalną. Wybór nie zmienia faktów przedmiotu ani odpowiedzi kupującemu. Zmiana ustawienia zachowuje już wygenerowany i edytowany tekst do kolejnej generacji, ale oznacza wynik jako pochodzący z innych ustawień, gdy zmieniła się wersja lub dodatkowe cechy. Etykieta udanej generacji pokazuje jej wersję. Błąd nowej próby jest widoczny przy wyniku wraz z informacją o zachowaniu wcześniejszego tekstu. Szablon nadal korzysta z zapisanych danych i nie jest generacją AI.

Nowe instrukcje opisują wyszukiwalny tytuł, naturalne wprowadzenie, rozwijanie dodatkowych cech, czytelne grupowanie detali oraz osobny blok wymiarów. Zawierają wzorce bogatszej karty, skąpej karty i informacji dopisanych w słowach kluczowych, z zakazem przenoszenia przykładowych faktów. Zapisane wady i wymiary mają pozostać także w krótkiej wersji. Ocena „bardzo dobry” nie potwierdza braku wad, śladów noszenia ani oryginalności. Krótka i naturalna wersja pomijają porady stylizacyjne i ogólne sugestie dopasowania. Szczegółowa jest rozbudowanym opisem sprzedażowym z kontekstem noszenia i stylizacji, ale bez dopisywania niepotwierdzonych cech technicznych. Panel wyjaśnia, że tekstowy generator nie analizuje miniatury zdjęcia.

Zgodnie z doprecyzowaniem właściciela wersja „Szczegółowa — długi opis + hasztagi” celuje w 130–190 słów samego tekstu i osobną linię 8–12 różnych, pasujących hasztagów. Kontekst sezonu, codziennego noszenia, stylizacji i doboru rozmiaru może rozwinąć opis także przy skąpej karcie. Materiał, wypełnienie, zapięcie, kaptur, kieszenie, autentyczność, wady i wymiary nadal muszą wynikać z danych. Hasztagi mogą odnosić się do podanej marki, rodzaju rzeczy, koloru, rozmiaru, sezonu i stylu, bez obcych marek. Krótka i naturalna wersja pozostają zwięzłe, bez obowiązkowych hasztagów i minimum długości.

Serwer sprawdza w szczegółowej wersji minimum 100 słów bez hasztagów oraz od 8 do 12 tagów bez powtórzeń (bez rozróżniania wielkości liter). Gdy wynik nie spełnia tych wymagań, model otrzymuje jedną prośbę o pełną poprawkę w ramach tego samego limitu czasu 60 sekund. Gotowy wynik nie jest ponawiany; błędy HTTP również nie są automatycznie ponawiane. Po ponownie niepełnym wyniku jest komunikat błędu. Korekta może zużyć drugi request Gemini, ale jest jedną operacją użytkownika w limicie panelu.

W wygenerowanym opisie poprawiana jest pisownia dwóch nazw wymiarów: „szerokosc” → „szerokość” i „dlugosc” → „długość”, z zachowaniem wielkości liter. Liczby, jednostki, przybliżenia i zapisane dane karty nie są przez tę korektę zmieniane. Testy sprawdzają te przypadki oraz rozdzielenie krótkiej/naturalnej wersji od wymagań długiej wersji, liczenie tekstu niezależnie od hashtagów i jednorazową poprawkę niepełnej generacji. Pozostają testy walidacji, autoryzowanego transportu klucza, błędów dostawcy, oddzielenia odpowiedzi kupującemu i danych finansowych. Przeciążenie Gemini (HTTP 503) ma osobny komunikat, a wcześniejszy wynik nie jest prezentowany jako nowy po błędzie.

## Autorski poradnik — 19 października 2026

Baza wiedzy zawiera osobny poradnik „Zarabianie na Vinted”. Sześć rozdziałów: ustawienie wyszukiwania, personalizacja polecanych ofert, własna metoda, ocena okazji, przygotowanie sprzedaży i przykłady. Materiał startowy odwołuje się do oficjalnych opisów Vinted (`/help/35`, `/help/409`, sprawdzone 19.10.2026). Metoda autora i wyniki pozostają puste do uzupełnienia; treści nie obiecują konkretnych efektów personalizacji.

Autor może edytować treść każdego rozdziału i przykład z praktyki. API zapisuje poradnik w D1, waliduje kompletność rozdziałów i kontroluje rewizję. Tekst jest wyświetlany jako tekst, bez wykonywania HTML. Kopia JSON zawiera też poradnik. W trybie demo edycja jest wyłączona; przełączenie na własny panel zachowuje widok poradnika.

Poradnik jest wspólnym materiałem dla odbiorców Site, a nie oddzielną metodą każdego sprzedawcy. `VP_GUIDE_AUTHOR_EMAIL`, konfigurowane wyłącznie na serwerze, uprawnia wskazany zweryfikowany adres do pierwszego zapisu. Ten zapis wiąże autorstwo z uwierzytelnionym ID użytkownika w danym Site; kolejne zmiany wymagają tego ID. Pozostali użytkownicy mają tylko odczyt. Brak konfiguracji zamyka możliwość pierwszego zapisu. E-mail i ID autora nie są udostępniane w danych panelu. Obecny dostęp Site nadal jest prywatny.

## Rozbudowa Bazy wiedzy — 19 października 2026

Sześć głównych tematów: regulamin a sprzedaż; limity, płatności i polskie podatki; ograniczanie ryzyka blokady; metoda autora dotycząca sprawdzania ogłoszeń; odwołanie po banie i warunki nowego konta; pozyskiwanie towaru. Teksty z oficjalnymi źródłami i datą sprawdzenia znajdują się w `lib/knowledge-base.ts`, a karty, wyszukiwarka, filtry i czytnik w `components/vp/knowledge-base.tsx`. Krótkie wcześniejsze porady pozostają w rozwijanej części. Pełny sześcioczęściowy poradnik nadal działa.

Trzy metody mają edytor autora: treść do 6000 znaków i przykład do 2000. Metoda pozyskiwania korzysta z istniejącego rozdziału `method`; nie powstaje druga kopia treści. `review` i `recovery` są dodatkowymi wpisami we wcześniejszym dokumencie JSON poradnika. Odczyt uzupełnia stary zestaw sześciu rozdziałów do ośmiu, zachowując zapisane treści, autora, rewizję i datę. Zapis wymaga pełnych ośmiu wpisów, więc dawny klient nie skasuje nowych metod. Zmiana nie wymaga migracji SQL. Uprawnienia autora, kontrola rewizji, edycja tylko we własnym trybie i kopia JSON pozostają w mocy.

Treści rozdzielają raportowanie DAC7 (co najmniej 30 transakcji lub ponad 2000 EUR rocznie na platformie), prywatne zbycie rzeczy, działalność nierejestrowaną w Polsce (limit przychodu należnego 10 813,50 zł kwartalnie w 2026 r.) i KYC dostawcy płatności. Dashboard nie jest rozliczeniem podatkowym. Zasady platformy są oddzielne od ustaw podatkowych: standardowe konto nie dopuszcza rzeczy pozyskanych do komercyjnej odsprzedaży. Tematy moderacji opisują zgodność, dowody i odwołania, bez zapewnień pominięcia kontroli lub bezwarunkowego utworzenia konta po blokadzie. Metody autora pozostają puste do uzupełnienia.

## Wygląd i logo — 19 października 2026

Logo przekazane przez użytkownika jest w `public/brand/vintedplug-logo.png` w oryginalnej postaci. Nagłówek korzysta z lekkiego wariantu WebP; favicon ICO, ikony PNG oraz Apple Touch Icon powstały przez zmianę formatu i rozmiaru tej samej grafiki. Kompozycja logo pozostaje bez zmian.

Paleta panelu: dominują białe powierzchnie, jasne chłodne tła, podstawowy teal `#006676`, ciemny teal `#003c49` i turkusowe akcenty. Poprzednie zielone, oliwkowe i złote kolory interfejsu zostały zastąpione także w formularzach, wykresach, poradniku i ilustracjach zastępczych. Dawne wbudowane kolory kont są mapowane przy wyświetlaniu na nową paletę, bez przepisywania zapisanych danych. Rzeczywiste zdjęcia przedmiotów pozostają zdjęciami użytkownika.

## Sprawdzanie i rozwój

```sh
node --experimental-strip-types --test tests/*.test.mjs
pnpm exec tsc --noEmit
```

Instalacja, build i publikacja: według umiejętności Sites. Schemat bazy w `db/schema.ts`, migracje w `drizzle/`. Nie zmieniaj opublikowanych migracji; dodawaj kolejne.

Następne integracje: Supabase dla wersji SaaS, testy modeli AI, Stripe i limity planów. Bieżący kod i historia są przechowywane w repozytorium źródłowym Site.
