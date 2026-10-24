# Stan projektu Ubranka

Aktualizacja: 2026-10-24. Po przetestowaniu P2 Kasia i Aleksy zgłosili dodatkowe
okazje. Aleksy zatwierdził P2.1: wesele jako gość, praca, randka i impreza,
dobór do okazji, zachowanie danych P2, pracę na dev, testy i podgląd Vercel.
Implementacja i kontrole lokalne są zakończone; publikacja jest w toku.

## Aktualne dokumenty

- [Wymagania V1.3](REQUIREMENTS-V1.3.md) i [plan V1.3](IMPLEMENTATION-PLAN-V1.3.md)
  uzupełniają zachowaną bazę V1.2 o zatwierdzony P2.1.
- [Weryfikacja i scenariusz odbioru P2.1](P21-VERIFICATION.md).
- [Historyczna weryfikacja P2](P2-VERIFICATION.md).
- [Kontrakty danych P2/P2.1 i szkice P3/P4](DATA-CONTRACTS-P2.md).
- [Wybrany wygląd A](design/DESIGN-DIRECTION-V1.2.md), ilustracje
  [P2](design/P2-ASSETS.md) i [P2.1](design/P21-ASSETS.md).
- [Koszty](COST-PLAN-V1.2.md), [sklepy](RETAILER-FEASIBILITY-V1.1.md),
  [środowisko](SETUP.md), [zależności](DEPENDENCY-STATUS.md), [decyzje](DECISIONS.md).

## Wykonane

- P2: wygląd A — Krem i śliwka; PL/EN, krótki start, profile stylów, budżety,
  priorytety, dwa tryby propozycji, opinie z opcjonalnym powodem i szafa demo.
- P2.1: sześć okazji w PL/EN. Okazja bieżącej rundy jest oddzielona od domyślnej
  okazji profilu. Zmiana okazji rozpoczyna wybór od nowa, zachowując gust.
- Filtr okazji poprzedza ranking. Maksymalnie dwa wyniki, budżet obejmuje
  dostawę, własne rzeczy kosztują 0 nowego wydatku. Niepasujące propozycje nie
  uzupełniają pary; brak zgodnych wyników jest jawnie komunikowany.
- Katalog ma 37 fikcyjnych rzeczy i 12 zestawów. Cztery nowe ilustracje weselne
  przedstawiają dorosłe fikcyjne osoby. To przykłady dla gości, nie pełna obsługa
  dowolnego dress code'u z zaproszenia.
- Stan V2 czyta V1 pod niezmienionym kluczem zapisu. Zachowane wszystkie stare
  identyfikatory rzeczy/zestawów, profile, język, tryb, szafa i opinie z powodami.
- Nadal działa lokalny zapis, obsługa błędów odczytu/zapisu, potwierdzany reset,
  pusty wynik i praca załadowanego interfejsu bez sieci.

Nie ma kont, synchronizacji, własnych zdjęć, AI, prawdziwych ofert sklepów,
listy zakupowej ani płatności. Ilustracje nie są przymiarką na użytkowniku;
reguły nie uwzględniają rzeczywistych wymiarów ani rozmiarów produktów.

## Weryfikacja P2.1

- TypeScript strict i ESLint: PASS.
- Testy domeny: 15/15 PASS; testy WWW w Edge: 13/13 PASS.
- Eksport WWW/iOS/Android: PASS. Fizyczne urządzenia z Expo Go nie były testowane.
- Sprawdzono migrację zamrożonego zapisu V1, oba tryby, budżet, wyczerpanie
  przykładów, PL/EN oraz szerokości 320/360/390/1440 px i klawiaturę WWW.
- CI i wdrożenie tego zakresu: oczekują na publikację; wyniki zostaną dopisane
  w [raporcie P2.1](P21-VERIFICATION.md).

Zależności nie zmieniły się w P2.1. W P2 zgodność SDK i Expo Doctor 21/21
przeszły, a audyt zgłosił 8 wpisów (5 high, 3 moderate) z 3 zgłoszeń źródłowych.
Nie zastosowano niesprawdzonych override ani `audit fix --force`.
Szczegóły: [DEPENDENCY-STATUS.md](DEPENDENCY-STATUS.md).

## Git i hosting

- Praca na `dev`. Podgląd: https://ubranka-git-dev-risk-every-asset.vercel.app.
  Chroni go logowanie Vercel. Projekt `ubranka`, zespół Risk Every Asset.
- `main` pozostaje przy fundamencie `0203382a7581124006cbe88a607d1b9a0b5ae2f2`;
  https://ubranka.vercel.app nie jest podglądem P2.1.
- Implementacja, CI i wdrożenie P2: `04ea37775515240e45b2001614dbfccb103e1105`,
  [run SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40102781826),
  Vercel `dpl_Bc6PBTM8s9EU6kS13Si4Zw2dPJuQ` READY i test online PASS.
- P2.1: lokalnie sprawdzony, oczekuje na publikację i kontrolę online.

Historycznie P0 przeszedł [CI](https://github.com/loszavera/ubranka/actions/runs/40090246634).
Użytkownik potwierdził działanie hostingu oraz zdalnego Codex przez internet mobilny.
P1/V1.1 i V1.2 przeszły przeglądy dokumentacji; wersje historyczne zachowano.

## Następny krok

Odbiór P2.1 przez Kasię i Aleksego w stałym podglądzie dev według krótkiego
scenariusza w raporcie. Po uwagach można zaproponować przygotowanie P3:
konkretnych dostawców, kosztów, zakresu danych, retencji/usuwania i pierwszej
iteracji prywatnej szafy. Nie rozpoczynać P3 ani przenoszenia do main automatycznie.
