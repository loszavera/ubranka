# P3 — usługi i koszty V1.4

Data: 2026-10-25. Dodatek pomiarowy do [V1.3](COST-PLAN-V1.3.md).
Zastępuje wcześniejszy przykładowy koszt wizualizacji wyłącznie dla warunków
próby P3.2 opisanych poniżej. Nie zmienia usług ani abonamentów i nie potwierdza
kosztu całej aplikacji. Przebieg i ocena: [P32-REPORT.md](P32-REPORT.md).

## Pomiar P3.2

Wykonano **12 z 12 wywołań**, po sześć na model: wszystkie zakończone HTTP 200,
bez błędów i ponowień. Koszt obliczony ze zwróconego użycia API i stawek wynosi
**0,432032 USD**. To koszt zużycia tej próby, nie kwota doładowania ani
potwierdzenie obciążenia karty. Dane źródłowe:
[measurements.json](p32/measurements.json) i
[podsumowanie galerii](../public/p32/summary.json).

Warunki: bezpośrednie Images API, dwa syntetyczne obrazy wejściowe 1024×1536
(osoba i zestaw na innej osobie), `quality=medium`, `size=1024x1536`, `n=1`,
PNG, nieprzezroczyste tło. W każdej z sześciu par oba modele otrzymały
identyczny prompt i wejścia.
Zbadano snapshoty `gpt-image-2.5-sunburst-2026-09-08` oraz
`gpt-image-2.5-flare-2026-09-08`; nie generowano dodatkowych wejść płatnym AI.

| Model | Wywołania | Koszt zużycia API | Średni czas odpowiedzi | Użyteczne technicznie |
| --- | ---: | ---: | ---: | ---: |
| Sunburst | 6 | 0,216016 USD | 14,77498 s | 5/6 |
| Flare | 6 | 0,216016 USD | 12,29703 s | 5/6 |
| Łącznie | 12 | 0,432032 USD | — | 10/12 |

Każde żądanie zużyło 3072 tokeny obrazów wejściowych, 225–231 tokenów tekstu
wejściowego i 343 tokeny obrazu wyjściowego; tekst wyjściowy: 0 tokenów.
Łącznie: 36 864 tokeny obrazów wejściowych, 2728 tekstu i 4116 obrazu wyjściowego.
Stawki użyte w rozliczeniu to odpowiednio 8, 5 i 30 USD za milion tokenów.
[Dokumentacja kosztów GPT Image 2.5](https://developers.openai.com/api/docs/guides/image-generation).

```text
Koszt USD = (2728 × 5 + 36 864 × 8 + 4116 × 30) / 1 000 000
          = 0,432032 USD
Średnio na wywołanie = 0,432032 / 12 ≈ 0,036003 USD
```

Flare miał niższy średni czas w tej próbie, przy takim samym koszcie zużycia.
Sześć pomiarów na model nie gwarantuje przewagi czasu ani ceny w innych zadaniach.

## Rozliczenie limitu 25 PLN

Na potrzeby budżetu przyjęto konserwatywne przeliczenie: **5 PLN/USD × 1,23
rezerwy podatkowej × 1,10 bufora opłat = 6,765 PLN/USD**.
Próba zużyła według tej metody **2,92269648 PLN**, czyli około **2,92 PLN**
z zatwierdzonych 25 PLN. Mnożniki są rezerwą, nie potwierdzonym podatkiem,
kursem karty ani opłatą naliczoną użytkownikowi.

Dla porównania kurs średni [NBP, tabela 207/A/NBP/2026 z 23.10.2026](https://nbp.pl/statystyka-i-sprawozdawczosc/kursy/tabela-a/)
wynosił 3,9247 PLN/USD. Samo przeliczenie 0,432032 USD daje około **1,6956 PLN**
przed podatkami i opłatami. Kurs NBP również nie potwierdza faktycznego kursu
rozliczenia płatności.

Próba zmieściła się w budżecie i wyczerpała limit liczby wywołań. Pozostały
budżet nie upoważnia do dodatkowych generacji; po 12 wywołaniach nie planujemy
dalszych płatnych prób w tym zakresie. Parametry konta i finansowania pozostają
prywatne.

## Koszt użytecznego wyniku

Przegląd techniczny zakończono: **10/12 wyników uznano za użyteczne**, po pięć
na model. Według [assessment.json](p32/assessment.json) próg wynosił co najmniej
8/10 i brak błędu krytycznego. Koszt jednego technicznie użytecznego wyniku,
z uwzględnieniem kosztu dwóch odrzuconych obrazów, wyniósł:

```text
0,432032 USD / 10 = 0,0432032 USD
2,92269648 PLN / 10 = 0,292269648 PLN z przyjętą rezerwą
```

To około **0,29 PLN z rezerwą za technicznie użyteczny wynik w tej próbie**.
Odbiór całej próby z ograniczeniami potwierdzono 2026-10-25; nie zebrano osobnych
ocen każdego obrazu, więc koszt indywidualnie zaakceptowanego wyniku jest nieustalony. Techniczny sukces próby nie jest pełnym
odbiorem jakości ani gwarancją podobnego odsetka użytecznych wyników w przyszłości.

## Projekcja wyłącznie dla takich samych warunków

Poniżej średni koszt z próby pomnożono przez liczbę wywołań, przy takich samych
modelach, ustawieniach, wejściach i rozkładzie przypadków. To ekstrapolacja,
nie wykonane pomiary większego wolumenu ani gwarancja przyszłej ceny.

| Liczba wywołań | Zużycie API w USD | PLN według NBP, bez podatków/opłat | PLN z przyjętą rezerwą |
| --- | ---: | ---: | ---: |
| 60 | 2,160160 | 8,48 | 14,61 |
| 75 | 2,700200 | 10,60 | 18,27 |

**60 lub 75 wywołań nie oznacza tylu zaakceptowanych wizualizacji.** Nie znamy
jeszcze odsetka wyników zaakceptowanych przez Kasię i Aleksego. Koszt
zaakceptowanego wyniku pozostaje nieustalony; po ocenie powinien obejmować
także koszt odrzuconych obrazów i wszystkich ponowień.

Przegląd techniczny wskazał zmianę kroju spodni w W-ELEGANT dla obu modeli
oraz podwinięte rękawy w M-CASUAL dla Sunburst. Udane żądanie API nie oznacza
wiernego przeniesienia ubrania. Oceny techniczne są zapisane; użytkownicy odebrali
całą próbę z ograniczeniami (2026-10-25). Szczegóły ograniczeń opisuje [raport P3.2](P32-REPORT.md).

Projekcja nie obejmuje innych zdjęć, dodatkowych obrazów wejściowych, większej
jakości lub rozdzielczości, rozpoznawania szafy, rekomendacji, infrastruktury,
transferu, przechowywania ani abonamentów. Dwie syntetyczne osoby w studyjnym
otoczeniu nie dowodzą jakości dla rzeczywistych sylwetek i zdjęć domowych.
Wizualizacja nie potwierdza fizycznego dopasowania rozmiaru. Cel całego pilotażu
około 150 PLN/mies. i 30 zaakceptowanych wyników/osobę/mies. nadal wymaga
pełniejszej oceny; ten pomiar go nie potwierdza. P3.3 nie rozpoczęto i wymaga
osobnej zgody.
