# Wymagania Ubranka — V1.6

Data: 2026-10-25. Dodatek do [V1.5](REQUIREMENTS-V1.5.md).
**P3.2 odebrane przez Kasię i Aleksego z opisanymi ograniczeniami. Zatwierdzono
wyłącznie przygotowanie planu P3.3, bez implementacji i nowych płatnych wywołań.**
Poniższe rozszerzenia są propozycją do zatwierdzenia, nie działającymi funkcjami.
[Plan V1.6](IMPLEMENTATION-PLAN-V1.6.md), [dane AI](P33-AI-DATA-POLICY-V1.0.md),
[koszty V1.5](COST-PLAN-V1.5.md).

## Wynik odebrany i granica dowodów

Odebrano [próbę P3.2](P32-REPORT.md): 12 wywołań, 0,432032 USD, technicznie
użyteczne 10/12. Odbiór całej próby nie oznacza indywidualnej akceptacji każdego
obrazu ani obietnicy dopasowania rozmiaru. Dwa obrazy zmieniły krój spodni.
Testowano zdjęcie osoby i gotowy zestaw na drugim zdjęciu. Zdjęcia kilku
osobnych rzeczy oraz rzeczywistych osób wymagają kolejnego sprawdzenia.

## Proponowany zakres produktu

| ID | Wymaganie P3.3 |
| --- | --- |
| R-33 | „Moja sylwetka / My fit”: jeden prywatny profil ciała na konto, wspólny dla profili stylu. Opcjonalny wzrost, obwody klatki/talii/bioder w cm, rozmiary góry/dołu/butów i system rozmiarów; brak danych pokazujemy wprost. Jedno aktualne zdjęcie całej dorosłej osoby, podgląd, wymiana, usunięcie. Bez automatycznego odgadywania wymiarów. |
| R-34 | „Dobierz zestawy”: profil stylu + okazja → maksymalnie dwa kompletne zestawy z aktywnych własnych rzeczy. Najpierw filtr okazji, następnie preferencje i opinie. Ręczna zamiana rzeczy. Braki dają jedną propozycję lub opis brakującej kategorii, bez dopisywania fikcyjnych rzeczy. |
| R-35 | Pierwsze obsługiwane komplety: góra + dół + buty albo sukienka + buty, opcjonalnie warstwa przy maks. trzech rzeczach. Pełne zestawy z większą liczbą elementów, akcesoria i inne kategorie pozostają w szafie; ta wizualizacja ich nie obsługuje i niczego nie pomija po cichu. |
| R-36 | Rzeczy własne oznaczają 0 PLN nowych zakupów. Tryb ekonomiczny/markowy pozostaje w demo, a dla zakupów wraca z P4. Nie tworzymy sztucznego porównania cen w prywatnej szafie. |
| R-37 | Polubienie uczy gustu; odrzucenie ma opcjonalny powód. Kolejna para na prośbę. Ocena błędu wizualizacji jest osobna od oceny stylizacji i nie zmienia automatycznie gustu. |
| R-38 | „Zobacz na mnie / Visualise on me”: użytkownik wybiera jeden zestaw i widzi dokładne zdjęcie osoby oraz 1–3 zdjęcia rzeczy do przekazania. Dla kompletów z R-35 normalnie 2–3 rzeczy; pojedynczą rzecz dopuszczamy wyłącznie jako jawnie opisany test/niepełną stylizację. Jeden przycisk generuje jeden obraz. |
| R-39 | Pierwsza zgoda AI jest oddzielna od zapisu zdjęć w Supabase. Każde wywołanie wymaga świadomego potwierdzenia widocznych wejść i rezerwy kosztu. Brak generowania przy otwarciu strony, głosowaniu, przewijaniu, zmianie języka lub profilu. |
| R-40 | Po odświeżeniu wraca to samo zadanie, nie nowe wywołanie. Brak automatycznych ponowień i przełączania modelu. Przy nieznanym wyniku/koszcie pokazać stan wymagający wyjaśnienia, zachować rezerwę i zablokować nowe wysyłki. |
| R-41 | Wynik jest prywatny, oznaczony jako AI, obok zdjęć odniesienia i informacji „Wizualizacja nie potwierdza rozmiaru”. Można pobrać, ocenić i usunąć. Usunięte wejście blokuje zadania oraz usuwa powiązane wyniki; spóźniona odpowiedź nie przywraca danych. |
| R-42 | Własne limity egzekwuje serwer we wspólnej bazie, nie sam przycisk. Płatne błędy i ręczne nowe próby są liczone. Użytkownik widzi liczbę wyników, prób i zużyty/zarezerwowany budżet. Szczegóły: koszty V1.5. |

PL/EN, spokojny wygląd A, istniejące okazje, profile i dane P2/P3.1 pozostają.
Zdjęcie nie jest wymagane do samego doboru zestawów. Ręczne rozmiary pomagają
filtrować oczywiste rozbieżności, ale nie dowodzą fizycznego dopasowania.

## Etapy i odbiór

- **P3.3A — proponowany następny zakres:** profil, własne zestawy, ekrany i trwałe
  zadania z testowym dostawcą; płatne AI wyłączone na serwerze, bez klucza AI.
  Przykład syntetyczny jest podpisany jako przykład, nigdy jako wynik zdjęć użytkownika.
- **P3.3B — osobna zgoda:** krótka próba rzeczywistych wywołań na syntetycznych
  zdjęciach osobnych ubrań, do 6 wywołań / 10 PLN łącznie, bez ponowień.
- **P3.3C — osobna zgoda po B:** ograniczony pilotaż prywatnych zdjęć dwóch osób,
  z osobistą zgodą każdego konta na dane AI i określonym czasem/budżetem.
- **P3.3D — późniejsza propozycja:** automatyczne rozpoznawanie zdjęć rzeczy
  z korektą. Wymaganie z V1.4 pozostaje; nie jest spełnione przez ręczne opisy
  ani opłacone próbą generowania. Model, dane i budżet wymagają osobnego planu.

Kryteria A: izolacja kont, zachowanie danych, prawdziwy dobór z własnej szafy,
PL/EN, stany anulowania/błędu/limitu, brak połączeń AI, testy konkurencji i usuwania.
Kryteria B: jawny raport wszystkich prób, wierność rzeczy i osoby, działanie
w limicie czasu serwera i rozliczenie kosztu. Proponowany próg: ≥5/6 technicznie
użytecznych (≥8/10 bez błędu krytycznego), następnie odbiór użytkowników.
Nieudana próba B nie uruchamia automatycznie następnego testu lub P3.3C.

## Poza obecną zgodą

Nie rozpoczęto kodowania, migracji, konfiguracji usług, tworzenia/przenoszenia
kluczy, przesyłania zdjęć do AI ani nowych wywołań. Bez nowych abonamentów,
automatycznych zakupów, katalogów sklepów, treningu na zdjęciach i zmian rozliczeń.
Akceptacja P3.2 nie odnawia jej wykorzystanego limitu ani zgody na doładowanie.
Nie zmienia również niepotwierdzonego statusu logowania Kasi w P3.1.
