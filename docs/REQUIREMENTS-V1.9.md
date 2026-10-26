# Wymagania Ubranka — V1.9

Data: 2026-10-26. Rozwinięcie [V1.8](REQUIREMENTS-V1.8.md).
**Kasia i Aleksy zaakceptowali P3.3C1. Następnie 2026-10-26 użytkownik zatwierdził
P3.3C2 według V1.9 do implementacji i aktywacji po spełnieniu warunków planu.**
Jawnie zaakceptował limity, granicę ceny przyjętego żądania, zasady AI V1.2
i wyłączenie auto-reload organizacji. [Raport C2](P33C2-VERIFICATION.md) odróżnia
zgodę od wykonania; do spełnienia warunków serwer pozostaje OFF.

[Plan V1.9](IMPLEMENTATION-PLAN-V1.9.md), [koszty V1.8](COST-PLAN-V1.8.md),
[przyjęte zasady danych AI V1.2](P33-AI-DATA-POLICY-V1.2.md).

## Odbiór C1

Przyjęto poprawę miniatur, pełny podgląd i przygotowany przepływ C1.
[Raport C1](P33C1-VERIFICATION.md) pozostaje dowodem wykonania.
Ogólna akceptacja nie dopisuje nazw urządzeń, testu aplikacji natywnej,
osobnego logowania Kasi ani zgody na przekazanie zdjęć dostawcy AI.
Uzupełnienie odbioru 2026-10-26: Aleksy potwierdził Chrome na PC oraz Chrome
na Androidzie. Zakres dotyczy WWW; modeli i wersji nie podał. Urządzenie oraz
przeglądarka Kasi pozostają niepodane. Nie jest to zgoda na wykonanie C2.

Uzupełnienie po zatwierdzeniu C2 (2026-10-26): użytkownik wskazał iPhone/Safari
dla Kasi. To deklarowany zakres użycia pilotażu, nie dodatkowy test wykonany
przez agenta lub osobny odbiór C2.

## Zatwierdzone C2

Wymagania R-52–R-57 pozostają podstawą. Właściciel zatwierdził poniższe
doprecyzowania; każda osoba nadal osobiście potwierdza własne wysłania.

| ID | Przyjęte wymaganie |
| --- | --- |
| R-58 | Prywatny pilotaż WWW dla dwóch zaproszonych dorosłych: 30 dni od zapisanej aktywacji, maks. 60 wysłań łącznie, 30/konto i 5/konto/dobę UTC. Cały trial 25 PLN plus istniejący wspólny próg 25 PLN/miesiąc UTC. Żadnego automatycznego odnowienia. |
| R-59 | Finansowanie wyłącznie z opłaconych kredytów OpenAI, bez nowych wpłat, doładowań i abonamentów. Przed startem zatwierdzone wyłączenie auto-reload całej organizacji, także dla innych projektów API. Pozostaje OFF po C2. Potwierdzenie wykonania: raport C2. |
| R-60 | Osobny ograniczony klucz projektu Ubranka tylko w sekretach Supabase, bez użycia kluczy B/P3.2. Potwierdzony czas ważności nie dłuższy niż pilotaż jest warunkiem aktywacji; bez niego OFF i ponowne uzgodnienie zakończenia. Nie dodawać klucza administracyjnego do aplikacji. |
| R-61 | Model i parametry jak w B: `gpt-image-2.5-flare-2026-09-08`, Images edits, medium, jedno PNG 1024×1536. Bez dodatkowego modelu, retry, fallbacku i płatnej kalibracji operatora. Pierwszą rzeczywistą próbę inicjuje uczestnik; zalicza się do limitów C2. |
| R-62 | Budżet rezerwuje środki przed żądaniem; brak kosztu lub przekroczenie rezerwy blokuje kolejne. 25 PLN jest granicą dopuszczania nowych żądań, nie gwarancją ceny już przyjętego żądania. Akceptacja tej granicy musi być jawna. |
| R-63 | Zasady AI V1.2: zgoda niezaznaczona, dokładne wejścia 1 własna dorosła osoba + 1–3 rzeczy, odrębne potwierdzenie każdego wysłania do OpenAI. Zmiana polityki/treści/zdjęć wymaga nowego potwierdzenia. Pseudonimowy identyfikator bezpieczeństwa zamiast emaila; bez pomiarów i całej szafy. |
| R-64 | Po zatwierdzeniu najpierw integracja i testy syntetyczne przy OFF. Dopiero ich zaliczenie, potwierdzone finansowanie i konfiguracja klucza pozwalają na aktywację. Zamknięte B nie jest ponownie otwierane. |
| R-65 | Koniec czasu, limit lub wcześniejszy stop blokuje wysłania na serwerze; już wysłane żądanie rozliczamy. Gotowe ważne wyniki pozostają do własnego terminu retencji. Klucz wygasa, w kontroli końcowej zostaje unieważniony/usunięty z Supabase. Raport tylko zbiorczy; bez prywatnej galerii i automatycznego przejścia do D. |

Bez integracji sklepów, zakupów, rozpoznawania ubrań, nowych planów usług i premiery
komercyjnej. Nie obiecujemy 30 udanych wizualizacji na osobę ani poprawnego rozmiaru.
Niezweryfikowane platformy natywne pozostają poza pilotażem WWW.
