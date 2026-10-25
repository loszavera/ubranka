# Plan implementacji Ubranka — V1.7

Data: 2026-10-25. **Propozycja P3.3B do zatwierdzenia; dziś tylko dokumentacja.**
Kasia i Aleksy zaakceptowali P3.3A. Nie rozpoczęto B, nie utworzono klucza
serwerowego i nie wykonano nowych płatnych wywołań.
[Wymagania V1.7](REQUIREMENTS-V1.7.md), [koszty V1.6](COST-PLAN-V1.6.md),
[poprzedni plan](IMPLEMENTATION-PLAN-V1.6.md), [wykonane A](P33A-VERIFICATION.md).

## Cel i rezultat do odebrania

Sprawdzić, czy aplikacja potrafi wiarygodnie ubrać fikcyjną dorosłą osobę
na podstawie **osobnych zdjęć rzeczy** oraz bezpiecznie zapisać, odczytać
i usunąć wynik. P3.2 używało jednego zdjęcia gotowego zestawu; nie dowodziło
tego nowego przepływu. B obejmuje brakującą integrację i ograniczoną próbę.

Rezultat: działający przepływ na dedykowanych syntetycznych kontach,
raport wszystkich prób i galeria do obejrzenia na telefonie, z jawnymi
ograniczeniami jakości. Płatne generowanie pozostaje niedostępne dla zwykłych
kont. Pracujemy na dev; zatwierdzony kod i galerię publikujemy na main.

## Proponowana próba

| Przypadek | Osoba | Okazja | Wejścia ubraniowe |
| --- | --- | --- | --- |
| B01 — pierwszy pomiar | Fikcyjna dorosła kobieta | Na co dzień | Góra + dół + buty |
| B02 | Fikcyjny dorosły mężczyzna | Na co dzień | Góra + dół + buty |
| B03 | Fikcyjna dorosła kobieta | Elegancko | Góra + dół + buty; ocena kroju spodni |
| B04 | Fikcyjny dorosły mężczyzna | Elegancko | Góra + dół + buty |
| B05 | Fikcyjna dorosła kobieta | Wesele jako gość | Sukienka + buty |
| B06 | Fikcyjny dorosły mężczyzna | Wesele jako gość | Góra + dół + buty |

Maks. **6 płatnych żądań / 10 PLN całej próby**, jedno żądanie naraz, najwyżej
jedno wysłanie każdego przypadku. B01 sprawdza największą liczbę wejść:
osoba + trzy rzeczy. Kalibracja, przygotowanie i płatne błędy liczą się do tych
samych limitów; brak siódmej próby, retry, automatycznej poprawki i zmiany modelu.
Próba może zakończyć się wcześniej. B nie obiecuje sześciu udanych wyników.

Wejścia powstaną lokalnie z istniejących syntetycznych ilustracji P2/P3.2:
wycinki, kadrowanie i neutralne tło bez płatnego AI. Każda rzecz osobno.
Opisujemy pozostawione fragmenty ciała lub zasłonięte detale; nie nazywamy
takich wycinków prawdziwymi zdjęciami flat-lay. Dobieramy źródła zgodne
z limitem trzech rzeczy, bez ukrytego przenoszenia czwartej warstwy z ilustracji.
Przed płatnym startem zapisujemy manifest bajtów po obróbce, kolejność,
SHA-256 wejść i promptu. Nie dostrajamy promptów po obejrzeniu pierwszych wyników.

## Model i kontrakt

Pozostaje kandydat z P3.2: **`gpt-image-2.5-flare-2026-09-08`**, bezpośrednie
Images edits, `n=1`, `quality=medium`, `size=1024x1536`, PNG, `background=opaque`,
`moderation=auto`, bez streamingu, częściowych obrazów i dodatkowego modelu tekstowego.
Nie dodajemy niepotwierdzonego dla 2.5 `input_fidelity`. Snapshot figuruje
w [dokumentacji modelu](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare);
nie zastępuje to kontroli dostępu projektu przed startem.

Do OpenAI idą wyłącznie bajty zatwierdzonych syntetycznych zdjęć i kontrolowana
instrukcja. Nie przekazujemy danych profilu, emaili, historii szafy ani publicznych
URL/Files API. Kopie wejść: do 1024×1536 i 1 MB każda, bez rozciągania i EXIF;
prompt do 2500 znaków. [Kontrakt edits](https://developers.openai.com/api/reference/resources/images/methods/edit).

## Kolejność realizacji po zatwierdzeniu

1. **Manifest i izolacja B.** Addytywne tabele/prywatne ustawienia próby oraz
   lista sześciu przypadków powiązanych z dedykowanymi kontami, rekordami,
   wersjami, hashami i parametrami. Weryfikacja przed rezerwą i tuż przed siecią.
   Dane `user_metadata` i przełącznik klienta nie uprawniają do generowania.
   Wspólny Supabase dev/main; blokady obowiązują oba adresy i bezpośredni RPC.
2. **Rzeczywiste ograniczenia próby.** Zastąpić dla B stałe przyszłego pilotażu
   z A osobnym limitem 6 wysłań, 1000 groszy, jednym wysłaniem na przypadek oraz
   oknem maks. 24 h od kontrolowanej aktywacji. Po terminie OFF; okno nie odnawia
   się automatycznie. Manifest przypisuje po trzy przypadki każdemu z dwóch
   kont, bez zwiększania istniejącego limitu pięciu prób/dobę na konto.
   C nadal ma własną, nieaktywną politykę.
3. **Worker i trwałość.** Osobna funkcja Supabase, trwałe `reserved → sent`
   przed siecią, pojedynczy zwycięzca, dokładnie jedno wywołanie transportu.
   `waitUntil` służy kontynuacji po 202, nie gwarantuje wznowienia. Awaria po
   `sent` daje wynik nieznany, bez ponowienia. Timeout OpenAI 90 s, cały przebieg
   120 s; przekroczenie lub brak usage blokuje dalszą próbę.
4. **Wynik, miejsce i usuwanie.** Zaimplementować trwały manifest przed uploadem,
   PNG ≤8 MB, miniaturę ≤100 kB, kontrolę konta/zgody/wejść przed publikacją,
   rozliczenie rzeczywistych bajtów i prywatny odczyt `no-store`. Zapisane
   syntetyczne PNG z P3.2 służą bezpłatnym testom dekodera. Domknąć eksport,
   wygasanie po 30 dniach, anulowanie, spóźniony wynik i istniejące sprzątanie.
   Nie wystarczy aktualne `result:null` ani transport zdjęć JPEG ≤1 MB.
5. **Minimalny przepływ UI.** Dopuszczone konto testowe widzi dokładne wejścia,
   rezerwę i jawny przycisk. UUID powstaje przed pierwszym POST; odświeżenie
   odczytuje to samo zadanie. Wynik, pobranie, usuwanie i ocena wierności są
   oddzielne od polubienia stylizacji. Zwykłe konta widzą AI OFF.
6. **Kontrole bez płatnego AI.** Check, testy domeny/backendu, Deno, build:all,
   E2E PL/EN i CI; następnie hosted RPC/Storage na dedykowanych fixture.
   Sprawdzić podmienione konto/hash/parametr, dwa UUID tego samego przypadku,
   siódme żądanie, konkurencję, utratę 202, timeout, brak usage, pełny magazyn,
   wygasanie i usunięcie podczas zapisu. Adapter testowy tylko lokalnie/CI;
   bez produkcyjnego generatora atrap lub fallbacku do obrazka P3.2.
7. **Dostęp i finansowanie.** Po powyższych kontrolach: odczyt aktualnych zasad
   i finansowania, nowy osobny ograniczony klucz B w projekcie OpenAI Ubranka,
   wyłącznie w sekretach istniejącego Supabase. Minimalne prawa Images edits
   i ewentualnie odczyt modelu, krótka ważność (proponowane 7 dni). Klucz lokalny
   P3.2 pozostaje lokalny; bez klucza w Git, przeglądarce, EXPO_PUBLIC czy Vercel.
   Brak możliwości ustawienia potrzebnych uprawnień wymaga wyjaśnienia,
   nie rozszerzenia do wszystkich usług. Nie zmieniamy planów ani rozliczeń.
8. **Sześć pomiarów i zamknięcie.** Po B01 rozliczyć pełne usage i ustalić
   rezerwę według planu kosztów przed B02. Wykonać resztę tylko przy spełnieniu
   warunków. Na końcu OFF, unieważnienie dedykowanego klucza B i usunięcie go
   z sekretów, raport/galeria, sprzątanie kont testowych i potwierdzenie braku
   ich rekordów/plików/Auth. Nie wywoływać globalnego cleanupu ręcznie.

## Ograniczenia środowiska i warunki zatrzymania

Supabase Free: 150 s życia workera, 2 s CPU bez oczekiwania na I/O i 256 MB RAM;
brak `sharp/libvips` oraz Web Workers. Wybór dekodera zgodnego z Edge wymaga
bezpłatnego testu maksymalnego obrazu/odpowiedzi przed wgraniem klucza.
Jeżeli telemetria CPU/RAM nie jest dostępna, zapisać to w raporcie, a nie
deklarować zmierzonego zapasu. Znane przekroczenie lub brak podstaw do bezpiecznego
dekodowania zatrzymuje płatny start. [Limity](https://supabase.com/docs/guides/functions/limits),
[praca w tle](https://supabase.com/docs/guides/functions/background-tasks).

Przekroczenie limitu, timeout po wysłaniu, brak rozliczenia, naruszenie manifestu
lub zakresu danych, wyczerpanie Free albo niedozwolone finansowanie kończą/wstrzymują próbę.
Słaba jakość poprawnie rozliczonego syntetycznego wyniku jest oceniana i raportowana;
sama nie wymaga powtórzenia ani nie blokuje pozostałych zarejestrowanych przypadków.
Nie zmieniamy modelu, hostingu, budżetu ani abonamentu w celu dokończenia sześciu
obrazów. Czas generacji nie jest SLA; przerwanie klienta nie cofa kosztu dostawcy.

## Raport, dane syntetyczne i odbiór

Raport zapisuje każde wysłanie: hash wejść/promptu/wyjścia, parametry, usage,
koszt USD i PLN, rezerwę, czas pobierania/generowania/zapisu, rozmiary i błędy.
Ocena jak w P3.2: osoba, ubrania, kompletność, anatomia/artefakty, użyteczność,
każde 0–2. Próg ≥8/10 i bez błędu krytycznego (zmiana osoby, pominięcie rzeczy,
istotna zmiana kroju). Sukces B wymaga ≥5 z 6 przypadków oraz kontroli prywatności,
kosztów i usuwania. Próby brakujące/nieudane nie znikają z mianownika.
Następnie Kasia i Aleksy oceniają przydatność; wynik techniczny nie uruchamia C.

Prywatne obiekty testowe usuwamy po wykonaniu kopii raportowej, najpóźniej
zgodnie z limitem retencji. Galeria `/p33b/` na main zawiera wyłącznie świadomie
publikowane materiały fikcyjne i ich ograniczenia, bez kont, kluczy czy salda.
Materiały raportowe w repozytorium pozostają jako historia badań; nie są objęte
30-dniową retencją prywatnych wyników. To nie jest zgoda na publiczne zdjęcia
użytkowników. Dane kont usług i szczegóły finansowania pozostają poza Git.

## Zgoda potrzebna przed realizacją

Jedna zgoda może objąć integrację, bezpłatne kontrole, dedykowany klucz serwerowy,
syntetyczne wejścia do OpenAI, próbę 6/10 PLN z opisanymi granicami rezerwy,
publikację raportu/galerii na main oraz zamknięcie dostępu B. Sposób finansowania
musi być jawnie podany w tej samej rozmowie; wcześniejsza zgoda P3.2 nie wystarcza.
**Do otrzymania tej zgody pozostają wyłącznie planowanie i odczyt.**
Po raporcie zatrzymanie przed C i prywatnymi zdjęciami, także przy sześciu dobrych wynikach.
