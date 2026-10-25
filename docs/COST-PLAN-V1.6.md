# P3.3B — koszty i granice próby V1.6

Data: 2026-10-25. **Propozycja, bez zgody na nowe wywołania lub finansowanie.**
Uzupełnia [V1.5](COST-PLAN-V1.5.md) i [plan V1.7](IMPLEMENTATION-PLAN-V1.7.md).
Nie zmienia propozycji pilotażu C ani obecnych ustawień usług.

## Zużycie API

- Łącznie najwyżej 6 wysłań i 10 PLN budżetu próby, jedno żądanie naraz;
  pierwsza kalibracja, przygotowanie i płatne błędy liczą się do tych limitów.
- Jeden raz na każdy z sześciu przypadków. Brak automatycznych/ręcznych ponowień
  w tej zgodzie, alternatywnego modelu i dodatkowej płatnej kalibracji.
- Flare snapshot 2026-09-08, Standard: 5/8/30 USD za milion tokenów tekstu
  wejściowego / obrazów wejściowych / wyjścia. Stawki sprawdzono 2026-10-25.
  Brak rabatu cache przy bezpośrednim Images edits.
  [Oficjalny cennik i usage](https://developers.openai.com/api/docs/guides/image-generation#cost-and-latency).
- Rozliczamy wszystkie składniki rzeczywistego usage. Niespójność/brak pola
  to koszt niepotwierdzony, a nie zero. Wersjonujemy stawki i współczynnik
  6,765 PLN/USD (5 × 1,23 × 1,10); to bufor budżetowy, nie bieżący kurs ani faktura.
- P3.2: średnio około 0,036 USD / 0,24 PLN na obraz z dwoma wejściami.
  To punkt odniesienia, nie cena lub górna granica dla 3–4 wejść B.

## Konkretna reguła rezerw

B01 ma cztery wejścia i rezerwuje cały budżet 10 PLN. Nowa zgoda musi jawnie
obejmować rozpoczęcie tego pomiaru bez udokumentowanej maksymalnej ceny żądania.
Stary wyjątek udzielony dla P3.2 nie jest tu używany.

Po pełnym rozliczeniu B01 rezerwa każdej kolejnej próby wynosi większą z kwot:
**1 PLN** albo **2 × największy dotychczasowy koszt B w PLN + 0,20 PLN**,
zaokrąglona w górę do grosza. Jest przeliczana przed wysłaniem, w jednej transakcji
z licznikami. Koszt rozliczony + rezerwy + nowa rezerwa nie mogą przekroczyć 10 PLN.
To stała reguła niniejszej propozycji, nie samodzielna zgoda na większy budżet.

Koszt większy niż rezerwa, nieznany wynik, timeout lub brak usage: zachować
pełną znaną kwotę/niepewność, zatrzymać dalsze wysyłki, bez retry. Usunięcie
pliku/konta, nowy UUID, zmiana dnia albo okna próby nie przywraca wywołań/pieniędzy.

**10 PLN nie jest gwarantowaną maksymalną końcową opłatą dostawcy.** Images edits
nie ma parametru `max_cost`; rezerwa ogranicza nowe wysyłki, ale nie rachunek
trwającego żądania. Także limit dostawcy może zadziałać z opóźnieniem.
[API](https://developers.openai.com/api/reference/resources/images/methods/edit),
[spend limits](https://developers.openai.com/api/docs/guides/spend-limits).

## Finansowanie jest osobną decyzją

Zużycie API i zakup kredytów to różne kwoty. W tej turze sprawdzono tylko do
odczytu istniejące saldo, limit projektu i auto-doładowanie. Szczegółów konta
nie publikujemy; właściciel otrzymuje je w rozmowie oraz ignorowanej notatce lokalnej.
Możliwe doładowanie przekracza budżet zużycia tej małej próby i wymaga jawnej zgody.

Rekomendowana kompletna zgoda B obejmuje najwyżej jedno ewentualne automatyczne
doładowanie związane z próbą według odczytanych ustawień, z konkretną kwotą
przedstawioną właścicielowi. Zgoda oddziela docelowe saldo od maksymalnego
obciążenia karty z ewentualnymi podatkami; obie granice trzeba potwierdzić.
Nie oznacza zmiany ustawień ani ręcznego zakupu.
Przed pierwszym żądaniem ponowny odczyt finansowania. Jeżeli kwota/warunki
się zmieniły, nie można potwierdzić marginesu albo możliwe jest kolejne
niezatwierdzone doładowanie, zatrzymać wysyłki i wyjaśnić sytuację.

Jeśli właściciel nie zgodzi się na doładowanie, nie uruchamiać próby przy
możliwości jego wyzwolenia; przedstawić osobną decyzję dotyczącą finansowania.
Nie wyłączać samodzielnie auto-doładowania całej organizacji ani nie przenosić
kosztu na inny projekt. Środki i zużycie innych projektów mogą zmieniać saldo.

## Pozostałe usługi i zakończenie

Istniejące Supabase Free i Vercel, bez nowych abonamentów. Sprawdzić limity
przed hosted testem; przy wyczerpaniu zatrzymać pracę bez upgrade. Po raporcie
AI OFF i unieważnienie/usunięcie klucza B. C, realne zdjęcia, nowy budżet i nowe
okno testowe wymagają osobnej zgody; dobry wynik B niczego automatycznie nie uruchamia.
