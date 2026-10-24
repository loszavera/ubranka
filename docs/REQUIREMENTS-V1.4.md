# Wymagania Ubranka — V1.4

Data: 2026-10-24. **P2.1 odebrany przez użytkownika i dopuszczony do main.
P3 poniżej jest propozycją do zatwierdzenia, nie rozpoczętą implementacją.**
Dokument uzupełnia [V1.3](REQUIREMENTS-V1.3.md) i pełną bazę [V1.2](REQUIREMENTS-V1.2.md).

## Nowe ustalenia użytkownika

- „Akceptuję P2.1” — odbiór dodatkowych okazji i dobierania zestawów.
- „Przenieś całość do main branch” — upoważnienie do publikacji odebranej wersji.
- Przygotować P3: prywatna szafa ze zdjęciami, wybór usług, koszty, przechowywanie
  i usuwanie danych. **Na razie tylko plan do zatwierdzenia.**
- Nie zmieniono celu 150 PLN/mies., 30 wizualizacji/osobę, obu rodzajów zdjęć,
  PL/EN, wymiarów/rozmiarów ani docelowego podglądu zestawu na osobie.

## Proponowane doprecyzowania P3

| Obszar | Propozycja; wymaga akceptacji |
| --- | --- |
| R-05, R-12, Q-04 | Osobne konta Kasi i Aleksego, wiele profili stylu w koncie. Szafy prywatne; bez wzajemnego udostępniania. |
| R-12, Q-03 | Dodanie zdjęcia ubrania albo ubrania na sobie, edycja i usunięcie. Pierwsza iteracja: ręczny krótki opis; rozpoznawanie AI później. |
| R-16, R-24 | Zapis w chmurze, synchronizacja między urządzeniami, osobiste PL/EN. Pierwszy odbiór na WWW w telefonie; test natywny osobno. |
| Q-04, Q-05 | Supabase Free, konkretny region Frankfurt, prywatny Storage i kontrola dostępu. Google do logowania; brak przekazywania zdjęć do AI w P3.1. |
| Q-04 | Zdjęcie w szafie pozostaje do usunięcia przez właściciela. Usunięcie obejmuje miniatury i inne warianty; ograniczenia cache i kopii dostawców ujawniamy osobno. |
| Q-08 | Dane P2 pozostają dostępne w demo. Selektywny import profili/opinii jest dobrowolny; fikcyjne ubrania nie stają się prawdziwą szafą. |
| R-04, R-13, R-20, R-22 | Pełne P3 obejmuje parametry sylwetki, rozmiary, rozpoznawanie rzeczy, zestawy z własnych ubrań i wizualizację. P3.1 jest fundamentem, nie odbiorem tych funkcji. |
| R-23, R-25, Q-09 | Darmowy backend w limitach na start; AI dopiero po osobno zatwierdzonej małej próbie jakości/kosztu. Nie gwarantujemy 60 wyników w 150 PLN przed pomiarem. |

Usługi, limity 100 rzeczy/osobę i polityka danych są rekomendacją projektową,
nie nowymi odpowiedziami z wywiadu. Google wymaga kont obu osób; nie zakładamy,
że już je mają lub wybrali tę metodę. Alternatywa email jest opisana w planie.

## Proponowany odbiór

- **A-13 / P3.1:** dwa konta są izolowane także przy bezpośrednich żądaniach API;
  ta sama osoba widzi swoją szafę na drugim urządzeniu; zmiana konta czyści lokalny widok.
- **A-14 / P3.1:** oba rodzaje zdjęć dają się dodać, poprawić i usunąć; brak EXIF/GPS
  w wysłanej kopii; anulowanie/błąd nie udaje sukcesu; test usunięcia rzeczy i konta.
- **A-15 / P3.1:** import wybranych danych P2 nie miesza kont, nie tworzy fikcyjnych
  własnych ubrań, nie usuwa lokalnej kopii i nie duplikuje ponownego importu.
- **A-06 / P3.2:** raport jakości/kosztu ograniczonej próby wizualizacji; ocena Kasi
  i Aleksego przed przekazaniem prawdziwych zdjęć do AI.
- **A-04/A-06/A-09 / P3.3:** zestawy wskazują konkretne własne rzeczy, uwzględniają
  okazję i dane profilu; wynik wizualizacji dotyczy tego zestawu. Dane, koszty
  i usunięcia mają rzeczywiste dowody, oddzielne od demonstracji.

Zakres etapów: [plan V1.4](IMPLEMENTATION-PLAN-V1.4.md). Proponowana
[polityka danych](P3-DATA-POLICY-V1.0.md) i [koszty V1.3](COST-PLAN-V1.3.md).
Wersje historyczne pozostają bez zmian.
