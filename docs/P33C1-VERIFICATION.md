# P3.3C1 — przygotowanie prywatnych wizualizacji

Data: 2026-10-26. Zakres zatwierdzony według [planu V1.8](IMPLEMENTATION-PLAN-V1.8.md).
**C1 wykonane, opublikowane na main i zaakceptowane przez Kasię i Aleksego (2026-10-26).**
C2 nie jest uruchomione.

## Zakres i granice

Większe miniatury, pełny podgląd na żądanie, przygotowanie konkretnych wejść,
wersjonowana zgoda, odrębny nieaktywny pilotaż C, kontrola limitów i usuwanie.
Testy używają fikcyjnych dorosłych i dwóch świeżych kont syntetycznych.
**Zero nowych wywołań AI i kosztu API, bez klucza AI w chmurze i nowych usług.**
Nie odczytywano zdjęć użytkowników w ramach kontroli. B pozostaje zamknięte;
sześć zużytych slotów i jego rozliczenie nie są budżetem C.

## Czytelność

Oryginały PNG 1024×1536 zachowują bajty i SHA-256. Miniatury mają limit
100 000 B. Skończony dobór: 600×900 JPEG q82, q65, następnie 450×675 q65;
awaryjnie mały PNG. Algorytm nie wywołuje AI. Szczegóły i licencje:
[kodek](P33C1-CODEC.md), [noty](../THIRD-PARTY-NOTICES.md).

| Zachowany wynik B | Stary PNG 120×180 (B) | Nowy JPEG 600×900 (B) |
| --- | ---: | ---: |
| B01 | 33 351 | 45 159 |
| B02 | 31 231 | 42 226 |
| B03 | 32 061 | 44 841 |
| B04 | 31 364 | 43 179 |
| B05 | 35 575 | 49 011 |
| B06 | 31 088 | 42 698 |

Wszystkie sześć uzyskało q82 w pierwszym kroku; łącznie 267 114 B.
Ocena wzrokowa porównań: czytelniejsze twarze, kontury i materiał, bez zmiany
kadru/kolorów. Publiczne porównanie `/p33c1/` korzysta wyłącznie z istniejących
obrazów syntetycznych. Jego duży podgląd to już publiczny WebP z galerii B.
Prywatny podgląd aplikacji pobiera autoryzowany oryginalny PNG; to osobna ścieżka.
Galeria `/p33b/`, jej manifesty i obrazy pozostają niezmienione.

Lokalne porównanie: 8 kombinacji PL/EN, 390/1440 px i DPR 1/2 PASS; bez
poziomego przewijania, z pełnym obrazem pobieranym dopiero po otwarciu.
Zrzuty i hashe: `artifacts/p33c1-gallery/`, `p33c1-gallery-local.json`.

## Kodek w rzeczywistym Edge

2026-10-26 09:52:07–09:52:25 UTC: dziewięć bezpłatnych wywołań samego
dekodera we Frankfurcie, bez jobów, Storage, klucza OpenAI i dostawcy AI.
Sześć zachowanych PNG B, szum RGBA oraz graniczny PNG 8 000 000 B i jego
odpowiednik JSON 10 666 814 B. **9/9 HTTP 200**, każda miniatura ≤100 kB.

Przetworzenie B: 180–245 ms. Szum: 471 ms i awaryjny PNG 56 320 B;
graniczny RGBA: JPEG 450×675, 97 864 B po trzech próbach. Parsowanie JSON
z kodekiem: 391 ms. Różnica round-trip obejmuje upload i sieć, nie jest czasem CPU.
W siedmiu zakończonych instancjach runtime CPU wynosiło 255–768 ms; wszystkie
zakończyły się `EarlyDrop`, bez błędu limitu CPU/pamięci. Pamięć raportowana przy
zamknięciu wynosiła 11,6–22,3 MB: **to nie pomiar szczytowego RAM**. Udane
przetworzenie obciążeń w Edge oraz lokalny benchmark nie gwarantują każdego
możliwego obrazu. Płatna integracja C nie była uruchamiana.

Przegląd wykrył i naprawił nadmierną paletę PLTE oraz kolorowe obwódki alpha w
awaryjnym PNG. Regresje odtworzono przed poprawką; po niej 8/8 testów kodeka PASS.
Źródła dowodów lokalnych: `artifacts/p33c1-edge-probes.json` oraz benchmark
w worktree kodeka. Limity i dekoder mają odmowę przed nadmierną alokacją;
błąd miniatury nie inicjuje ponownego żądania AI.

## Klient i kontrola danych

Historia ładuje widoczne miniatury, maksymalnie dwa odczyty naraz. Wyjście poza
widok zwalnia obraz; logout, zmiana konta i usunięcie anulują pobieranie.
„Powiększ” otwiera oryginał z zachowaniem proporcji; można pobrać PNG.
Nowy JPEG i starszy PNG mają jawny kontrakt MIME, wymiarów i rozmiaru.

Przygotowanie pokazuje zdjęcie sylwetki i 1–3 rzeczy z konkretnego zestawu.
Zgoda jest niezaznaczona, a wysłanie w C1 niedostępne. Receipt jest związany
z projektem, kontem, trialem i UUID; utrata odpowiedzi pozwala tylko odczytać
stan. Nie ma automatycznych ponowień. „Usuń wyniki AI” zachowuje szafę i sylwetkę.

Prywatne E2E: 31/31 PASS, w tym 7 scenariuszy C1 i 24 regresje; testy klienta
82/82 PASS. To kontrolowane odpowiedzi usług i dane syntetyczne, nie dowód
działania rzeczywistego OpenAI. PL 390 px oraz EN 320/390 px oceniono wzrokowo.

## Kontrole końcowe

Testy zintegrowane: typy/lint PASS; 82 testy klienta, 97 backendu, 8 kodeka,
15 E2E demo i 31 prywatnych E2E PASS. `build:all` obejmuje WWW/iOS/Android;
zgodność zależności PASS, Expo Doctor 21/21. CI dla kodu
`a03188876a27f49e250673e71849580f52d67504`:
[40345096974 — SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40345096974).
Użyto jednego `workflow_dispatch`, bez zmiany ustawień Actions.

Po poprawce retencji pełne CI powtórzono dla końcowego kodu
`b6363ec68879999ffac1d245e22003b6fd4137d7`:
[40364002496 — SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40364002496).
Wszystkie kroki, łącznie z 233 testami, kontrolą Deno, eksportem trzech platform
i oboma zestawami E2E, przeszły. Jeden dispatch dla tej poprawki; bez zmiany
ustawień usług. Późniejszy commit aktualizuje wyłącznie dokumentację wykonania.

Migracja `private_visualization_c1` wdrożona jako `20261026113435`.
Funkcje: wardrobe v10, cleanup v9, worker v8. Bez nowego projektu/usługi.
Prywatna konfiguracja `p33c-v1` jest nieaktywna; daty i przypisanie uczestników
pozostają do C2. Mechanizm dopuszcza maksymalnie dwa sloty uczestników.
Publiczne ścieżki C mają hard OFF; dawne wejścia B straciły uprawnienia
`service_role`. Rozliczenie starego zlecenia nie jest nowym wysłaniem.

Kontrole rzeczywistego Supabase:

- 12 podstawowych i 10 dodatkowych kontroli: odmowa generacji przez Edge,
  worker i bezpośrednie RPC A/B/C; brak obejścia przez zgodę lub `service_role`;
  cudzy zestaw/job/obraz niedostępny, bezpośredni Storage i signed URL odmawiają.
- Dwie niezależne transakcje SQL w odrębnym trialu syntetycznym: odczyt
  `pg_blocking_pids()` potwierdził waiter z jednym blokującym procesem. Po COMMIT
  pierwszej drugi czekał 9298 ms i zakończył się `AI_BUSY`. Obie transakcje
  zatwierdzono; powstała jedna rezerwacja 23,51 PLN i zero znaczników wysłania.
  Publiczny przełącznik pozostał OFF. Rezerwę zwolniono, fixture trial usunięto;
  B i wspólny miesiąc zachowały 149 groszy i zero rezerw.
- Dwa zachowane B01 wgrano jako jawne syntetyczne próbki odczytu, bez próby AI,
  `c_attempts`, znaczników wysłania i zapisów kosztu. 16 kontroli manifestu,
  hashy oryginału/miniatury, właściciela, eksportu i wycofania zgody PASS.
- Zapis opinii nie unieważnił prawidłowego wyniku. Usunięcie wejścia i wygaśnięcie
  blokowały odczyt. Usunięcie wyników zachowało sylwetkę i szafę obu kont.

Vercel Production `dpl_3eU8K447Zb7T4hymo4J2tBePY3Aa`: READY dla powyższego SHA,
alias [ubranka.vercel.app](https://ubranka.vercel.app). Lokalne/zdalne main i dev
były równe po atomowym, zachowującym historię push.
Hosted galeria: 8/8 kombinacji PL/EN, 390/1440 px, DPR 1/2 PASS.
Hosted aplikacja: oba konta, PL/EN, 320/390/1440 px — **12 widoków PASS**.
Pełny PNG i ZIP miały hash B01, miniatury JPEG 600×900, maks. dwa aktywne
pobrania, ekran dokładnych czterech wejść, zgoda/wysłanie wyłączone, reload,
wylogowanie i zwolnienie Blob PASS. Język obu fixture przywrócono.
Zero błędów i prób wysłania do OpenAI. Zrzuty przejrzano wzrokowo.

Pierwszy pomocnik hosted zbyt wcześnie sprawdzał wyczyszczenie sesji oraz liczył
anulowane pobrania nadal kończone przez proxy Playwright. Poprawiono wyłącznie
pomiar i oczekiwanie; ponowny test obu kont przeszedł. Nie zmieniano aplikacji
na podstawie tego fałszywego alarmu. Dowód: `artifacts/p33c1-ui/report.json`,
pierwotny wynik zachowano oddzielnie.

Test sprzątania wykrył rzeczywistą różnicę hostingu: rozszerzenie Supabase
odrzuca `UPDATE` bez `WHERE`. Archiwizacja liczników powodowała przez to rollback
procedury retencji i zatrzymanie fizycznego cleanupu; dostęp do danych był już
zablokowany. Poprawka `b6363ec68879999ffac1d245e22003b6fd4137d7` ogranicza
aktualizację do kwalifikujących się rekordów. Wdrożona migracja `20261026165536`
(`targeted_c_member_retention`) zachowuje dotychczasowe sumy i granice retencji.
Test 20/20 PASS: dokładnie jeden kwalifikujący się licznik zostaje zmieniony,
a kolejne sprzątanie nie aktualizuje żadnego licznika. Niezależny przegląd PASS.
Ochrona bazy pozostaje włączona; nie uruchamiano globalnego cleanupu ręcznie.
Końcowy dowód fizycznego usunięcia pochodzi z istniejącego cron co 10 minut.

Aktualizacja 17:00:39 UTC: zwykły cron zakończył usuwanie. Dla obu dokładnie
wskazanych kont syntetycznych jest **0 Auth, kont, rzeczy, zdjęć, profili sylwetki,
zapisów stylizacji, jobów, manifestów wyników, intentów, zgód i obiektów Storage**.
Usunięto wszystkie 20 plików. Następnie usunięto wyłącznie dwa zaproszenia i pusty
trial fixture; lokalny plik sesji nie istnieje. Dowód lokalny:
`artifacts/p33c1-final-cleanup.json`. Nie wykonywano ręcznego globalnego cleanupu.

Końcowy odczyt rozliczeń: B zamknięte, 6/6 slotów nadal zużytych,
214 403 mikro-USD / 149 groszy, zero nierozliczonych wysłań i rezerw.
Skrót finansowy B `beba2b0c1e20d9f86089f29fe09bd6c4` pozostał identyczny.
Wspólny miesiąc nadal ma 149 groszy i zero rezerw. C: `prepared`, brak dat,
uczestników i prób; `ai_enabled=false`, `c_enabled=false`, globalna blokada ON.
Nowy koszt API C1: **0 PLN**.

Końcowy runtime `b6363ec` jest na main/dev. Vercel Production
`dpl_ACxjCmCoL19MjHvFh7wwyB7sAbQk` READY, alias główny potwierdzony.
Poprawka dotyczy wyłącznie SQL/testu; kod UI i galeria są identyczne z
przetestowanym `a031888`. Odnośniki odbioru:
[aplikacja](https://ubranka.vercel.app),
[porównanie miniatur](https://ubranka.vercel.app/p33c1/).

Advisor: siedem prywatnych tabel z RLS bez polityk to celowy brak bezpośredniego
dostępu; trzy funkcje SECURITY DEFINER mają kontrolę właściciela i zostały
sprawdzone. Istniejące ostrzeżenie o ochronie haseł pozostaje przy Google OAuth;
nie uruchomiono dodatkowej usługi. Kontrola nazw sekretów 15:08:37 UTC:
zero sekretów AI. Nie odczytywano ich wartości.

## Ograniczenia i odbiór

Brak nowych generacji i przesyłania prywatnych zdjęć do AI. C1 nie dowodzi
jakości płatnej integracji C2 ani dopasowania rozmiaru. Agent nie wykonał testu na
fizycznym iOS/Android; eksport JS i emulacja DPR nie zastępują urządzenia.
Przed C2 konieczny jest test urządzeń rzeczywiście używanych przez uczestników.

Kasia i Aleksy następnie potwierdzili przetestowanie i akceptację C1.
Później Aleksy doprecyzował (2026-10-26): **Chrome na PC oraz Chrome na Androidzie**.
To test wersji WWW przez użytkownika. Nie podano modelu urządzenia, wersji
przeglądarki, systemu PC ani konkretnych scenariuszy. Urządzenie/przeglądarka
Kasi pozostają niepodane; nie jest to test aplikacji natywnej ani potwierdzenie iOS.
Zlecili wyłącznie końcową propozycję C2, bez aktywacji,
płatnych wywołań i prywatnych zdjęć w AI. [Plan V1.9](IMPLEMENTATION-PLAN-V1.9.md)
nie uruchamia C2; finansowanie, klucz, daty i zgody nadal wymagają zatwierdzenia.
