# Budżet przy 30 wizualizacjach na osobę — V1.2

Data: 2026-10-24. Aktualizacja założeń po Q25; bez nowych zakupów i wywołań API.
[Analiza V1.1](COST-PLAN-V1.1.md) zachowuje rozpoznanie usług, źródła cenników
i ograniczenia z tego samego dnia. Nie powtarzano badania cen w tej aktualizacji.

## Ustalony wolumen i sposób liczenia

- Pilotaż dla Kasi i Aleksego: dwie osoby.
- Planowane użycie: **30 wizualizacji na osobę miesięcznie, 60 łącznie**.
- Konwencja planistyczna: jeden wynikowy obraz zestawu na osobie to jedna
  wizualizacja; wyrenderowanie obu propozycji daje dwa obrazy, nie jeden.
- 30 opisuje oczekiwane użycie. Nie ustalono jeszcze sposobu egzekwowania limitu
  ani zasad rozliczania nieudanych prób wobec użytkownika. Koszty każdej próby
  i ponowień muszą być widoczne w wewnętrznym rejestrze wydatków.
- Budżet usług pozostaje około **150 PLN/miesiąc**, możliwie mniej. Jest odrębny
  od budżetu zakupowego zestawu i nie oznacza uruchomienia płatnych usług.

## Co trzeba zmierzyć

Roboczy podział V1.1 to 25 PLN na analizę/rekomendacje, 75 PLN na wizualizacje
i 50 PLN rezerwy, przy infrastrukturze mieszczącej się w bezpłatnych limitach
odpowiedniego planu. Nadal jest propozycją puli, a nie prognozą ceny dostawcy.

Przy puli 75 PLN i 60 wynikach miesięcznie dopuszczalny **średni koszt jednego
wyniku wynosi 1,25 PLN**, z uwzględnieniem kosztów nieudanych prób i ponowień.
To wynik dzielenia budżetu przez wolumen, nie znana cena generacji.
Rozliczenie powinno uwzględnić opłaty, podatki i przewalutowanie, gdy występują.

| Średni koszt jednego wyniku, łącznie z przypisanymi próbami | Koszt 60 wyników |
| --- | ---: |
| 0,50 PLN — przykładowy scenariusz | 30 PLN |
| 1,00 PLN — przykładowy scenariusz | 60 PLN |
| 1,25 PLN — próg proponowanej puli | 75 PLN |
| 2,00 PLN — przykładowy scenariusz | 120 PLN |

Przykłady nie są ofertami usług. Mała próba jakości i rzeczywistego zużycia musi
ustalić koszt akceptowalnego wyniku, czas oczekiwania oraz odsetek ponowień.
Jeżeli potrzebny będzie abonament infrastruktury, jego koszt trzeba odjąć od
tych samych 150 PLN i ponownie wyliczyć dostępną pulę AI.

## Oszczędności i zależności

Propozycja pozostaje: analiza przy dodaniu/zmianie zdjęcia, zapis zaakceptowanych
wyników oraz wizualizacja na żądanie. Nie generować ponownie przy samym otwarciu
ekranu. Konkretne zachowanie przycisków i limitów należy sprawdzić w prototypie;
nie zastępować wymaganej wizualizacji samym opisem bez uzgodnienia.

Q23 pozwala zacząć od listy z linkami i zakupów w sklepach, bez własnej integracji
płatności lub składania zamówień. Nie usuwa to potrzeby sprawdzenia dostępu do
produktów, praw użycia zdjęć, cen i dostępności ani możliwych kosztów katalogu.

PL i EN mają używać własnych słowników tekstów interfejsu; nie planujemy płatnego
tłumaczenia każdego ekranu przez AI. Dobór i język przyszłych odpowiedzi stylisty
trzeba uwzględnić w próbie usługi, zamiast zakładać bezkosztową dodatkową generację.

Przed realną próbą zdjęć należy wskazać dostawcę i wyjaśnić jego zasady danych
zgodnie z [ustaleniem Q24](INTERVIEW-V1.2.md). Na tym etapie nie zmieniono planu
Vercel, nie utworzono backendu ani nie potwierdzono kosztu 60 wizualizacji.
