# VintedPlug na Firebase Hosting

Firebase Hosting może obsłużyć publiczny link z TikToka bez płatnego planu. To ta sama strona promocyjna co w aplikacji: podgląd magazynu i finansów, przykładowe opisy i tła, „Moje metody” oraz cena 29,90 zł/mies. W domyślnej zapowiedzi nie można założyć konta ani zapłacić. Przykłady działają w przeglądarce bez wywoływania płatnych usług.

## Pierwsza publikacja z Windows

1. W [konsoli Firebase](https://console.firebase.google.com/) utwórz osobny projekt VintedPlug na **Spark**. Skopiuj jego **Project ID** (może się różnić od nazwy wyświetlanej). Nie trzeba dodawać aplikacji, włączać Firestore, Storage, App Hosting ani dodawać karty.
2. Pobierz aktualne repozytorium (w istniejącej kopii: `git pull`). W folderze `vintedplug` z plikiem `package.json` uruchom **03-opublikuj-zapowiedz.cmd**. Podaj identyfikator projektu i zaloguj się do Google w oknie, które otworzy Firebase. Wymagany Node.js, zalecamy 24 LTS.
3. Po udanej publikacji weź **Hosting URL** wypisany przez Firebase CLI. Otwórz go na telefonie: wybierz inne konto w podglądzie, kliknij Finanse, zmień długość opisu. Dopiero ten adres wklej do bio. Do oglądania strony nie potrzeba konta Google ani ChatGPT.

### Odpowiednik w terminalu

Z folderu zawierającego `firebase.json`:

```sh
node --run install:ci
npx --yes firebase-tools@15.37.0 login
npx --yes firebase-tools@15.37.0 deploy --only hosting --project TWOJE_PROJECT_ID
```

Konfiguracja jest już w repozytorium; nie uruchamiaj `firebase init`. Publikacja dotyczy tylko Hosting w wybranym projekcie. Hook przed każdą publikacją buduje świeże pliki z tego samego komponentu co główna strona aplikacji. Sam build, bez logowania lub publikacji: `node --run firebase:build`. Weryfikacja trzech wersji strony: `node --run firebase:test`. Pliki statyczne trafiają do `dist-firebase/`, osobno od buildu Workera.

## Kiedy będzie można kupić abonament?

Panel, zdjęcia, sesje, dane klientów, wywołania AI i webhook Stripe zostają na własnym backendzie Cloudflare. [Instrukcja uruchomienia panelu](standalone.md) i [konfiguracja Stripe](stripe-setup.md). W istniejącym projekcie utworzono D1. Kolejne kroki to aktywacja R2, migracje, konfiguracja wysyłki maili i sekretów, a następnie wdrożenie i test zakupu na docelowym adresie. Samo postawienie strony w Firebase tego nie robi.

| Wersja publicznej strony | Zmienne procesu publikacji | Co widzi kupujący |
| --- | --- | --- |
| Zapowiedź (domyślnie) | Obie puste | Interaktywne demo i cena po starcie, bez linku do płatności |
| Test | `VP_PUBLIC_RELEASE=test`, `VP_PUBLIC_APP_ORIGIN=https://ADRES-PANELU` | Linki do samodzielnego panelu i zakupu testowego, oznaczenie Stripe test |
| Sprzedaż | `VP_PUBLIC_RELEASE=live`, ten sam rzeczywisty origin | Linki do `/panel` i `/abonament` na docelowej domenie panelu |

Na Windows w cmd ustaw zmienne przez `set "NAZWA=wartość"`, a następnie użyj polecenia `deploy --only hosting` jak wyżej. Plik `03-opublikuj-zapowiedz.cmd` **zawsze** publikuje zapowiedź, również przy ponownym uruchomieniu. Przed przejściem na live sprawdź na docelowym hoście rejestrację i e-mail, zakup i nadanie dostępu, wyłączenie odnowienia i dostęp do końca opłaconego okresu. Tryb strony nie przełącza konta Stripe i nie nadaje dostępu.

Publiczny adres panelu to jedyna informacja o backendzie, której potrzebuje strona. Sesje, powroty ze Stripe, webhooki i linki do potwierdzenia e-maila korzystają z domeny **panelu**, nie z domeny promocyjnej Firebase. Nie ma reguły przepisującej `/api` ani logowania na statyczny HTML.

## Co jest bezpłatne

Plan Spark nie ma opłaty miesięcznej; bezpłatny hosting ma [limity danych i transferu](https://firebase.google.com/docs/hosting/usage-quotas-pricing). Firestore to odrębna baza danych i nie jest do tego wdrożenia potrzebna. Przeniesienie obsługi webhooków do [Cloud Functions](https://firebase.google.com/docs/hosting/serverless-overview) lub zdjęć do [Cloud Storage for Firebase](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024) wymagałoby konta rozliczeniowego Blaze. Opłaty Stripe, ewentualne zużycie AI oraz [limity R2](https://developers.cloudflare.com/r2/pricing/) na backendzie są odrębne.
