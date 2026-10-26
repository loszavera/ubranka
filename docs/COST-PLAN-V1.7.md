# Koszty Ubranka — V1.7: propozycja P3.3C

Data: 2026-10-26. Zastępuje propozycję limitów C z [V1.5](COST-PLAN-V1.5.md);
[V1.6](COST-PLAN-V1.6.md) zachowuje historyczny zakres B.
**Aktualizacja 2026-10-26: C1 zatwierdzone do implementacji z kosztem AI 0,
bez klucza AI w chmurze i nowych abonamentów. C2 nadal oczekuje na zgodę.**

## Co wiemy, a czego jeszcze nie zmierzono

B: 6/6 udanych wywołań, koszt API 0,214403 USD, konserwatywny zapis 1,49 PLN.
Jedna próba zajęła 0,22–0,28 PLN budżetu. Prosta ekstrapolacja 60 podobnych
żądań daje **14,90 PLN według średniej B lub 16,80 PLN według maksimum B**.
To ilustracja na syntetycznych wejściach, nie wycena prywatnych zdjęć ani
gwarancja. Cena zależy od usage i może być inna. [Raport B](P33B-REPORT.md).

Proponowany model i parametry bez zmiany względem B:
`gpt-image-2.5-flare-2026-09-08`, Images edits, jedno PNG 1024×1536, medium,
bez streamingu, dodatkowego modelu tekstowego i Files API. Miniaturę tworzy
enkoder z istniejącego wyniku, bez kosztu generacji.

Stawki Standard sprawdzone 2026-10-26: tekst wejściowy 5 USD, obraz wejściowy
8 USD, obraz wyjściowy 30 USD za milion tokenów; nie zakładamy rabatu cache/Batch.
Nie używamy kalkulatora starego modelu do estymacji tokenów Flare.
[Oficjalny opis i ceny modelu](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare).

## Limity proponowanego pilotażu

| Zakres | Proponowana granica |
| --- | --- |
| C1 | 0 wywołań AI; istniejący Supabase Free i hosting, bez nowego abonamentu. Przetwarzanie plików/testy zużywają obecne zasoby; nie aktywować płatnych rozszerzeń. |
| C2 — czas | 30 kolejnych dni od zatwierdzonej aktywacji zapisanej na serwerze; bez automatycznego przedłużenia. |
| C2 — koszt | 25 PLN łącznie dla obu kont i całego okresu, również przez granicę miesięcy; dodatkowo dotychczasowy wspólny próg aplikacji 25 PLN/miesiąc UTC. Nie resetujemy wydatków B w tym samym miesiącu ani nie dodajemy drugiego miesięcznego limitu. |
| C2 — wysłania | Maks. 60 łącznie, 30 na każde z dwóch kont w całym pilotażu i 5/konto/dobę UTC. Błędy także zajmują slot. Bez retry, ręcznego ponowienia tej samej operacji ani rezerwy dodatkowych 40 prób/konto. |
| Równoległość | Jedno żądanie globalnie; niejawna kolejka i automatyczny fallback wyłączone. |
| Miejsce | Maks. 30 aktywnych wyników i 100 MB AI/konto w istniejących 250 MB całego konta; istniejące pliki i rezerwy liczą się razem. Maks. 8 MB oryginał + 100 kB miniatura. |

To limity maksymalne, nie obietnica 30 dobrych obrazów na osobę. Kwota lub miejsce
mogą zatrzymać pilot wcześniej. Usunięcie/odrzucenie wyników, wylogowanie,
reinstalacja, nowe UUID i zmiana dnia/miesiąca nie zwracają wykorzystanych prób
ani kosztów całego pilotażu. Nowe świadome zlecenie w C2 musi mieć odrębne wejścia
lub zestaw; nie może być ponowieniem nieznanej/nieudanej operacji.

## Rezerwacja i granica gwarancji

Pierwsze prywatne żądanie rezerwuje **cały obecnie dostępny budżet** — mniejszy
z pozostałego limitu C2 i wspólnego miesiąca — aż do odczytu usage.
Przykład: jeżeli z 25 PLN miesiąca rozliczono tylko B za 1,49 PLN, dostępne
jest 23,51 PLN; nie zerujemy tej historii, by zarezerwować pełne 25 PLN.
To przykład, nie bieżący odczyt salda. Kolejna rezerwa to co najmniej
`max(1 PLN, 2 × największy rozliczony
koszt C + 0,20 PLN)`, zaokrąglona w górę do groszy. Dopiero rzeczywisty pomiar C
ustala dalsze rezerwy; średnia B nie zastępuje rozliczenia prywatnego wejścia.
Admission: koszt rozliczony + aktywne rezerwy + nowa rezerwa ≤ dostępny limit.

Rozliczenie jak B: rzeczywiste tokeny × stawki zatwierdzonej wersji cennika,
USD zachowane bez utraty precyzji, budżet PLN zaokrąglany w górę per żądanie.
Roboczy mnożnik 6,765 PLN/USD (5 × 1,23 × 1,10) to bufor kursu/podatku,
nie faktyczny kurs ani stawka podatkowa konta. Sprawdzić adekwatność przed C2;
nie zmieniać go w dół, aby zmieścić więcej wywołań.

Brak usage, nieznany wynik wysłania, rzeczywisty koszt powyżej rezerwy albo
wyczerpanie limitu blokuje następne operacje. Nie zerować rezerwy po timeout.
Żądanie już wysłane rozliczamy także po końcu okresu, wycofaniu zgody lub
usunięciu konta; dane zdjęciowe nadal podlegają usunięciu.

**25 PLN jest egzekwowaną granicą dopuszczania nowych żądań w aplikacji,
nie gwarancją maksymalnej ceny już przyjętego wywołania API.** Pierwsza próba
może przekroczyć rezerwę; nie ma parametru ceny maksymalnej żądania w używanym
kontrakcie. C2 wymaga akceptacji tej granicy. Twardego limitu faktury nie
przedstawiać jako wdrożonego na podstawie samego budżetu aplikacji.

## Finansowanie i zakończenie

Nie odczytywano dziś salda ani ustawień konta i niczego nie zmieniano. Zgoda na
doładowanie B była ograniczona do B; nie finansuje automatycznie C. Przed C2
potrzebny aktualny odczyt oraz osobna konkretna zgoda na ewentualne obciążenie.
Jeżeli istniejące ustawienia mogą wywołać niezatwierdzone doładowanie albo
granic nie można potwierdzić, płatnego startu nie będzie. Nie zmieniać ustawień
rozliczeń/abonamentów w celu obejścia tej przeszkody.

Nowy ograniczony klucz C tylko w sekretach Supabase; po końcu OFF, unieważnienie
i usunięcie sekretu. Liczniki B pozostają zamknięte. Raport C podaje wszystkie
wysłania, błędy, czas, usage, koszty i braki pomiaru; bez prywatnych zdjęć
i danych rozliczeniowych konta w publicznym repozytorium.
