# P3.1 — backend prywatnej szafy

Implementacja: Supabase Auth + Postgres + prywatny Storage; Edge Functions bez
zewnętrznych zależności. Ten plik opisuje kod, nie potwierdza uruchomienia chmury.
Stan rzeczywistej konfiguracji i testów należy sprawdzić w PROJECT-STATUS.md.

## Kontrakt klienta

`supabase.functions.invoke('wardrobe', { body: { action, ...payload } })`.
Każde żądanie wymaga JWT zalogowanej osoby; funkcja sprawdza go w Auth `getUser`.
Nie ufa przesłanemu `accountId`. Odpowiedź: `{data: result}` albo
`{error:{code,message}}`; konflikt wersji to HTTP 409 / `CONFLICT`.

| Akcja | Argumenty | Wynik |
| --- | --- | --- |
| `bootstrap` | brak | `{accountId,state,items}` |
| `saveState` | `expectedRevision,data,importId?` | `{revision,data}` |
| `createItem` | `itemId` UUID + wszystkie pola opisu | rzecz; ponowienie tego UUID nie tworzy drugiej rzeczy |
| `updateItem` | `itemId,expectedRevision` + wszystkie pola | rzecz z podwyższoną wersją |
| `uploadPhoto` | `itemId,expectedRevision,operationId` UUID, `mimeType:'image/jpeg',mainBase64,thumbBase64` | rzecz z nowym zdjęciem i wersją |
| `deletePhoto`, `deleteItem` | `itemId,expectedRevision` | `{status:'deleted'|'pending'}` |
| `deleteAccount` | brak; UI wymaga świadomego potwierdzenia | `{status:'deleted'|'pending'}` |
| `export` | brak | snapshot oraz `exportedAt`; pliki pobiera klient z prywatnego Storage |

Stan: `{revision,data:{locale,profiles,activeProfileId,feedback,askReason}}`.
Początkowo puste profile/opinie, `activeProfileId:''`, PL, `askReason:true`.
Profile zachowują model P2; ich ID są ograniczonymi ciągami, także `p2:everyday`.
Brak `ownedItemIds`: fikcyjne ubrania nie stają się prywatną szafą.
Import wybranych profili/opinii składa klient, przekazuje `expectedRevision`
i trwałe `importId`; receipt per konto zapobiega powtórnemu zastosowaniu.
Zmiany dwóch urządzeń mają wersję; stary zapis zwraca konflikt, nie nadpisuje nowszego.

Rzecz: `{id,name,category,color,occasions,size,photoKind,revision,status,createdAt,updatedAt,photo}`.
Kategorie: `top,bottom,layer,shoes,dress,accessory`; okazje jak P2.1;
`photoKind:garment|person`, `size:''` gdy brak. `photo` jest null albo
`{id,mainPath,thumbPath,mimeType,bytes,thumbBytes}`. Ścieżki mają właściciela na początku;
nie są publicznymi URL. Bucket `wardrobe-private`, odczyt JWT; aplikacja nie wydaje signed URL.

## Ochrona i ograniczenia

- Pusta prywatna allowlista: domyślnie nikt nie dostaje danych. Dwa adresy
  administrator wpisuje lokalnie/panelem do `wardrobe_private.invites`, nie do Git.
- Hook Before User Created blokuje inne rejestracje. Niezależna kontrola allowlisty
  w bootstrap/RLS blokuje dane nawet przy pominięciu konfiguracji hooka.
- RLS obejmuje konta, rzeczy, zdjęcia oraz Storage. Bezpośrednie zapisy tabel/Storage
  użytkownika są zabronione; operacje przechodzą przez walidowane RPC/Edge.
- Każda mutacja blokuje wiersz konta na czas transakcji: równoległe dodawanie nie
  omija 100 rzeczy ani rezerwacji magazynu. Usuwane rzeczy liczą się do limitu
  aż do fizycznego zakończenia, zamiast pozwalać zapchać magazyn pending delete.
- Każde zdjęcie: ≤1 000 000 bajtów + miniatura ≤100 000 bajtów, obie kopie JPEG;
  limit konta 250 000 000 bajtów obejmuje staged/active/deleting. Dodatkowa wewnętrzna
  kolejka maks. 200 wersji zdjęć/konto ogranicza zaległości sprzątania.
- Klient dekoduje i ponownie koduje zdjęcie. Edge sprawdza rzeczywiste bajty,
  strukturę JPEG, wymiary ≤1600 px, brak EXIF/XMP/IPTC/komentarzy i nadmiarowego ogona.
  Format PNG/WebP/HEIC musi wcześniej przejść obsługiwaną konwersję; surowy plik
  nie trafia do magazynu. Parser Edge nie zastępuje dekodera zdjęć.
- Upload ma rezerwację, SHA-256 obu wariantów, dwa obiekty i osobne zatwierdzenie.
  Ponowienie operationId jest dopuszczone dla tych samych danych. Nowsza edycja
  rzeczy blokuje commit poprzedniej wersji, zamiast ukrycie ją nadpisać.
  Po potwierdzonej zmianie opisu jawne ponowienie uploadu z bieżącą wersją może
  przypiąć te same bajty do nowej wersji. Stare żądanie nie przedłuża dzierżawy;
  kolejna zmiana między wznowieniem a commit nadal kończy się konfliktem.

## Usuwanie i sprzątanie

W pierwszej transakcji konto/rzecz/zdjęcie traci dostęp. UI pokazuje `pending`,
dopóki Storage API i baza nie potwierdzą końca. Usuwanie samym SQL jest zabronione.
Worker używa Storage API dla obu wariantów; funkcja SQL nie usuwa rekordu,
jeśli obiekt nadal figuruje w Storage. Konto: pliki → rzeczy/profile/opinie → Auth.
Stan `deleting` blokuje stare tokeny. Nie blokuje to już pobranej kopii na urządzeniu.

Pięciominutowa dzierżawa uploadu zapobiega wyścigowi: worker nie może skasować
rekordu, gdy wysyłanie jeszcze trwa. Wywołania sieciowe mają timeout 15 s.
Porzucony upload po godzinie i wygaśnięciu dzierżawy trafia do sprzątania; worker co 10 minut przetwarza
do 25 zdjęć. Nowe próby sprzątania mają pierwszeństwo przed niedawnymi błędami,
więc uszkodzony rekord nie zatrzymuje pozostałych. Worker zaczyna operacje przez
maks. 18 s, wywołania mają timeout 3 s; pozostała praca czeka na następny przebieg.
Błędy pozostają w stanie/technicznych licznikach, bez zdjęć lub tokenów
w logach. Cel ≤24 h zakłada działającą usługę i worker; Free może być wstrzymany.

## Konfiguracja (bez nowych abonamentów)

1. Dwa osobne dostępne projekty Free Frankfurt: testowy i późniejszy pilot.
2. Zastosować `supabase/migrations/202610240001_private_wardrobe.sql` na wybranym
   projekcie, po potwierdzeniu jego tożsamości. Migracja nie zawiera kont ani sekretów.
3. Wpisać dwa zaproszenia, skonfigurować Before User Created hook
   `public.wardrobe_before_user_created`. W Auth włączyć wyłącznie Google,
   wyłączyć email/password, anonymous i manual linking. Callback Google ustawić
   zgodnie z Supabase; redirect aplikacji wyłącznie na zaakceptowane adresy.
4. Wdrożyć `wardrobe` i `wardrobe-cleanup`. `verify_jwt=false` jest celowe:
   `wardrobe` zawsze wykonuje Auth `getUser`, cleanup wymaga oddzielnego losowego
   sekretu (≥32 znaki). To nie oznacza anonimowego dostępu.
5. Sekrety Edge: `WARDROBE_ALLOWED_ORIGINS` jako dokładna lista adresów oddzielona
   przecinkiem, `WARDROBE_CLEANUP_SECRET`. Supabase wstrzykuje `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Klient dostaje tylko URL i klucz publiczny.
6. Vault: `project_url`, `wardrobe_cleanup_secret` (ten sam sekret co Edge).
   Następnie zastosować `supabase/setup-cleanup.sql`; sprawdzić udane wywołanie
   i działanie harmonogramu. Publiczny klucz API nie autoryzuje sprzątania.
7. Testować tylko syntetyczne dane. Oddzielne Preview nie dostaje kluczy pilota.

## Weryfikacja

Lokalnie bez Dockera: prawdziwy Postgres WASM (PGlite), fixture tylko dla tabel
zarządzanych przez Supabase (`auth`, `storage`). Migracja wykonuje się w całości,
a testy uruchamiają RPC/RLS w rolach authenticated/service_role.

```powershell
npm install --prefix .local/backend-test-runtime --no-audit --no-fund --ignore-scripts @electric-sql/pglite@0.5.11
$env:PGLITE_MODULE = Join-Path (Get-Location) '.local/backend-test-runtime/node_modules/@electric-sql/pglite/dist/index.js'
node --experimental-strip-types --test supabase/tests/protocol.test.ts supabase/tests/cleanup.test.ts supabase/tests/database.test.mjs
npx --yes deno@2.9.6 check supabase/functions/wardrobe/index.ts supabase/functions/wardrobe-cleanup/index.ts
```

Po dodaniu przypiętej zależności developerskiej PGlite do głównego package.json
nie jest potrzebny lokalny runtime ani `PGLITE_MODULE`; runner importuje pakiet normalnie.

Test zdalny po konfiguracji dwóch syntetycznych kont: `supabase/tests/live.test.mjs`.
Lokalny ignorowany plik env zawiera URL, publiczny klucz, dwa JWT, ścieżkę do
syntetycznego JPEG <100 kB oraz `WARDROBE_TEST_SYNTHETIC=true`. Uruchomienie:

```powershell
node --env-file=.env.backend-test.local supabase/tests/live.test.mjs
```

Nie uruchamiać na danych użytkowników. Wynik lokalnego Postgresa nie potwierdza
Google OAuth, faktycznego Storage API, harmonogramu ani kasowania w chmurze.
Po teście zdalnym sprawdzić usunięcie plików po dzierżawie i uruchomieniu workera,
usunięcie konta, eksport obu wariantów oraz prawdziwe logowanie na dwóch urządzeniach.

Źródła sprawdzone 2026-10-24:
[Storage RLS](https://supabase.com/docs/guides/storage/security/access-control),
[Storage delete](https://supabase.com/docs/guides/storage/management/delete-objects),
[Auth hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook),
[harmonogram Edge](https://supabase.com/docs/guides/functions/schedule-functions),
[sekrety Edge](https://supabase.com/docs/guides/functions/secrets).
