# Wymagania Ubranka — V1.3

Data: 2026-10-24. Aktualizacja po teście P2 przez Kasię i Aleksego.
Po zgłoszeniu dodatkowych okazji użytkownik zatwierdził P2.1: wesele jako gość,
praca, randka i impreza, dobór zestawów, zachowanie danych P2, testy i podgląd dev.

Ten dokument jest przyrostową aktualizacją [V1.2](REQUIREMENTS-V1.2.md).
Wszystkie wymagania, ograniczenia i kryteria V1.2 nadal obowiązują, z poniższym
rozszerzeniem R-19. V1.2 pozostaje pełną bazą; nie zmieniono jej historycznej treści.

## Potwierdzone wymaganie

| ID | Aktualizacja | Granica ustalenia |
| --- | --- | --- |
| R-19 | Poza codziennym/eleganckim ubiorem aplikacja obsługuje wesele jako gość, pracę, randkę i imprezę oraz dobiera zgodne zestawy. | P2.1 zatwierdzony 2026-10-24. Szczegółowy dress code nie jest ustalony; przykłady weselne wymagają uwzględnienia zaproszenia. |

Potwierdzenie wykonania testu nie oznacza przeprowadzenia wszystkich kryteriów
technicznych ani testu natywnego iOS/Android. Nie zgłoszono innych uwag w tej wiadomości.

## Zatwierdzona realizacja P2.1

- Rozszerzyć wybór o wesele (na początek jako gość), pracę, randkę i imprezę.
  Zachować dotychczasowe wybory; nowe etykiety dostępne w PL/EN.
- Rozdzielić trwały profil gustu od okazji wybieranej na bieżącą rundę.
  Zmiana okazji nie wymaga tworzenia kolejnego profilu; profil może pamiętać
  domyślną okazję, którą użytkownik zmienia przed rozpoczęciem wyboru.
- Okazja określa dopuszczalne zestawy. Dopiero wśród nich ranking uwzględnia
  gust i priorytety. Nie pokazywać niepasującego zestawu tylko dla wypełnienia pary.
- Zachować maksymalnie dwie propozycje, oba tryby, budżet z dostawą, własne rzeczy
  po 0 PLN, opinie oraz uczciwy stan pusty. Dane nadal demonstracyjne.
- Zachować zapisane profile, język, własność rzeczy i opinie przy aktualizacji modelu.

Lista okazji i powyższy zakres zostały zaakceptowane bezpośrednią wiadomością
użytkownika. Bieżąca okazja rundy nie jest zapisywana; po odświeżeniu lub zmianie
profilu wraca jego domyślna okazja. Domyślną okazję można zmienić w edytorze profilu.

## Kryterium odbioru A-12

Po wybraniu „wesele” w PL lub EN użytkownik otrzymuje najwyżej dwa kompletne
zestawy oznaczone jako odpowiednie na tę okazję i mieszczące się w budżecie,
albo czytelny brak wyników. Zmiana okazji nie usuwa preferencji profilu. Zapis
z P2 odtwarza się bez utraty danych. Dowody obejmują testy reguł, przepływ WWW
i podgląd Vercel; nie są dowodem profesjonalnej porady lub wirtualnej przymiarki.

## Historia

V1.3 dodaje feedback po P2 oraz A-12; 2026-10-24 uzupełniono akceptację P2.1.
Pełna historia wcześniejszych
ustaleń i kryteriów znajduje się w [V1.2](REQUIREMENTS-V1.2.md).
Zakres wykonania opisuje [plan V1.3](IMPLEMENTATION-PLAN-V1.3.md).
