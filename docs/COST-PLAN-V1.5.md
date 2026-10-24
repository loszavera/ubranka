# P3.3 — plan kontroli kosztów V1.5

Data: 2026-10-25. **Propozycja, bez aktywacji opłat.** Pomiar historyczny:
[V1.4](COST-PLAN-V1.4.md). Zakres: [plan V1.6](IMPLEMENTATION-PLAN-V1.6.md).
Nie zmieniamy bieżących ustawień konta OpenAI, finansowania ani abonamentów.
Pozostałe środki z P3.2 nie są zgodą na dalsze wywołania.

## Punkt odniesienia

P3.2 kosztowało 0,432032 USD / 12 prób: średnio około 0,036 USD na obraz,
budżetowo 0,24 PLN. 60 identycznych wywołań odpowiadałoby około 14,61 PLN
z dotychczasową rezerwą. To nie cena 60 poprawnych obrazów z osobnych rzeczy:
nowa liczba/rodzaj wejść, zdjęcia domowe i odrzucenia nie zostały jeszcze zmierzone.

Kandydat: `gpt-image-2.5-flare-2026-09-08`, bezpośrednie Images API,
`n=1`, `quality=medium`, `size=1024x1536`, PNG, tło opaque, moderacja auto.
Stawek 5/8/30 USD za milion tokenów tekstu wejścia / obrazu wejścia / obrazu
wyjścia używamy do obliczeń ze zwróconego usage; bez założenia zniżki cache.
Nie dodajemy modelu tekstowego, płatnej bramki ani automatycznego fallbacku.
[Model](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare),
[rozliczanie obrazów](https://developers.openai.com/api/docs/guides/image-generation#cost-and-latency).

## Proponowane granice kolejnych zgód

| Etap | Zasięg proponowanej zgody |
| --- | --- |
| P3.3A | 0 wywołań AI, bez klucza w chmurze. Istniejące usługi Free i bieżący hosting, bez nowych abonamentów. |
| P3.3B | Maks. 6 wywołań i 10 PLN całej próby syntetycznej, łącznie z przygotowaniem i błędami. Bez ponowień; tylko jedno żądanie naraz. Przed startem osobna zgoda z aktualnym sposobem finansowania. |
| P3.3C | Propozycja pierwszego pilotażu na 30 dni: 25 PLN łącznie na AI dla obu kont, dodatkowo miesięczny próg aplikacyjny 25 PLN. Bez automatycznego przedłużenia pilotażu lub zwiększenia budżetu. Aktywacja dopiero po odrębnej zgodzie. |

Dla C proponujemy 30 gotowych wizualizacji na konto/miesiąc, maks. 40 wysłanych
prób na konto/miesiąc i 5 prób/dobę. Okresy miesięczne/dobowe liczymy w UTC
i pokazujemy datę resetu w czasie lokalnym. Cała próba C nadal kończy się po
30 dniach albo po zużyciu 25 PLN łącznie, także gdy obejmie dwa miesiące.
30 gotowych wyników jest limitem technicznym, nie obietnicą 30 wyników zaakceptowanych.
Pierwotny cel użytkowników pozostaje celem jakościowym; poprawki również kosztują.
Usunięcie/odrzucenie obrazu nie przywraca wykorzystanych liczników.

Limity prób i wyników mogą zatrzymać pracę wcześniej niż kwota; para dwóch
wizualizacji to dwa osobne wywołania. Pierwsze UI generuje tylko wybrany jeden
zestaw. Dobór regułami i oglądanie zapisanych wyników nie wywołują płatnego AI.
Nie uruchamiamy automatycznych e-maili/alertów do innych osób; licznik i komunikaty
są w aplikacji. Właściciel ma zbiorczy odczyt kosztów bez zdjęć drugiej osoby.

## Rezerwa i rozliczenie

1. Serwer w jednej transakcji blokuje wspólny wiersz budżetu i licznik konta,
   sprawdza upoważniony okres, próby/wyniki, dostępne miejsce, zgodę i wejścia.
   Warunek przyjęcia: koszt rozliczony + wszystkie rezerwy + nowa rezerwa ≤ limit.
2. Dla pilota proponujemy rezerwę **1 PLN na jedno żądanie**, do potwierdzenia
   pomiarami B. To estymacja zabezpieczająca dopuszczanie kolejnych prób,
   nie udokumentowane maksymalne obciążenie jednego żądania przez OpenAI.
   W B pierwsze niemierzone żądanie blokuje cały pozostały budżet próby do odczytu
   usage; dalszą rezerwę dobieramy do pomiaru. Wyjątek estymacji P3.2 nie przenosi
   się automatycznie na nową zgodę.
3. Jedna globalna operacja generowania naraz, najwyżej jedno aktywne zadanie
   użytkownika. Przy zajętości informacja i brak wysyłki, bez niejawnej kolejki
   nowych płatnych operacji. Klientowy klucz idempotencji powstaje przed pierwszym
   POST; także przy utracie odpowiedzi powtórzenie tego klucza tylko odczytuje stan.
4. Przed siecią zapis trwałego stanu wysłania; rozliczenie po kompletnym usage.
   Kwoty przechowujemy w całkowitych mikrodolarach i konserwatywnie zaokrąglonych
   groszach. Początkowy przelicznik budżetu: 5 × 1,23 × 1,10 = 6,765 PLN/USD.
   Kurs/rezerwy są wersjonowane przy zadaniu, nie zmieniane wstecz.
5. Błąd po wysłaniu, timeout, urwany wynik lub brak usage: nie traktować jako
   0 PLN. Rezerwa zostaje, koszt „niepotwierdzony”, nowe wywołania globalnie
   zablokowane do ręcznego wyjaśnienia. Bez ponownej generacji przez worker/SDK.
   Rezerwy nie zwalnia sam upływ czasu, usunięcie konta ani zmiana miesiąca.
6. Gdy koszt przekroczy rezerwę, zapisać pełny koszt i wstrzymać dalsze wysyłki;
   nie obcinać kwoty do limitu. Podniesienie rezerwy, zmiana modelu/jakości/liczby
   wejść wymaga aktualizacji planu. Potwierdzony brak wysłania pozwala zwolnić rezerwę.

Na ekranie: wyniki 0/30, próby 0/40, wykorzystany i zarezerwowany budżet, data
resetu/końca pilotażu; „Ponów” nigdy nie jest ukrytym retry. Nowa świadoma próba
ma nowy identyfikator, nową rezerwę i zajmuje kolejny limit. Limity globalne
obejmują także zatwierdzone testy administratora oraz dev, bez osobnego obejścia.

## Granice gwarancji i koszt całej aplikacji

Images edits nie udostępnia parametru maksymalnego kosztu. Stałe parametry,
4 obrazy maksymalnie i ograniczony prompt nie stanowią dowodu górnej ceny.
Rezerwa 1 PLN nie jest gwarancją, że pojedyncza trwająca operacja jej nie przekroczy.
OpenAI opisuje egzekwowane limity wydatków, ale blokada może zadziałać z opóźnieniem.
Własny limit aplikacji kontroluje nowe wysyłki; nie gwarantuje końcowej faktury
PLN przy opóźnionych danych, kursie, podatkach i opłatach.
[API edits](https://developers.openai.com/api/reference/resources/images/methods/edit),
[limity dostawcy](https://developers.openai.com/api/docs/guides/spend-limits).

Nie zmieniamy obecnego limitu projektu ani finansowania. Przed B/C odczytujemy
stan konta, ważność klucza, zasady rozliczeń i zdolność wykonania zatwierdzonej
próby. Jednorazowa zgoda na finansowanie P3.2 nie obejmuje nowych doładowań.
Jeżeli bieżące finansowanie może wywołać nowe obciążenie, konkretna zgoda na B/C
musi je osobno obejmować; nie wolno zacząć i dopiero potem o tym informować.

Cel całej aplikacji około 150 PLN/mies. pozostaje odrębny od budżetu AI.
Przechowywanie, odczyty zdjęć, eksport i funkcje serwerowe zużywają limity usług
także bez generowania. Nie potwierdzamy kosztu infrastruktury na podstawie P3.2.
Przed C sprawdzić wykorzystanie istniejących usług; przy wyczerpaniu Free
wstrzymać operacje, bez automatycznego upgrade. Warunki komercyjnego hostingu
sprawdzimy przed premierą. Rozpoznawanie zdjęć w P3.3D wymaga osobnego budżetu.
