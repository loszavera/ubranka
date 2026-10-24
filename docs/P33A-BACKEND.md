# P3.3A — backend prywatnych stylizacji

Data: 2026-10-25. Implementacja zatwierdzonego A według planu V1.6.
Ten plik opisuje kod i lokalne dowody. Stan wdrożenia chmury podaje
[PROJECT-STATUS.md](PROJECT-STATUS.md). **AI pozostaje wyłączone**, bez klucza,
klienta OpenAI, wywołań płatnych ani nowego abonamentu.

## Zgodność i kontrakt

Migracja `20261024230417_private_styling_foundation.sql` jest uzupełniająca.
Nie zmienia zastosowanych migracji ani danych demo. `bootstrap` i `export`
zachowują dotychczasowe pola oraz dodają:

- `bodyFit: {revision,data,photo,photoDeletion}`. `data` zawiera `heightCm`,
  `chestCm`, `waistCm`, `hipsCm` (null albo liczba >0 i ≤300), `sizeSystem`
  (`EU|UK|US|other`) oraz tekstowe `topSize`, `bottomSize`, `shoeSize` (≤40 znaków).
  Początek: null, EU, puste rozmiary. `photo` zachowuje kontrakt P3.1;
  `photoDeletion: 'pending'|null` wynika ze stanu serwera, także po odświeżeniu.
- `styling: {revision,data:{outfits,feedback}}`. Zestaw:
  `{id,profileId,occasion,itemIds,itemRevisions,createdAt}`; opinia:
  `{profileId,outfitId,itemIds,vote,reason?}`. Max. 100 zapisanych / 1000 opinii.
  Opinia nie wymaga zapisanego zestawu i nie zapisuje go automatycznie.
- `visualization: {mode:'off',jobs,consent,limits}`. Zgoda AI jest nieaktywna,
  budżet aktywnego pilotażu 0 PLN. Proponowane limity 30 wyników / 40 prób / 5
  prób dziennie są opisem przyszłych ograniczeń, nie aktywacją płatnego AI.

Nowe akcje istniejącej funkcji `wardrobe`:

| Akcja | Argumenty / wynik |
| --- | --- |
| `saveBodyFit` | `{expectedRevision,data}` → cały `bodyFit` |
| `uploadBodyPhoto` | `{expectedRevision,operationId,mimeType,mainBase64,thumbBase64,storageConsentVersion:'p33a-body-v1'}` → cały `bodyFit` |
| `deleteBodyPhoto`, `deleteAiData` | `{expectedRevision}` wersji bodyFit → `{status:'pending'|'deleted'}`; następnie refresh |
| `saveStyling` | `{expectedRevision,data}` → cały `styling` |
| `requestVisualization`, `setAiConsent` | zawsze `AI_DISABLED`, również przez bezpośredni RPC |
| `getVisualization` | `{jobId}` → własne nieukryte zlecenie |
| `cancelVisualization`, `deleteVisualization` | `{jobId,expectedRevision}` → zlecenie albo `{status:'deleted'}` |

Job ma `id,revision,outfitId,status,createdAt,completedAt,expiresAt,errorCode,
reservedPln,spentPln,result`. Statusy: reserved/sent/succeeded/failed/
outcome_unknown/cancelled/expired. W A `result:null`; na hostingu historia jest
pusta, ponieważ nie można uruchomić generatora. Nie produkujemy fikcyjnych
kosztów ani obrazów dla prywatnych danych.

## Zdjęcie sylwetki, RLS i usuwanie

Zdjęcie ma `wardrobe_photos.kind='body'`, `item_id=null`; wcześniejsze rekordy
otrzymują `kind='item'`. Bucket pozostaje `wardrobe-private`, JPEG ≤1 MB plus
miniatura ≤100 kB. Ścieżki: `accountUUID/accountUUID/operationUUID/main.jpg`
oraz `thumb.jpg`. Odczyt nadal przez świeżo autoryzowany `downloadPhoto` POST,
bez bezpośredniego SELECT Storage, publicznych czy podpisanych URL.

Nowe tabele mają RLS oraz jawne granty. Klient może czytać własne aktywne dane;
zapisy wyłącznie przez sprawdzane RPC/Edge. Właściciel pochodzi z Auth.
Nowe zestawy wymagają własnych aktywnych rzeczy, zgodnych wersji i okazji oraz
kompletu góra/dół/buty, sukienka/buty albo sukienka/warstwa/buty. Niezmieniona
historia może zachować ID usuniętej rzeczy; nie jest to uprawnienie do jej odczytu.

Wspólny limit 250 MB obejmuje szafę, sylwetkę, niedokończone/usuwane warianty
i rezerwy miejsca AI. Upload sylwetki ma tę samą dzierżawę 5 minut, CAS,
idempotentne operationId i bezpieczne zastąpienie niedokończonej próby.
Po usunięciu metadata/RLS natychmiast blokują nowe odczyty. Fizyczne pliki
usuwa obecny worker przez Storage API; harmonogram co 10 minut pozostaje.
`deleteAccount` obejmuje fotografie obu typów; finalizacja dodatkowo usuwa
bodyFit, styling i osobiste zlecenia przed Auth. Nie gubi ścieżek oczekujących
na czyszczenie. `deleteAiData` usuwa zdjęcie sylwetki i ukrywa/anuluje zlecenia;
nie usuwa wymiarów ani szafy.

## Fundament zleceń i kosztów — lokalnie sprawdzony, bez aktywacji

Oprócz HTTP/RPC OFF, `wardrobe_private.ai_enabled()` zawsze zwraca false.
Nie istnieje przełącznik środowiskowy, parametr HTTP ani produkcyjny tryb testowy.
Service-only reserve/mark_sent/settle również odmawiają przy tym ustawieniu.
Test zastępuje funkcję wyłącznie w swojej jednorazowej bazie PGlite.

Fundament SQL obejmuje:

- identyfikator klienta sprzed pierwszego POST, właściciela i fingerprint wersji;
  powtórzenie po utracie odpowiedzi zwraca tę samą operację;
- globalną blokadę jednej operacji, atomowe rezerwy obu budżetów (cały pilotaż
  i miesiąc UTC), limit prób oraz miejsca, CAS reserved→sent;
- jedną kolejność blokad dla mutacji i cleanup: globalny mutex, konto,
  następnie zdjęcie/zlecenie; żadna blokada DB nie obejmuje żądania sieciowego;
- rewalidację zgody, zaproszenia, konta, zdjęć i wersji profilu/rzeczy przed
  wysłaniem i rozliczeniem; brak automatycznego ponowienia po sent;
- koszt z ustandaryzowanego usage 5/8/30 USD za milion, całkowite mikrodolary
  i grosze zaokrąglone w górę przy przeliczniku 6,765 PLN/USD;
- nieznany koszt zatrzymuje kolejne operacje i zachowuje rezerwę; usunięcie
  wyniku/konta, upływ czasu lub zmiana miesiąca nie zerują kosztów;
- watchdog oznacza sent starsze niż 5 minut jako unknown, bez kolejnego API;
  niewysłane zlecenia wygasają po 15 minutach. Zamknięte osobiste metadane
  bez rezerw są usuwane po 90 dniach, bez zmiany zbiorczych kwot projektu.

`_shared/visualization.ts` jest niepodłączonym kontraktem koordynacji:
claimOnce, pojedyncze wywołanie dostawcy, limit PNG, manifest przed zapisem,
ponowna kontrola przed publikacją, sprzątanie spóźnionego pliku i rozliczenie
znanego kosztu także przy błędzie. Nie ma implementacji dostawcy sieciowego.
Syntetyczny adapter znajduje się wyłącznie w `tests/support/`.

**Granica dowodów:** testy koordynatora potwierdzają kolejność/reakcję na awarie
portów, nie trwały manifest w prawdziwym Storage. Nie wdrożono workera AI,
magazynu wygenerowanych PNG, dekodera/miniatur ani ścieżki publikacji wyników.
Przed B trzeba je podłączyć do zweryfikowanego protokołu, zachowując limity,
manifest i retencję 30 dni, oraz wykonać zatwierdzony hosted test. Nie uznajemy
kontraktu/mocka za działającą generację lub ukończenie B/C.

## Weryfikacja

```powershell
node --experimental-strip-types --test supabase/tests/protocol.test.ts supabase/tests/cleanup.test.ts supabase/tests/database.test.mjs supabase/tests/styling-database.test.mjs supabase/tests/styling-protocol.test.ts
npx --yes deno@2.9.6 check supabase/functions/wardrobe/index.ts supabase/functions/wardrobe-cleanup/index.ts supabase/functions/_shared/visualization.ts
```

PGlite wykonuje wszystkie migracje i prawdziwe RPC/RLS; zarządzane tabele Auth/
Storage są fixture. Sprawdza obydwa konta, CAS, limity, usuwanie i zachowanie
danych P3.1, replay, deadline, brak zgody, unknown i rozliczenie. Jeden silnik
PGlite serializuje polecenia; nie zastępuje testu równoległych połączeń hosted.
Test HTTP potwierdza, że OFF wykonuje tylko kontrolę Auth, bez żądania do
dostawcy. Test koordynatora uruchamia dwa wywołania i tylko jedno przejmuje pracę.
Hosted OAuth, Storage oraz cron wymagają odrębnego raportu wdrożenia root.

Wynik lokalny: **41/41 testów PASS**, sprawdzenie typów Deno 2.9.6 PASS.
Niezależny przegląd migracji/Edge oraz kolejności blokad bez uwag blokujących.
