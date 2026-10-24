# Stan projektu Ubranka

Aktualizacja: 2026-10-24. Etap P1 — wywiad i odpowiedzi uzupełniające zapisane
w V1.2. Wybrano wygląd A; planujemy interfejs PL/EN. Infrastruktura i podgląd P0 działają;
kod aplikacji pozostaje starterem. Dalsze funkcje nie są jeszcze wdrożone.

## Aktualne dokumenty

- [Wymagania V1.2](REQUIREMENTS-V1.2.md)
- [Plan implementacji V1.2](IMPLEMENTATION-PLAN-V1.2.md)
- [Odpowiedzi uzupełniające](INTERVIEW-V1.2.md)
- [Wybrany wygląd A](design/DESIGN-DIRECTION-V1.2.md)
- [Plan kosztów V1.2](COST-PLAN-V1.2.md)
- [Rozpoznanie sklepów](RETAILER-FEASIBILITY-V1.1.md)
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
- Użytkownik potwierdził działanie podglądu po uruchomieniu Vercel.
- Zapisano 20 odpowiedzi w wywiadzie, wymaganiach i planie V1.1; zachowano V1.0.
- Wygenerowano i obejrzano trzy koncepcje UI z przyciskami oraz zapisano PNG
  i prompty. Użytkownik wybrał A — Krem i śliwka; ekran nie został jeszcze zaimplementowany.
- Sprawdzono oficjalne źródła kosztów usług i możliwości sklepów. Nie uruchomiono
  płatnych usług/API ani integracji zakupowych; jakość przymiarki pozostaje nieznana.
- V1.2 zapisuje oba tryby dwóch pełnych zestawów, początkowo najlepiej dopasowane,
  budżet nowych zakupów z dostawą i listę z linkami jako pierwszy etap zakupów.
- Planowane 30 wizualizacji/osobę/mies. daje 60 dla dwóch osób. Koszt do pomiaru.
- Q24 zapisano jako wstępny kierunek prywatnych zdjęć; konkretna usługa AI,
  retencja i usuwanie muszą być wyjaśnione przed realnym użyciem.

## Weryfikacja

Poniższe wyniki dotyczą fundamentu P0. Bieżąca zmiana V1.2 dotyczy dokumentacji,
bez zmian kodu lub zależności; nie dopisujemy nowych wyników testów aplikacji.
Poprzednia kontrola P1/V1.1: sprawdzono zgodność z oryginalnymi pytaniami i 20 odpowiedziami,
47 lokalnych odsyłaczy (0 błędnych), diff bez błędów białych znaków oraz trzy
wygenerowane plansze. Wymagania i plan przeszły także niezależny przegląd agenta;
doprecyzowano obowiązkowe dane do dobierania ubrań bez narzucania momentu ich zebrania.

Kontrola V1.2: 75 lokalnych odsyłaczy, 0 błędnych; przegląd zgodności odpowiedzi
i niezależny przegląd dokumentacji bez istotnych uwag. Zachowano ID wymagań,
historyczne pliki V1.0/V1.1, kod i zależności. Nie uruchamiano ponownie testów
aplikacji dla zmiany obejmującej wyłącznie dokumentację.

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
| Vercel Production | READY; https://ubranka.vercel.app — ekran i przycisk działają, brak błędów/ostrzeżeń w konsoli |
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

## Hosting

Projekt `ubranka` w zespole Risk Every Asset jest połączony z GitHubem.
Użytkownik uzupełnił brakujące GitHub Login Connection i uruchomił import.
Pierwsze wdrożenie Production: `dpl_AaHsdKgbQLwuncD98PZ6dgLYWsRm`,
źródło `main`, commit `b1fcd6f184d4201ef54d0ffa35527d45494806e4`, status READY.
Adres: https://ubranka.vercel.app. Zrzut w `artifacts/vercel-preview.png`.
Kod aplikacji jest identyczny z pierwszym commitem zweryfikowanym w CI;
późniejsze commity aktualizują tylko dokumentację infrastruktury.

Późniejsza weryfikacja przed wywiadem potwierdziła automatyczne wdrożenia commita
`0203382a7581124006cbe88a607d1b9a0b5ae2f2`: Production
`dpl_DLD5ParVFW3tLeAJSv6m3JihMmvW` i Preview
`dpl_DuR8WEszXwe96wYFjbweqoURtb22`, oba READY.
Adres podglądu `dev`: https://ubranka-git-dev-risk-every-asset.vercel.app
wymaga logowania Vercel; ochrona pozostaje włączona. To dowód dla wskazanego
commita, nie dla późniejszych zmian dokumentacji.

## Pozostaje do sprawdzenia na urządzeniach

- Otwarcie ekranu na fizycznym iPhone/Androidzie w Expo Go.

## Następny krok

Pierwszy prototyp w kierunku A: PL/EN, krótki start, profile, szafa demo,
dwie pełne propozycje w obu trybach, preferencja trybu i opinie. Nie potrzeba teraz
kolejnej rundy pytań produktowych. Aktualizacja dokumentacji nie jest wdrożeniem prototypu.

Q21–Q23 i Q25 są rozstrzygnięte; Q24 daje wstępny kierunek danych i wymaga
wyjaśnienia konkretnego dostawcy przed realnym przetwarzaniem. Dalsze zależności
techniczne: jakość i koszt wizualizacji, prywatny backend oraz dostęp do produktów.
Około 150 PLN/mies. pozostaje celem do sprawdzenia rzeczywistym zużyciem przy
60 wizualizacjach, nie gwarancją kosztu. Własna szafa ma pierwszeństwo przed sklepami.
Nie rozpoczynać samodzielnie funkcji stylisty, backendu, AI ani płatności.
Zmiany P1 powstają na `dev`; `main` pozostaje odebranym fundamentem.
