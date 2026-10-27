# Samodzielny vintedplug

Stan: 27 października 2026. Kod i build samodzielnego serwisu są przygotowane; właściciel utworzył już bazę D1. Worker, R2, poczta i domena nie są jeszcze uruchomione. Nie wysłano rzeczywistych e-maili. Obecny hosting Sites nadal używa logowania przez ChatGPT. Płatności pozostają testowe.

Aktualizacja konfiguracji: właściciel zalogował Wrangler na swoim komputerze i utworzył D1 `vintedplug` w WEUR. Na podstawie wyniku jego polecenia zapisano `database_id` w `wrangler.standalone.jsonc`; binding aplikacji pozostaje `DB`. Baza jest jeszcze pusta, nie zastosowano migracji ani nie przeniesiono danych. Autoryzacja wykonana na komputerze właściciela nie daje dostępu temu środowisku — jego połączenie OAuth z panelem Cloudflare zostało zablokowane przez politykę sieciową. Kolejne operacje na koncie wykonuje właściciel w swoim terminalu. R2, Worker, poczta i domena nadal czekają na uruchomienie.

## Dwa sposoby uruchamiania

- `node --run dev` / `node --run build`: dotychczasowy hosting Sites. Brak `VP_AUTH_MODE` oznacza `sites`.
- `node --run standalone:dev` / `node --run standalone:build`: osobny Worker na koncie właściciela. `wrangler.standalone.jsonc` ustawia `VP_AUTH_MODE=standalone`. Nie ma pluginu Sites, pozorowanego użytkownika ani połączeń z aplikacjami ChatGPT.
- Oba buildy zapisują wynik do `dist/`. Przed wdrożeniem ZAWSZE zbuduj wybrany wariant od nowa. `node --run standalone:check` odrzuca wynik buildu Sites i brak prawdziwego ID bazy.

Plik `wrangler.standalone.jsonc` jest celowo poprawnym JSON bez komentarzy i końcowych przecinków, aby walidator oraz Wrangler czytały ten sam dokument. Nie wpisuj do niego sekretów.

## Logowanie

Better Auth 1.7.12 + adapter Drizzle/D1. Rejestracja wymaga potwierdzenia e-maila (link ważny godzinę). Hasła mają 12–128 znaków i są haszowane przez bibliotekę. Sesja trwa do 7 dni; cookie ma HttpOnly, Secure w HTTPS i SameSite=Lax. Reset hasła wymaga jednorazowego linku ważnego 30 minut i usuwa wcześniejsze sesje. Tokeny nie trafiają do logów aplikacji. Formularze mają polskie komunikaty, pokazywanie hasła oraz ponowne wysłanie linku. Ogólne odpowiedzi rejestracji i resetu ograniczają ujawnianie istnienia kont.

Każde API danych i rozliczeń sprawdza sesję po stronie serwera, a następnie istniejące uprawnienia abonamentu. W trybie standalone nie ma awaryjnego przejścia na tożsamość ChatGPT. Worker usuwa przychodzące nagłówki tożsamości Sites. Limit prób działa atomowo w D1 także przy równoległych żądaniach. Endpoint auth dopuszcza wyłącznie używane operacje; POST wymaga zgodnego Origin i JSON do 16 KiB. Powroty z formularzy są ograniczone do lokalnych ścieżek.

## Własna infrastruktura

W katalogu aplikacji, po zainstalowaniu zależności przez `node --run install:ci`:

1. Połącz WŁASNE konto: `node node_modules/wrangler/bin/wrangler.js login`. Kontrolę logowania zachowuje właściciel. Nie przesyłaj tokenów do rozmowy ani GitHuba.
2. Utwórz D1 i R2, jeśli jeszcze nie istnieją: `node node_modules/wrangler/bin/wrangler.js d1 create vintedplug` oraz `node node_modules/wrangler/bin/wrangler.js r2 bucket create vintedplug-photos`. To wymaga weryfikacji planu i ewentualnej zgody na koszty; kod nie uruchamia tych operacji automatycznie. Koszt CPU haszowania haseł trzeba sprawdzić na docelowym planie Workers.
3. Wstaw zwrócony `database_id` pod bindingiem DB w `wrangler.standalone.jsonc`. Nazwa R2 musi odpowiadać prawdziwemu bucketowi. Ustaw `account_id`, jeżeli konto ma dostęp do wielu organizacji.
4. W `vars` ustaw `VP_APP_ORIGIN` na jeden kanoniczny adres HTTPS, np. własny adres workers.dev lub domenę. W tym samym pliku ustaw właściwe testowe identyfikatory ceny i Customer Portal. `STRIPE_MODE` na tym etapie pozostaje `test`.
5. Skonfiguruj nadawcę transakcyjnego Resend i potwierdź domenę nadawcy. Zapisz sekrety przez `wrangler secret put NAZWA --config wrangler.standalone.jsonc`: `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`. Dla sekretu sesji wygeneruj lokalnie co najmniej 32 losowe bajty; nie używaj wartości testowych. Ustaw też istniejące sekrety Gemini i rozliczeń, patrz poniżej. Nie wpisuj wartości do śledzonych plików.
6. Dla NOWEJ pustej bazy zastosuj migracje: `node node_modules/wrangler/bin/wrangler.js d1 migrations apply vintedplug --remote --config wrangler.standalone.jsonc`. Dla migracji istniejących danych zastosuj procedurę następnej sekcji; nie uruchamiaj ponownie starych migracji na istniejących tabelach.
7. `node --run test`, `node --run typecheck`, `node --run standalone:build`, `node --run standalone:check`. Potem `node node_modules/wrangler/bin/wrangler.js deploy --config dist/server/wrangler.json`.
8. Sprawdź rzeczywistą rejestrację, dostarczenie maila, potwierdzenie, logowanie, reset, wylogowanie, izolację dwóch klientów i cały zakup testowy. Przed pierwszymi klientami przejrzyj aktualny audyt zależności i dokumenty serwisu. Dopiero po tej weryfikacji wykonuj przełączenie adresu.

Własną domenę przypnij do tego samego Workera; wszystkie callbacki i linki mailowe muszą używać `VP_APP_ORIGIN`. Nie zakupiono domeny i nie wybrano jej nazwy.

Do lokalnych testów standalone użyj ignorowanego `.dev.vars` z rzeczywistą konfiguracją i lokalnym `VP_APP_ORIGIN` zgodnym z adresem serwera. HTTP jest dozwolone tylko podczas developmentu na localhost/127.0.0.1/terminal.local. Nie przełączaj obecnego wdrożenia Sites na tryb standalone.

## Przeniesienie danych i abonamentów

Nie ma automatycznego łączenia kont po adresie e-mail. Nowy, zweryfikowany użytkownik otrzymuje mapowanie w `vp_auth_identity`: auth_user_id → stabilny owner. Ten owner jest używany przez istniejące tabele, pliki i metadane Stripe.

Przed migracją wykonaj eksport D1 i kopię R2. Migracja docelowej bazy musi zachować historię migracji, wszystkie dane i klucze obiektów R2. Nowa migracja 0005 jedynie tworzy sześć tabel logowania. Nie modyfikuj migracji 0000–0004.

Powiązanie nowego konta z poprzednim owner wymaga osobnego potwierdzenia tożsamości właściciela starego konta i zweryfikowanego nowego konta. Wykonuje je operator, z dokładnymi identyfikatorami, przed pierwszym otwarciem panelu nowego użytkownika. Nie łącz według samego e-maila, nie dopuszczaj wskazania starego owner w publicznym formularzu. Jeśli nowy owner ma już dane lub abonament, zatrzymaj operację i rozwiąż konflikt przed zmianą mapowania.

Zachowaj dokładnie `VP_BILLING_OWNER_ID`, `VP_BILLING_KEYRING_SECRET`, zaszyfrowany rekord klucza Stripe, identyfikatory klientów/subskrypcji i owner w ich metadanych. Zmiana sekretu szyfrowania uniemożliwi odczyt dotychczas zapisanego klucza Stripe. Sekrety skopiuj bezpośrednio między panelami dostawców, poza Git i rozmową. Ustaw też autora poradników zgodnie z istniejącą konfiguracją.

Zaplanuj krótką przerwę w zapisie do starej aplikacji i końcową synchronizację D1/R2. Po przełączeniu zmień adres webhooka Stripe i jego sekret, sprawdź dostarczenie oraz anulowanie w Customer Portal. Stara kopia nie może nadal przyjmować zapisów jako równoległe źródło danych. Zachowaj kopię do wycofania wdrożenia. Żadna z tych operacji migracyjnych nie została wykonana w ramach przygotowania kodu.

## Weryfikacja i ograniczenia

108 testów przechodzi, w tym rzeczywisty Better Auth na SQLite przez adapter D1: haszowanie, wymagane potwierdzenie, cookies, błędne/wygasłe sesje, reset i odebranie starych sesji, obce Origin i callbacki, stabilne mapowanie tożsamości i współbieżny limit prób. Testy poczty używają kontrolowanej odpowiedzi HTTP, nie wysyłają wiadomości.

Build standalone przechodzi; wysyłka poczty na realnym koncie, zachowanie CPU na docelowym planie, migracja produkcyjnych danych i niezależny zakup end-to-end nadal wymagają sprawdzenia na własnym hostingu. Bieżący audyt npm zgłasza problemy w istniejących zależnościach (m.in. Next, sharp, browserslist i source-map-js); nie rozszerzano tej zmiany o niezweryfikowaną aktualizację całego stosu. Przed publicznym startem niezależnej wersji trzeba ocenić osiągalność zgłoszonych ścieżek i zastosować poprawki. Nie jest to deklaracja gotowości do produkcyjnej sprzedaży.

Dokumentacja źródłowa: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ ; https://better-auth.com/docs/authentication/email-password ; https://better-auth.com/docs/adapters/drizzle ; https://better-auth.com/docs/concepts/rate-limit ; https://resend.com/docs/api-reference/emails/send-email .

Podgląd wykrył konflikt Zod 3/4 w resolverze dev. Główna zależność to teraz Zod 4.6.7, a istniejące schematy aplikacji jawnie korzystają z `zod/v3`, aby zachować dotychczasową walidację. Po tej zmianie powtórzono testy, TypeScript, build i podgląd formularza.
