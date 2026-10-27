# P3.3C2 — realizacja i weryfikacja

Aktualizacja: 2026-10-27. **Integracja wdrożona i sprawdzona; C2 nieaktywne.**

## Upoważnienie i granice

Użytkownik zatwierdził [plan V1.9](IMPLEMENTATION-PLAN-V1.9.md),
[koszty V1.8](COST-PLAN-V1.8.md) oraz [zasady AI V1.2](P33-AI-DATA-POLICY-V1.2.md):
30 dni, 25 PLN łącznie, maks. 60 wysłań / 30 na konto / 5 na konto na dobę UTC,
bez ponowień i płatnych testów operatora. Jawnie przyjął ryzyko przekroczenia
rezerwy i budżetu przez już przyjęte żądanie.

Finansowanie wyłącznie istniejącymi kredytami. Zatwierdzono wyłączenie auto-reload
całej organizacji OpenAI i pozostawienie OFF po C2, bez nowych wpłat/abonamentów.
Osobny ograniczony klucz tylko w sekretach Supabase, z potwierdzonym wygaśnięciem
najpóźniej z końcem pilotażu. Każdy uczestnik sam zatwierdza własne wejścia w UI.
Operator nie otwiera i nie przesyła prywatnych zdjęć uczestników do AI.

## Bieżący stan

- Punkt startowy: czysty dev `19159d7`; C1 odebrane.
- Integracja klienta, backendu i workera zakończona. Migracja C2 i cztery Edge
  Functions wdrożone przy OFF; osobny helper przygotowuje kopie JPEG bez AI.
- Finansowanie: 2026-10-26 wyłączono auto-reload całej organizacji i potwierdzono
  widoczny stan OFF. Kredyty były dostępne; bez wpłat i zmian abonamentów.
- Testy lokalne, API i hosted UI zakończone; klucz i aktywacja oczekują.
- Płatne wywołania operatora w C2: 0. Zgoda B pozostaje wyczerpana.
- Potwierdzone urządzenia Aleksego: Chrome na PC i Androidzie. Urządzenie/
  przeglądarka Kasi: iPhone/Safari (odpowiedź użytkownika 2026-10-26). To zakres
  użycia pilotażu, nie wykonany przez agenta test na fizycznym urządzeniu.
- Kasia potwierdziła osobiste logowanie Google i widok prywatnej szafy.
  Kontrola Auth/zaproszeń potwierdziła oba aktywne konta; bez odczytu ich zdjęć.

## Dowody przed aktywacją

- `check`, `check:backend`: PASS; klient 88/88, backend 123/123, kodeki 12/12,
  E2E demo 15/15, prywatne E2E 39/39. Razem 277 testów, bez pominięć.
  Kontrolowany transport modelu nie jest dowodem płatnej generacji C2.
- `check:dependencies`, Expo Doctor 21/21 i `build:all`: PASS. Trzy eksporty
  to kontrola kompilacji, nie test fizycznego iOS/Android. Finalne pakiety mają
  właściwy projekt Supabase i nie zawierają konfiguracji syntetycznej.
- Rzeczywiste API: 29/29 kontroli na dwóch świeżych kontach syntetycznych.
  Przygotowanie i dokładny hash ośmiu kopii, brak cache, cudzy dostęp odrzucony,
  generowanie OFF, bezpośredni dostęp do helpera/workera odrzucony, B zamknięte.
- Hosted SQL: dziewięć kontroli aktywacji, zgód, hashy, jednorazowej rezerwacji,
  zajętości, 60/30/5 i budżetów w jednej transakcji zakończonej `ROLLBACK`.
  Stan końcowy: runtime OFF, C prepared, zero uczestników/prób/rezerw;
  dotychczasowe B i miesiąc zachowują 149 groszy i identyczny skrót rozliczeń.
- Osobna syntetyczna rezerwacja bez wysłania została zwolniona i usunięta.
  Nowy test nakładania transakcji nie dostarczył dowodu: kanał MCP zwrócił
  wygasły requestState. Dotychczasowy test współbieżności C1 dotyczy tego samego,
  niezmienionego `c_reserve_core`; nie oznaczamy nowego overlap jako PASS.
- Helper kopiowania: cztery rzeczywiste żądania na sztucznym obrazie 1066×1600
  dały identyczny JPEG 1023×1536 / 904427 B. Round-trip 1194–2150 ms, bez AI.
  Pojedyncze zdjęcie ma osobną invokację, aby nie sumować CPU czterech dekodowań.
  Lokalny pomiar do 1,141 s CPU / 214,5 MB RSS nie jest pomiarem zasobów chmury.
- Niezależny przegląd klienta/backendu/workera: bez blokujących ustaleń.
  Doradca Supabase: 9 informacji o celowym RLS bez polityk w prywatnym schemacie,
  3 wcześniejsze ostrzeżenia o kontrolowanych funkcjach SECURITY DEFINER i
  ostrzeżenie ochrony haseł (aplikacja korzysta z Google OAuth).
  [RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
  [SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
  [ochrona haseł](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Prywatne dowody operacyjne pozostają w ignorowanych `.local/` i `artifacts/`.
Nie publikujemy identyfikatorów uczestników, sesji ani ich zdjęć.

## Publikacja i końcowy hosted UI

- Kod `9677fffdf31ba1e5ad7489f45382a1b478189920` opublikowany atomowo,
  bez force push, na dev/main; potwierdzono równość lokalnych i zdalnych refów.
- [CI 40404830064](https://github.com/loszavera/ubranka/actions/runs/40404830064)
  SUCCESS. Vercel Production `dpl_CUKiPX1pxJhtK1M3zcSoRCzrdFc1` READY;
  główny adres [ubranka.vercel.app](https://ubranka.vercel.app).
- Produkcyjny pakiet `entry-51186fec2991421890e94de7467d3bba.js`:
  SHA-256 `2fd9652ee4ab9d979220e65a206072a9c168e11aaee5b37a6b76a6bcd57279ab`.
  Linux/Vercel i Windows mają inne nazwy pakietów; potwierdzono poprawny ref
  Supabase, obecność C2 i brak konfiguracji testowej w rzeczywistej produkcji.
- Hosted UI **30/30 PASS**: dwa świeże konta syntetyczne, PL/EN przy 320/390/1440 px,
  12 zrzutów. 16 odczytów kopii JPEG potwierdzonych po bajtach/hashu/no-store;
  cztery kompletne podglądy renderowały kopie zgodne z manifestami serwera.
  Zgody niezaznaczone i zablokowane przy OFF, zero POST generacji, zero
  zaakceptowanych zgód wysłania w UI i zero lokalnych receipt.
- Faktyczne aktywne odczyty przeglądarki: maks. 2 na konto. Transport diagnostyczny
  dokańczał wcześniej anulowane odczyty (maks. 4); nie utożsamiamy obu pomiarów.
  Poprawiono tylko selektory testu: ikona SVG nie jest zdjęciem wejściowym.
  Nie było potrzeby zmiany aplikacji ani płatnych prób.
- Testowy consent wycofano zwykłym API, zachowując przyrost rewizji; żadnych resetów.
  Usunięcie obu syntetycznych kont zwykłą ścieżką aplikacji zakończyło się fizycznym
  usunięciem Auth, rekordów, wejść, intentów i plików Storage. Zaproszenia i lokalne
  sesje również usunięte. Nie uruchamiano ręcznie globalnego cleanupu.
- Odczyt końcowy 2026-10-27 02:50 UTC: C OFF/prepared, zero uczestników i prób,
  zero rezerw; B zamknięte, 149 gr i identyczny skrót historycznych rozliczeń.

## Pozostały krok operacyjny

Formularz osobnego klucza projektu Ubranka przygotowano: Restricted,
wyłącznie Images Request, ważność 30 dni. **Klucz nie został utworzony ani
zapisany w Supabase.** Narzędzie obsługi przeglądarki wymaga potwierdzenia
w chwili utworzenia nowego trwałego dostępu, także po wcześniejszym upoważnieniu.
Nie jest to ponowne zatwierdzanie zakresu C2.

Po tym potwierdzeniu: zapisać klucz wyłącznie w sekretach Supabase, sprawdzić
rzeczywisty termin wygaśnięcia i aktualne finansowanie, następnie jednokrotnie
aktywować dwa zatwierdzone konta zgodnie z V1.9. Pierwsze płatne wywołanie
wykonuje uczestnik własnym kliknięciem w aplikacji. Do tego czasu AI OFF.

## Zakończenie

Po terminie/limicie serwer blokuje nowe wysłania, a przyjęte zlecenie nadal
podlega rozliczeniu. Kontrola końcowa potwierdzi OFF, unieważnienie klucza,
usunięcie sekretu i zbiorczy raport. Tych czynności nie uznajemy za wykonane
na podstawie samego upływu daty. Zatrzymanie przed D.
