# Wymagania Ubranka — V1.3

Data: 2026-10-24. Aktualizacja po teście P2 przez Kasię i Aleksego.
Potwierdzona nowa potrzeba: dodatkowe okazje, np. „wesele”. Użytkownicy chcą
kontynuować budowę i proszą o propozycję następnego etapu.

Ten dokument jest przyrostową aktualizacją [V1.2](REQUIREMENTS-V1.2.md).
Wszystkie wymagania, ograniczenia i kryteria V1.2 nadal obowiązują, z poniższym
rozszerzeniem R-19. V1.2 pozostaje pełną bazą; nie zmieniono jej historycznej treści.

## Potwierdzone wymaganie

| ID | Aktualizacja | Granica ustalenia |
| --- | --- | --- |
| R-19 | Aplikacja obsługuje dodatkowe okazje poza dotychczasowym codziennym/eleganckim ubiorem, w tym wesele. | Feedback po P2. Użytkownicy nie podali zamkniętej listy okazji, roli na weselu ani szczegółowego dress code'u. |

Potwierdzenie wykonania testu nie oznacza przeprowadzenia wszystkich kryteriów
technicznych ani testu natywnego iOS/Android. Nie zgłoszono innych uwag w tej wiadomości.

## Proponowana realizacja do akceptacji z P2.1

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

Lista nowych okazji, rola gościa i powyższy sposób realizacji są propozycją,
nie dodatkowymi odpowiedziami użytkowników. P2.1 czeka na akceptację wykonania.

## Proponowany odbiór A-12

Po wybraniu „wesele” w PL lub EN użytkownik otrzymuje najwyżej dwa kompletne
zestawy oznaczone jako odpowiednie na tę okazję i mieszczące się w budżecie,
albo czytelny brak wyników. Zmiana okazji nie usuwa preferencji profilu. Zapis
z P2 odtwarza się bez utraty danych. Dowody obejmują testy reguł, przepływ WWW
i podgląd Vercel; nie są dowodem profesjonalnej porady lub wirtualnej przymiarki.

## Historia

V1.3 dodaje feedback po P2 oraz proponowany A-12. Pełna historia wcześniejszych
ustaleń i kryteriów znajduje się w [V1.2](REQUIREMENTS-V1.2.md).
Zakres wykonania opisuje [plan V1.3](IMPLEMENTATION-PLAN-V1.3.md).
