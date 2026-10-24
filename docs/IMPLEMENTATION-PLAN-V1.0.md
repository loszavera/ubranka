# Plan implementacji Ubranka — V1.0

Data: 2026-10-24. Status: plan ogólny; szczegóły i priorytety produktu po następnym wywiadzie.
Podstawa: [Wymagania V1.0](REQUIREMENTS-V1.0.md) i [Rejestr decyzji](DECISIONS.md).

## Zasady planu

- Obecnie realizujemy P0. Kolejne etapy opisują kierunek, nie rozpoczęte ani ukończone prace.
- Każdy etap kończy się małym, sprawdzalnym rezultatem i aktualizacją bieżącego statusu projektu.
- Wersja web umożliwia częste sprawdzanie z telefonu; testy natywne iOS/Android rozpoczynamy od fundamentu.
- Mocki pozostają jawnie oznaczone. Eksport web nie potwierdza działania na urządzeniu natywnym.
- Wymagania funkcjonalne i projekt graficzny doprecyzowujemy przed rozbudową produktu.
- Nie podajemy dat ukończenia dalszych etapów przed ustaleniem ich zakresu i zależności.

## P0 — Fundament i możliwość dalszej pracy

Cel: przygotować projekt do budowania oraz umożliwić kontynuację zdalnie.

Zakres:

1. Zsynchronizować folder z `loszavera/ubranka`; utworzyć `main` i roboczą `dev`.
2. Dodać `AGENTS.md`, README, wymagania V1.0, plan V1.0, rejestr decyzji i status projektu.
3. Przygotować TypeScript, React Native, Expo i Expo Router oraz minimalny ekran techniczny.
4. Utrwalić wersje zależności w lockfile; dodać komendy uruchamiania i podstawowej weryfikacji.
5. Przygotować eksport web i konfigurację hostingu Vercel, z `main` jako stabilną bazą i podglądami `dev`.
6. Udokumentować uruchomienie Expo Go, testowanie z telefonu i ograniczenia lokalnego komputera.
7. Sprawdzić dostęp do usług oraz wymienić konkretne pozostałe logowania lub działania użytkownika.

Kryteria odbioru / wymagane dowody:

- Lokalne i zdalne gałęzie istnieją, znane są ich SHA; aktywną gałęzią jest `dev`.
- Świeża instalacja zależności i uzgodnione kontrole kończą się powodzeniem; zapisujemy komendy i wyniki.
- Web buduje się i ekran techniczny otwiera się w przeglądarce; brak funkcji produktu jest jasno opisany.
- Dla urządzenia mobilnego zapisujemy wynik rzeczywistego testu albo jednoznacznie oznaczamy „niesprawdzone”.
- Konfiguracja hostingu jest oddzielona od faktycznie działającego wdrożenia; URL podajemy dopiero po weryfikacji.
- Dokumentacja pozwala kontynuować bez odtwarzania ustaleń z historii czatu.

## P1 — Doprecyzowanie produktu i prototyp UX

Zależność: P0 oraz zapowiedziany przez użytkownika następny krok z pytaniami.

- Zebrać odpowiedzi Aleksego i Kasi dotyczące odbiorców, zakresu, stylu, budżetu i zakupów.
- Ustalić minimum pierwszej wersji produktu i najważniejszy przepływ użytkownika.
- Przygotować lekki prototyp: wejście → wywiad → profil → dwie propozycje → decyzja/opinia.
- Uzgodnić kierunek wizualny, język komunikatów i podstawy dostępności.
- Wydać wymagania oraz plan w kolejnej wersji, jeśli zakres się zmieni.

Odbiór: uzgodniony zakres pierwszej wersji i sprawdzony z użytkownikami przebieg podstawowego wyboru.
Powiązania: R-02–R-10.

## P2 — Profile i szybkie wybory na danych demonstracyjnych

Zależność: P1.

- Zaimplementować ustalony wywiad, edycję profilu, wiele stylów oraz preferencje budżetowe.
- Zbudować rundę dwóch propozycji, decyzje tak/nie oraz opcjonalną informację o odrzuceniu.
- Utrwalić stan na poziomie uzgodnionym dla prototypu i zdefiniować kontrakty przyszłych usług.
- Obsłużyć pustą rundę, odrzucenie obu propozycji i zmianę aktywnego profilu.

Odbiór: kompletny przepływ na oznaczonych danych demo, sprawdzony w WWW, iOS i Androidzie.
Powiązania: R-03, R-05–R-10, Q-01–Q-03.

## P3 — Dane użytkownika i wirtualna szafa

Zależność: P1; kolejność względem P2 można zmienić po wywiadzie.

- Wybrać backend, uwierzytelnianie i magazyn zdjęć na podstawie wymagań i kosztów.
- Wprowadzić model kont, profili, ubrań, opinii i praw dostępu.
- Dodać ubrania posiadane/kupione, ich zdjęcia, opis, edycję i usuwanie.
- Ustalić oraz wdrożyć zakres parametrów i zdjęć sylwetki, w tym zasady przechowywania.
- Sprawdzić synchronizację oraz izolację danych między kontami.

Odbiór: zapis, odczyt, edycja i usunięcie danych działają w realnym środowisku testowym;
użytkownik nie uzyskuje dostępu do danych innego konta.
Powiązania: R-04, R-12, Q-04–Q-05.

## P4 — Rzeczywiste ubrania, rekomendacje i zestawy

Zależność: ustalone źródła produktów; dane i profile potrzebne do danego scenariusza.

- Podłączyć uzgodniony katalog lub źródła sklepów; rejestrować ceny, rozmiary, dostępność i pochodzenie.
- Zaimplementować filtrowanie według profilu i budżetu oraz ranking dwóch propozycji.
- Uwzględniać opinie użytkownika i mierzyć trafność rekomendacji na uzgodnionych scenariuszach.
- Dobierać zestawy z nowych i posiadanych rzeczy, bez przedstawiania niezweryfikowanych danych jako pewnych.
- Wybrać i zweryfikować usługi AI tylko tam, gdzie są potrzebne do uzgodnionej funkcji.

Odbiór: rzeczywiste propozycje mają sprawdzalne źródła; budżet i profil wpływają na wynik;
zestaw może łączyć rzecz z szafy z produktem do kupienia.
Powiązania: R-06–R-13, Q-06.

## P5 — Kontrolowane zakupy i dalsza automatyzacja

Zależność: doprecyzowane zasady zakupów, partnerzy/sklepy i właściwy operator płatności.

- Ustalić zakres samodzielnych zakupów, wymagane potwierdzenia, limity i możliwość wyłączenia.
- Zaprojektować przebieg zamówienia, rozliczenia, niepowodzenia, zwrotu i obsługi użytkownika.
- Wykorzystać integrację płatniczą bez zapisywania danych karty w aplikacji ani repozytorium.
- Sprawdzić ponowienia, ochronę przed podwójnym zamówieniem oraz historię zdarzeń.
- Przejść od środowiska testowego do uzgodnionego pilotażu dopiero po odbiorze mechanizmów kontroli.

Odbiór: uzgodnione scenariusze i awarie przechodzą w sandboxie operatora;
realne zakupy mają osobno ustalony zakres uruchomienia.
Powiązania: R-14–R-15, Q-07.

## Weryfikacja i wydawanie przez cały projekt

- Na zmianach kodu wykonywać adekwatne kontrole typów, lint oraz build; testy dodawać dla realnych zachowań i ryzyk.
- Testować mały ekran, klawiaturę, dostępność i zachowanie natywne; dokumentować platformę i ograniczenia dowodu.
- Rozwijać na `dev`; promować sprawdzone wydania na `main` zgodnie z aktualnym poleceniem użytkownika.
- Przed dystrybucją mobilną ustalić konta Expo/Apple/Google, identyfikatory aplikacji i koszty.
- Oceniać bezpieczeństwo, prywatność i koszty wraz z dodawaniem realnych danych oraz usług.

## Historia wersji

| Wersja | Data | Zmiana |
| --- | --- | --- |
| V1.0 | 2026-10-24 | Początkowe etapy i kryteria odbioru; uruchomiony zakres ograniczony do P0. |

Po inicjalizacji V1.0 pozostaje bazą. Istotne zmiany tworzą kolejny plik, np.
`IMPLEMENTATION-PLAN-V1.1.md`, z aktualizacją odsyłaczy w README i statusie projektu.
