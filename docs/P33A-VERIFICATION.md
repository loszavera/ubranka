# P3.3A — wdrożenie i weryfikacja

Data: 2026-10-25. Zakres zatwierdzony: [plan V1.6](IMPLEMENTATION-PLAN-V1.6.md).
Kod i backend przeszły kontrole; publikacja main i końcowe czyszczenie fixture
są w toku. Poniżej oddzielono wykonane kontrole od oczekujących.

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
- GitHub, Vercel main, kontrola wdrożonego UI i fizyczne usunięcie fixture: oczekuje.

Koordynator generacji jest lokalnie testowanym kontraktem, a adapter syntetyczny
istnieje wyłącznie w testach. Nie wdrożono klienta OpenAI, workera generacji,
produkcyjnego zapisu PNG, dekodera/miniatur AI ani zgody na przekazanie zdjęć.
To przygotowanie do osobno zatwierdzanego B, nie dowód działania tych usług.
Ocena błędu faktycznego wyniku oraz pomiar CPU/RAM/latencji wymagają tej dalszej fazy.

Dowody lokalne w ignorowanym `artifacts/`: `p33a-check-final.log`, `p33a-unit.log`,
`p33a-backend.log`, `p33a-deno.log`, `p33a-private-e2e-retest.log`,
`p33a-private-new-retest.log`, `p33a-demo-e2e.log`, `p33a-build-all.log`,
`p33a-hosted-report.json`. Nie publikujemy sesji Auth ani prywatnych logów.

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
