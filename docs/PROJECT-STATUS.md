# Stan projektu Ubranka

Aktualizacja: 2026-10-24. Etap P0 — lokalna infrastruktura gotowa.

## Aktualne dokumenty

- [Wymagania V1.0](REQUIREMENTS-V1.0.md)
- [Plan implementacji V1.0](IMPLEMENTATION-PLAN-V1.0.md)
- [Rejestr decyzji](DECISIONS.md)
- [Środowisko i testowanie](SETUP.md)

## Przygotowane

- Folder połączony z pustym repozytorium loszavera/ubranka.
- TypeScript, React Native, Expo SDK57 i Expo Router; Node24/npm11.
- Ekran startowy do testowania uruchamiania i przycisku. Brak funkcji produktu.
- Dokumentacja V1.0, instrukcje agentów i pracy z telefonu.
- Konfiguracja CI, eksportu WWW i hostingu Vercel.
- Git i integracja GitHub działają; integracja Vercel odczytuje konto/zespoły.
- Użytkownik potwierdził dostęp do tego czatu przez Codex na telefonie przy
  połączeniu komórkowym (poza domową siecią).

## Weryfikacja

| Kontrola | Wynik |
| --- | --- |
| Czysta instalacja `npm ci` | PASS, 837 pakietów; znane ostrzeżenia opisane poniżej |
| `npm run check` | PASS: TypeScript i ESLint bez błędów |
| `npm run check:dependencies` | PASS: zgodne wersje Expo SDK57 |
| `npm run doctor` | PASS: 21/21 kontroli |
| `npm run build:all` | PASS: eksport WWW oraz bytecode Hermes dla iOS i Androida |
| `npm run build:web` | PASS: samodzielny eksport WWW do dist/ |
| Przeglądarka lokalna | PASS: ekran, styl i kliknięcie przycisku; widoczne potwierdzenie działania |
| Konsola przeglądarki | Brak przechwyconych błędów i ostrzeżeń |
| GitHub Actions, Ubuntu | PASS: instalacja, typy/lint, zgodność SDK i eksport trzech platform |
| Fizyczne urządzenia iOS/Android | Nie sprawdzono aplikacji w Expo Go |
| Zdalny Codex | Użytkownik potwierdził działanie przez internet mobilny |

Logi są lokalnie w `artifacts/`: npm-ci.log, check.log, build-all.log,
build-web.log, npm-audit.json; zrzut ekranu w preview.png. Nie zawierają danych
użytkowników aplikacji i nie są publikowane w Git.

Pierwsza próba Hermes w sandboxie Windows nie mogła zapisać pliku tymczasowego;
powtórzenie poza sandboxem zakończyło się powodzeniem. Nie zmieniano kodu kompilatora.

Audyt npm zgłasza 8 wpisów pakietów wynikających z 3 zgłoszeń źródłowych.
Pozostają nierozwiązane; zakres, źródła i plan opisuje
[stan zależności](DEPENDENCY-STATUS.md). Udany build nie usuwa tego ograniczenia.

## Git i CI

Pierwszy wspólny commit infrastruktury przeznaczony jest dla `main` i `dev`;
pracujemy dalej na `dev`. Workflow `Project checks` jest zapisany w repozytorium.
Pierwsza synchronizacja potwierdziła ten sam SHA lokalnie i zdalnie dla obu gałęzi:
`289480fed88da1ca9960edb9ed3b35e34d3da7af`.
[Jednorazowy run CI dla tego commita](https://github.com/loszavera/ubranka/actions/runs/40090246634)
zakończył się powodzeniem. Dla kolejnych commitów należy sprawdzać ich własne runy.

## Pozostaje do potwierdzenia przez użytkownika

- Otwarcie ekranu na fizycznym iPhone/Androidzie w Expo Go.
- Użytkownik zatwierdził utworzenie podglądu Vercel w zespole Risk Every Asset.
  Import repozytorium został zablokowany przez brak GitHub Login Connection
  w koncie Vercel. Konieczne: Account Settings → Authentication → GitHub.
  Nie powstał jeszcze projekt Ubranka w Vercelu ani zweryfikowany URL.

## Następny krok

Po zakończeniu P0 i na kolejną prośbę użytkownika: seria pytań doprecyzowujących
produkt z Aleksym i Kasią. Potem aktualizacja wymagań/planu i zakres P1.
Nie rozpoczynać samodzielnie funkcji stylisty, backendu, AI ani płatności.
