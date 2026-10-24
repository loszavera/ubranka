# P3.1 — weryfikacja implementacji

Data: 2026-10-24. Gałąź dev. Dokument odróżnia testy lokalne, testy w chmurze
i scenariusz użytkowników na telefonach. **Google OAuth i konfiguracja usług
są potwierdzone; poprawka odczytu zdjęć przeszła testy w chmurze.** Stan dostępu:
[P31-SETUP.md](P31-SETUP.md).

## Sprawdzony zakres

- Prywatna szafa PL/EN jest oddzielona od demo i jego klucza `ubranka:p2:v1`.
  Import wybranych profili/opinii jest świadomy, powtarzalny bez duplikatów.
- CRUD zdjęć/rzeczy, profile, wersje/CAS, zachowanie formularza przy błędzie,
  import, ZIP z danymi i obiema kopiami zdjęcia, potwierdzane usuwanie.
- Dekodowanie JPG/PNG/WebP, orientacja EXIF, ponowne kodowanie bez metadanych,
  limity rozmiarów, odmowa HEIC i anulowanie. Syntetyczne obrazy, bez zdjęć osób.
- Realna migracja SQL/RLS w PGlite: właściciel, odmowa bezpośrednich zapisów,
  limity/rezerwacje, CAS, trwałe usuwanie, stare tokeny po blokadzie konta.
  Tabele zarządzane przez Supabase Auth/Storage są testowymi fixture.
- Testy UI używają rzeczywistego frontendu/SDK i kontrolowanych odpowiedzi API.
  Nie wykonują prawdziwego logowania Google ani operacji w Supabase.

## Wyniki lokalne

| Kontrola | Wynik |
| --- | --- |
| TypeScript strict + ESLint | PASS |
| Testy domeny, zdjęć i klienta (`npm test`) | 34/34 PASS |
| SQL/RLS/protokół/cleanup (`test:backend`) | 14/14 PASS; rola Auth hook i odczyt zdjęć przez Edge |
| Deno 2.9.6, dwie Edge Functions | PASS |
| Expo SDK dependency check | PASS |
| Expo Doctor | 21/21 PASS |
| Eksport WWW, Android, iOS | PASS; nie zastępuje testów fizycznych urządzeń |
| Regresja WWW P2/P2.1 + zdjęcia (Edge) | 15/15 PASS |
| Prywatna szafa WWW (Edge, syntetyczne API) | 8/8 PASS; w tym przerwanie odczytu przy zmianie konta |
| npm audit | 8 istniejących wpisów: 5 high, 3 moderate; bez nowych wpisów |

Raporty lokalne (ignorowane w Git): `artifacts/p31-build-all.log`,
`p31-tests.log`, `p31-backend-tests.log`, `p31-e2e.log`, `p31-private-e2e.log`, `e2e-results.json`,
`private-e2e-results.json`, `p31-npm-audit.json` i zrzuty w `private-e2e/`.
Eksport all najpierw trafił na odmowę zapisu Hermes do katalogu tymczasowego
sandboxa Windows; poza tym ograniczeniem zakończył się powodzeniem.
Audyt i granice analizy opisuje [DEPENDENCY-STATUS.md](DEPENDENCY-STATUS.md).

Niezależny przegląd znalazł i doprowadził do naprawienia trzech przypadków:
ponowienie uploadu po zmianie opisu wiąże jawnie aktualną wersję, wybór innego
zdjęcia zastępuje przerwany upload bez ominięcia limitu lub starej dzierżawy,
a definitywna odmowa dostępu czyści kontrolowany cache i prywatny widok.
Regresje obejmują obie kolejności wyścigu oraz zachowanie danych przy zwykłym
błędzie sieci. Odmowa dostępu nie jest traktowana jak przejściowy brak sieci.

## Historyczny etap częściowej konfiguracji — 2026-10-24, do 19:02 UTC

Poniższy zapis dokumentuje stan przed aktywacją Auth, Google i harmonogramu.
Aktualny wynik znajduje się w następnej sekcji.

- Free / Frankfurt, osobny projekt `ubranka-test`. Migracja `private_wardrobe`
  zastosowana jako wersja `20261024185902`; przed wdrożeniem tabele były puste.
  Pierwsze wywołanie narzędzia zwróciło błąd stanu żądania. Przed ponowieniem
  potwierdzono brak migracji/tabel, zamiast powtarzać migrację w ciemno.
- `wardrobe` i `wardrobe-cleanup`: ACTIVE, wersja 1. RLS wszystkich trzech
  tabel ON; bucket `wardrobe-private` ma public=false, limit 1 MB i JPEG.
  Dwa zaproszenia są w prywatnej bazie; brak użytkowników Auth i zdjęć.
- Poprawiono `USAGE` schematu public dla `supabase_auth_admin`, potrzebne do
  wywołania hooka. Test faktycznie przełącza rolę Auth. Po poprawce:
  TypeScript/ESLint PASS, backend 12/12 PASS, Deno 2.9.6 PASS.
- Hosted API, 19:02 UTC: **5/5 PASS** — brak JWT, brak sekretu cleanup,
  obcy Origin i anonimowe wywołania RPC użytkownika/administratora są odrzucane.
  Dowód lokalny: `artifacts/p31-hosted-anonymous.json`. Pierwsza próba testu
  miała błędną nazwę argumentu RPC (`p_account` zamiast `p_id`); poprawiono test
  i potwierdzono rzeczywistą odmowę uprawnienia 42501.
- Security Advisor: 2 WARN o świadomie udostępnionych authenticated funkcjach
  SECURITY DEFINER. Niezależny przegląd potwierdził: `wardrobe_execute` bierze
  tożsamość z JWT i sam sprawdza zaproszenie, właściciela, blokadę konta, CAS
  oraz limity; `wardrobe_is_active` wymaga własnego uid i zwraca bool.
  Obie mają pusty search_path. Funkcje administratora nie są dostępne authenticated.
  [Opis ostrzeżenia](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
  Performance Advisor zgłasza 3 nieużywane indeksy w nowej pustej bazie;
  pozostawiono indeksy potrzebne do właściciela i sprzątania.
  [Opis informacji](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
- Direct RPC może ominąć CORS i natychmiastową próbę cleanup w Edge; autoryzację
  i limity egzekwuje również SQL, a usuwanie czeka wtedy na cron. Zwykłe
  wylogowanie nie gwarantuje natychmiastowego unieważnienia wcześniej skopiowanego
  JWT. Blokada/usuwanie konta i cofnięcie zaproszenia są osobnymi bramkami danych.
- Auth/hook nie jest jeszcze aktywowany w ustawieniach. Brak sekretów Edge/Vault,
  crona, klienta Google i zmiennych Vercel. **Te wyniki nie dowodzą** logowania,
  izolacji dwóch prawdziwych sesji, Storage uploadu, eksportu ani fizycznego usuwania.
  Odbiór na telefonach pozostaje otwarty. Main pozostaje P2.1.

## Podgląd i odbiór chmury

### Konfiguracja i Google OAuth

- Oficjalne CLI 2.122.0 autoryzowane kodem przez właściciela na telefonie.
  Ustawiono Google provider, hook Before User Created, dokładny dev/local callback,
  sekrety Edge/Vault i cron. Końcowy `config diff`: zero zadeklarowanych różnic;
  sekret Google jest zamaskowany. Email/password i SMS są wyłączone, podobnie
  anonymous i manual linking. Testowe sesje email były przygotowane oddzielnie.
- Google Auth External/Testing: dwa wskazane test users, tylko email/profile/openid.
  Utworzono klienta WWW dla testowego Supabase. Plik klienta i wszystkie sekrety
  są lokalnie w ignorowanej konfiguracji, nie w repozytorium/EXPO_PUBLIC.
- Vercel Preview/dev otrzymał URL i nowoczesny publishable key. Pierwsze wdrożenie
  z konfiguracją: `dpl_EumKoPSrxfqCawVvHgR1AKaCTXga`, commit `9fcaee1`, READY.
  Na stałym adresie dev wykonano rzeczywisty Google account chooser → consent
  name/profile picture/email → callback → prywatna szafa właściciela (0 rzeczy).
  Wylogowanie usunęło prywatny widok. Konto Kasi i fizyczne telefony nie były testowane.
- Dowody lokalne: `artifacts/p31-google-login.png`, `p31-google-scopes.png`.
  Pełne CI `9fcaee1`: [SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40123667091).

### Błąd wykryty w chmurze i poprawka

Pierwszy `live.test.mjs` nie przeszedł odcięcia zdjęcia po deleteItem. SQL RLS
zwracał już zero obiektów, a bezpośredni authenticated Storage GET nadal zwracał
200 / CDN HIT z identycznym SHA-256 pliku, mimo `private,no-store`. Nowy URL z nonce
zwracał odmowę; nie oznacza to odwołania starego URL. Dotyczyło wyłącznie sztucznych
zdjęć testowych. Izolacja A/B nadal odrzucała drugie konto.

Poprawka: dodatkowa migracja `private_photo_edge_reads` usuwa Storage SELECT
użytkowników. POST `downloadPhoto` w Edge sprawdza JWT i dokładną aktywną ścieżkę
przez RLS użytkownika; dopiero potem pobiera bajty serwerowo i odpowiada bez cache.
Klient używa tej drogi dla miniaturek, zdjęć i eksportu. Osobne testy obejmują
odmowę przed odczytem uprzywilejowanym, błędne ścieżki/rozmiar i zmianę konta.
Niezależne przeglądy backendu i klienta: bez uwag blokujących. Pierwszy wynik
pozostaje FAIL; poniżej zapisano osobny retest poprawionego rozwiązania.

### Retest rzeczywistych usług po poprawce

- `live.test.mjs`: **30 kontroli PASS**. Dwie syntetyczne sesje mają oddzielne
  dane; odmowa zmiany cudzej rzeczy, CAS, rezerwacja/upload, zatwierdzenie zdjęcia,
  identyczne bajty zdjęć z Edge, odcięcie odczytu po usunięciu.
- Dodatkowe próby: main/thumb i SHA-256, brak bezpośredniego odczytu Storage
  przez właściciela/drugą osobę/anonima, także po rozgrzaniu cache przez serwer,
  inne endpointy i signed URL, odmowa uploadu z pominięciem serwera, staged photo,
  podmiana zdjęcia, cofnięcie zaproszenia, nieprawidłowe ścieżki i podszyty accountId.
- Idempotentny import i CAS dwóch sesji przeszły. Backend ignoruje obce
  identyfikatory własnych rzeczy przy imporcie demo.
- Konto testowe B usunięto fizycznie. Dla A o 19:54:52 UTC plik jeszcze istniał
  (admin GET 200, zgodny SHA-256), ale stary JWT miał Edge 404 i Storage 400.
  To dowód odebrania dostępu jeszcze przed usunięciem pliku, niezależny od cache.
  Naturalny cron o 20:00 UTC (run 5, request 6) odpowiedział HTTP 200,
  `pending:0, failed:0`. O 20:00:42 potwierdzono brak zdjęć A i Auth 404;
  końcowo dla A/B: puste trzy tabele, pusty Storage, odmowa exact main/thumb,
  stare JWT odrzucone. Usunięto oba syntetyczne zaproszenia i lokalne tokeny testowe.
- Dawne adresy fixture, które wykazały CDN HIT, po fizycznym usunięciu zwracały
  400/BYPASS, także z nonce; brak bajtów JPEG. To wynik dla sprawdzonych obiektów,
  nie ogólna gwarancja czasu czyszczenia CDN w planie Free.
- Po sesjach testowych ponownie wyłączono email/password; deklarowany Auth
  config diff = 0. Rzeczywiste konto właściciela pozostaje nienaruszone.
- Raport zawiera 90 zapisanych kontroli (w tym powyższe 30 z repozytorium).
  Lokalnie `artifacts/p31-hosted-report.json`, SHA-256:
  `1895D01C7AE531F81ABA440FC9BE80409DE28AF1000B78B5D1E9830B004DE665`.
  Dane wyłącznie syntetyczne; raport nie zawiera haseł, JWT ani adresów email.

### Finalna publikacja kodu i ograniczenia odbioru

- Kod aplikacji/Edge: `b063de5`; drobny jawny import Buffer w teście:
  `2cc3a0ec92a31dc514330ca513a2efce250663f5`. Końcowy check i eksport
  WWW/iOS/Android PASS. Lokalne logi: `p31-check-final.log`, `p31-build-all-final.log`.
- [CI 40127417984](https://github.com/loszavera/ubranka/actions/runs/40127417984):
  **SUCCESS** dla `2cc3a0e`, z testami domeny, backendu, Deno, eksportem
  wszystkich platform, regresją WWW i ośmioma scenariuszami prywatnego UI.
- Vercel `dpl_ErgZM7GMGy8wMrxcYH5DHDqNsFvk`: **READY**, source `2cc3a0e`,
  Preview/dev; stały adres: https://ubranka-git-dev-risk-every-asset.vercel.app.
  Końcowy commit dokumentacji nie zmienia aplikacji ani konfiguracji usług.
- Ponowne rzeczywiste Google login właściciela na finalnym kliencie: PASS.
  Ponowne otwarcie czystego adresu zachowało sesję i pustą szafę; końcowe
  wylogowanie PASS. Zrzut bez danych konta: `artifacts/p31-final-preview.png`.
  Dodatkowy upload przez automatyzację Chrome nie został ukończony: rozszerzenie
  wymaga uprawnienia do lokalnych plików. Formularz anulowano bez zapisu.
  To ograniczenie narzędzia testowego; nie przedstawiamy realnego przepływu
  przeglądarka → wybór pliku → chmura jako zaliczonego. Osobno zaliczono
  rzeczywiste API zdjęć oraz UI z przechwyconymi odpowiedziami usług.
- Odbiór Kasi i obu telefonów pozostaje otwarty. Instrukcja:
  [P31-ACCEPTANCE.md](P31-ACCEPTANCE.md). Main nadal `270359f` / P2.1.

### Historyczny podgląd bez konfiguracji

Podgląd docelowy: https://ubranka-git-dev-risk-every-asset.vercel.app.
Kod opublikowano na dev w `a9ec29aefcaecd543e2959cfaacf805982833608`.
Vercel `dpl_DwRjKYjq8fJwcf429RC3FmKhd2vk`: READY.
Kontrola online 18:06:17 UTC: PASS, HTTP 200, zero błędów JavaScript.
Sprawdzono parę weselną/opinię w demo, prywatny ekran PL/EN, nieaktywne logowanie
bez konfiguracji, brak żądań do Supabase oraz zachowanie danych demo po powrocie
i przeładowaniu. Dowód: `artifacts/p31-vercel-verification.json` i zrzut
`p31-vercel-unconfigured-pl.png`. Pierwsze dwie próby skorygowały błędne założenia
testu: przycisk logowania jest nieaktywny, nie ukryty; JSON porównujemy jako dane,
nie tekst z ustaloną kolejnością pól. Aplikacja nie wymagała zmiany.

CI: [run 40119015249](https://github.com/loszavera/ubranka/actions/runs/40119015249)
dla tego samego commita: **SUCCESS**, w tym 15/15 scenariuszy WWW i 7/7 prywatnego
UI na Ubuntu/Chromium. Uruchomiony przez workflow_dispatch, ponieważ push
nie utworzył run. Kolejny commit zapisuje wyłącznie niniejszy raport/status,
bez zmiany aplikacji, testów, zależności lub konfiguracji wdrożenia.
Main pozostaje odebranym P2.1, commit `270359f128a928aa7459cba623f890d7e1093b8b`.

Do odbioru użytkowników pozostają Google OAuth Kasi i praca na fizycznych
telefonach: odczyt tej samej szafy na drugim urządzeniu, dodanie/przygotowanie
zdjęcia z galerii i aparatu, eksport oraz usunięcie. Safari iPhone/Chrome Android
oraz natywne development buildy nie były testowane. W dev używamy danych
syntetycznych; rzeczywiste zdjęcia należą do osobnego środowiska pilotażu po odbiorze.
P3.2/P3.3, sklepy, wizualizacja AI i nowe abonamenty pozostają poza zakresem.
