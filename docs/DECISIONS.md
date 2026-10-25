# Rejestr decyzji — Ubranka

Stan początkowy: 2026-10-24. Decyzje produktowe wymagające doprecyzowania nie są zastępowane wyborem technologii.
„Roboczo” oznacza odwracalną decyzję techniczną na potrzeby fundamentu, a nie ostateczny zakres produktu.

| ID | Data | Status | Decyzja i uzasadnienie |
| --- | --- | --- | --- |
| D-001 | 2026-10-24 | Polecenie użytkownika | Repozytorium `https://github.com/loszavera/ubranka`; folder projektu jest lokalnym miejscem pracy. |
| D-002 | 2026-10-24 | Polecenie użytkownika | Gałęzie `main` i `dev`; bieżąca praca na `dev`. Samo istnienie planu nie oznacza automatycznej publikacji każdej dalszej zmiany na `main`. |
| D-003 | 2026-10-24 | Roboczo | TypeScript + React Native + Expo + Expo Router, jedna aplikacja w jednym repozytorium. Cel: wspólna baza dla iOS, Androida i WWW oraz szybkie testowanie. |
| D-004 | 2026-10-24 | Roboczo | Expo SDK 57 na start dla testów Expo Go na fizycznym telefonie podczas przejścia ekosystemu na SDK 58. Dokładne wersje utrwala lockfile; przed aktualizacją SDK sprawdzamy zgodność z Expo Go. |
| D-005 | 2026-10-24 | Rekomendacja techniczna | Web jako aplikacja SPA, eksportowana przez Metro do `dist`, przygotowana do hostingu Vercel. `main` jest kandydatem na stabilny adres, `dev` na podglądy. Przygotowana konfiguracja nie oznacza połączonego konta ani aktywnego wdrożenia. |
| D-006 | 2026-10-24 | Otwarta | Backend, konta użytkowników, magazyn zdjęć, katalog sklepów i dostawca AI zostaną dobrane po doprecyzowaniu wymagań. Nie tworzymy ich kont ani zależności dla samego fundamentu. |
| D-007 | 2026-10-24 | Polecenie użytkownika | Najpierw infrastruktura i ogólne dokumenty V1.0. Seria pytań produktowych nastąpi w kolejnym kroku. |
| D-008 | 2026-10-24 | Rekomendacja organizacyjna | Na początku jeden czat łączy zarządzanie i implementację; pomocniczy agenci mogą wykonywać rozdzielne zadania. Drugi stały czat ma sens przy większej liczbie równoległych prac. |
| D-009 | 2026-10-24 | Roboczo | Dokumenty V1.0 stanowią bazę po inicjalizacji. Istotne zmiany tworzą V1.1 itd.; README i bieżący status wskazują aktualne wersje. |
| D-010 | 2026-10-24 | Cel produktu do doprecyzowania | Samodzielne zakupy pozostają w wizji produktu. Limity, potwierdzenia, operator i obsługa wyjątków wymagają osobnych ustaleń przed implementacją realnych płatności. |
| D-011 | 2026-10-24 | Wykonane po upoważnieniu użytkownika | Aktualizuje stan D-005: Vercel jest połączony z repozytorium, `main` zasila Production, a `dev` Preview. Adres `https://ubranka.vercel.app` działa; użytkownik potwierdził podgląd. |
| D-012 | 2026-10-24 | Ustalenie użytkowników | Odbiorcy: kobiety i mężczyźni bez sprecyzowanego stylu lub czasu na zakupy. Najpierw użytek własny, docelowo komercyjny rynek polski. |
| D-013 | 2026-10-24 | Ustalenie użytkowników | Priorytety: poznanie gustu, zestawy z posiadanych rzeczy, pomoc w zakupach; ubrania codzienne i eleganckie, krótki start oraz stopniowe poznawanie preferencji. |
| D-014 | 2026-10-24 | Ustalenie z otwartym szczegółem | Budżet na cały zestaw. Kasia preferuje dwa kompletne zestawy, Aleksy wariant tani/markowy. Sposób połączenia i liczenie wydatku wymagają Q21–Q22; 500 PLN to scenariusz przykładowy. |
| D-015 | 2026-10-24 | Ustalenie użytkowników | „Podoba mi się” uczy gustu, nie kupuje ani nie dodaje do koszyka. Odrzucenie obu prowadzi do kolejnej pary; powód można pominąć, pytanie wyłączyć. Propozycje na prośbę użytkownika. |
| D-016 | 2026-10-24 | Ustalenie z otwartymi szczegółami | Profil wykorzystuje wymiary/rozmiary i zdjęcia; szafa przyjmuje zdjęcia rzeczy oraz zdjęcia na osobie. Zestawy mają być wizualizowane na osobie/zdjęciu użytkownika. Szczegóły danych i Q24 pozostają otwarte. |
| D-017 | 2026-10-24 | Ustalenie z otwartą realizacją | Pierwszy zakres zakupowy to koszyk do zatwierdzenia (Q23), doprecyzowujący D-010. Vinted, Zara, Zalando, Reserved i H&M to preferowane źródła; dostęp projektu do ich katalogów i zakupów nie jest potwierdzony. |
| D-018 | 2026-10-24 | Ustalenie użytkowników | Spokojny wygląd; przygotować kilka propozycji do wyboru. A/B/C są makietami, żadna nie jest zatwierdzona. Rekomendacja projektowa: B — Szałwia i porcelana. |
| D-019 | 2026-10-24 | Cel kosztowy | Około 150 PLN miesięcznie, możliwie mniej. Wolumen Q25 i rzeczywisty koszt wizualizacji wymagają pomiaru. Cel nie jest aktywowanym rozliczeniem ani gwarancją ceny. |
| D-020 | 2026-10-24 | Propozycja techniczna | Rozwija D-006: Supabase Free jest kandydatem na mały pilotaż. Wykonalność przymiarki sprawdzić ograniczoną próbą, a sklepy integrować po uzyskaniu dostępu. Nie wybrano ani nie uruchomiono backendu/AI. |
| D-021 | 2026-10-24 | Wykonane | Aktualizuje D-007/D-009: otrzymano 20 odpowiedzi, zapisano wymagania i plan V1.1, analizy i trzy makiety. V1.0 zachowano; pozostało pięć pytań Q21–Q25 i wybór wyglądu. |
| D-022 | 2026-10-24 | Wybór użytkownika | Zastępuje otwartą decyzję i rekomendację B z D-018: wybrano A — Krem i śliwka. Jest to wybór kierunku wyglądu, nie odbiór działającego UI. |
| D-023 | 2026-10-24 | Preferencje użytkowników i sposób realizacji | Kasia chce PL, Aleksy EN, dopuszczając późniejsze EN. Plan realizacyjny: PL/EN od pierwszego prototypu, słowniki i wybór per użytkownik, początkowo PL. Język nie zmienia rynku PL, PLN ani dostawy do Polski. |
| D-024 | 2026-10-24 | Ustalenie użytkownika | Rozstrzyga Q21 i część D-014: oba tryby dwóch pełnych zestawów; początkowo najlepiej dopasowane, opcjonalnie ekonomiczny/markowy. Domyślny tryb ustala użytkownik. |
| D-025 | 2026-10-24 | Ustalenie użytkownika | Rozstrzyga Q22 i część D-014: budżet obejmuje rzeczy do dokupienia z dostawą; własne rzeczy 0 PLN nowego wydatku. Nieznanych opłat nie traktować jako zera. |
| D-026 | 2026-10-24 | Ustalenie użytkownika | Rozstrzyga Q23 i aktualizuje D-017: na początek wystarczy lista zakupowa z linkami; zakup kończy użytkownik w sklepach. Dostęp do produktów nadal wymaga weryfikacji; automatyczne zamawianie pozostaje przyszłym celem. |
| D-027 | 2026-10-24 | Wstępny kierunek z wyjaśnieniem do wykonania | Aktualizuje Q24/D-016: prywatne zdjęcia do usunięcia i wykorzystanie AI przyjęto wstępnie („chyba tak”). Wyjaśniono alternatywę zapisu tylko opisu po analizie. Przed realnym uploadem trzeba wskazać usługę, przekazywane dane i retencję/usuwanie; nie jest to zgoda na dowolnego dostawcę. |
| D-028 | 2026-10-24 | Ustalenie wolumenu | Rozstrzyga Q25 i aktualizuje D-019: 30 wizualizacji/osobę/mies., czyli 60 dla dwóch osób. Konwencja planistyczna to jeden obraz zestawu na osobie; para obrazów liczy się jako dwa. Nie jest to twardy limit ani gwarancja zmieszczenia w 150 PLN. |
| D-029 | 2026-10-24 | Aktualizacja dokumentacji | Wymagania i plan V1.2 zapisują odpowiedzi uzupełniające. V1.0/V1.1 są zachowane. Kolejny proponowany zakres to prototyp A PL/EN; nie rozpoczęto implementacji ani podłączenia usług. |

| D-030 | 2026-10-24 | Zatwierdzone przez użytkownika | Rozpoczęcie P2 zgodnie z V1.2 na dev, wykonanie testów i udostępnienie podglądu Vercel. Zgoda obejmuje prototyp demo, nie kolejny etap P3 ani publikację main. |
| D-031 | 2026-10-24 | Realizacja P2 | Zapis lokalny AsyncStorage, 28 fikcyjnych rzeczy i 8 ilustracji, ranking regułowy z opiniami per profil. Oba języki zachowują PLN. Przyszłe kontrakty konta, oferty i wizualizacji opisuje DATA-CONTRACTS-P2.md. |

| D-032 | 2026-10-24 | Feedback użytkowników | Kasia i Aleksy przetestowali P2; potrzebne dodatkowe okazje, np. wesele. Wymagania V1.3 rozszerzają R-19. Proszą o propozycję dalszej pracy; lista okazji i wykonanie P2.1 czekają na akceptację. |

Nowe wpisy z 2026-10-24:

| ID | Data | Status | Ustalenie |
| --- | --- | --- | --- |
| D-033 | 2026-10-24 | Zatwierdzone i wykonane | Aktualizuje D-032: P2.1 obejmuje wesele jako gość, pracę, randkę i imprezę, twardy filtr okazji i zachowanie P2. Wykonano testy i podgląd. |
| D-034 | 2026-10-24 | Odbiór i zgoda na main | Użytkownik zaakceptował P2.1 i polecił przenieść całość do main. Publikacja zachowała historię; produkcja sprawdzona w P21-PRODUCTION.md. |
| D-035 | 2026-10-24 | Zlecona wyłącznie dokumentacja | Przygotować P3: usługi, koszty, zdjęcia i ich usuwanie. Bez implementacji, tworzenia backendu lub nowych opłat. |
| D-036 | 2026-10-24 | Propozycja do akceptacji | V1.4 dzieli P3 na P3.1 prywatną szafę, P3.2 ograniczoną próbę AI i P3.3 docelowe zestawy/wizualizacje. Supabase Free/Frankfurt + Google OAuth i polityka danych są rekomendacją, nie przyjętą decyzją użytkownika. |
| D-037 | 2026-10-24 | Zatwierdzone P3.1 | Aktualizuje D-035/D-036: użytkownik zatwierdził implementację, darmowe usługi Supabase Free/Frankfurt, Google OAuth, limity i zasady V1.0, testy i Vercel dev. Bez płatnego AI, nowych abonamentów, P3.2/P3.3 i publikacji P3.1 na main. |
| D-038 | 2026-10-24 | Implementacja lokalna, chmura oczekuje | Prywatny stan jest oddzielony od demo P2. Selektywny import dotyczy wybranych profili/opinii, nie fikcyjnych ubrań. Autoryzowany odczyt zdjęć JWT, brak signed URL; RLS/CAS i trwałe sprzątanie. Wyniki lokalne nie zastępują konfiguracji OAuth/Storage i testów dwóch kont. |
| D-039 | 2026-10-24 | Zgoda na main i testy przed premierą | Aktualizuje D-002/D-037 oraz wcześniejszy warunek „main po odbiorze” w planie V1.4: użytkownik polecił przenieść P3.1 na main. Przed premierą komercyjną zatwierdzony zakres można publikować i testować na main bez osobnej akceptacji wyłącznie z powodu gałęzi. Dev pozostaje warsztatem, a `https://ubranka.vercel.app` adresem odbioru. Publikacja P3.1 i kontrola głównego adresu przeszły (P31-MAIN.md); zgoda nie oznacza odbioru funkcji ani zgody na nowe etapy lub opłaty. |
| D-040 | 2026-10-24 | Wspólne środowisko przed premierą | Dla dev/main wykorzystujemy istniejący Supabase Free `ubranka-test` we Frankfurcie i te same dwa zaproszone konta. Prywatne dane w chmurze są wspólne dla obu adresów; lokalny zapis demo pozostaje osobny. Bez nowej usługi, migracji danych ani zmiany retencji. Docelowy podział środowisk pilotażu i produkcji ustalimy ponownie przed premierą komercyjną. |
| D-041 | 2026-10-24 | Pozytywny ponowny test użytkownika | Aleksy potwierdził zadowolenie po teście poprawki usuwania; zgłoszenie zamknięte (P31-DELETION-FIX.md). Wcześniej potwierdził większość funkcji P3.1 poza logowaniem Kasi. Nie jest to potwierdzenie tego logowania, pełnej macierzy urządzeń ani zgoda na P3.2/P3.3. Następny proponowany zakres to ograniczona próba P3.2 z planu V1.4; nadal czeka na akceptację. |
| D-042 | 2026-10-24 | Zatwierdzone przygotowanie OpenAI | Użytkownik utworzył projekt Ubranka, zlecił konfigurację limitu i osobny klucz zapisany bezpiecznie lokalnie do P3.2. Parametry konta i sekret DPAPI pozostają poza Git/aplikacją/hostingiem. Brak zgody na płatne wywołania, zakupy lub zmianę rozliczeń. Proponowany budżet próby pozostaje osobny od limitu miesięcznego. |

| ID | Data | Status | Ustalenie |
| --- | --- | --- | --- |
| D-043 | 2026-10-25 | Zatwierdzenie P3.2 i wyjątek od estymacji | Aktualizuje D-041/D-042: użytkownik zatwierdził syntetyczną próbę do 12 płatnych wywołań i 25 PLN łącznie, bez automatycznych ponowień i zmian abonamentów. Po preflight jawnie polecił rozpocząć test bez pełnej estymacji, zachowując te limity. Szczegóły finansowania pozostają prywatne. |
| D-044 | 2026-10-25 | Próba wykonana, odbiór użytkowników oczekuje | 12/12 udanych wywołań, 0,432032 USD API i 2,92269648 PLN z rezerwą. Technicznie użyteczne 10/12; oba W-ELEGANT zmieniają krój spodni. Flare jest kandydatem, nie zatwierdzonym dostawcą aplikacji. Raport P32-REPORT.md i galeria /p32/ służą odbiorowi. Zgoda wyczerpana liczbą wywołań; P3.3 nie rozpoczęto. |

| ID | Data | Status | Ustalenie |
| --- | --- | --- | --- |
| D-045 | 2026-10-25 | Odbiór P3.2 i zlecone tylko planowanie | Kasia i Aleksy zaakceptowali wyniki P3.2 z ograniczeniami. Zlecili plan P3.3: wizualizacje w aplikacji, zasady danych AI i kontrola kosztów, bez implementacji oraz nowych płatnych wywołań. Aktualizuje D-044; nie odnawia limitu ani finansowania próby. |
| D-046 | 2026-10-25 | Propozycja do zatwierdzenia | V1.6 dzieli P3.3 na A: fundament z AI OFF, B: syntetyczna próba 6 wywołań / 10 PLN, C: osobno zatwierdzany pilot 30 dni / 25 PLN AI łącznie, D: późniejsze rozpoznawanie. Kandydat Flare, Supabase Edge i prywatny Storage; zasady danych AI V1.0 oraz koszty V1.5 są propozycją, nie wdrożoną konfiguracją. Rekomendowany następny zakres to wyłącznie A. |

| ID | Data | Status | Ustalenie |
| --- | --- | --- | --- |
| D-047 | 2026-10-25 | Zatwierdzone P3.3A | Aktualizuje D-045/D-046: użytkownik zatwierdził A zgodnie z V1.6: profil sylwetki, prywatny zapis zdjęcia w obecnym Supabase, zestawy z własnej szafy i przygotowanie wizualizacji z płatnym AI wyłączonym. Praca dev, testy syntetyczne, podgląd main. Bez klucza AI w chmurze, płatnych wywołań i nowych abonamentów. Zatrzymanie przed P3.3B; B/C/D nadal osobno. |

| ID | Data | Status | Ustalenie |
| --- | --- | --- | --- |
| D-048 | 2026-10-25 | Odbiór P3.3A i zlecone planowanie B | Kasia i Aleksy potwierdzili przetestowanie i zaakceptowali P3.3A. Zlecili propozycję P3.3B do zatwierdzenia, bez nowych płatnych wywołań. Aktualizuje D-047; nie oznacza aktywacji B/C, zgody na klucz AI w chmurze, nowe doładowanie ani osobnego potwierdzenia logowania Kasi. |
| D-049 | 2026-10-25 | Propozycja do zatwierdzenia | V1.7 konkretyzuje B: brakująca integracja workera/Storage/UI, sześć dozwolonych przypadków i ich hashy, 6 wysłań / 10 PLN, pierwszy pomiar z czterema wejściami, wersjonowane rezerwy/koszty, osobny klucz Edge oraz wyłączenie/unieważnienie po raporcie. Finansowanie wymaga jawnej zgody według prywatnego odczytu konta; dane realnych osób i C pozostają wyłączone. Dziś tylko dokumentacja i odczyt. |

## Konsekwencje wyboru Expo

- WWW oraz aplikacje natywne mogą współdzielić komponenty i logikę, ale nie zastępuje to testów na każdej platformie.
- Expo Go ułatwia pierwsze testy bez lokalnego Android Studio i Xcode; część późniejszych integracji wymaga development build.
- Windows nadaje się do pracy nad kodem i podglądu; budowanie iOS w chmurze jest możliwe przez EAS po konfiguracji wymaganych kont.
- Docelowa dystrybucja w sklepach mobilnych oraz związane z nią konta i koszty nie są potrzebne do pierwszego podglądu web.
- Nie wybieramy teraz monorepo ani osobnych aplikacji web/mobile; można to zmienić na podstawie rzeczywistych potrzeb.

## Źródła techniczne

Wskazane przez przegląd dokumentacji podczas inicjalizacji; wymagają ponownego sprawdzenia przy aktualizacji SDK lub hostingu.

- [Expo — tworzenie projektu i zgodność z Expo Go](https://docs.expo.dev/get-started/create-a-project/)
- [Expo — publikowanie wersji web](https://docs.expo.dev/guides/publishing-websites/)
- [Expo — development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo — EAS Build](https://docs.expo.dev/build/introduction/)

## Aktualizowanie rejestru

Przy zmianie decyzji dopisz nowy wpis z datą, statusem, powodem oraz ID zastępowanej decyzji.
Zachowaj wcześniejsze uzasadnienie. Stan wykonania i dowody testów należą do bieżącego statusu projektu,
a szczegółowy zakres produktu do wersjonowanych wymagań i planu.
