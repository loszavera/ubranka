# Stan projektu Ubranka

Aktualizacja: 2026-10-27.

**P3.3C2 zatwierdzone według V1.9, z korektą ważności klucza w V1.10.**
Integracja wdrożona; [raport wykonania C2](P33C2-VERIFICATION.md) zawiera
testy i publikację. **Aktywacja: 2026-10-27 09:31 UTC; koniec 2026-11-26
09:31 UTC (10:31 czasu polskiego).** Zakres: 30 dni / 25 PLN
łącznie / 60 wysłań, 30 na konto i 5 na konto na dobę UTC, bez retry.
Właściciel przyjął granicę gwarancji ceny oraz zasady AI V1.2. Zatwierdził
wyłączenie auto-reload całej organizacji, finansowanie istniejącymi kredytami
i osobny ograniczony klucz tylko w Supabase. Zero płatnych testów operatora
i prywatnych zdjęć uczestników w testach. Każdy osobiście potwierdza wysłania.
Warunki planu spełnione; AI C2 ON dla obu uczestników. Zatrzymanie przed D.

Integrację C2, migracje i cztery Edge Functions wdrożono początkowo przy OFF.
Lokalne kontrole: 88 testów klienta, 129 backendu, 12 kodeka,
15 E2E demo i 39 prywatnych; typy/lint, Deno, trzy eksporty i Doctor 21/21 PASS.
Kasia potwierdziła logowanie Google i prywatną szafę na iPhone/Safari;
oba konta uczestników są gotowe. Auto-reload organizacji wyłączone.
Poprzednia publikacja `9677fff`: CI SUCCESS i Vercel Production READY. Hosted UI
30/30 PASS (PL/EN, 320/390/1440 px); dane i konta syntetyczne posprzątane.
2026-10-27 właściciel potwierdził utworzenie klucza tylko Images Request,
ważność Never i zapis wyłącznie w Supabase. Klucz utworzono i zapisano;
migracja rozróżniająca Never od terminu serwera wdrożona przy OFF.
129 testów backendu i niezależny przegląd PASS. Publikacja `d6b9947`:
CI SUCCESS, Vercel READY; pakiet klienta identyczny z wcześniej sprawdzonym.
Aktywacja zakończona: dwa konta, 0 wysłań C / 0 PLN / 0 rezerw. B i wspólny
miesiąc zachowują 1,49 PLN; obecnie wolne 23,51 PLN w miesiącu. Nowe płatne
wywołania operatora: 0. Każdy sam zatwierdza pierwsze wysłanie w aplikacji.
Aktualne [wymagania V1.10](REQUIREMENTS-V1.10.md), [plan V1.10](IMPLEMENTATION-PLAN-V1.10.md)
i [koszty V1.9](COST-PLAN-V1.9.md) zachowują 30 dni pilotażu; klucz wymaga
odrębnego unieważnienia po zakończeniu. Zasady danych AI V1.2 bez zmian.

## Historia przygotowania propozycji C2

**P3.3C1 przetestowane i zaakceptowane przez Kasię i Aleksego.**
Zlecili wyłącznie końcową propozycję C2. Powstały [wymagania V1.9](REQUIREMENTS-V1.9.md),
[plan V1.9](IMPLEMENTATION-PLAN-V1.9.md), [koszty V1.8](COST-PLAN-V1.8.md)
i [zasady AI V1.2](P33-AI-DATA-POLICY-V1.2.md). C2 nadal niezatwierdzone.
Propozycja: 30 dni / 25 PLN całego trialu i wspólne 25 PLN/miesiąc UTC,
60 wysłań łącznie / 30 na konto / 5 na dobę UTC, bez retry. Finansowanie z już
opłaconych kredytów, z proponowanym wyłączeniem auto-reload całej organizacji
OpenAI i pozostawieniem OFF po C2; dotyczy również innych projektów API.
Ta zmiana, klucz i aktywacja wymagają nowej zgody. Każdy osobiście potwierdza
prywatne wejścia. Limit aplikacji nie gwarantuje ceny przyjętego żądania.
W turze planowania odczytano panel rozliczeń/ustawienia danych i oficjalne źródła.
Szczegóły kont pozostają poza Git. Supabase 17:18 UTC: AI OFF, globalna blokada,
C prepared, bez dat, uczestników i prób; miesiąc/B 149 groszy, zero rezerw.
Bez zmian runtime, usług, ustawień, kluczy, wywołań modeli i prywatnych zdjęć w AI.
Kontrola dokumentacji: 10 plików Markdown, 127 lokalnych odnośników bez braków,
UTF-8 i whitespace PASS; niezależny przegląd kosztów/danych oraz zgodności z kodem.
Uwzględniono jawne przygotowanie kopii zdjęć i potwierdzone wygaśnięcie klucza
jako warunek aktywacji. Testów runtime nie powtarzano dla zmian wyłącznie dokumentacyjnych.

## Odebrane C1 — dowody wykonania

**P3.3C1 wykonane według V1.8 i opublikowane na main.**
Ostrzejsze miniatury, pełny podgląd i przygotowany przepływ prywatnych
wizualizacji, zgód, usuwania i limitów. [Aplikacja](https://ubranka.vercel.app)
oraz [porównanie miniatur](https://ubranka.vercel.app/p33c1/).
AI pozostaje wyłączone na serwerze; bez klucza AI w chmurze, nowych płatnych
wywołań, prywatnych zdjęć w AI i abonamentów. Zatrzymano pracę przed C2.
Kod końcowy `b6363ec` na dev/main; Vercel Production READY.
CI [40364002496](https://github.com/loszavera/ubranka/actions/runs/40364002496)
SUCCESS: 82 testy klienta, 97 backendu, 8 kodeka, 15 E2E demo i 31 prywatnych.
Typy/lint, Deno, eksport trzech platform, zależności i Expo Doctor 21/21 PASS.
Rzeczywisty Supabase: odmowy generacji i obcego dostępu, współbieżne transakcje,
oryginał/miniatura/eksport, wycofanie zgody i usuwanie PASS. Hosted UI:
12 widoków obu kont PL/EN przy 320/390/1440 px oraz 8 kombinacji galerii PASS.
Naprawiono blokadę retencji przez hosted safeupdate, zachowując ochronę bazy.
Po zwykłym cron oba konta syntetyczne, rekordy i 20 plików fizycznie usunięto;
zaproszenia, puste triale fixture i lokalne sesje także usunięte.
B pozostaje zamknięte: 6/6 zużytych slotów, 149 groszy, identyczny skrót rozliczeń,
zero rezerw. C jest nieaktywne, z zerem prób; nowy koszt API 0 PLN.
Agent nie wykonywał testów na fizycznym iOS/Android. Po odbiorze C1 Aleksy
doprecyzował 2026-10-26 własny test WWW: **Chrome na PC oraz Chrome na Androidzie**.
Nie podano modeli, wersji ani osobnych scenariuszy. Urządzenie/przeglądarka Kasi
pozostają niepodane. Ta informacja nie zatwierdza C2 ani zmian rozliczeń.
Następny krok: zatwierdzenie końcowej propozycji C2, jeżeli odpowiadają jej granice.
Szczegóły: [raport C1](P33C1-VERIFICATION.md).

## Plan C — historia przygotowania

**P3.3B zaakceptowane przez Kasię i Aleksego z opisanymi ograniczeniami
(2026-10-26).** Zlecono wyłącznie propozycję P3.3C z poprawą ostrości miniatur.
Powstały [wymagania V1.8](REQUIREMENTS-V1.8.md),
[plan V1.8](IMPLEMENTATION-PLAN-V1.8.md), [koszty V1.7](COST-PLAN-V1.7.md)
i [propozycja zasad danych AI V1.1](P33-AI-DATA-POLICY-V1.1.md).
W chwili przygotowania **C1/C2 nie były zatwierdzone do wykonania**; późniejsza
zgoda na C1 jest opisana powyżej. Rekomendacja C1: czytelniejsza
miniatura i pełny podgląd, zgody, izolacja, liczniki i testy syntetyczne przy
serwerowym AI OFF. C2 osobno: 30 dni / 25 PLN łącznie, maks. 60 wysłań,
30/konto i 5/dobę, bez ponowień. Szczegóły finansowania trzeba ustalić przed C2;
zgoda na B nie przechodzi na C.
W turze planowania tylko dokumentacja i odczyt kodu/oficjalnych źródeł, bez zmiany
aplikacji, usług, kluczy i danych oraz bez nowych wywołań AI. Testów runtime
nie powtarzano. Odbiór B nie dopisuje logowania Kasi ani testów urządzeń.
Kontrola dokumentacji: dziewięć plików, 114 lokalnych odnośników bez braków,
UTF-8 i `git diff --check` PASS. Niezależne przeglądy backendu i klienta;
uwzględniono zachowanie wspólnego budżetu miesięcznego, odczyt gotowych wyników
po wycofaniu zgody, rozliczanie po końcu trialu i rzeczywiste uprawnienia
administratora infrastruktury. Brak zmian runtime, manifestów i obrazów B.

## Odebrane P3.3B — dowody wykonania z 2026-10-25

**P3.3A przetestowane i zaakceptowane przez Kasię i Aleksego (2026-10-25).**
Następnie zatwierdzili wykonanie **P3.3B** z limitami i zatrzymaniem przed C.
Ówczesne [wymagania V1.7](REQUIREMENTS-V1.7.md),
[plan V1.7](IMPLEMENTATION-PLAN-V1.7.md) i [koszty V1.6](COST-PLAN-V1.6.md).
Zakres: rzeczywista integracja serwerowa, tylko sześć zarejestrowanych
syntetycznych przypadków, maks. 6 wysłań / 10 PLN, osobny ograniczony klucz
w Supabase, raport/galeria i powrót do OFF. Użytkownik jawnie zatwierdził
granicę rezerwy i ograniczone finansowanie; szczegóły pozostają poza Git.
Integracja i bezpłatne kontrole są wykonane: 74 testy klienta, 71 backendu,
3 dekodera, 15 E2E demo, 24 E2E prywatne oraz kontrole rzeczywistego Supabase.
**Próba B wykonana: 6/6 udanych wywołań, bez ponowień; koszt API 0,214403 USD,
budżetowo 1,49 PLN / 10 PLN. AI ponownie OFF, sześć slotów zużytych, zero
nieznanych rozliczeń i rezerw.** Osobny klucz unieważniono i usunięto z Supabase
(kontrola 13:47 UTC). Hosted test potwierdził, że rzeczywisty `b_reserve`
czeka na globalną blokadę; nie jest to dowód dwóch zatwierdzonych rezerwacji.
Szczegóły dowodów, publikacji i ograniczeń: [raport P3.3B](P33B-REPORT.md).
Wcześniejszy kod `32046d0` opublikowano na dev/main; Vercel Production READY, CI
40155204050 SUCCESS. 15 kontroli wdrożonego WWW PL/EN 320/390 px: PASS.
Ocena wizualna: 6/6 spełnia próg ≥8/10, bez błędu krytycznego; uwagi dotyczą
ręki w B05 oraz drobnych zmian nogawek i krawata w B06. Konta pierwszej
bezpłatnej kontroli usunięto; do płatnej próby odtworzono dwa konta syntetyczne.
Końcowy odczyt B01 i zapis oceny z reloadem w rzeczywistym UI: PASS. Oba konta,
ich rekordy, prywatne pliki, zaproszenia i lokalne sesje usunięto; koszt i sześć
slotów pozostały niezmienione. Nowa lokalna galeria 320/390 px i `build:web`:
PASS. Sześć nowych obrazów opublikowano na dev/main jako `b0b84ce`;
Vercel Production READY. Końcowy test WWW 390/1440 px: 18 kontroli PASS
(14:40:41 UTC), hashe wszystkich sześciu obrazów zgodne, zero błędów.
Historia CI dotyczy runtime; nowe dowody galerii zapisano w raporcie B.
**Odbiór B został następnie potwierdzony 2026-10-26.** Poprawę czytelności
miniatury 120×180 px uwzględniono w propozycji C1: większa miniatura ≤100 kB
i podgląd istniejącego oryginału na żądanie. Późniejsza implementacja C1 jest
opisana na początku tego dokumentu. C2/D nadal niezlecone; prywatne zdjęcia
pozostają wyłączone z AI.

## Odebrane P3.3A — dowody wykonania

Zakres: profil sylwetki i prywatne zdjęcie w Supabase, zestawy z własnej szafy,
przygotowanie wizualizacji z serwerowym AI OFF, testy syntetyczne i podgląd main.
Praca na dev. Bez klucza AI w chmurze, płatnych wywołań i nowych abonamentów.
62 testy logiki/klienta, 41 backendu, 15 regresji
demo oraz wszystkie 18 scenariuszy prywatnego UI: PASS w zakończonym CI
(lokalnie wcześniej poprawiono obsługę konfliktu formularza). Supabase: migracja i funkcje wdrożone, 40 kontroli
dwóch syntetycznych kont PASS. Hashe wcześniejszych danych pozostają zgodne.
Kod `4b34a00`, dokumentacja wykonania `8cd3787`; Vercel Production READY pod
https://ubranka.vercel.app. Pięć kontroli wdrożonego UI z rzeczywistym Supabase
na koncie syntetycznym: PASS. CI 40143086234: SUCCESS dla kodu `4b34a00`.
Oba konta syntetyczne, ich rekordy i pliki zostały całkowicie usunięte przez
aplikację oraz istniejący harmonogram; kontrola 01:40 czasu polskiego PASS.
Usunięto testowe zaproszenia i lokalne sesje. Końcowy commit zapisuje tylko
dokumentację wyników. Odbiór A został następnie potwierdzony przez użytkowników.
Nie dopisano indywidualnych wyników urządzeń ani osobnego testu logowania Kasi.
Szczegóły i granice:
[P33A-VERIFICATION.md](P33A-VERIFICATION.md), [backend](P33A-BACKEND.md).

## Historia P3.2 i przygotowania planu

**P3.2 zakończone technicznie: 12/12 udanych wywołań, bez błędów i ponowień.**
Sześć przypadków × dwa modele na istniejących obrazach fikcyjnych dorosłych.
Koszt API **0,432032 USD**, rozliczenie budżetu z rezerwą **2,92269648 PLN / 25 PLN**.
10/12 wyników spełnia próg techniczny; oba eleganckie zestawy damskie zmieniają
krój spodni. Flare jest kandydatem do dalszego projektu: w tej próbie był szybszy
przy tym samym koszcie. **Kasia i Aleksy zaakceptowali wyniki P3.2 z opisanymi
ograniczeniami (2026-10-25).** Nie nadali ocen poszczególnym obrazom.
[Galeria](https://ubranka.vercel.app/p32/), [raport](P32-REPORT.md),
[koszty V1.4](COST-PLAN-V1.4.md). Limit wywołań P3.2 wyczerpany.
**Przygotowano plan P3.3 V1.6**, zgodnie ze zleceniem wyłącznie dokumentacyjnym:
prywatne zestawy i profil, wizualizacja na prośbę, zasady danych oraz koszty.
Rekomendacja: P3.3A z AI wyłączonym, później osobno próba syntetyczna B i pilotaż C.
Automatyczne rozpoznawanie pozostaje w D. W chwili sporządzenia planu wszystkie
fazy czekały na zatwierdzenie; późniejsza zgoda na A i jej realizacja są powyżej.
W tamtej turze nie zmieniano kodu, bazy, usług ani kluczy i nie wywoływano modeli.
Weryfikacja dokumentacji: spójność faz/limitów/zgód, lokalne odnośniki, JSON
odbioru i niezmienione pomiary P3.2 PASS; niezależny przegląd architektury oraz
zasad danych. Testów runtime aplikacji nie powtarzano przy zmianie wyłącznie
dokumentów i metadanych odbioru.
Materiały `66e5e05` opublikowano na dev/main. Vercel Production
`dpl_6VhgLoT8s9cNhvBEv6YvauhN1Xob` READY; publiczny test galerii i powrotu
do aplikacji PASS. Końcowa zmiana zapisuje dowody bez zmiany galerii/aplikacji.
Lokalne check/build PASS; brak widocznego uruchomienia nowego CI odnotowano
w [raporcie](P32-REPORT.md), bez utożsamiania go z historycznym sukcesem CI.

Po przetestowaniu P2 Kasia i Aleksy zgłosili dodatkowe
okazje. Aleksy zatwierdził P2.1: wesele jako gość, praca, randka i impreza,
dobór do okazji, zachowanie danych P2, pracę na dev, testy i podgląd Vercel.
Użytkownik odebrał P2.1 i polecił przenieść całość do main. Wersja produkcyjna
jest opublikowana i sprawdzona. Następnie użytkownik **zatwierdził P3.1**:
Supabase Free/Frankfurt, Google, zdjęcia, synchronizacja, limity i zasady danych
V1.0, testy i podgląd dev. Bez płatnego AI i nowych abonamentów.

**P3.1 jest na main, wdrożenie i kontrola przeszły:** użytkownik zatwierdził przeniesienie
P3.1 i testowanie przed premierą pod https://ubranka.vercel.app. Dev pozostaje
warsztatem. Zgoda zastępuje wcześniejszy warunek „main po odbiorze” w planie V1.4;
nie oznacza odbioru funkcji ani zgody na P3.2/P3.3 lub opłaty.

Usługi są skonfigurowane dla dev i main,
Google właściciela działa, testy chmury i CI przeszły. Wykryty cache zdjęcia
po usunięciu naprawiono odczytem przez Edge. Logowanie Kasi pozostaje
niepotwierdzone. Na main sprawdzono rzeczywiste logowanie
właściciela, odczyt istniejącego zdjęcia i wylogowanie. [Raport](P31-MAIN.md).

Użytkownik następnie zgłosił udany test większości funkcji na telefonie, poza
logowaniem Kasi, oraz pozostającą kartę „Usuwanie w toku”. Potwierdzono przyczynę:
odświeżenie przywracało rekord oczekujący na bezpieczne czyszczenie plików.
Poprawka prezentacji jest na main (`1b342e0`): usunięta rzecz nie wraca po
odświeżeniu, a informacja o czyszczeniu wynika ze stanu serwera. Testy klienta
36/36 i prywatnego UI 10/10 PASS. Naturalny cron o 21:00 UTC usunął zgłoszoną
rzecz i oba pliki; bez błędów oraz ręcznej ingerencji. [Raport](P31-DELETION-FIX.md).
Po wdrożeniu poprawki Aleksy potwierdził pozytywny ponowny test i zadowolenie
z wyniku (2026-10-24). Zgłoszenie usuwania zamknięte. Nie rozszerzamy tej deklaracji
na logowanie Kasi, pełną checklistę urządzeń ani zgodę na P3.2.

## P3.1 — bieżący wynik

- Osobny ekran prywatnej szafy PL/EN, profile, selektywny import P2, zdjęcia
  z galerii/aparatu, edycja, wymiana, eksport ZIP i potwierdzane usuwanie.
- Prywatne dane nie trafiają do zapisu demo. JWT, RLS i kontrola aktywnego konta
  chronią dane; serwer sprawdza limity i wersję przed zmianą. Konflikt wymaga
  świadomego odczytu/porównania nowszego stanu.
- Zdjęcia JPG/PNG/WebP są ponownie kodowane do JPEG bez EXIF/GPS. HEIC ma
  czytelną odmowę. Limit 100 rzeczy/konto, 1 MB + miniatura 100 kB, 1600 px,
  250 MB/konto; niedokończone operacje nadal zajmują limit.
- Projekt Google Cloud `ubranka-2026` pozostaje bez rozliczeń. Użytkownik podał
  oba konta i wyraźnie zaakceptował User Data Policy; nie wymaga to ponownej zgody.
  Klient OAuth jest utworzony, ma dokładny callback Supabase i dwa test users.
  Zakres wyłącznie email/profile/openid. Na podglądzie dev sprawdzono rzeczywiste
  logowanie właściciela, odczyt pustej prywatnej szafy i wylogowanie.
- Supabase połączony: organizacja Risk Every Asset, Free, projekt `ubranka-test`
  we Frankfurcie. Migracja, prywatny bucket, RLS i obie Edge wdrożone. Dwa konta
  wpisane na prywatną listę dostępu. Pięć anonimowych prób API poprawnie odrzuconych.
- Właściciel autoryzował CLI z telefonu. Auth/hook, sekrety Edge/Vault oraz
  harmonogram co 10 minut są skonfigurowane. Faktyczny wywołany przez cron
  request HTTP zakończył się 200. Email/SMS, anonymous i manual linking wyłączone.
- URL i klucz publiczny Supabase są ustawione w Vercel Preview/dev i Production/main.
  Wdrożenie dev `dpl_ErgZM7GMGy8wMrxcYH5DHDqNsFvk` READY, kod `2cc3a0e`,
  zawiera konfigurację i poprawiony transport zdjęć. Nie ujawniono kluczy
  serwerowych, sekretu Google ani adresów kont w repozytorium.
- Konfiguracja main korzysta z tego samego istniejącego
  Supabase Free `ubranka-test` we Frankfurcie i tych samych dwóch zaproszonych
  kont. Prywatne dane w chmurze są wspólne dla dev/main; lokalny zapis demo jest
  osobny. Nie powstaje nowa usługa, migracja danych ani zmiana retencji.
  Podział pilotażu i produkcji zostanie ponownie ustalony przed premierą komercyjną.
- Supabase Site URL wskazuje main; dodano dokładny callback aplikacji main,
  zachowując powroty dev. `config diff` nie wykazał różnic zadeklarowanej
  konfiguracji. CORS main/dev: HTTP 204 z dokładnym originem; obcy origin: HTTP 403.
  Callback klienta Google do tego samego Supabase nie zmienił się.
- Hosted test ujawnił bezpośredni Storage GET z CDN po odebraniu dostępu w RLS.
  Nowa migracja usuwa odczyt Storage użytkowników, a Edge POST `downloadPhoto`
  wykonuje świeżą kontrolę Auth/RLS przed pobraniem bajtów. Backend 14/14 PASS;
  niezależny przegląd backendu i klienta bez uwag blokujących. Hosted live 30
  kontroli PASS; raport rozszerzony 90 kontroli. Naturalny cron 20:00 UTC
  usunął syntetyczne pliki i konta. Nie pozostały syntetyczne zaproszenia.
- TypeScript/ESLint, 34 testy domeny, 14 backendu, 15 regresji WWW, 8 prywatnego UI
  i eksport trzech platform PASS. [Końcowe CI SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40127417984).
  Upload przez automat Chrome wymaga niedostępnego uprawnienia rozszerzenia;
  realny wybór pliku i OAuth Kasi sprawdzą użytkownicy. API zdjęć sprawdzono w chmurze.
- Szczegóły: [konfiguracja](P31-SETUP.md), [backend](P31-BACKEND.md),
  [wyniki i ograniczenia testów](P31-VERIFICATION.md).
- Historyczny etap bez usług, dev `a9ec29a`: Vercel `dpl_DwRjKYjq8fJwcf429RC3FmKhd2vk`
  READY; kontrola online 18:06 UTC PASS (demo, zachowanie zapisu, jawny brak
  konfiguracji usług w PL/EN). Lokalnie: 34 testy logiki, 11 backendu,
  15 regresji WWW i 7 prywatnego UI PASS. Eksport trzech platform PASS.
  [CI dla a9ec29a: SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40119015249),
  wraz z testami na Ubuntu/Chromium. Następny commit zapisuje wyłącznie raport.
  Ten wcześniejszy wynik nie zastępował późniejszych testów chmury opisanych wyżej.

## Aktualne dokumenty

- [Wymagania V1.6](REQUIREMENTS-V1.6.md) i [plan V1.6](IMPLEMENTATION-PLAN-V1.6.md):
  odebrane P3.2, zatwierdzone P3.3A i propozycja etapów B–D. Wersje V1.2–V1.5 zachowano.
- [Projekt zasad danych AI](P33-AI-DATA-POLICY-V1.0.md)
  (część Supabase zatwierdzona w A) i [projekt kontroli kosztów V1.5](COST-PLAN-V1.5.md):
  aktywacja danych AI i płatnych prób nadal wymaga osobnych zgód.
- [Raport P3.3A i scenariusz odbioru](P33A-VERIFICATION.md), [backend P3.3A](P33A-BACKEND.md).
- [Raport P3.2](P32-REPORT.md), [historyczny preflight](P32-PREFLIGHT.md)
  i [manifest przypadków](p32/cases.json).
- [Przyjęte zasady zdjęć](P3-DATA-POLICY-V1.0.md), [pomiary kosztów V1.4](COST-PLAN-V1.4.md).
- [Publikacja main i test produkcyjny P2.1](P21-PRODUCTION.md).
- [Weryfikacja i scenariusz odbioru P2.1](P21-VERIFICATION.md).
- [Historyczna weryfikacja P2](P2-VERIFICATION.md).
- [Kontrakty danych P2/P2.1 i szkice P3/P4](DATA-CONTRACTS-P2.md).
- [Wybrany wygląd A](design/DESIGN-DIRECTION-V1.2.md), ilustracje
  [P2](design/P2-ASSETS.md) i [P2.1](design/P21-ASSETS.md).
- [Założenia wolumenu AI](COST-PLAN-V1.2.md), [sklepy](RETAILER-FEASIBILITY-V1.1.md),
  [środowisko](SETUP.md), [zależności](DEPENDENCY-STATUS.md), [decyzje](DECISIONS.md).

## Odebrane P2/P2.1

- P2: wygląd A — Krem i śliwka; PL/EN, krótki start, profile stylów, budżety,
  priorytety, dwa tryby propozycji, opinie z opcjonalnym powodem i szafa demo.
- P2.1: sześć okazji w PL/EN. Okazja bieżącej rundy jest oddzielona od domyślnej
  okazji profilu. Zmiana okazji rozpoczyna wybór od nowa, zachowując gust.
- Filtr okazji poprzedza ranking. Maksymalnie dwa wyniki, budżet obejmuje
  dostawę, własne rzeczy kosztują 0 nowego wydatku. Niepasujące propozycje nie
  uzupełniają pary; brak zgodnych wyników jest jawnie komunikowany.
- Katalog ma 37 fikcyjnych rzeczy i 12 zestawów. Cztery nowe ilustracje weselne
  przedstawiają dorosłe fikcyjne osoby. To przykłady dla gości, nie pełna obsługa
  dowolnego dress code'u z zaproszenia.
- Stan V2 czyta V1 pod niezmienionym kluczem zapisu. Zachowane wszystkie stare
  identyfikatory rzeczy/zestawów, profile, język, tryb, szafa i opinie z powodami.
- Nadal działa lokalny zapis, obsługa błędów odczytu/zapisu, potwierdzany reset,
  pusty wynik i praca załadowanego interfejsu bez sieci.

Odebrane demo P2.1 nie ma kont, synchronizacji, własnych zdjęć, AI, prawdziwych ofert sklepów,
listy zakupowej ani płatności. Ilustracje nie są przymiarką na użytkowniku;
reguły nie uwzględniają rzeczywistych wymiarów ani rozmiarów produktów.

## Weryfikacja P2.1

- TypeScript strict i ESLint: PASS.
- Testy domeny: 15/15 PASS; testy WWW w Edge: 13/13 PASS.
- Eksport WWW/iOS/Android: PASS. Fizyczne urządzenia z Expo Go nie były testowane.
- Sprawdzono migrację zamrożonego zapisu V1, oba tryby, budżet, wyczerpanie
  przykładów, PL/EN oraz szerokości 320/360/390/1440 px i klawiaturę WWW.
- Vercel: READY i test online PASS (16:23 UTC). Końcowe CI dla `3c555b5`:
  [SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40111604543),
  w tym 13/13 scenariuszy WWW na Ubuntu/Chromium. Pierwsze CI wykazało zbyt
  wczesny pomiar po resize; poprawiono synchronizację testu bez zmiany aplikacji.
  Dowody i ograniczenia: [raport P2.1](P21-VERIFICATION.md).

Zależności nie zmieniły się w P2.1. W P2 zgodność SDK i Expo Doctor 21/21
przeszły, a audyt zgłosił 8 wpisów (5 high, 3 moderate) z 3 zgłoszeń źródłowych.
Nie zastosowano niesprawdzonych override ani `audit fix --force`.
Szczegóły: [DEPENDENCY-STATUS.md](DEPENDENCY-STATUS.md).

## Git i hosting

- Praca na `dev`. Podgląd: https://ubranka-git-dev-risk-every-asset.vercel.app.
  Chroni go logowanie Vercel. Projekt `ubranka`, zespół Risk Every Asset.
- Docelowy adres odbioru: https://ubranka.vercel.app (`main`, Vercel Production).
  P3.1 jest wdrożone i sprawdzone. Przed premierą zatwierdzony zakres można publikować
  i testować na main bez osobnego odbioru wyłącznie z powodu gałęzi; testy oraz
  jawne ograniczenia pozostają wymagane. To nie jest premiera komercyjna.
- Kod P3.1 `115b765` przeniesiono fast-forward na main; lokalne i zdalne
  gałęzie main/dev były zgodne po push. Vercel `dpl_2obmzhuWFReCHZWSaFNdX9z1U8BD`
  READY, target Production. HTTP 200, Google OAuth → szafa/zdjęcie → logout PASS,
  zero błędów konsoli. Końcowy commit zapisuje wyłącznie dokumentację.
- Historycznie `main` przeniesiono fast-forward z fundamentu `0203382` do odebranego P2.1
  `9bc50acef56f7b41525bfd9fb0cbb682e04fe26a`. Produkcja: https://ubranka.vercel.app.
  Vercel `dpl_21XuJzQigJzLn6Y39NKA9taZ1rvM` READY; test online PASS 16:44 UTC,
  HTTP 200, 0 błędów JavaScript. Kolejny commit aktualizuje wyłącznie dokumentację.
  Lokalny zapis demo dev/main jest osobny; publikacja kodu go nie synchronizuje.
  Prywatna szafa P3.1 korzysta ze wspólnego backendu obu adresów.
- Implementacja, CI i wdrożenie P2: `04ea37775515240e45b2001614dbfccb103e1105`,
  [run SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40102781826),
  Vercel `dpl_Bc6PBTM8s9EU6kS13Si4Zw2dPJuQ` READY i test online PASS.
- P2.1: aplikacja `b74e22c59bebd78e8aeeadb2cba28a100d3eb002`, Vercel
  `dpl_kKpgbeYGGDEYT25R1SRMUKx4keoZ` READY, kontrola online PASS na stałym adresie dev.
- Końcowy kod/testy P2.1: `3c555b56a93067581b312a980896cf5a29a5118d`, CI SUCCESS,
  Vercel `dpl_5rMcGooY9RdwsL4f8vnidys6byA8` READY. Aplikacja i bundle identyczne
  z wynikiem kontroli online. Commit 9bc50ac zapisał raport bez zmian kodu.

Historycznie P0 przeszedł [CI](https://github.com/loszavera/ubranka/actions/runs/40090246634).
Użytkownik potwierdził działanie hostingu oraz zdalnego Codex przez internet mobilny.
P1/V1.1 i V1.2 przeszły przeglądy dokumentacji; wersje historyczne zachowano.

## Historyczne przygotowanie dostępu OpenAI — przed P3.2

Użytkownik utworzył projekt Ubranka, a następnie zatwierdził konfigurację jego
limitu oraz dedykowany lokalny klucz testowy. Parametry konta pozostają w prywatnych
notatkach, poza repozytorium. Klucz ma uprawnienie wywołań obrazów i odczytu
informacji o modelach oraz ograniczony okres ważności.
Klucz zapisano wyłącznie lokalnie, jako DPAPI CurrentUser w ignorowanym katalogu
`.local/p32-openai/`, z ACL użytkownik Windows + SYSTEM. Nie powstał jawny plik
klucza; sprawdzono zgodność po zaszyfrowaniu/odszyfrowaniu, ACL i wykluczenie z Git.
Na etapie przygotowania panel potwierdził utworzenie klucza i brak jego użycia.
Nie wykonano wtedy żądania modelu. Późniejszą zatwierdzoną próbę zakończono;
wynik i rzeczywiste użycie API opisuje [raport P3.2](P32-REPORT.md).

Wynik odczytu ustawień konta przekazano użytkownikowi prywatnie. Sama konfiguracja
dostępu nie zatwierdza płatnej próby, zakupu kredytów ani zmiany rozliczeń.

## Następny krok

**Dokończenie zatwierdzonego C1, następnie test użytkowników na main:**
ostrość przykładów na telefonie oraz przygotowanie wejść własnego zestawu
przy AI OFF. Oczekiwany rezultat: odbiór lub konkretny feedback.
Osobny późniejszy start C2 wymaga zgody na płatny pilotaż,
finansowanie i świadome wysłanie zdjęć przez każdego uczestnika.
Nie ponawiamy żadnej generacji B; jego sześć slotów pozostaje wykorzystanych.

Logowanie Kasi w P3.1 nie zostało osobno potwierdzone; ogólny odbiór A/B nie
dopisuje takiego wyniku. Galeria i pomiary P3.2 pozostają niezmienione.
