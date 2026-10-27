# P3.3C2 — realizacja i weryfikacja

Aktualizacja: 2026-10-27. **C2 aktywne dla dwóch zatwierdzonych kont.**
Start: 2026-10-27 09:31:20 UTC; koniec: 2026-11-26 09:31:20 UTC
(10:31 czasu polskiego). Płatne testy operatora: 0.

## Upoważnienie i granice

Użytkownik zatwierdził [plan V1.9](IMPLEMENTATION-PLAN-V1.9.md),
[koszty V1.8](COST-PLAN-V1.8.md) oraz [zasady AI V1.2](P33-AI-DATA-POLICY-V1.2.md):
30 dni, 25 PLN łącznie, maks. 60 wysłań / 30 na konto / 5 na konto na dobę UTC,
bez ponowień i płatnych testów operatora. Jawnie przyjął ryzyko przekroczenia
rezerwy i budżetu przez już przyjęte żądanie.

Finansowanie wyłącznie istniejącymi kredytami. Zatwierdzono wyłączenie auto-reload
całej organizacji OpenAI i pozostawienie OFF po C2, bez nowych wpłat/abonamentów.
Osobny ograniczony klucz tylko w sekretach Supabase. 2026-10-27 właściciel
zmienił ważność na bezterminową i potwierdził utworzenie teraz oraz aktywację.
[Plan V1.10](IMPLEMENTATION-PLAN-V1.10.md) zapisuje tę zmianę warunku TTL V1.9;
limity pilotażu pozostają bez zmian. Każdy uczestnik sam zatwierdza własne wejścia w UI.
Operator nie otwiera i nie przesyła prywatnych zdjęć uczestników do AI.

## Bieżący stan

- Punkt startowy: czysty dev `19159d7`; C1 odebrane.
- Integracja klienta, backendu i workera zakończona. Migracja C2 i cztery Edge
  Functions wdrożone przy OFF; osobny helper przygotowuje kopie JPEG bez AI.
- Finansowanie: 2026-10-26 wyłączono auto-reload całej organizacji i potwierdzono
  widoczny stan OFF. Kredyty były dostępne; bez wpłat i zmian abonamentów.
- Testy lokalne, API i hosted UI zakończone. Stan klucza i aktywacji poniżej.
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

## Klucz i zmiana warunku TTL — 2026-10-27

Po jawnym potwierdzeniu właściciela utworzono osobny klucz projektu Ubranka:
Restricted, jedna zgoda Images Request, ważność Never. Zapis w sekrecie
`UBRANKA_P33C_OPENAI_KEY` potwierdzono 02:57:56 UTC. Wartość przeniesiono
bezpośrednio do Supabase; bez lokalnego pliku, Git i Vercel. Nie użyto klucza
P3.2/B, nie wykonano żądania modelu. Metadane konta i klucza są poza repo.

Nowa migracja rozdziela ważność klucza u dostawcy i skończony termin używania
go przez aplikację. Aktywacja NON_EXPIRING wymaga jawnej zgody zamiast
fałszywego potwierdzenia wygaśnięcia; termin serwerowy to dokładnie 30 dni.
Bezpłatne testy backendu po zmianie: **129/129 PASS**, w tym sześć dodatkowych
testów bramek, uprawnień, terminów, braku reopen/reset i starej ścieżki EXPIRING.
Typy/lint PASS, niezależny przegląd migracji i testów bez blokerów.
Migrację wdrożono w transakcji przez SQL Editor wraz z wpisem historii,
po dwóch błędach requestState wtyczki i potwierdzeniu braku wcześniejszego
wdrożenia. Odczyt bazy: migracja obecna, runtime OFF, C prepared, zero
uczestników/prób; anon/authenticated/service_role nie mogą aktywować C.

Ponownie odczytano panel OpenAI: finansowanie dostępne, auto-reload OFF,
limit projektu egzekwowany, udostępnianie danych do ulepszania modeli wyłączone.
Stawki i snapshot modelu potwierdzone w [dokumentacji OpenAI](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare).
Bez nowych wpłat i abonamentów. Pierwsze płatne wywołanie nadal należy
wyłącznie do świadomego kliknięcia uczestnika.

## Aktywacja i publikacja — 2026-10-27

- Kod migracji `51f6d1f` i dokumentacja `d6b9947` opublikowane na dev/main,
  z potwierdzeniem równości czterech lokalnych/zdalnych refów. Pełne
  [CI 40480768484](https://github.com/loszavera/ubranka/actions/runs/40480768484)
  **SUCCESS**: wszystkie kontrole kodu, 129 testów backendu, eksporty i E2E.
- Vercel Production `dpl_6SSM78KLpoB2dKB2GjmhQrGGK2ok` **READY**, alias
  [ubranka.vercel.app](https://ubranka.vercel.app). Weryfikacja HTTP 09:28 UTC:
  pakiet WWW ma identyczny SHA-256 jak wcześniej sprawdzony w 30 kontrolach UI;
  poprawny projekt Supabase, bez zmian kodu klienta i sekretu w publicznym pakiecie.
- Free Supabase bez przekroczeń w odczytanym panelu: baza 28,63 MB/0,5 GB,
  transfer 0,12/5 GB, Edge 1643/500000, Storage poniżej 1% limitu 1 GB.
  Statystyki mają opóźnienie, nie są gwarancją przyszłego zużycia. Harmonogram
  cleanup aktywny co 10 minut, ostatnie wykonanie zakończone sukcesem.
- Jednokrotne `c_activate_nonexpiring` zakończyło się sukcesem o
  **2026-10-27 09:31:20.494750 UTC**. Koniec i termin użycia przez aplikację:
  **2026-11-26 09:31:20.494750 UTC** — dokładnie 30 dni. Nie ma odnowienia.
- Odczyt po aktywacji: runtime ON, C active/unblocked, dwa właściwe konta
  dopuszczone, wszystkie pięć bramek prawdziwych. `NON_EXPIRING`, rzeczywisty
  termin dostawcy NULL; nie zapisano fikcyjnego `keyExpiryVerified`.
- Stan startowy C2: **0 wysłań / 0 PLN / 0 rezerw**. Limit C 25 PLN,
  wspólny miesiąc 25 PLN z zachowanym kosztem B 1,49 PLN — dostępne teraz
  w miesiącu 23,51 PLN. B nadal zamknięte, sześć zużytych slotów i niezmieniony
  skrót rozliczeń. Nie zresetowano kosztów ani historii.
- Zasady AI V1.2 i osobiste potwierdzenie pozostają wymagane w aplikacji.
  Operator nie odczytał zdjęć uczestników, nie akceptował zgód za nich i nie
  wysłał żądania modelu. Konfiguracja klucza jest potwierdzona w panelu;
  jego działanie w płatnym żądaniu C2 nie zostało sprawdzone przez operatora.
- Przegląd dokumentacji: 11 plików UTF-8, 144 lokalne odnośniki PASS.
  Receipt i metadane operacyjne zapisano poza Git. Końcowa aktualizacja
  dokumentacyjna nie zmienia wdrożonego kodu aplikacji.

Następny krok: uczestnik odświeża aplikację, wybiera zapisany zestaw i własne
wejścia, osobiście potwierdza zasady/podgląd i wysyła jedną wizualizację.
W razie błędu przekazuje komunikat i godzinę, bez ponawiania operacji.

## Zakończenie

Po terminie/limicie serwer blokuje nowe wysłania, a przyjęte zlecenie nadal
podlega rozliczeniu. Kontrola końcowa potwierdzi OFF, unieważnienie klucza,
usunięcie sekretu i zbiorczy raport. Tych czynności nie uznajemy za wykonane
na podstawie samego upływu daty. Klucz Never pozostaje ważny u dostawcy aż
do odrębnego unieważnienia. Nie utworzono automatyzacji Codex ani klucza
administracyjnego do odwoływania dostępu. Zatrzymanie przed D.
