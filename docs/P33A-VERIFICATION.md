# P3.3A — wdrożenie i weryfikacja

Data: 2026-10-25. Zakres zatwierdzony: [plan V1.6](IMPLEMENTATION-PLAN-V1.6.md).
Kod, backend, CI, podgląd main i fizyczne usunięcie danych syntetycznych:
**PASS**. **Aktualizacja 2026-10-25: Kasia i Aleksy potwierdzili przetestowanie
i zaakceptowali P3.3A.** Zlecili tylko propozycję B, bez nowych płatnych wywołań.
Ogólna akceptacja nie jest osobnym potwierdzeniem każdego punktu checklisty
ani konkretnych urządzeń. P3.3B nie rozpoczęto.

## Granica etapu

Prywatny profil sylwetki, jedno zdjęcie osoby w obecnym Supabase, dobór do dwóch
kompletnych zestawów z własnych rzeczy i przygotowanie wizualizacji PL/EN.
AI pozostaje wyłączone w interfejsie, Edge i RPC. Brak klucza AI w chmurze,
nowych płatnych wywołań i abonamentów. Galeria P3.2 jest osobnym przykładem;
nie używa fotografii użytkownika ani nie tworzy fikcyjnych wydatków.

Filtr rozmiaru porównuje wyłącznie jednoznaczne etykiety literowe góry/dołu.
Nie przelicza rozmiarów liczbowych ani systemów sklepów i nie potwierdza
fizycznego dopasowania. Brak zdjęcia nie blokuje doboru zestawu.

## Weryfikacja techniczna

- TypeScript/ESLint i kontrola Edge w Deno 2.9.6: **PASS**.
- Logika/klient: **62/62 PASS**, w tym 17 nowych testów zestawów i 9 klienta.
  Postgres/RLS, transport i koordynator: **41/41 PASS**. Testy obejmują również
  brak automatycznego ponowienia, zachowanie rezerwy przy nieznanym wyniku,
  kolejność manifest/zapis, spóźniony wynik po usunięciu i współdzielony limit miejsca.
- Regresja demo WWW: **15/15 PASS**. Prywatny UI: **10 wcześniejszych scenariuszy
  PASS**, następnie **8/8 nowych PASS** po poprawce przycisku odczytu konfliktu.
  Pierwszy przebieg miał 17/18: formularz zasłaniał globalne odświeżenie.
  Przycisk przeniesiono także do formularza. Następnie doprecyzowano oczekiwanie
  testu na koniec zamykania okna przed wyborem zdjęcia; bez automatycznych retry.
  Następnie pełny workflow GitHub, w tym wszystkie 18 prywatnych scenariuszy,
  przeszedł na tym samym kodzie.
  Sprawdzono PL/EN, 320/390 px, eksport, usuwanie, zmianę konta, brak kompletu,
  ręczną zamianę, opcjonalny powód i jawnie wyłączone AI.
- Eksport WWW/iOS/Android: **PASS**. Nie zastępuje fizycznych urządzeń.
- Chmura: **40 kontroli PASS** w `supabase/tests/p33a-live.test.mjs`.
  Dwie dedykowane syntetyczne sesje Auth bez zmiany ustawień logowania i bez
  wysyłania emaili. Rzeczywiste Edge/Postgres/Storage: zapis rozmiarów, wyścig CAS,
  idempotentny upload, zgodność bajtów zdjęcia, izolacja kont, odmowa bezpośredniego
  Storage po odczycie, prywatny zapis zestawu/opinii i eksport. Usunięcie sylwetki
  natychmiast odbiera odczyt, zachowując rozmiary i rzeczy. Edge oraz bezpośredni
  RPC odmawiają generacji przez `AI_DISABLED`. Koszt i próby pozostają zerowe.
- Migracja chmury `20261024232236 private_styling_foundation` odpowiada lokalnemu
  plikowi `20261024230417_private_styling_foundation.sql`; wersje narzędzie nadaje
  przy zastosowaniu. `wardrobe` v5 i `wardrobe-cleanup` v4 są ACTIVE.
  Hashe dotychczasowego stanu konta, rzeczy i metadanych zdjęć przed/po: zgodne.
- Doradca bezpieczeństwa: bez nowych zgłoszeń. Pozostały dwa wcześniejsze
  ostrzeżenia o celowo udostępnionych RPC SECURITY DEFINER oraz ostrzeżenie
  ochrony wyciekłych haseł przy wyłączonym logowaniu hasłem. Właściciel i
  aktywność są kontrolowane w RPC/RLS; nie rozszerzono grantów użytkowników.
- GitHub dev/main: `4b34a00526f814804735fb8a6221193608f15372`, publikacja
  bez przepisywania historii. Vercel Production
  `dpl_4SVbhXLb7aH5VsTW8ex8dXJv8VHH`: **READY**, alias
  https://ubranka.vercel.app przypisany do tego kodu.
- Wdrożony main z rzeczywistym Supabase: **5 kontroli PASS** na dedykowanej
  syntetycznej sesji. Zapis rozmiarów i zdjęcia po świadomym potwierdzeniu,
  odczyt po odświeżeniu, własny zestaw/opinia, przygotowanie z wyłączonym AI,
  PL/EN przy 320/390 px oraz wylogowanie. Zero błędów JavaScript i połączeń
  poza adresem aplikacji oraz istniejącym Supabase. Zero wywołań generacji.
- CI uruchomiono ręcznie na main; automatyczne uruchomienia repozytorium są
  wyłączone. Nie zmieniano ustawień Actions.
  [Przebieg 40143086234](https://github.com/loszavera/ubranka/actions/runs/40143086234): **SUCCESS**
  dla dokładnego SHA `4b34a00526f814804735fb8a6221193608f15372`.
  Obejmuje check, logikę, backend, Deno, zależności, eksporty i obie grupy E2E.
- Oba konta syntetyczne usunięto przez aplikację i istniejący harmonogram.
  Kontrola o 23:40:21 UTC (01:40:21 czasu polskiego) potwierdziła **zero**
  rekordów kont/rzeczy/zdjęć/sylwetki/stylizacji/zleceń, zero wpisów Storage
  pod oboma prefiksami oraz brak obu użytkowników Auth. Usunięto dwa testowe
  zaproszenia i lokalny plik sesji. Bez ręcznego globalnego czyszczenia
  ani skracania zabezpieczenia świeżego uploadu.
- Niezależny przegląd końcowy: bez blokujących uwag; zachowano granicę A/B.

Końcowy commit po `4b34a00` zapisuje wyłącznie dokumentację, bez zmian
kodu, konfiguracji usług i zależności. Wynik CI dotyczy wskazanego SHA kodu.

Koordynator generacji jest lokalnie testowanym kontraktem, a adapter syntetyczny
istnieje wyłącznie w testach. Nie wdrożono klienta OpenAI, workera generacji,
produkcyjnego zapisu PNG, dekodera/miniatur AI ani zgody na przekazanie zdjęć.
To przygotowanie do osobno zatwierdzanego B, nie dowód działania tych usług.
Ocena błędu faktycznego wyniku oraz pomiar CPU/RAM/latencji wymagają tej dalszej fazy.

Dowody lokalne w ignorowanym `artifacts/`: `p33a-check-final.log`, `p33a-unit.log`,
`p33a-backend.log`, `p33a-deno.log`, `p33a-private-e2e-retest.log`,
`p33a-private-new-retest.log`, `p33a-demo-e2e.log`, `p33a-build-all.log`,
`p33a-hosted-report.json`, `p33a-main-ui.json`, `p33a-main-*.png`,
`p33a-cleanup-report.json`, `p33a-ci-report.json`.
Nie publikujemy sesji Auth ani prywatnych logów.

Testy syntetyczne nie potwierdzają logowania Google Kasi ani zachowania aparatu
i selektora plików na fizycznym iPhonie/Androidzie. To pozostaje do odbioru.

## Krótki test użytkowników po publikacji

1. Otworzyć https://ubranka.vercel.app i prywatną szafę. Sprawdzić, że wcześniejsze
   ubrania oraz profile pozostały dostępne.
2. W „Moja sylwetka” zapisać opcjonalne rozmiary. Wybrać własne zdjęcie dorosłej
   osoby, przeczytać zasady Supabase i świadomie zatwierdzić zapis. Po odświeżeniu
   sprawdzić wartości i zdjęcie; następnie przetestować wymianę/usunięcie.
3. Dla jednej okazji opisać co najmniej górę, dół i buty albo sukienkę i buty.
   W „Zestawy” wybrać profil/okazję i „Dobierz zestawy”. Sprawdzić zgodność
   rzeczy, zapis zestawu, ręczną zamianę, polubienie i opcjonalny powód odrzucenia.
4. Wybrać „Zobacz na mnie”. Sprawdzić miniatury wybranych wejść i niedostępny
   przycisk generacji. „Zobacz przykład P3.2” otwiera istniejącą galerię
   fikcyjnych osób, a nie przymiarkę własnych zdjęć.
5. Zmienić język PL/EN, odświeżyć, pobrać eksport i sprawdzić go na swoim
   urządzeniu. Usunięte zdjęcie powinno od razu zniknąć z odczytu; pliki mogą
   kończyć czyszczenie w tle według przyjętych zasad.

Nie uruchamiać P3.3B tylko dlatego, że ten test się powiódł. Następna płatna
próba wymaga osobnej zgody określającej dane, liczbę wywołań i budżet.
