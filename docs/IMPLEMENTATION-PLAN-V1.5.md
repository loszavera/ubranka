# Plan implementacji Ubranka — V1.5

Data: 2026-10-25 (Europe/Warsaw). Dodatek do
[planu V1.4](IMPLEMENTATION-PLAN-V1.4.md), zgodny z
[wymaganiami V1.5](REQUIREMENTS-V1.5.md). Użytkownik zatwierdził P3.2;
próbę wykonano technicznie. P3.3 pozostaje niezatwierdzone i nie rozpoczęto go.
Dokument zachowuje plan i podsumowanie wykonania; pełne dowody zawiera
[raport P3.2](P32-REPORT.md).

## Bieżący stan: wykonano technicznie, odbiór oczekujący

Wykonano **12/12 wywołań**, bez błędów i ponowień. Koszt użycia API wyniósł
**0,432032 USD**, a rozliczenie budżetu z rezerwą **2,92269648 PLN z 25 PLN**.
Przegląd uznał **10/12 wyników za użyteczne technicznie**. Dwa obrazy W-ELEGANT
odrzucono z powodu istotnej zmiany kroju spodni. Wynik techniczny nie oznacza
odbioru: ocena Kasi i Aleksego pozostaje oczekująca. Kwota z rezerwą nie jest
potwierdzeniem obciążenia karty.

Limit wywołań został wyczerpany; nie planujemy następnych płatnych prób.
P3.3 nie rozpoczęto. Szczegóły: [raport](P32-REPORT.md),
[pomiary](p32/measurements.json), [oceny](p32/assessment.json)
i [koszty V1.4](COST-PLAN-V1.4.md).

## Historia warunku estymacji

Historyczny [preflight](P32-PREFLIGHT.md) zatrzymał wykonanie przy **0/12
wywołań, 0 USD i braku wygenerowanych wyników**. Nie potwierdzono wiarygodnej
górnej estymacji kosztu obrazów wejściowych.

Następnie, 2026-10-25, użytkownik jawnie polecił testować niezależnie od szacunku.
Przyjęto wyjątek od warunku uzyskania wiarygodnej górnej estymacji przed
rozpoczęciem próby. Limity 12 wywołań i 25 PLN pozostały bez zmian.
Wykonano jedno żądanie naraz, rozliczając zwrócone użycie przed kolejnym.
Wyjątek nie dopuścił automatycznych ponowień ani nie stanowił matematycznej
gwarancji maksymalnego kosztu pojedynczego żądania.

## Macierz próby P3.2

Używamy istniejących zasobów `assets/outfits/`, opisanych w
[P2-ASSETS.md](design/P2-ASSETS.md) i [P21-ASSETS.md](design/P21-ASSETS.md).
Pierwszy obraz wskazuje osobę, drugi pełny zestaw na innej fikcyjnej dorosłej
osobie. Nie generujemy nowych wejść płatnym AI.
Wykonywalny opis przypadków: [cases.json](p32/cases.json).

| Przypadek | Osoba | Zestaw referencyjny | Porównanie |
| --- | --- | --- | --- |
| W-CASUAL: kobieta, codzienny; także kalibracja | w1.png | w3.png | Sunburst / Flare |
| M-CASUAL: mężczyzna, codzienny | m1.png | m3.png | Sunburst / Flare |
| W-ELEGANT: kobieta, elegancki | w1.png | w4.png | Sunburst / Flare |
| M-ELEGANT: mężczyzna, elegancki | m1.png | m4.png | Sunburst / Flare |
| W-WEDDING: kobieta, wesele jako gość | w1.png | w5.png | Sunburst / Flare |
| M-WEDDING: mężczyzna, wesele jako gość | m1.png | m5.png | Sunburst / Flare |

Sześć przypadków × dwa modele daje najwyżej **12 wywołań łącznie**. Pierwsze
dwa wywołania, dla W-CASUAL, służą również kalibracji kosztu i czasu. Błędu nie
zastępujemy dodatkową próbą poza tym limitem; nie obiecujemy pełnej macierzy.

Stałe ustawienia: bezpośrednie Images API, `quality=medium`, `size=1024x1536`,
`n=1`, bez streamingu częściowych obrazów. W każdej parze zachowujemy identyczny
prompt, pliki wejściowe i ich kolejność, format wyjścia oraz pozostałe parametry;
zmienia się tylko model. Zapisujemy dokładne identyfikatory modeli. Nie zmieniamy
ustawień ani promptu w reakcji na wynik kalibracji, aby nie mieszać warunków
porównania. Jeden obraz to jedna wizualizacja, nie para zestawów.

## Przyjęty przebieg i kontrola kosztu

Poniższe zasady dokumentują wykonaną próbę; nie uruchamiają nowej serii wywołań.

1. Zapisz aktualną zgodę i przygotuj lokalnie macierz, prompty, parametry oraz
   identyfikatory/hash wejść. Sprawdź obrazy i źródło ich syntetycznego pochodzenia.
2. Przed płatnym startem sprawdź aktualne modele, stawki i obsługiwane parametry.
   Odnotuj brak potwierdzonej górnej estymacji wejść oraz opisany wyżej wyjątek
   zatwierdzony przez użytkownika. Nie przedstawiaj rezerwy jako gwarancji i nie
   przenoś tokenizacji starszych modeli ani kalkulatora vision na GPT Image 2.5
   bez potwierdzenia. Sama niepewność estymacji nie blokuje już rozpoczęcia próby.
3. Prowadź trwały lokalny rejestr prób i rezerw. Przed wysłaniem żądania sprawdź
   oba limity: **12 wywołań i 25 PLN za całą próbę z buforem**. Uwzględnij
   przygotowania, kalibrację, błędy i ewentualne ponowienia, a także właściwe
   przeliczenie waluty i składniki kosztu. Wykonuj najwyżej jedno żądanie naraz.
4. Wyłącz automatyczne ponowienia również w użytym kliencie API. Każde wysłane
   żądanie zajmuje miejsce w limicie prób. Timeout lub brak odpowiedzi nie
   oznacza zerowego kosztu; zachowaj rezerwę i zatrzymaj kolejne wywołania,
   jeśli rozliczenie pozostaje nieznane.
5. Po każdym wyniku zapisz rzeczywiste tokeny, koszt, czas, status i plik wyniku.
   Rozlicz użycie API przed kolejnym żądaniem i zaktualizuj rezerwę na podstawie
   dostępnych pomiarów. Nieznany koszt już wysłanego żądania, osiągnięcie limitu
   prób lub brak miejsca w pozostałym budżecie oznacza zatrzymanie, bez retry.
6. Przygotuj porównanie i raport, zaktualizuj dokumentację i zakończ zakres.
   Nie wdrażaj AI w aplikacji ani P3.3 na podstawie samego wyniku próby.

Sposób sfinansowania próby zatwierdzony osobno, parametry konta pozostają prywatne.
Nie publikujemy salda, ustawień doładowań, identyfikatorów kont ani kluczy.
Sekret pozostaje w bezpiecznym zapisie lokalnym, poza aplikacją, Git i hostingiem.
Miesięczny limit dostawcy nie zastępuje rejestru i limitu tej próby.

## Ocena i raport

Przegląd techniczny zakończono i zapisano w [assessment.json](p32/assessment.json).
Stosowano skalę 0–2 w pięciu kryteriach; użyteczność techniczna wymagała co
najmniej 8/10 i braku błędu krytycznego. Wynik 10/12 dotyczy tej ręcznej oceny,
nie odbioru użytkowników ani gwarantowanej skuteczności dla kolejnych zdjęć.

- Dla każdego wyniku porównaj zachowanie osoby, krój/kolor każdej rzeczy,
  kompletność zestawu, artefakty i użyteczność wizualną. Opisz konkretne błędy,
  zwłaszcza podmianę osoby, pominięcie lub zmianę ubrania i deformacje anatomii.
- Zachowaj referencje obok wyników. Oznaczenie modeli można ukryć na czas
  pierwszej oceny użytkowników; raport techniczny zachowuje pełne przypisanie.
- Raport obejmuje wszystkie próby, parametry, tokeny, statusy, czasy, sumę kosztów
  oraz powód zatrzymania. Oddziel zmierzone koszty od estymacji i nierozliczonych
  rezerw. Koszt użytecznego wyniku uwzględnia koszt prób nieudanych; przy braku
  użytecznych wyników nie przedstawiaj tego wskaźnika jako zera.
- Ocena techniczna nie zastępuje odbioru Kasi i Aleksego, który pozostaje
  oczekujący. Jedna próbka na model i przypadek nie mierzy powtarzalności.
  Nie gwarantujemy jakości, tożsamości ani fizycznego dopasowania rozmiaru.
- Próba obejmuje dwie syntetyczne osoby i gotowe zestawy na innej osobie.
  Nie dowodzi działania dla osobnych zdjęć rzeczy, innych sylwetek ani realnych
  zdjęć użytkowników. Nie potwierdza też budżetu całej aplikacji 150 PLN/mies.

## Pozostały stan projektu

P3.1 jest wdrożone na main; pozytywny ponowny test poprawki usuwania jest
potwierdzony, a logowanie Kasi nadal czeka na sprawdzenie. Ten test może odbyć
się niezależnie od P3.2. Dev pozostaje warsztatem, main adresem odbioru przed
premierą; aktualne zasady i wyniki opisuje [PROJECT-STATUS.md](PROJECT-STATUS.md).
Wspólny backend dev/main i przyjęta polityka danych P3.1 pozostają bez zmian.

P3.3 nie rozpoczęto; wymaga osobnej zgody po raporcie i ocenie przykładów.
Przekazanie prawdziwych zdjęć do AI wymaga także uzgodnienia zasad danych AI;
prywatny magazyn w UE
nie stanowi dowodu przetwarzania AI w UE. Dalsze wykonanie pozostaje zatrzymane
do rozstrzygnięcia następnego zakresu; odbiór przykładów jest oczekujący.
