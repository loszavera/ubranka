# Rejestr decyzji — Ubranka

Stan początkowy: 2026-10-24. Decyzje produktowe wymagające doprecyzowania nie są zastępowane wyborem technologii.
„Roboczo” oznacza odwracalną decyzję techniczną na potrzeby fundamentu, a nie ostateczny zakres produktu.

| ID | Data | Status | Decyzja i uzasadnienie |
| --- | --- | --- | --- |
| D-001 | 2026-10-24 | Polecenie użytkownika | Repozytorium `https://github.com/loszavera/ubranka`; folder projektu jest lokalnym miejscem pracy. |
| D-002 | 2026-10-24 | Polecenie użytkownika | Gałęzie `main` i `dev`; bieżąca praca na `dev`. Samo istnienie planu nie oznacza automatycznej publikacji każdej dalszej zmiany na `main`. |
| D-003 | 2026-10-24 | Roboczo | TypeScript + React Native + Expo + Expo Router, jedna aplikacja w jednym repozytorium. Cel: wspólna baza dla iOS, Androida i WWW oraz szybkie testowanie. |
| D-004 | 2026-10-24 | Roboczo | Expo SDK 57 na start dla testów Expo Go na fizycznym telefonie podczas przejścia ekosystemu na SDK 58. Dokładne wersje utrwala lockfile; przed aktualizacją SDK sprawdzamy zgodność z Expo Go. |
| D-005 | 2026-10-24 | Rekomendacja techniczna | Web jako aplikacja SPA, eksportowana przez Metro do `dist`, przygotowana do hostingu Vercel. `main` jest kandydatem na stabilny adres, `dev` na podglądy. Przygotowana konfiguracja nie oznacza połączonego konta ani aktywnego wdrożenia. |
| D-006 | 2026-10-24 | Otwarta | Backend, konta użytkowników, magazyn zdjęć, katalog sklepów i dostawca AI zostaną dobrane po doprecyzowaniu wymagań. Nie tworzymy ich kont ani zależności dla samego fundamentu. |
| D-007 | 2026-10-24 | Polecenie użytkownika | Najpierw infrastruktura i ogólne dokumenty V1.0. Seria pytań produktowych nastąpi w kolejnym kroku. |
| D-008 | 2026-10-24 | Rekomendacja organizacyjna | Na początku jeden czat łączy zarządzanie i implementację; pomocniczy agenci mogą wykonywać rozdzielne zadania. Drugi stały czat ma sens przy większej liczbie równoległych prac. |
| D-009 | 2026-10-24 | Roboczo | Dokumenty V1.0 stanowią bazę po inicjalizacji. Istotne zmiany tworzą V1.1 itd.; README i bieżący status wskazują aktualne wersje. |
| D-010 | 2026-10-24 | Cel produktu do doprecyzowania | Samodzielne zakupy pozostają w wizji produktu. Limity, potwierdzenia, operator i obsługa wyjątków wymagają osobnych ustaleń przed implementacją realnych płatności. |
| D-011 | 2026-10-24 | Wykonane po upoważnieniu użytkownika | Aktualizuje stan D-005: Vercel jest połączony z repozytorium, `main` zasila Production, a `dev` Preview. Adres `https://ubranka.vercel.app` działa; użytkownik potwierdził podgląd. |
| D-012 | 2026-10-24 | Ustalenie użytkowników | Odbiorcy: kobiety i mężczyźni bez sprecyzowanego stylu lub czasu na zakupy. Najpierw użytek własny, docelowo komercyjny rynek polski. |
| D-013 | 2026-10-24 | Ustalenie użytkowników | Priorytety: poznanie gustu, zestawy z posiadanych rzeczy, pomoc w zakupach; ubrania codzienne i eleganckie, krótki start oraz stopniowe poznawanie preferencji. |
| D-014 | 2026-10-24 | Ustalenie z otwartym szczegółem | Budżet na cały zestaw. Kasia preferuje dwa kompletne zestawy, Aleksy wariant tani/markowy. Sposób połączenia i liczenie wydatku wymagają Q21–Q22; 500 PLN to scenariusz przykładowy. |
| D-015 | 2026-10-24 | Ustalenie użytkowników | „Podoba mi się” uczy gustu, nie kupuje ani nie dodaje do koszyka. Odrzucenie obu prowadzi do kolejnej pary; powód można pominąć, pytanie wyłączyć. Propozycje na prośbę użytkownika. |
| D-016 | 2026-10-24 | Ustalenie z otwartymi szczegółami | Profil wykorzystuje wymiary/rozmiary i zdjęcia; szafa przyjmuje zdjęcia rzeczy oraz zdjęcia na osobie. Zestawy mają być wizualizowane na osobie/zdjęciu użytkownika. Szczegóły danych i Q24 pozostają otwarte. |
| D-017 | 2026-10-24 | Ustalenie z otwartą realizacją | Pierwszy zakres zakupowy to koszyk do zatwierdzenia (Q23), doprecyzowujący D-010. Vinted, Zara, Zalando, Reserved i H&M to preferowane źródła; dostęp projektu do ich katalogów i zakupów nie jest potwierdzony. |
| D-018 | 2026-10-24 | Ustalenie użytkowników | Spokojny wygląd; przygotować kilka propozycji do wyboru. A/B/C są makietami, żadna nie jest zatwierdzona. Rekomendacja projektowa: B — Szałwia i porcelana. |
| D-019 | 2026-10-24 | Cel kosztowy | Około 150 PLN miesięcznie, możliwie mniej. Wolumen Q25 i rzeczywisty koszt wizualizacji wymagają pomiaru. Cel nie jest aktywowanym rozliczeniem ani gwarancją ceny. |
| D-020 | 2026-10-24 | Propozycja techniczna | Rozwija D-006: Supabase Free jest kandydatem na mały pilotaż. Wykonalność przymiarki sprawdzić ograniczoną próbą, a sklepy integrować po uzyskaniu dostępu. Nie wybrano ani nie uruchomiono backendu/AI. |
| D-021 | 2026-10-24 | Wykonane | Aktualizuje D-007/D-009: otrzymano 20 odpowiedzi, zapisano wymagania i plan V1.1, analizy i trzy makiety. V1.0 zachowano; pozostało pięć pytań Q21–Q25 i wybór wyglądu. |

## Konsekwencje wyboru Expo

- WWW oraz aplikacje natywne mogą współdzielić komponenty i logikę, ale nie zastępuje to testów na każdej platformie.
- Expo Go ułatwia pierwsze testy bez lokalnego Android Studio i Xcode; część późniejszych integracji wymaga development build.
- Windows nadaje się do pracy nad kodem i podglądu; budowanie iOS w chmurze jest możliwe przez EAS po konfiguracji wymaganych kont.
- Docelowa dystrybucja w sklepach mobilnych oraz związane z nią konta i koszty nie są potrzebne do pierwszego podglądu web.
- Nie wybieramy teraz monorepo ani osobnych aplikacji web/mobile; można to zmienić na podstawie rzeczywistych potrzeb.

## Źródła techniczne

Wskazane przez przegląd dokumentacji podczas inicjalizacji; wymagają ponownego sprawdzenia przy aktualizacji SDK lub hostingu.

- [Expo — tworzenie projektu i zgodność z Expo Go](https://docs.expo.dev/get-started/create-a-project/)
- [Expo — publikowanie wersji web](https://docs.expo.dev/guides/publishing-websites/)
- [Expo — development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo — EAS Build](https://docs.expo.dev/build/introduction/)

## Aktualizowanie rejestru

Przy zmianie decyzji dopisz nowy wpis z datą, statusem, powodem oraz ID zastępowanej decyzji.
Zachowaj wcześniejsze uzasadnienie. Stan wykonania i dowody testów należą do bieżącego statusu projektu,
a szczegółowy zakres produktu do wersjonowanych wymagań i planu.
