# Ubranka

Wirtualny stylista: mniej przeglądania, prostsze decyzje i ubrania dopasowane do osoby.
Jeden projekt TypeScript / React Native / Expo dla iOS, Androida i przeglądarki.

**Docelowy adres odbioru:** https://ubranka.vercel.app
(bieżący zakres i dowody: [stan projektu](docs/PROJECT-STATUS.md)).
**Warsztat dev:** https://ubranka-git-dev-risk-every-asset.vercel.app
(logowanie Vercel; stan wdrożenia w dokumencie statusu).

**Odebrane demo P2.1:** rozszerzenie o wesele jako gość, pracę, randkę
i imprezę. Okazję wybierasz przed rundą; propozycje muszą do niej pasować.
Zachowano dane P2, a domyślną okazję profilu można edytować. Wyniki testów
i publikacji znajdują się w statusie oraz raporcie P2.1. Wygląd A — Krem i śliwka, PL/EN, krótki start,
edytowalne profile, szafa demo i najwyżej dwa zestawy w obu trybach.
Budżet obejmuje nowe rzeczy z dostawą; posiadane rzeczy kosztują 0 PLN.
Opinie zmieniają ranking przykładów i pozostają z ustawieniami na urządzeniu.
Demo używa 37 fikcyjnych ubrań i 12 ilustracji. AI, sklepy i lista zakupowa
należą do kolejnych etapów.

**P3.1: pozytywny test Aleksego; logowanie Kasi do sprawdzenia.** Zakres zatwierdzony
zgodnie z [planem V1.4](docs/IMPLEMENTATION-PLAN-V1.4.md).
Zaimplementowano prywatną szafę PL/EN, zdjęcia, konta Google, synchronizację,
eksport i usuwanie. Lokalne testy opisuje [raport P3.1](docs/P31-VERIFICATION.md).
**Usługi są skonfigurowane:** Supabase Free Frankfurt, Google OAuth dla dwóch
zaproszonych kont, prywatny magazyn i harmonogram usuwania. Logowanie Google
sprawdzono na dev i main. Testy ujawniły cache bezpośrednich odczytów Storage; poprawka
przenosi pobieranie zdjęć do autoryzowanego POST przez Edge i przeszła retest.
Testy chmury, fizyczne usunięcie fixture przez harmonogram oraz CI: PASS.
P3.1 przeniesiono na main i sprawdzono logowanie, odczyt zdjęcia oraz wylogowanie.
Aleksy potwierdził działanie większości funkcji i pozytywny ponowny test poprawki
usuwania. Logowanie Kasi pozostaje otwarte; szczegóły [odbioru](docs/P31-ACCEPTANCE.md).
Bieżące dowody:
[raport P3.1](docs/P31-VERIFICATION.md), [konfiguracja](docs/P31-SETUP.md).
**P3.2 zatwierdzono 2026-10-25:** do 12 płatnych wywołań i 25 PLN łącznie,
wyłącznie na syntetycznych obrazach fikcyjnych dorosłych, bez automatycznych ponowień.
**Próba zakończona: 12/12 udanych wywołań, koszt API 0,432032 USD**, około 2,92 PLN
z konserwatywną rezerwą. Dziesięć wyników uznano za technicznie użyteczne;
dwa zmieniają krój spodni. [Galeria porównawcza](https://ubranka.vercel.app/p32/)
i [raport jakości oraz kosztów](docs/P32-REPORT.md) zostały odebrane przez Kasię
i Aleksego z opisanymi ograniczeniami (2026-10-25).
Użytkownik pozwolił rozpocząć pomiar bez pełnej estymacji, zachowując limity.
**P3.3A: wdrożone na main, z płatnym AI wyłączonym; oczekuje na Wasz test.** Profil
sylwetki, prywatne zdjęcie w Supabase, maksymalnie dwa zestawy z własnej szafy,
zapis/opinie i przygotowanie wizualizacji PL/EN. [Raport oraz instrukcja odbioru](docs/P33A-VERIFICATION.md).
Próba kilku osobnych zdjęć ubrań w P3.3B i pilotaż prywatnych zdjęć w C
wymagają późniejszych zgód.
Aplikacja nie generuje jeszcze obrazów AI; nie uruchomiono nowych abonamentów.
Dev i main korzystają z tego samego istniejącego Supabase Free `ubranka-test`
we Frankfurcie i tych samych dwóch zaproszonych kont. Prywatna szafa w chmurze
jest wspólna dla obu adresów. Lokalny zapis demo pozostaje osobny — publikacja
nie kopiuje localStorage. Nie tworzymy nowej usługi ani nie zmieniamy retencji.
Podział środowisk pilotażu i produkcji ustalimy ponownie przed premierą komercyjną.
[Historyczny odbiór P2.1 na main](docs/P21-PRODUCTION.md).

## Dokumenty

- [Wymagania V1.6 — odebrane P3.2, zatwierdzone P3.3A](docs/REQUIREMENTS-V1.6.md)
- [Plan implementacji V1.6 — fazy P3.3A–D](docs/IMPLEMENTATION-PLAN-V1.6.md)
- [Zasady danych V1.0 — Supabase w A, AI czeka na osobną zgodę](docs/P33-AI-DATA-POLICY-V1.0.md)
- [P3.3A — weryfikacja i test użytkowników](docs/P33A-VERIFICATION.md)
- [P3.3A — kontrakty backendu i granice przygotowania AI](docs/P33A-BACKEND.md)
- [Proponowana kontrola kosztów V1.5](docs/COST-PLAN-V1.5.md)
- [P3.2 — raport jakości, kosztów i weryfikacji](docs/P32-REPORT.md)
- [P3.2 — historyczny preflight i późniejsze rozstrzygnięcie użytkownika](docs/P32-PREFLIGHT.md)
- [Przypadki P3.2, prompty i hashe wejść](docs/p32/cases.json)
- [Przyjęte zasady zdjęć i usuwania](docs/P3-DATA-POLICY-V1.0.md)
- [Konfiguracja usług P3.1](docs/P31-SETUP.md) i [backend](docs/P31-BACKEND.md)
- [Weryfikacja P3.1 i jej ograniczenia](docs/P31-VERIFICATION.md)
- [Pomiary P3.2 V1.4](docs/COST-PLAN-V1.4.md) i [usługi V1.3](docs/COST-PLAN-V1.3.md)
- [Odpowiedzi uzupełniające](docs/INTERVIEW-V1.2.md) i [pierwsze 20 odpowiedzi](docs/INTERVIEW-V1.1.md)
- [Wybrany wygląd A](docs/design/DESIGN-DIRECTION-V1.2.md)
- [Założenia budżetu przy 30 wizualizacjach na osobę](docs/COST-PLAN-V1.2.md)
- [Możliwości integracji sklepów](docs/RETAILER-FEASIBILITY-V1.1.md)
- [Stan projektu i następny krok](docs/PROJECT-STATUS.md)
- [Publikacja P2.1 do main i test produkcyjny](docs/P21-PRODUCTION.md)
- [Weryfikacja P2.1](docs/P21-VERIFICATION.md)
- [Historyczna weryfikacja P2](docs/P2-VERIFICATION.md)
- [Kontrakty danych P2 i granice dalszych etapów](docs/DATA-CONTRACTS-P2.md)
- [Decyzje](docs/DECISIONS.md)
- [Uruchamianie, telefon i hosting](docs/SETUP.md)
- [Stan zależności i znane ograniczenia](docs/DEPENDENCY-STATUS.md)
- [Instrukcje dla agentów](AGENTS.md)

Baza historyczna: [wymagania V1.0](docs/REQUIREMENTS-V1.0.md)
i [plan V1.0](docs/IMPLEMENTATION-PLAN-V1.0.md), a także
[wymagania V1.1](docs/REQUIREMENTS-V1.1.md) i [plan V1.1](docs/IMPLEMENTATION-PLAN-V1.1.md).
Zachowano też [porównanie makiet A/B/C](docs/design/DESIGN-CONCEPTS-V1.1.md)
oraz [pierwszą analizę kosztów i usług](docs/COST-PLAN-V1.1.md).

## Pierwsze uruchomienie

Wymagania: Git, Node **24.18.0** (lub zgodna wersja 24.x), npm 11.

```powershell
git switch dev
npm ci
npm run web
```

Telefon w tej samej sieci: zainstaluj Expo Go, uruchom npm start i zeskanuj QR.
Na Windows npm run ios uruchamia serwer dla Expo Go; symulator iOS wymaga macOS.
Nie potrzeba konta Expo do lokalnego podglądu.

## Kontrole i podgląd buildu

```powershell
npm run check
npm test
npm run test:backend
npm run check:backend
npm run test:e2e
npm run test:private:e2e
npm run check:dependencies
npm run doctor
npm run build:web
npm run preview
```

Eksport jest dostępny pod http://localhost:4173. Polecenie npm run build:all
sprawdza eksport JavaScript i zasobów dla trzech platform; nie zastępuje testów
na urządzeniach. Demo P2 nie wymaga pliku .env ani kluczy API.
Prywatna szafa wymaga usług wskazanych w instrukcji P3.1; wartości publiczne
opisuje `.env.example`. OAuth natywny wymaga development build; Expo Go służy
nadal do sprawdzania demo. Syntetyczny eksport testów prywatnej szafy w
`artifacts/private-web` nie jest przeznaczony do publikacji.
Testy przeglądarkowe używają zainstalowanego Edge na Windows. Na Linuxie
zainstaluj przeglądarkę testową: `npx playwright install --with-deps chromium`.

## Gałęzie i współpraca

Pracujemy na dev. Main zasila główny adres odbioru; przed premierą komercyjną
zatwierdzony zakres można publikować i testować na main bez osobnej akceptacji
wyłącznie z powodu gałęzi. Publikacja nie oznacza odbioru funkcji ani zgody na
kolejny etap lub opłaty. Vercel nazywa ten cel Production; dev służy podglądom
Preview. Nazwa środowiska Vercel nie oznacza premiery komercyjnej.
GitHub Actions sprawdza typy, lint, domenę, zgodność zależności, eksport platform
i przepływy WWW w Playwright. Wynik należy sprawdzać dla konkretnego commita.
Początkowo jeden czat zarządza projektem i implementacją; stan zapisujemy w plikach.

Repozytorium jest publiczne. Zdjęcia, sekrety i lokalne logi nie należą do Git.
THIRD-PARTY-NOTICES.md zachowuje licencję szablonu Expo; nie stanowi decyzji
o licencji własnego kodu Ubranka.
