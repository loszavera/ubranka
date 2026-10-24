# Stan projektu Ubranka

Aktualizacja: 2026-10-24. P2 zatwierdzono do implementacji na dev, testów
i podglądu Vercel. Interaktywny prototyp jest wdrożony i sprawdzony online.
Kasia i Aleksy potwierdzili własny test: potrzebne są dodatkowe okazje, np.
„wesele”. Chcą kontynuować budowę i proszą o propozycję następnego zakresu.
Nie jest to potwierdzenie wszystkich kryteriów technicznych ani testu Expo Go.

## Aktualne dokumenty

- [Wymagania V1.3](REQUIREMENTS-V1.3.md) i [plan V1.3](IMPLEMENTATION-PLAN-V1.3.md)
  uzupełniają zachowaną bazę V1.2 o feedback i propozycję P2.1.
- [Weryfikacja i scenariusz odbioru P2](P2-VERIFICATION.md).
- [Kontrakty danych P2 i szkice P3/P4](DATA-CONTRACTS-P2.md).
- [Wybrany wygląd A](design/DESIGN-DIRECTION-V1.2.md), [pochodzenie ilustracji](design/P2-ASSETS.md).
- [Plan kosztów](COST-PLAN-V1.2.md), [rozpoznanie sklepów](RETAILER-FEASIBILITY-V1.1.md).
- [Środowisko](SETUP.md), [zależności](DEPENDENCY-STATUS.md), [decyzje](DECISIONS.md).

## Wykonane P2

- Wygląd A — Krem i śliwka: powitanie, zestawy, szafa i ustawienia; mobilna
  nawigacja, układ desktopowy, przyciski dostępne z klawiatury.
- Pełne słowniki PL/EN i zapamiętywany język; rynek PL i PLN są stałe.
- Krótki start, profile codzienny/elegancki, dodawanie i edycja profili,
  priorytet, budżet i domyślny tryb osobno dla każdego profilu.
- Dwa najlepiej dopasowane zestawy lub para ekonomiczny/markowy; maksymalnie
  dwie propozycje i jawny stan pusty przy zbyt małym budżecie/końcu przykładów.
- „Podoba mi się” zmienia ranking w danym profilu. Odrzucenie obu daje kolejną
  parę; powód można pominąć i wyłączyć w ustawieniach. Nie powstaje zakup.
- 28 przykładowych ubrań i 8 ilustracji dorosłych fikcyjnych osób. Szafa pozwala
  zaznaczać posiadane rzeczy; nowe rzeczy + dostawy muszą mieścić się w limicie.
- Zapis lokalny, walidacja odczytu, potwierdzany reset, obsługa błędu zapisu,
  pustego wyniku, ładowania, niedostępnej ilustracji i braku sieci.
- Testy reguł biznesowych, przepływów przeglądarki i konfiguracja tych testów w CI.

Reguły demonstracyjne nie uwzględniają rzeczywistych wymiarów/sylwetki, modeli AI,
cen sklepów ani rozmiarów produktów. Ilustracje nie są przymiarką na użytkowniku.
Nie ma kont, synchronizacji, własnych zdjęć, listy zakupowej ani płatności.
Konkretne usługi, dane i retencję trzeba wyjaśnić przed P3.

## Weryfikacja

Wyniki lokalne: 11/11 testów domeny i 8/8 scenariuszy przeglądarkowych PASS;
TypeScript/ESLint PASS; zgodność SDK PASS; Expo Doctor 21/21 PASS;
eksport WWW/iOS/Android PASS. Zakres i lokalne dowody opisuje
[raport P2](P2-VERIFICATION.md). Sprawdzono ekrany PL/EN przy szerokościach
320, 360, 390 i 1440 px. CI na Ubuntu/Chromium także zakończyło się SUCCESS.
Fizyczne iOS/Android w Expo Go nie są sprawdzone.

Audyt npm nadal zgłasza 8 wpisów (5 high, 3 moderate) z 3 zgłoszeń źródłowych.
Nie zastosowano niesprawdzonych override ani `audit fix --force`.
Szczegóły i plan: [DEPENDENCY-STATUS.md](DEPENDENCY-STATUS.md).

## Git i hosting

- Praca P2 odbywa się na `dev`; `main` pozostaje przy odebranym fundamencie
  `0203382a7581124006cbe88a607d1b9a0b5ae2f2`.
- Podgląd dev: https://ubranka-git-dev-risk-every-asset.vercel.app.
  Chroni go logowanie Vercel. Projekt `ubranka`, zespół Risk Every Asset.
- Stabilny main: https://ubranka.vercel.app. Nie jest podglądem P2.
- Implementacja P2: `04ea37775515240e45b2001614dbfccb103e1105`, zgodna lokalnie
  i na GitHubie. Kolejny commit uzupełnia wyłącznie dokumentację odbioru.
- Vercel Preview `dpl_Bc6PBTM8s9EU6kS13Si4Zw2dPJuQ`, źródło `dev`/`04ea377`,
  READY. Sprawdzono podgląd przez przeglądarkę: HTTP 200, obrazy, start PL,
  dwie propozycje, polubienie, EN, reload i zachowanie opinii; 0 błędów JavaScript.
- [GitHub Actions dla 04ea377](https://github.com/loszavera/ubranka/actions/runs/40102781826):
  SUCCESS. Ponieważ push nie utworzył runu, jednorazowo uruchomiono istniejący
  workflow ręcznie dla `dev`. Bez zmian reguł ochrony lub uprawnień kont.

Historycznie P0 przeszedł lokalne kontrole i
[CI dla 289480f](https://github.com/loszavera/ubranka/actions/runs/40090246634).
Użytkownik potwierdził zdalny Codex przez internet mobilny i działanie hostingu.
P1/V1.1 oraz V1.2 przeszły przeglądy dokumentacji; wersje V1.0/V1.1 zachowano.
Wyniki historyczne nie zastępują kontroli P2.

## Rekomendowany następny krok do akceptacji

P2.1 — dodatkowe okazje i dobór do sytuacji: wesele jako gość, praca, randka,
impreza; wybór przed rundą, pasujące przykłady i filtrowanie, zachowanie danych P2,
testy i podgląd dev. Pełny proponowany zakres: [plan V1.3](IMPLEMENTATION-PLAN-V1.3.md).
Potwierdzona potrzeba to więcej okazji, w tym wesele; pozostała lista i sposób
realizacji są propozycją. Nie rozpoczęto implementacji.

Gotowa odpowiedź: „Zatwierdzam P2.1. Dodaj opisane okazje i dobór zestawów,
zachowaj dane P2, wykonaj testy i udostępnij podgląd z dev na Vercel”.
Późniejszy P3 wymaga konkretnej propozycji usług, danych i kosztów. Nie rozpoczynać
go ani przenoszenia do main automatycznie.
