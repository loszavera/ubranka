# P3.3B — integracja i próba syntetyczna

Data: 2026-10-25. Zakres zatwierdzony: [plan V1.7](IMPLEMENTATION-PLAN-V1.7.md),
[kontrola kosztów V1.6](COST-PLAN-V1.6.md). Ten dokument rozróżnia wykonanie
integracji, bezpłatne testy i rzeczywiste wyniki dostawcy.

## Stan próby

**Integracja wdrożona do Supabase; bezpłatne testy przeszły. Płatny start
nie nastąpił: 0/6 wysłań, 0 PLN.** Publikacja WWW jest opisana poniżej.
AI pozostaje wyłączone. Nie utworzono nowego klucza B. Do ukończenia konfiguracji
sekretu potrzebne jest ponowne logowanie właściciela do panelu Supabase.
Nie przesłano prywatnych zdjęć ani danych użytkowników do OpenAI.
Nie zmieniono ustawień rozliczeń ani abonamentów. P3.3C pozostaje nieuruchomione.

Brak wyniku jest oznaczony w [galerii syntetycznej](https://ubranka.vercel.app/p33b/).
Sześć przypadków pozostaje w mianowniku. **Próg sukcesu ≥5/6 nie został oceniony**;
obrazy wejściowe, testy z atrapami i dawny wynik P3.2 nie są nowymi generacjami B.

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
równoczesnych transakcji hosted. Przed płatnym uruchomieniem trzeba jeszcze
wykonać tę kontrolę na odtworzonych kontach próby.

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

Końcowy commit dokumentacyjny zapisuje te dowody i następny krok; nie zmienia
przetestowanego runtime ani galerii. CI powyżej dotyczy wskazanego SHA kodu.
**AI OFF, zero aktywacji B, zero wysłań, brak utworzonego klucza B.**
Nie ma nowego klucza do unieważnienia ani usunięcia. Starego klucza P3.2 nie użyto.
Kod nie aktywuje próby przy deployu. Całe B nie jest zakończone ani odebrane:
wyniki jakości i kosztów dostawcy nadal wymagają zatwierdzonej próby.

Automatyczna kontrola bezpieczeństwa odrzuciła porównanie fingerprintów
istniejących prywatnych rekordów, ponieważ wymagałoby odczytu danych poza
zakresem próby syntetycznej. Nie wykonano tego zapytania inną drogą.
Zachowanie dotychczasowych danych ocenia się przez przegląd addytywnej migracji
i regresje; nie deklarujemy bezpośredniego porównania bajtów prywatnych rekordów.

## Kontynuacja

Zgoda na B i limity pozostają zapisane; nie jest potrzebna ponowna zgoda na
rutynowe czynności tego etapu. Po udostępnieniu zalogowanego panelu należy
odświeżyć stan techniczny i warunki finansowania, utworzyć osobny ograniczony
klucz, zapisać go wyłącznie w Supabase i aktywować próbę dopiero po komplecie
kontroli. Każdy rzeczywisty wynik wymaga zapisu usage, kosztu i oceny; na końcu
AI OFF, unieważnienie klucza, usunięcie sekretu i sprzątanie kont testowych.
Nie przechodzić do C ani prywatnych zdjęć.
