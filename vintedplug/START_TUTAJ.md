# vintedplug na Twoim komputerze

Masz pełny kod panelu, logo, favicon, style, formularze, API, schemat bazy, migracje i testy. Możesz edytować projekt w VS Code. Paczka zawiera aktualny biało-turkusowy wygląd i poradnik „Zarabianie na Vinted”.

## Pierwsze uruchomienie na Windowsie

1. Zainstaluj **Node.js 24 LTS** z https://nodejs.org/en/download i otwórz ponownie terminal po instalacji. Obecny runtime projektu wymaga Windows 11.
2. Rozpakuj cały ZIP, np. do `C:\projekty\vintedplug`. Pracuj w rozpakowanym folderze, nie wewnątrz ZIP-a.
3. Uruchom **01-instalacja.cmd**. Poczekaj, aż instalacja zależności i przygotowanie lokalnej bazy zakończą się komunikatem „Gotowe”. Pierwsza instalacja wymaga internetu. Nie musisz instalować pnpm globalnie.
4. Uruchom **02-uruchom.cmd** i zostaw to okno otwarte.
5. Otwórz **http://127.0.0.1:5173**. Jeśli pojawi się przekierowanie do logowania, lokalna sesja utworzy się automatycznie. To konto deweloperskie „Maciej”, bez podawania hasła do Vinted ani ChatGPT.
6. W panelu wybierz „Włącz własny panel”, aby dodawać i zapisywać swoje dane. Dla wygody edytora poradnika lokalne konto ma uprawnienia autora.

Kolejnym razem wystarczy **02-uruchom.cmd**. Aby zatrzymać serwer, naciśnij `Ctrl+C` w jego oknie.

## Otwieranie i edycja w VS Code

W VS Code wybierz **Plik → Otwórz folder** i wskaż folder projektu. Możesz też otworzyć plik `vintedplug.code-workspace`.

Po zapisaniu pliku serwer deweloperski odświeża zmiany. Przeglądarkę zostaw na `http://127.0.0.1:5173`.

| Co chcesz zmienić | Plik lub folder |
| --- | --- |
| Kolory, odstępy, wygląd i układ mobilny | `app/globals.css` |
| Dashboard, menu, rzeczy, finanse i ustawienia | `components/vp/panel.tsx` |
| Formularze kont, rzeczy i wydatków | `components/vp/forms.tsx` |
| Wygląd autorskiego poradnika i edytor | `components/vp/earning-guide.tsx` |
| Rozdziały i materiał startowy poradnika | `lib/earning-guide.ts` |
| Tematy, źródła i treści Bazy wiedzy | `lib/knowledge-base.ts` |
| Karty, filtry, wyszukiwarka i czytnik Bazy wiedzy | `components/vp/knowledge-base.tsx` |
| Obliczenia finansowe i walidacja | `lib/domain.ts` |
| Nazwa strony i favicon | `app/layout.tsx` |
| Logo oraz ikony | `public/brand/` |
| Zapis i odczyt danych, obsługa AI | `app/api/` oraz `lib/server.ts` |
| Model bazy | `db/schema.ts` |
| Kolejne zmiany struktury bazy | `drizzle/` |

Treść poradnika możesz też edytować bez kodowania w panelu: **Baza wiedzy → Pełny poradnik zarabiania → Otwórz poradnik → Edytuj rozdział**. W trzech tematach metod autora użyj przycisku **Dodaj swoją metodę** lub **Edytuj treść**. Najpierw włącz własny panel. Metoda pozyskiwania towaru i rozdział wyszukiwania w poradniku korzystają z tego samego zapisu. Po zapisaniu własnej wersji to ona będzie pokazywana zamiast materiału startowego z pliku.

## Te same czynności z terminala VS Code

Na Windowsie w PowerShellu, w folderze z `package.json`:

```powershell
npx.cmd --yes pnpm@11.25.0 install --frozen-lockfile
npm.cmd run local:setup
npm.cmd run dev
```

Na macOS/Linux użyj `npx` i `npm` bez końcówki `.cmd`.

Przy pierwszym uruchomieniu dostępne jest lokalne logowanie pod adresem:

```text
http://127.0.0.1:5173/signin-with-chatgpt?return_to=/
```

Nazwa ścieżki pochodzi z hostowanej wersji. W lokalnym trybie deweloperskim sesję obsługuje dołączony mechanizm dla localhost; nie łączy Cię z kontem sprzedażowym Vinted.

## Gdzie są zapisywane dane

Lokalne rekordy i przesłane zdjęcia znajdują się w **`.wrangler/state/`** w folderze projektu. Są zachowywane po zamknięciu serwera i ponownym uruchomieniu komputera. Zatrzymaj serwer przed robieniem kopii tego folderu.

Paczka zawiera kod i strukturę bazy. Nie zawiera Twoich transakcji ani prywatnych zdjęć zapisanych w wersji online. Lokalna baza zaczyna się od pustych własnych danych; widok demonstracyjny nadal pokazuje przykłady.

W panelu możesz dodatkowo pobrać kopię JSON z Ustawień oraz CSV z finansów. Automatyczny import JSON do aplikacji nie jest jeszcze dodany. Kopia całego zatrzymanego folderu `.wrangler/state/` zachowuje lokalne rekordy i pliki.

Lokalne zmiany kodu i danych **nie publikują się automatycznie** pod adresem strony online. Uruchamiasz i edytujesz projekt na swoim komputerze. Publikację oraz docelową bazę dla klientów konfiguruje się osobno.

## Zmiany bazy w przyszłości

Po zmianie `db/schema.ts` wygeneruj nową migrację i zastosuj ją lokalnie:

```powershell
npx.cmd --yes pnpm@11.25.0 run db:generate
npm.cmd run local:setup
```

Skrypt stosuje tylko oczekujące migracje. Nie zmieniaj już zastosowanych plików SQL. `local:setup` można uruchamiać wielokrotnie; nie zeruje danych ani nie nadpisuje istniejącego `.dev.vars`.

## AI i pozostałe integracje

Szablony opisów i odpowiedzi, kalkulator, finanse, magazyn i edytor poradnika działają bez klucza AI. Prawdziwe generowanie wymaga osobnej konfiguracji dostawcy. Wzór lokalnych ustawień jest w `.dev.vars.example`; instalacja utworzy `.dev.vars`.

W paczce nie ma kluczy API ani sekretów produkcyjnych. `.dev.vars` pozostaje plikiem serwerowym i jest pomijany przez Git. Supabase i płatności nie są jeszcze podłączone. Lokalny runtime symuluje D1 i magazyn R2 na komputerze; do zwykłej pracy lokalnej nie potrzebujesz konta Cloudflare.

## Sprawdzanie kodu

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Do codziennej edycji używaj `npm.cmd run dev`. `build` tworzy wynik kompilacji, a lokalna sesja deweloperska działa w trybie `dev`.

## Gdy coś nie działa

- **Nie znaleziono node/npm:** zainstaluj Node.js 24 LTS i otwórz ponownie VS Code/terminal.
- **Brak tabel w bazie:** zatrzymaj serwer i uruchom `01-instalacja.cmd` lub `npm.cmd run local:setup`.
- **Port zajęty:** zamknij drugie okno serwera. Możesz też uruchomić `npm.cmd run dev -- --port 5174` i otworzyć adres z terminala.
- **Lokalne logowanie nie działa:** korzystaj z `127.0.0.1` lub `localhost`, a nie adresu IP komputera w sieci.
- **Blokada npm.ps1 w PowerShellu:** używaj poleceń `npm.cmd`/`npx.cmd` lub dołączonych plików `.cmd`.

Szczegóły funkcji i ograniczeń aplikacji są w `PROJECT.md`. Commit, z którego pochodzi kopia, jest zapisany w `SOURCE_VERSION.txt`.

Oficjalne materiały:

- Node.js: https://nodejs.org/en/download
- Wymagania lokalnego runtime: https://developers.cloudflare.com/workers/wrangler/install-and-update/
- Lokalny rozwój: https://developers.cloudflare.com/workers/local-development/
- Migracje D1: https://developers.cloudflare.com/d1/wrangler-commands/
