# Strona promocyjna vintedplug

## Adresy i dostęp

- `/` — publiczna strona promocyjna, dostępna bez logowania. Nie odczytuje danych użytkowników ani bazy.
- `/panel` — dotychczasowy panel z niezmienionym sprawdzaniem tożsamości, abonamentu i właścicieli danych.
- `/abonament` — logowanie i karta abonamentu; przycisk zakupu tworzy sesję Checkout przez istniejące API.
- Po powrocie z Checkout karta sprawdza status na serwerze. Dopiero odpowiedź `access: true` uruchamia przejście do `/panel`. Niepotwierdzona płatność pozostawia kartę z komunikatem i możliwością ponowienia sprawdzenia.
- Zwykłe wejście na `/abonament` i powrót z Customer Portal nadal pozwalają obejrzeć status i zarządzać abonamentem. Nie przekierowują automatycznie.

Strona zachowuje białe tło, akcenty teal, logo i favicon projektu. Pokazuje interaktywny podgląd kont/magazynu/finansów, dwa przykładowe opisy do kopiowania, wybór czterech istniejących teł, przebieg pracy, cennik i FAQ. Wszystkie liczby, ubrania i teksty demonstracyjne są oznaczone; nie pochodzą z prywatnego panelu. Przełączanie przykładów nie wywołuje AI ani nie zapisuje danych.

## Obecny etap

Hosting pozostaje publiczny, Stripe w trybie testowym, logowanie przez ChatGPT. Cennik wyraźnie oznacza testową płatność; FAQ opisuje aktualny sposób logowania. Opisy produktu nie obiecują automatycznego wystawiania ani połączenia z Vinted. Opcjonalny Photoroom jest wyłączony z ceny abonamentu. Nie dodano fikcyjnych opinii ani wyników sprzedaży.

Niezależne logowanie i własna domena to osobny następny etap. Przy uruchomieniu płatności live zaktualizuj oznaczenie trybu testowego i FAQ, po rzeczywistym przełączeniu konfiguracji Stripe. Przy zmianie hostingu zachowaj powiązania tożsamości z danymi i Stripe Customer; nie wystarczy zastąpić identyfikatorów użytkowników.

## Weryfikacja

Przeglądarką w managed preview sprawdzono desktop i iframe z viewportem 390 px: układ bez poziomego przewijania, przełączanie kont i finansów, długości opisów, teł i rozwijanie FAQ. Clipboard API nie działa w niebezpiecznym kontekście HTTP lokalnego podglądu; przy odmowie interfejs pokazuje instrukcję ręcznego skopiowania. Produkcja korzysta z HTTPS.

W tymczasowym, usuniętym przed buildem widoku QA sprawdzono dwa kontrolowane zwroty serwera: `access: false` pozostawia kartę, `access: true` prowadzi do chronionego `/panel`. Nie wykonywano dodatkowej płatności ani nie nadawano dostępu w bazie. Logowanie platformy nie działa w lokalnym managed preview; wejścia na `/abonament` i `/panel` poprawnie kierują do bramy z odpowiednim `return_to`. Poprzedni zakup i anulowanie w sandboxie zostały potwierdzone przez użytkownika na rzeczywistej witrynie.
