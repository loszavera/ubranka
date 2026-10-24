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
