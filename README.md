# Ubranka

Wirtualny stylista: mniej przeglądania, prostsze decyzje i ubrania dopasowane do osoby.
Jeden projekt TypeScript / React Native / Expo dla iOS, Androida i przeglądarki.

**Podgląd dev:** https://ubranka-git-dev-risk-every-asset.vercel.app
(logowanie Vercel; stan wdrożenia w dokumencie statusu).
**Stabilny fundament main:** https://ubranka.vercel.app

**Etap:** P2.1 — zatwierdzone rozszerzenie o wesele jako gość, pracę, randkę
i imprezę. Okazję wybierasz przed rundą; propozycje muszą do niej pasować.
Zachowano dane P2, a domyślną okazję profilu można edytować. Wyniki testów
i publikacji znajdują się w statusie oraz raporcie P2.1. Wygląd A — Krem i śliwka, PL/EN, krótki start,
edytowalne profile, szafa demo i najwyżej dwa zestawy w obu trybach.
Budżet obejmuje nowe rzeczy z dostawą; posiadane rzeczy kosztują 0 PLN.
Opinie zmieniają ranking przykładów i pozostają z ustawieniami na urządzeniu.
Prototyp używa 37 fikcyjnych ubrań i 12 ilustracji. Konta, synchronizacja,
własne zdjęcia, AI, sklepy i lista zakupowa należą do kolejnych etapów.

## Dokumenty

- [Wymagania V1.3 — aktualizacja bazy V1.2](docs/REQUIREMENTS-V1.3.md)
- [Plan implementacji V1.3 — P2.1](docs/IMPLEMENTATION-PLAN-V1.3.md)
- [Odpowiedzi uzupełniające](docs/INTERVIEW-V1.2.md) i [pierwsze 20 odpowiedzi](docs/INTERVIEW-V1.1.md)
- [Wybrany wygląd A](docs/design/DESIGN-DIRECTION-V1.2.md)
- [Budżet przy 30 wizualizacjach na osobę](docs/COST-PLAN-V1.2.md)
- [Możliwości integracji sklepów](docs/RETAILER-FEASIBILITY-V1.1.md)
- [Stan projektu i następny krok](docs/PROJECT-STATUS.md)
- [Weryfikacja i scenariusz odbioru P2.1](docs/P21-VERIFICATION.md)
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
npm run test:e2e
npm run check:dependencies
npm run doctor
npm run build:web
npm run preview
```

Eksport jest dostępny pod http://localhost:4173. Polecenie npm run build:all
sprawdza eksport JavaScript i zasobów dla trzech platform; nie zastępuje testów
na urządzeniach. Prototyp P2 nie wymaga pliku .env ani kluczy API.
Testy przeglądarkowe używają zainstalowanego Edge na Windows. Na Linuxie
zainstaluj przeglądarkę testową: `npx playwright install --with-deps chromium`.

## Gałęzie i współpraca

Pracujemy na dev. main jest stabilną bazą; obie gałęzie startują z tą samą
infrastrukturą. Vercel jest połączony: main zasila Production, a dev służy podglądom Preview.
GitHub Actions sprawdza typy, lint, domenę, zgodność zależności, eksport platform
i przepływy WWW w Playwright. Wynik należy sprawdzać dla konkretnego commita.
Początkowo jeden czat zarządza projektem i implementacją; stan zapisujemy w plikach.

Repozytorium jest publiczne. Zdjęcia, sekrety i lokalne logi nie należą do Git.
THIRD-PARTY-NOTICES.md zachowuje licencję szablonu Expo; nie stanowi decyzji
o licencji własnego kodu Ubranka.
