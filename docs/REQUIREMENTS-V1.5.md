# Wymagania Ubranka — V1.5

**Aktualizacja odbioru 2026-10-25:** użytkownicy zaakceptowali P3.2 z ograniczeniami.
Poniższy dokument zachowuje warunki i stan próby przed odbiorem; wzmianki o
oczekującej ocenie są historyczne. Bieżące ustalenia: [V1.6](REQUIREMENTS-V1.6.md)
i [plan V1.6](IMPLEMENTATION-PLAN-V1.6.md), wyłącznie planowanie P3.3.

Data: 2026-10-25 (Europe/Warsaw). Dodatek do
[V1.4](REQUIREMENTS-V1.4.md); wcześniejsze wymagania pozostają aktualne,
z wyjątkiem zmian opisanych poniżej. Plan wykonania:
[V1.5](IMPLEMENTATION-PLAN-V1.5.md).

## Zatwierdzony zakres P3.2

Użytkownik zatwierdził ograniczoną próbę jakości i kosztu wizualizacji:

- **Maksymalnie 12 wywołań i 25 PLN za całą próbę**, zależnie od tego,
  który limit zatrzyma pracę wcześniej. Przygotowanie płatnym AI, kalibracja,
  błędy i ponowienia wliczają się do obu limitów; bez automatycznych ponowień.
  Nie ma obowiązku wykorzystania całego budżetu ani uzyskania 12 obrazów.
- Wyłącznie istniejące syntetyczne obrazy fikcyjnych dorosłych. Bez zdjęć
  użytkowników, ich prywatnej szafy ani materiałów sklepów.
- Sześć przypadków: kobieta i mężczyzna, zestaw codzienny, elegancki oraz
  wesele jako gość. Każdy przypadek porównuje Sunburst i Flare na tych samych
  wejściach, z tym samym promptem i parametrami. Pierwsza para jest jednocześnie
  kalibracją; nie oznacza dwóch dodatkowych wywołań.
- Rezultat to przykłady do oceny, rejestr kosztów/czasu/błędów, raport wykonalności
  i aktualizacja dokumentacji. **Po raporcie zatrzymujemy pracę przed P3.3.**

Sposób sfinansowania próby zatwierdzony osobno, parametry konta pozostają prywatne.
Budżet próby nie jest miesięcznym limitem projektu ani zgodą na nowe abonamenty.

## Wynik wykonania P3.2

**Próba jest wykonana technicznie:** 12/12 wywołań zakończonych powodzeniem,
bez błędów i ponowień. Koszt obliczony ze zwróconego użycia API wynosi
**0,432032 USD**, a rozliczenie budżetu z rezerwą **2,92269648 PLN z 25 PLN**.
Kwota z rezerwą nie jest potwierdzeniem obciążenia karty.

Przegląd techniczny uznał **10/12 wyników za użyteczne**; dwa odrzucono z powodu
istotnej zmiany kroju spodni. **Odbiór Kasi i Aleksego pozostaje oczekujący.**
Limit wywołań został wykorzystany; nie uruchamiamy następnych prób.
P3.3 nie rozpoczęto. Dowody i ograniczenia: [raport P3.2](P32-REPORT.md),
[pomiary](p32/measurements.json), [ocena techniczna](p32/assessment.json)
i [koszty V1.4](COST-PLAN-V1.4.md).

## Przygotowanie i późniejsze polecenie użytkownika

Historyczny [preflight](P32-PREFLIGHT.md) zatrzymał wykonanie przed płatnym
startem przy **0/12 wywołań, 0 USD i braku wygenerowanych wyników** z powodu
niepotwierdzonej górnej estymacji kosztu obrazów wejściowych.

Następnie, 2026-10-25, użytkownik jawnie polecił testować niezależnie od szacunku.
Zatwierdził tym samym wyjątek od warunku wiarygodnej górnej estymacji przed
rozpoczęciem próby. Polecenie nie podniosło limitu 12 wywołań ani 25 PLN i nie
dopuściło automatycznych ponowień. Wywołania wykonano pojedynczo, rozliczając
koszt każdego na podstawie zwróconego użycia API przed kolejną próbą.
Zgoda na niepewność estymacji nie stanowiła matematycznej gwarancji kosztu
pojedynczego żądania ani pozytywnego odbioru wyników.

## Odbiór i granice wniosków

**A-06 / P3.2:** raport obejmuje każdą wykonaną próbę, także nieudaną, a także
powód wcześniejszego zatrzymania. Oceniamy zachowanie osoby, krój i kolor
wszystkich rzeczy, kompletność zestawu, artefakty oraz koszt użytecznego wyniku.
Koszt nieudanych prób nie znika z podsumowania. Wynik może wskazać wykonalność,
ograniczenia albo brak wystarczających dowodów jakości lub kosztu.

Ocena przykładów przez Kasię i Aleksego pozostaje **do wykonania**. Zgoda na próbę
nie oznacza pozytywnego odbioru jej wyników. Nie gwarantujemy jakości, zachowania
tożsamości ani fizycznego dopasowania rozmiaru. Przeniesienie pełnego zestawu
z obrazu innej syntetycznej osoby nie dowodzi działania dla osobnych zdjęć rzeczy,
rzeczywistych użytkowników, różnych sylwetek ani zdjęć w trudnych warunkach.

## Stan pozostałych etapów

- P3.1 jest na main, pod adresem odbioru https://ubranka.vercel.app. Aleksy
  potwierdził działanie większości funkcji i pozytywny ponowny test poprawki
  usuwania. Logowanie Kasi pozostaje niepotwierdzone; nie rozszerzamy odbioru.
- Dev pozostaje gałęzią pracy. Przed premierą zatwierdzony zakres może być
  publikowany i testowany na main według aktualnych zasad projektu.
- P3.3, wykorzystanie prawdziwych zdjęć przez AI, integracja AI w aplikacji
  i nowe abonamenty pozostają poza zgodą na P3.2. P3.3 nie rozpoczęto.
- Cel około 150 PLN/mies. i 30 zaakceptowanych wizualizacji/osobę/mies.
  pozostaje celem dalszego pilotażu, nie wynikiem tej próby ani gwarancją ceny.

Bieżące wykonanie i dowody zapisujemy w [statusie](PROJECT-STATUS.md).
Ten dokument zapisuje zgodę, wymagania, historyczne zatrzymanie preflight
i późniejsze polecenie rozpoczęcia oraz wynik techniczny próby.
Nie zastępuje raportu wykonanych wywołań ani odbioru użytkowników.
