# P3.3B — integracja i próba syntetyczna

Data: 2026-10-25. Zakres zatwierdzony: [plan V1.7](IMPLEMENTATION-PLAN-V1.7.md),
[kontrola kosztów V1.6](COST-PLAN-V1.6.md). Ten dokument rozróżnia wykonanie
integracji, bezpłatne testy i rzeczywiste wyniki dostawcy.

## Stan próby

**Wykonano 6/6 rzeczywistych generacji, wszystkie zakończyły się poprawnie,
bez ponowień. Koszt API: 0,214403 USD; rozliczenie budżetu: 1,49 PLN / 10 PLN.**
Próbę zamknięto: AI OFF, sześć zajętych slotów, zero nieznanych rozliczeń i
rezerw. Klucz B unieważniono w OpenAI i usunięto z sekretów Supabase;
kontrolę zamknięcia dostępu zakończono o 13:47 UTC.

Wykorzystano wyłącznie fikcyjne dorosłe osoby i syntetyczne ubrania. Nie
przesłano prywatnych zdjęć użytkowników. Bez nowych abonamentów. P3.3C nie
rozpoczęto. Sześć wysłań wyczerpuje zgodę B; pozostały budżet nie pozwala
na dalsze generacje ani ponowienie przypadku.

Ocena wizualna: **6/6 wyników spełnia próg ≥8/10 bez błędu krytycznego**,
więc warunek jakości ≥5/6 został spełniony. Końcowa kontrola UI i sprzątanie
odtworzonych kont testowych zakończyły się poprawnie; publikacja sześciu wyników
na main pozostaje w toku.
**Odbiór przez Kasię i Aleksego pozostaje
otwarty.** [Galeria syntetyczna](https://ubranka.vercel.app/p33b/) jest miejscem
odbioru po zakończeniu publikacji opisanej poniżej.

## Zmierzone wyniki i koszty

| Przypadek | API USD | Budżet PLN | Czas workera | Ocena / 10 |
| --- | ---: | ---: | ---: | ---: |
| B01 | 0,038656 | 0,27 | 15,00 s | 10 |
| B02 | 0,040113 | 0,28 | 12,79 s | 10 |
| B03 | 0,033672 | 0,23 | 12,48 s | 10 |
| B04 | 0,034629 | 0,24 | 11,97 s | 10 |
| B05 | 0,031852 | 0,22 | 13,20 s | 8 |
| B06 | 0,035481 | 0,25 | 12,71 s | 9 |
| **Razem** | **0,214403** | **1,49** | **średnio 13,03 s** | **6/6 zaliczonych** |

PLN to konserwatywny współczynnik 6,765 z [planu kosztów](COST-PLAN-V1.6.md),
zaokrąglany w górę do grosza osobno dla każdego żądania. Przed tym zaokrągleniem
suma wynosi 1,450436295 PLN. To rozliczenie budżetu próby, nie kwota obciążenia
karty. Parametry konta i finansowania pozostają prywatne.

Każde usage jest znane i rozliczone; żaden wynik nie przekroczył swojej rezerwy.
Wyniki mają 1024×1536 px, prywatne miniatury 120×180 px. Średni czas dotyczy
workera w tej próbie, nie SLA ani czasu od kliknięcia w aplikacji. Surowe pomiary:
ignorowane `artifacts/p33b-results/B01-measurement.json`–`B06-measurement.json`;
stan finansowy po zamknięciu: `artifacts/p33b-financial-before-cleanup.json`.

Ocena obejmuje osobę, ubrania, kompletność, anatomię/artefakty i użyteczność,
każde 0–2. W B05 model zmienia ułożenie ręki po prawej stronie obrazu, a dłoń
jest nieczytelna lub schowana przy boku sukienki (osoba 1, artefakty 1).
W B06 nieco zwęża dół nogawek i poszerza wygląd krawata (ubrania 1), bez
istotnej zmiany rodzaju lub kroju. Nie stwierdzono błędów krytycznych.
Oceny i pomiary: [wyniki B](p33b/results.json); lokalny dowód oceny:
`artifacts/p33b-quality-review.json`. Próg dotyczy tej małej próby
wizualnej, nie gwarancji jakości innych zdjęć, fizycznego dopasowania ani odbioru
przez użytkowników. Niewidoczne rękawy i ramiona koszul model odtwarza; ta próba
nie potwierdza wierności ukrytych części ubrania.

## Co obejmuje integracja

- Jednorazowy serwerowy manifest B01–B06, dwie dedykowane tożsamości testowe,
  po trzy przypadki, hashe rzeczywiście przesyłanych JPEG i promptu, stałe parametry.
  Zwykłe konta i bezpośredni RPC nie mogą włączyć AI.
- Limit sześciu wysłań, jeden przypadek raz, 10 PLN, jedna aktywna operacja,
  nieodnawialne okno 24 h. Pierwsza rezerwa 10 PLN; później zgodnie z planem
  kosztów. Wynik nieznany blokuje dalsze wysyłki. Brak ponowień transportu.
- Worker zapisuje `sent` przed pojedynczym wywołaniem Images edits. Osobny
  restricted key jest odczytywany wyłącznie z sekretu Supabase
  `UBRANKA_P33B_OPENAI_KEY`; kod nie zawiera jego wartości.
- Manifest wyniku przed uploadem, PNG do 8 000 000 B, miniatura do 100 000 B,
  prywatny magazyn, ponowna autoryzacja odczytu, `no-store`, eksport i usuwanie.
  Okres 30 dni dotyczy wyniku w prywatnej szafie. Publiczne syntetyczne materiały
  raportowe pozostają jako historia badań.
- Oddzielna ocena wierności wyniku: pięć kryteriów 0–2, błąd krytyczny i notatka.
  Ocena stylu nadal służy poznawaniu gustu.

## Wejścia i ograniczenia

[Manifest wejść](p33b/cases.json) i [opis przygotowania](p33b/INPUTS.md):
23 JPEG, dwie fikcyjne dorosłe osoby, osobne wycinki deklarowanych rzeczy.
Przygotowanie było lokalne, bez nowych generacji. B01 ma osobę i trzy rzeczy;
B05 osobę, sukienkę i buty; pozostałe przypadki osobę i trzy rzeczy.

Wycinki nie są niezależnymi zdjęciami produktów. Niektóre rękawy, boki i pasy
są zasłonięte w źródłach; nie można ocenić wierności niewidocznych partii.
B06 testuje koszulę z krawatem, spodnie i buty, bez marynarki. Podobieństwo
fikcyjnych postaci ogranicza wnioski o zachowaniu różnorodnych twarzy i sylwetek.

Model i parametry: `gpt-image-2.5-flare-2026-09-08`, medium, 1024×1536,
jedno PNG, opaque, moderation auto. Bez streamingu, Files API i modelu pomocniczego.

## Weryfikacja

Lokalnie: `check`, `check:backend`, 74 testy logiki/klienta, 71 testów backendu,
3 testy rzeczywistego dekodera, 15 E2E demo i 24 E2E prywatnego UI: PASS.
Kontrola zależności i Expo Doctor (21/21): PASS. E2E prywatne używa atrap usług;
nie dowodzi rzeczywistego Google OAuth ani pracy na fizycznym telefonie.
Końcowy `build:all`: PASS dla WWW/iOS/Android. Pierwszą próbę zatrzymał
brak prawa zapisu pliku tymczasowego Hermes w sandboxie Windows; zatwierdzony
build poza sandboxem zakończył się poprawnie. Eksport nie jest testem urządzenia.

Supabase: dwie addytywne migracje B są zastosowane. Funkcje `wardrobe` v7,
`wardrobe-cleanup` v6 i `visualization-worker` v4 są aktywne przy wyłączonym AI.
Core hosted preflight z 02:30:06–02:30:53 UTC: PASS, 148 żądań HTTP, zero
wywołań generatora. Sprawdzono dwie syntetyczne tożsamości, odmowę AI i
uprzywilejowanych RPC, hashe 19 unikalnych zdjęć, izolację właściciela,
zakaz bezpośrednich odczytów Storage oraz niezmienność tych testowych danych.

Test dekodera w chmurze używał trzech zapisanych syntetycznych PNG P3.2
i pliku z losowymi pikselami o maksymalnym rozmiarze 8 000 000 B.
Maksymalny PNG: HTTP 200, dekodowanie 94 ms, miniatura 61 605 B.
JSON/base64 10 666 814 B: HTTP 200, parsowanie i dekodowanie 247 ms.
Logi zakończenia workerów w tym oknie raportowały 14–222 ms CPU i około
11–12 MB pamięci przy zamknięciu. **To nie jest pomiar szczytowego RAM**
ani całej przyszłej generacji wraz z transferem do dostawcy.

Osobny test SQL objął sześć rezerwacji, jednokrotne oznaczenie wysłania,
odmowę drugiego UUID, replay i rozliczenie sztucznego usage. Całość wycofano
przez ROLLBACK; osobny odczyt potwierdził zero prób, przypadków, zadań,
budżetów B i syntetycznych zgód AI. Sekwencyjne instrukcje nie są dowodem
równoczesnych transakcji hosted.

Przed płatnym startem wykonano także kontrolę dwóch sesji: edytor SQL utrzymywał
blokadę istniejącego `ai_control`, a rzeczywisty `b_reserve` drugiego konta
czekał **12 524,063 ms**, po czym po rollbacku otrzymał `AI_DISABLED`.
`pg_blocking_pids` potwierdziło blokujący proces. Snapshot przed i po był
identyczny: zero trwałych slotów, zadań, budżetów B i zmian zgód. Dowód:
`artifacts/p33b-concurrency-resumed.json`. Potwierdza to oczekiwanie RPC na
globalną blokadę i izolację; **nie jest testem dwóch zatwierdzonych rezerwacji
ani konkurencyjnego rozliczenia budżetu**. Pierwsza próba przez dwa wywołania
MCP nie uzyskała dowodu nakładania się sesji i nie została zaliczona.

Trwały fixture wyniku (dawny PNG P3.2, jawnie poza galerią B): PASS dla
odmowy przed publikacją, prywatnego PNG i miniatury, eksportu, izolacji,
`no-store`, natychmiastowego odcięcia po usunięciu i fizycznego skasowania
przez istniejący harmonogram. Usunięto wyłącznie jego przypięte metadane.
Nie uruchamiano globalnego cleanupu ręcznie. Surowe lokalne dowody pozostają
w ignorowanym `artifacts/`; nie publikujemy sesji, kont ani logów usług.

Doradca bezpieczeństwa: dwie tabele B mają RLS bez polityk — zamierzona odmowa
bezpośredniego dostępu; trzy publiczne funkcje SECURITY DEFINER są celowymi
bramkami z kontrolą konta. Uprawnienia operatorowe pozostają niedostępne dla
`authenticated`. Zapisano także istniejące ostrzeżenie ochrony ujawnionych haseł;
aplikacja używa logowania Google. Nie zmieniano ustawień Auth.
[Opis kontroli RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[funkcji](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[ochrony haseł](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Przeglądy i testy doprowadziły do poprawek terminu ważności wyniku, informacji
o trwającym usuwaniu oraz odtworzenia próby po utracie odpowiedzi/reloadzie.
Regresje przeszły. Worker weryfikuje rolę przez osobny RPC dostępny wyłącznie
dla `service_role`; zgodność dwóch tekstowych wartości klucza nie służy
autoryzacji. Ten problem wykryto i poprawiono przed płatnym startem.

## Publikacja i sprzątanie

Poniższe historyczne dowody publikacji dotyczą wcześniejszej integracji z AI
OFF. Nowe wyniki są przygotowane, lokalna galeria i `build:web` przeszły kontrolę.
Ich publikacja na main i kontrola wdrożonej galerii pozostają w toku;
nie przypisujemy im wcześniejszych testów.

Kod, galerię i raport opublikowano bez force push na dev/main jako
`32046d051c44994807c14149e35031fefff4644d`. Pełne
[CI 40155204050](https://github.com/loszavera/ubranka/actions/runs/40155204050)
zakończyło się SUCCESS: wszystkie wymienione testy oraz build trzech platform.
Automatyczne Actions są wyłączone w repozytorium, więc użyto pojedynczego
`workflow_dispatch`, bez zmiany ustawień repozytorium.

Vercel Production `dpl_AiFSdrmTR3YER367kWWkeTmegBRf`: READY dla tego SHA,
z aliasem [ubranka.vercel.app](https://ubranka.vercel.app).
Test realnego wdrożenia zakończony 02:41:57 UTC: **15 kontroli PASS**,
oba syntetyczne konta, PL/EN, szerokości 320/390 px, prywatne JPEG, AI OFF,
reload i logout. Tylko język chwilowo zmieniono i przywrócono; pozostałe dane
fixture zachowały hashe. Galeria: sześć oczekujących przypadków, 23 poprawnie
odczytane JPEG (46 obserwacji w dwóch rozmiarach), zero obrazów wynikowych B.
Zrzuty przejrzano wizualnie; brak błędów strony/sieci oraz przewijania poziomego.

Po kontroli wywołano `deleteAccount` wyłącznie dla dwóch kont testowych.
Odczyt o 02:42:50 UTC potwierdził brak ich rekordów w siedmiu tabelach,
obiektów w obu prywatnych bucketach i kont Auth. W tym przypadku aplikacja
dokończyła usuwanie bez oczekiwania na cron. Osobno potwierdzono brak prywatnych
receiptów/linków przypadków, usunięto dokładnie dwa testowe zaproszenia oraz
lokalny plik ich sesji. Istniejący harmonogram pozostaje bez zmian.

Dokumentacyjny commit `9ae488b` zachował te dowody bez zmiany runtime.
CI powyżej dotyczy wskazanego SHA kodu. Następnie po odzyskaniu dostępu do
panelu odtworzono wyłącznie dwa konta syntetyczne i wykonano opisaną próbę B.
Osobny klucz miał wyłącznie uprawnienie Images Request i ważność jednego dnia;
był przechowywany tylko w Supabase. Nie użyto lokalnego klucza P3.2.
Klucz B jest już unieważniony i usunięty z Supabase, a trial trwale zamknięty.

**Kontrola prywatnego wyniku w rzeczywistym UI: PASS o 13:49:01 UTC.**
Sprawdzono odczyt B01, hash PNG, formularz oceny, zapis i odtworzenie po reloadzie.
Próbna ocena służyła testowi zapisu, nie zastępuje oceny jakości; usunięto ją
wraz z fixture. Dowód: `artifacts/p33b-result-ui.json`.
Na zrzucie B01 miniatura 120×180 px powiększona do około 300 px szerokości
wygląda rozmyta, choć pobrany oryginalny PNG jest ostry. Przed ewentualnym C
należy poprawić czytelność podglądu, np. większą miniaturą z zachowaniem limitu
100 kB. To ograniczenie UX nie blokuje tej próby syntetycznej; poprawki teraz
nie implementowano i nie stanowi ona zgody na rozpoczęcie C.

**Sprzątanie odtworzonych kont po płatnej próbie: PASS.** Wywołania aplikacyjnego
`deleteAccount` objęły dokładnie dwa konta syntetyczne (13:49:36–13:49:46 UTC).
Potwierdzono brak ich rekordów w siedmiu tabelach, kont Auth i obiektów pod
oboma prefiksami w prywatnych magazynach. O 13:49:58 UTC przeszły też warunki
usunięcia zaproszeń. Dwie próby wykonania SQL przez MCP zakończyły się błędem
transportu; odczyt potwierdził, że zaproszenia nadal istniały. Następnie usunięto
wyłącznie te dwa wpisy przez edytor SQL z tymi samymi warunkami zakresu;
osobny odczyt MCP potwierdził zero. Dowód: `artifacts/p33b-invitations-final.json`.
Usunięto również lokalny plik sesji. Nie uruchamiano globalnego cleanupu ręcznie.

Wyniki raportowe zapisano przed usunięciem. Końcowy snapshot finansowy potwierdził
niezmienny digest przed/po, sześć wysłań, 214 403 mikroUSD i 149 groszy;
trial zamknięty i zablokowany, zero nieznanych rozliczeń, rezerw, prywatnych
referencji i osobistych jobów. Usunięcie kont nie przywróciło slotów ani budżetu.

Nowa galeria lokalna: **PASS dla 320/390 px**, 29 unikalnych obrazów (23 JPEG
wejściowe i sześć WebP wynikowych), 58 udanych odczytów, zero błędów i przewijania
poziomego. Sześć WebP ma łącznie 398 922 B wobec 10 884 397 B oryginalnych PNG;
brak EXIF/ICC/XMP. Hashe obu formatów zapisano w publicznym zestawieniu wyników.
Dowód: `artifacts/p33b-gallery-local-report.json`. To kontrola lokalna, nie
potwierdzenie gotowości nowego wdrożenia Vercel. Zmiany obejmują galerię i
dokumentację; runtime aplikacji i backend nie zmieniły się.

Automatyczna kontrola bezpieczeństwa odrzuciła porównanie fingerprintów
istniejących prywatnych rekordów, ponieważ wymagałoby odczytu danych poza
zakresem próby syntetycznej. Nie wykonano tego zapytania inną drogą.
Zachowanie dotychczasowych danych ocenia się przez przegląd addytywnej migracji
i regresje; nie deklarujemy bezpośredniego porównania bajtów prywatnych rekordów.

## Kontynuacja

Po dokończeniu publikacji i kontroli wdrożonej galerii Kasię i Aleksego prosimy o
obejrzenie sześciu wyników w galerii i akceptację lub feedback. Wykonanie
techniczne nie jest odbiorem użytkowników. Nie ponawiać żadnego z sześciu
wywołań, nie otwierać nowego okna i nie rozpoczynać C ani prywatnych zdjęć.
