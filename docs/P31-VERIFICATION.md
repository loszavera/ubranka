# P3.1 — weryfikacja implementacji

Data: 2026-10-24. Gałąź dev. **To odbiór kodu i testów lokalnych, nie potwierdzenie
uruchomionej usługi prywatnej szafy.** Dostęp Supabase, Google OAuth i testy
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
| Testy domeny, zdjęć i klienta (`npm test`) | 32/32 PASS; końcowa regresja po przeglądzie w toku |
| SQL/RLS/protokół/cleanup (`test:backend`) | 10/10 PASS; dodatkowa regresja zastąpienia przerwanego uploadu w integracji |
| Deno 2.9.6, dwie Edge Functions | PASS |
| Expo SDK dependency check | PASS |
| Expo Doctor | 21/21 PASS |
| Eksport WWW, Android, iOS | PASS; nie zastępuje testów fizycznych urządzeń |
| Regresja WWW P2/P2.1 + zdjęcia (Edge) | 15/15 PASS |
| Prywatna szafa WWW (Edge, syntetyczne API) | 7/7 PASS |
| npm audit | 8 istniejących wpisów: 5 high, 3 moderate; bez nowych wpisów |

Raporty lokalne (ignorowane w Git): `artifacts/p31-build-all.log`,
`p31-e2e.log`, `p31-private-e2e.log`, `e2e-results.json`,
`private-e2e-results.json`, `p31-npm-audit.json` i zrzuty w `private-e2e/`.
Eksport all najpierw trafił na odmowę zapisu Hermes do katalogu tymczasowego
sandboxa Windows; poza tym ograniczeniem zakończył się powodzeniem.
Audyt i granice analizy opisuje [DEPENDENCY-STATUS.md](DEPENDENCY-STATUS.md).

## Podgląd i odbiór chmury

Podgląd docelowy: https://ubranka-git-dev-risk-every-asset.vercel.app.
Publikacja końcowego kodu i wynik CI zostaną zapisane po weryfikacji wdrożenia.
Main pozostaje odebranym P2.1, commit `270359f128a928aa7459cba623f890d7e1093b8b`.

Do potwierdzenia na osobnym projekcie Free i danych sztucznych:
Google OAuth dwóch osób, odmowa trzeciej osoby, realny Storage/RLS, odczyt
na drugim urządzeniu, konflikt dwóch sesji, eksport, usunięcie plików/Auth
i działanie harmonogramu. Safari iPhone/Chrome Android oraz natywne development
buildy nie były testowane. Realne zdjęcia dopiero po odbiorze tego przepływu.
P3.2/P3.3, sklepy, wizualizacja AI i nowe abonamenty pozostają poza zakresem.
