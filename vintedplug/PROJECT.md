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

Edycja rzeczy ma kontrolę rewizji, aby wykrywać równoczesne zmiany w kilku oknach. Usunięcie konta wymaga wpisania jego nazwy i usuwa jego rzeczy oraz wydatki. Zdjęcia są prywatne, a format i rozmiar pliku sprawdzane po stronie serwera.

## AI

Szablony opisów/odpowiedzi i kalkulator negocjacji działają bez dostawcy AI; są wyraźnie oznaczone jako szablony.

Generowanie tekstu oraz edycja zdjęć mają przygotowane trasy serwerowe, ale pozostają nieaktywne bez skonfigurowanego dostawcy i modeli. Właściciel konfiguruje nazwy z `.env.example` przez sekrety hostingu; klucz API nie trafia do repozytorium ani przeglądarki. Do uzyskania klucza OpenAI stosujemy połączenie OpenAI Developers i jego przewidzianą procedurę. Dla zdjęć wymagane jest również `IMAGE_AI_ENABLED=true`.

Trasy stosują limity serwerowe 20 generacji tekstu i 3 edycji zdjęć na dzień UTC na użytkownika. Nieudane żądanie zwraca limit. Włączenie prawdziwych modeli wymaga sprawdzenia ich zgodności, uprawnień konta, kosztu i jakości. Nie wykonywano płatnych wywołań AI podczas budowy tej wersji.

## Autorski poradnik — 19 października 2026

Baza wiedzy zawiera kategorię „Zarabianie” i osobny poradnik „Zarabianie na Vinted”. Sześć rozdziałów: ustawienie wyszukiwania, personalizacja polecanych ofert, własna metoda, ocena okazji, przygotowanie sprzedaży i przykłady. Materiał startowy odwołuje się do oficjalnych opisów Vinted (`/help/35`, `/help/409`, sprawdzone 19.10.2026). Metoda autora i wyniki pozostają puste do uzupełnienia; treści nie obiecują konkretnych efektów personalizacji.

Autor może edytować treść każdego rozdziału i przykład z praktyki. API zapisuje poradnik w D1, waliduje kompletność rozdziałów i kontroluje rewizję. Tekst jest wyświetlany jako tekst, bez wykonywania HTML. Kopia JSON zawiera też poradnik. W trybie demo edycja jest wyłączona; przełączenie na własny panel zachowuje widok poradnika.

Poradnik jest wspólnym materiałem dla odbiorców Site, a nie oddzielną metodą każdego sprzedawcy. `VP_GUIDE_AUTHOR_EMAIL`, konfigurowane wyłącznie na serwerze, uprawnia wskazany zweryfikowany adres do pierwszego zapisu. Ten zapis wiąże autorstwo z uwierzytelnionym ID użytkownika w danym Site; kolejne zmiany wymagają tego ID. Pozostali użytkownicy mają tylko odczyt. Brak konfiguracji zamyka możliwość pierwszego zapisu. E-mail i ID autora nie są udostępniane w danych panelu. Obecny dostęp Site nadal jest prywatny.

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
