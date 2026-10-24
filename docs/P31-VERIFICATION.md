# P3.1 — weryfikacja implementacji

Data: 2026-10-24. Gałąź dev. **To odbiór kodu i testów lokalnych, nie potwierdzenie
uruchomionej usługi prywatnej szafy.** Podstawowe wdrożenie Supabase potwierdzono;
ustawienia Auth/sekretów, Google OAuth i testy
prawdziwych kont pozostają do dokończenia: [P31-SETUP.md](P31-SETUP.md).

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
| SQL/RLS/protokół/cleanup (`test:backend`) | 12/12 PASS; dodatkowy test roli Auth hook |
| Deno 2.9.6, dwie Edge Functions | PASS |
| Expo SDK dependency check | PASS |
| Expo Doctor | 21/21 PASS |
| Eksport WWW, Android, iOS | PASS; nie zastępuje testów fizycznych urządzeń |
| Regresja WWW P2/P2.1 + zdjęcia (Edge) | 15/15 PASS |
| Prywatna szafa WWW (Edge, syntetyczne API) | 7/7 PASS |
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

## Częściowe wdrożenie Supabase — 2026-10-24

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

Do potwierdzenia na osobnym projekcie Free i danych sztucznych:
Google OAuth dwóch osób, odmowa trzeciej osoby, realny Storage/RLS, odczyt
na drugim urządzeniu, konflikt dwóch sesji, eksport, usunięcie plików/Auth
i działanie harmonogramu. Safari iPhone/Chrome Android oraz natywne development
buildy nie były testowane. Realne zdjęcia dopiero po odbiorze tego przepływu.
P3.2/P3.3, sklepy, wizualizacja AI i nowe abonamenty pozostają poza zakresem.
