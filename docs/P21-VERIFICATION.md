# P2.1 — weryfikacja i odbiór

Data: 2026-10-24. Zakres zatwierdzony przez użytkownika: okazje, dobór zgodnych
zestawów, zachowanie danych P2, testy i Vercel Preview z dev. Kryterium A-12
z [V1.3](REQUIREMENTS-V1.3.md). P3 i publikacja do main nie są częścią tego zadania.

## Kontrole lokalne

| Kontrola | Wynik i dowód |
| --- | --- |
| `npm run check` | PASS, TypeScript strict i ESLint bez błędów. |
| `npm test` | PASS, 15 testów reguł domeny. Sześć okazji dla obu grup, oba tryby, limit dwóch, koszt/dostawa, własność, ranking gustu, brak zastępstwa inną okazją, wyczerpanie, walidacja i migracja V1/V2. |
| `npm run test:e2e` | PASS, 13 scenariuszy w Edge na Windows. `artifacts/p21-e2e.log`, `artifacts/e2e-results.json`, zrzuty w `artifacts/e2e/`. |
| `npm run build:all` | PASS, eksport WWW i bytecode Hermes dla iOS/Android. `artifacts/p21-build-all.log`. |
| Zachowanie katalogu P2 | 28 starych rzeczy identycznych; 8 starych zestawów zachowuje IDs, ceny, elementy i dawną okazję (teraz w tablicy). Nowy katalog: 37 rzeczy / 12 zestawów. |
| Obrazy | Cztery nowe ilustracje obejrzane i porównane z katalogiem. Fikcyjne dorosłe osoby, kompletne stylizacje i obuwie. [Prompty i pochodzenie](design/P21-ASSETS.md). |
| UI | Obejrzane zrzuty nowych propozycji weselnych i selektora PL/EN. Testy szerokości 320, 360, 390, 1440 px i klawiatury WWW przeszły. |
| Niezależny przegląd | PASS, bez konkretnych regresji; sprawdzono migrację, twardy filtr, stan rundy/profili, testy i zgodność obrazów z katalogiem. |

Pięć nowych scenariuszy WWW uzupełnia osiem scenariuszy P2:

1. Wesele dla kobiet, oba tryby, zmiana budżetu/języka z zachowaniem okazji rundy;
   reload przywraca domyślną okazję profilu i zachowuje ocenę.
2. Start z męską okazją weselną, dwie poprawne ilustracje/ceny, odrzucenie obu
   kończy przykłady bez propozycji innej okazji; praca otwiera świeżą rundę.
3. Edycja i zapis domyślnej okazji; przełączanie profili przywraca ich domyślne
   okazje bez usunięcia opinii.
4. Zamrożony zapis V1 z własnymi nazwami, aktywnym profilem, EN, budżetem,
   priorytetem, trybem, własnością i opiniami z powodem migruje pod tym samym
   kluczem. Dalsza opinia i kolejny reload zachowują dane.
5. Praca/randka/impreza ograniczają kandydatów, zmiana okazji zeruje rundę,
   brak markowego odpowiednika daje jedną kartę, zbyt niski budżet daje brak wyników.

Test domeny migracji zawiera także wszystkie 28 dawnych rzeczy i opinie dla
8 dawnych zestawów. Dane testowe są fikcyjne; nie zmieniono danych użytkowników.
Nie dodano zależności. Historyczny audyt i ograniczenia opisano w
[DEPENDENCY-STATUS.md](DEPENDENCY-STATUS.md); nie przedstawiamy go jako nowego audytu P2.1.

## Publikacja

- Implementacja aplikacji: `b74e22c59bebd78e8aeeadb2cba28a100d3eb002` na dev.
- Vercel Preview `dpl_kKpgbeYGGDEYT25R1SRMUKx4keoZ`: READY, źródło dev/b74e22c.
  Test online 2026-10-24 16:23 UTC: HTTP 200, wszystkie cztery nowe ilustracje,
  damskie/męskie wesele, oba tryby, praca/randka/impreza, PL/EN, migracja V1
  i zapis nowej opinii po reload — PASS, zero błędów JavaScript.
  Dowód: `artifacts/p21-vercel-verification.json`, `artifacts/p21-vercel-wedding-*.png`.
- Sprawdzony adres: https://ubranka-git-dev-risk-every-asset.vercel.app.
  Ochrona logowaniem Vercel zachowana; do testu użyto tymczasowego dostępu.
- Pierwsze [CI dla b74e22c](https://github.com/loszavera/ubranka/actions/runs/40111085233)
  przeszło wszystkie kroki i 12/13 scenariuszy WWW, lecz test responsywności
  zmierzył układ przed renderem po resize. Diagnostyka odtworzyła przejściowy
  stan w 20 próbach; wszystkie końcowe rozmiary poprawne. Poprawiono oczekiwanie
  na geometrię (bez tolerancji przepełnienia) oraz kontrolę obu języków przy
  każdej szerokości. Poprawione testy lokalne: 13/13 PASS.
  Log pierwszej próby: `artifacts/p21-ci-first.log`; diagnostyka:
  `artifacts/p21-layout-diagnostic.json`.
- Końcowy commit kodu/testów: `3c555b56a93067581b312a980896cf5a29a5118d`.
  [GitHub Actions 40111604543](https://github.com/loszavera/ubranka/actions/runs/40111604543):
  SUCCESS na Ubuntu/Chromium — czysta instalacja, typy/lint, 15 testów domeny,
  zgodność SDK, eksporty i 13/13 scenariuszy WWW. `artifacts/p21-ci-result.json`.
  Ponieważ push nie utworzył runu, istniejący workflow uruchomiono ręcznie na dev.
- Vercel dla `3c555b5`: `dpl_5rMcGooY9RdwsL4f8vnidys6byA8`, READY.
  Źródła aplikacji, zasoby, zależności i konfiguracja hostingu są identyczne
  z wersją sprawdzoną w przeglądarce. Log nowego wdrożenia potwierdza ten sam bundle.
  Późniejszy commit niniejszego podsumowania zmienia wyłącznie dokumentację.

Bundle z Linux/Vercel ma inną nazwę niż lokalny Windows. Potwierdzono nazwę
załadowanego skryptu względem logu Vercel właściwego commita;
CI na Linuxie wygenerowało ten sam bundle co Vercel. Nie zakładamy identyczności
plików między różnymi systemami budowania.

## Odbiór przez Kasię i Aleksego

Około 5–10 minut na dotychczasowym adresie dev, w tej samej przeglądarce co P2:

1. Przed resetowaniem czegokolwiek sprawdź, czy pozostały Twoje profile, język,
   budżet, opinie i posiadane rzeczy.
2. Wybierz „Wesele (gość)” i budżet 500 PLN. Poproś o zestawy w obu trybach,
   sprawdź damskie i męskie przykłady oraz szczegóły kosztu z dostawą.
3. Przełącz pracę, randkę i imprezę; poproś o nową parę. Oceń trafność przykładów.
4. Zmniejsz budżet dla wesela do 100 PLN bez nowych posiadanych rzeczy: przy
   braku pasujących propozycji aplikacja powinna to powiedzieć, bez innej okazji.
5. Zapisz domyślną okazję w Profilu i odśwież. Opinie pozostają, a okazja ustawiona
   tylko dla rundy wraca po odświeżeniu do domyślnej okazji profilu.

Przekaż uwagi Kasi/Aleksego, język, urządzenie i konkretny krok przy błędzie.
Pełna ocena na fizycznych urządzeniach iOS/Android w Expo Go nadal nie jest wykonana.
To prototyp z przykładami i prostym rankingiem; nie ma jeszcze AI, rzeczywistych
ofert ani przymiarki. Dane lokalne są przypisane do adresu przeglądarki, więc do
kontynuacji P2 należy użyć stałego adresu dev, a nie nowego adresu pojedynczego wdrożenia.
