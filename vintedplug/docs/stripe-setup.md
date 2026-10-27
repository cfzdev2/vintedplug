# Abonament vintedplug — Stripe

Cena: **29,90 PLN co miesiąc**, jeden produkt i jedna cena. Identyfikator ceny jest ustawiany wyłącznie na serwerze. Użytkownik najpierw loguje się do vintedplug przez istniejące logowanie ChatGPT, a potem przechodzi do hostowanego Stripe Checkout.

## Stan integracji

Zaimplementowane: ekran `/abonament`, karta w Ustawieniach, Stripe Checkout, Customer Portal, serwerowa blokada panelu i wszystkich istniejących API danych/zdjęć/AI, podpisane webhooki cyklu abonamentu, bezpieczne ponowienia, osobne rekordy test/live i wyjątek dla konta właściciela. Dane sprzedawców pozostają rozdzielone istniejącym polem `owner`.

**Produkt, cena 29,90 PLN miesięcznie, Customer Portal i endpoint webhooka są już utworzone w wybranym New business sandbox.** Ich identyfikatory i sekret podpisu webhooka są ustawione w hostingu. Nadal brakuje ograniczonego klucza API aplikacji. Właściciel może dodać go bezpośrednio w Ustawieniach → Abonament albo na `/abonament`. Aktualny hosting pozostaje prywatny dla właściciela, więc Stripe nie ma dostępu do webhooka. Przed uruchomieniem sprzedaży trzeba zakończyć konfigurację i sprawdzić sandbox na publicznie osiągalnym HTTPS. Połączenie Stripe z rozmową pozwoliło przygotować zasoby sandboxa. Worker korzysta z własnego klucza API, niezależnie od tego połączenia.

## Bezpieczne dodanie klucza w panelu

Formularz jest widoczny tylko dla użytkownika o `VP_BILLING_OWNER_ID`; serwer sprawdza ten identyfikator przed odczytem danych wejściowych i ponownie przed zapisem. Żądania spoza kanonicznego originu są odrzucane. Pole przyjmuje wyłącznie ograniczony klucz `rk_test_…`/`rk_live_…` zgodny z aktualnym trybem, sprawdza go przez odczyt skonfigurowanej ceny 2990 PLN-groszy i dopiero potem zapisuje. Ten test potwierdza poprawność klucza, konto i uprawnienie Prices: Read; pozostałe uprawnienia trzeba potwierdzić pełnym zakupem w sandboxie.

Klucz jest szyfrowany AES-256-GCM z losowym nonce 12 bajtów i powiązaniem do trybu. D1 przechowuje wyłącznie szyfrogram w `vp_billing_keys`; osobny 32-bajtowy sekret `VP_BILLING_KEYRING_SECRET` znajduje się w sekretach hostingu. Formularz, odpowiedzi API i logi nigdy nie zwracają zapisanego klucza. Niepoprawny klucz lub awaria walidacji nie nadpisują poprzedniego połączenia. Rekordy test/live są oddzielne i przypisane do identyfikatora właściciela.

`STRIPE_SECRET_KEY` z sekretów hostingu ma pierwszeństwo przed kluczem zapisanym w panelu. W takim przypadku formularz informuje o zarządzaniu z hostingu i blokuje zapis. Sekret szyfrowania jest trwały: nie rotuj go bez migracji i ponownego zaszyfrowania rekordów. Zgubienie go wymaga ponownego dodania klucza Stripe przez właściciela.

## 1. Sandbox i produkt

Zacznij od osobnego Stripe Sandbox, bez rzeczywistych obciążeń. Utwórz produkt `vintedplug` z ceną:

- kwota: 29,90 PLN (2990 groszy),
- typ: cykliczna, co 1 miesiąc,
- ilość: 1, bez okresu próbnego i kodów rabatowych,
- cena końcowa: bez podatku doliczanego ponad 29,90 PLN.

Zapisz ID `price_…`. Przy podatku zawartym w cenie użyj `tax_behavior=inclusive`. Kod nie włącza Stripe Tax ani dodatkowych stawek podatkowych. Przed sprzedażą ustal obowiązki podatkowe; Stripe Tax wymaga odpowiedniej konfiguracji i aktywnej rejestracji, samo włączenie `automatic_tax` nie wystarcza.

## 2. Customer Portal

Włącz Customer Portal w sandboxie. Zezwól na zmianę metody płatności, historię faktur i anulowanie **na koniec opłaconego okresu**. Zmiana planu i ilości nie są potrzebne przy jednym abonamencie. Jeśli używasz osobnej konfiguracji, zapisz ID `bpc_…` jako `STRIPE_PORTAL_CONFIGURATION_ID`.

## 3. Sekrety serwera

Ustaw wartości w sekretach hostingu Sites, nigdy w kodzie, przeglądarce, repozytorium ani wiadomości na czacie. `.env.example` i `.dev.vars.example` zawierają tylko nazwy i puste wartości.

| Nazwa | Wartość |
| --- | --- |
| `STRIPE_MODE` | `test`, później osobno `live` |
| `STRIPE_SECRET_KEY` | Opcjonalny restricted API key `rk_…`, zgodny z trybem; alternatywnie dodaj klucz przez formularz właściciela |
| `VP_BILLING_KEYRING_SECRET` | Losowy sekret szyfrowania 32 bajty / 64 znaki hex; ustawiony w sekretach hostingu, nigdy w repozytorium |
| `STRIPE_PRICE_ID` | ID ceny 2990 groszy / PLN / miesiąc |
| `STRIPE_WEBHOOK_SECRET` | Sekret podpisu konkretnego endpointu `whsec_…` |
| `VP_APP_ORIGIN` | Kanoniczny adres HTTPS witryny, bez ścieżki |
| `STRIPE_PORTAL_CONFIGURATION_ID` | Opcjonalne ID konfiguracji Customer Portal |
| `VP_BILLING_OWNER_ID` | Stabilny ID użytkownika nagłówka tożsamości Sites, a nie ID konta Stripe ani konta sprzedażowego Vinted |

W produkcji skonfigurowano już `VP_APP_ORIGIN`, `STRIPE_MODE=test` i identyfikator istniejącego właściciela na podstawie jego rekordu w bazie. Nie wpisuj przykładowego ID w miejsce rzeczywistego. W lokalnym trybie Windows identyfikator podaje `build/sites-vite-plugin.ts`; lokalny wyjątek ustaw tylko w ignorowanym `.dev.vars`.

Klucz ograniczony potrzebuje odczytu cen/subskrypcji/faktur, odczytu i zapisu klientów i Checkout Sessions oraz tworzenia sesji Customer Portal. Potwierdź uprawnienia testem integracji; nie nadawaj prawa do wypłat, przelewów ani zwrotów, których aplikacja nie wykonuje. Zmiana sekretów hostingu wymaga ponownego wdrożenia. Klucz zapisany przez formularz panelu jest używany od razu, bez kolejnego wdrożenia.

## 4. Webhook

Adres endpointu: kanoniczny origin + `/api/stripe/webhook`. Endpoint nie wymaga logowania użytkownika; obowiązkowo weryfikuje podpis Stripe, surowe body i czas podpisu. Jednak prywatna brama hostingu blokuje zewnętrzny ruch, zanim dotrze on do Workera — dlatego webhook wymaga publicznego hostingu z ochroną danych na poziomie aplikacji. Zmianę odbiorców witryny wykonaj świadomie po testach ochrony danych.

Subskrybuj zdarzenia:

- `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`,
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`,
- `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `invoice.voided`, `invoice.marked_uncollectible`.

Wersja API SDK 23.0.0: `2026-09-30.endive`. Obsługujemy zdarzenia snapshot (obiekt w `data.object`). Po zweryfikowaniu eventu Worker wiąże jego Stripe Customer z rekordem użytkownika i pobiera aktualny stan subskrypcji ze Stripe. Nie nadaje dostępu na podstawie adresu e-mail klienta ani parametrów strony sukcesu. Nie ma dodatkowych pól ani aplikacji pośredniczących wymaganych od kupującego.

Powiadomienia powtórzone są rozpoznawane po ID, a spóźnione nie przywracają starego stanu. Błąd dostawcy/bazy nie zapisuje eventu jako obsłużonego. Konflikt krótkiej blokady klienta zwraca 503, aby Stripe ponowił dostarczenie.

## 5. Dostęp i obsługa wyjątków

Dostęp otrzymuje rekord z poprawnym planem, statusem `active`/`past_due` i opłaconym okresem w przyszłości. Pierwsza płatność wymaga faktury `paid`, kwoty co najmniej 2990 groszy i odpowiedniej pozycji subskrypcji. Nieopłacony nowy okres nie przedłuża dostępu. Rezygnacja na koniec okresu pozostawia już opłacony czas. Po wygaśnięciu dane pozostają w D1/R2; nie są automatycznie kasowane.

Webhooki zwrotów i sporów nie są jeszcze zautomatyzowane. W razie pełnego zwrotu lub chargebacku obsługa musi również zakończyć abonament w Stripe; webhook `customer.subscription.deleted` odbierze dostęp. Sam zwrot w Stripe bez zakończenia subskrypcji nie zmienia dostępu. Przed publiczną sprzedażą ustal i opisz zasady zwrotów.

## 6. Test przed uruchomieniem

1. Potwierdź cenę 29,90 PLN w Checkout i brak obciążenia rzeczywistych środków w sandboxie.
2. Na osobnym koncie zaloguj się do vintedplug; przed płatnością panel i API danych mają odmawiać dostępu.
3. Opłać testowo abonament i potwierdź dostarczenie podpisanego webhooka. Otwórz panel z rzeczywistym kontem tego użytkownika.
4. Potwierdź, że użytkownik nie widzi danych ani zdjęć właściciela i nie może ich pobrać po ID.
5. Ponów webhook; kliknij zakup ponownie; nie mogą powstać drugie obciążenia ani drugi aktywny abonament.
6. Zasymuluj odnowienie, odrzuconą płatność, opóźnione zdarzenie i koniec opłaconego okresu.
7. Anuluj przez Customer Portal na koniec okresu i sprawdź datę dostępu.
8. Oddzielnie utwórz produkt, cenę, klucz i webhook w trybie live; testowe ID nie działają w live. Potwierdź aktywację konta sprzedawcy, podatki i dokumenty sprzedaży, a potem ustaw `STRIPE_MODE=live` i wdróż.

## Dowody i ograniczenia weryfikacji

Testy `tests/billing.test.mjs` używają prawdziwego SQLite dla SQL i kontrolowanych atrap odpowiedzi Stripe; weryfikacja podpisów korzysta z prawdziwego SDK i WebCrypto. Sprawdzono idempotencję, właścicieli, tryby, opłacone okresy, anulowanie, nieudane odnowienie, współbieżność i ponowienia po błędzie. Przeglądarką sprawdzono wygląd i obsługę błędu w tymczasowym widoku QA; ten widok nie trafia do wdrożenia.

27 października 2026 utworzono przez Stripe API syntetycznego klienta i abonament w wybranym sandboxie, z testową metodą `pm_card_visa`, bez prawdziwych danych klienta. Stripe zwrócił aktywny abonament i opłaconą fakturę 2990 PLN groszy. Na rzeczywistej odpowiedzi wykryto i poprawiono odczyt relacji pozycji faktury: API Endive używa `parent.subscription_item_details.subscription` i `subscription_item`, a nie starego pola `line.subscription`. Funkcja nadaje dostęp dopiero po powiązaniu pozycji z właściwym abonamentem, jego elementem i ceną. Test regresji odrzuca obcą subskrypcję, obcy element, inną cenę i niewłaściwy typ pozycji.

Rzeczywistą odpowiedź sandboxa sprawdzono lokalnie tą samą funkcją dostępu: opłacony okres nadaje dostęp, koniec okresu go odbiera. Testowy abonament anulowano przez Stripe API i potwierdzono odebranie dostępu na odpowiedzi anulowania. Nie zapisano syntetycznego klienta w produkcyjnej bazie panelu. Klucz aplikacji został już zapisany przez formularz właściciela i przeszedł walidację odczytu ceny; pozostałe uprawnienia wymagają testu przez panel. Te testy API nie zastępują zakupu przez Checkout ani dostarczenia webhooka — oba czekają na publicznie osiągalny hosting i osobne konto kupującego.

Oficjalna dokumentacja: https://docs.stripe.com/billing/subscriptions/webhooks, https://docs.stripe.com/customer-management/integrate-customer-portal, https://docs.stripe.com/keys.
