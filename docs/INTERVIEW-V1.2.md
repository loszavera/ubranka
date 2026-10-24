# Uzupełnienie wywiadu — V1.2

Data: 2026-10-24. Źródło: wybór wyglądu i odpowiedzi użytkownika po V1.1.
Zachowujemy [pierwsze 20 odpowiedzi](INTERVIEW-V1.1.md); poniższe ustalenia
uzupełniają je i w podanym zakresie zastępują wcześniejsze otwarte decyzje.

| Punkt | Odpowiedź | Zapis do projektu |
| --- | --- | --- |
| Wygląd | „szata graficzna A” | Wybrano A — Krem i śliwka. Wybór kierunku nie oznacza jeszcze gotowych ekranów ani odbioru interakcji. |
| 3 — język | Kasia: polski. Aleksy: angielski, jeżeli to proste; dopuszcza polski teraz i angielski później. | Plan realizacyjny: PL i EN od pierwszego prototypu, oddzielne słowniki tekstów i wybór języka per użytkownik. Rynek PL, PLN i dostawa do Polski pozostają bez zmian. |
| Q21 | Oba tryby; użytkownik ustawia domyślny, początkowo dwa najlepiej dopasowane. | Dwie pełne stylizacje: tryb „Najlepiej dopasowane” jako początkowy oraz przełączany tryb „Ekonomiczny / markowy”; zapamiętywana preferencja. |
| Q22 | „tak” | Budżet obejmuje rzeczy do dokupienia z dostawą. Posiadane ubrania to 0 PLN nowego wydatku. |
| Q23 | „na początek wystarczy” | Wystarczy lista zakupów z linkami; użytkownik finalizuje zakup w sklepach. Ubranka nie składa zamówienia przez samo zatwierdzenie listy. |
| Q24 | „chyba tak, chociaż nie rozumiem alternatywy” | Wstępnie przyjęty kierunek prywatnego przechowywania zdjęć do usunięcia i wykorzystania AI. Szczegóły dostawcy i przetwarzania wymagają wyjaśnienia przed realnym użyciem. |
| Q25 | „30” | Planowane 30 wizualizacji miesięcznie na osobę, czyli 60 dla Kasi i Aleksego. To wolumen do kalkulacji, nie gwarancja ceny ani wdrożony limit. |

## Wyjaśnienie zdjęć

Proponowany wariant zachowuje zdjęcia w prywatnej szafie, aby można było wracać
do ubrań i tworzyć kolejne wizualizacje. Użytkownik ma możliwość ich usunięcia.
Alternatywa to usunięcie oryginału po analizie i zapisanie tylko opisu, np.
„granatowe spodnie, prosty krój”. Oszczędza miejsce i ogranicza zachowywanie zdjęć,
ale utrudnia odtworzenie dokładnego wyglądu ubrania i wymaga ponownego dodania
zdjęcia do kolejnej wizualizacji. Nie wybrano tej alternatywy.

Prywatność w Ubranka i przekazanie zdjęcia dostawcy AI to osobne elementy.
Przed uruchomieniem realnego przepływu trzeba wskazać konkretną usługę, jakie
pliki do niej trafiają, kiedy oraz jak długo są zachowywane i usuwane. Usunięcie
pliku z Ubranka nie dowodzi automatycznie usunięcia jego kopii u dostawcy.
Odpowiedź Q24 nie jest nieograniczoną zgodą na wysyłanie danych dowolnej usłudze.
Teraz nie wysyłamy zdjęć i nie uruchamiamy dodatkowej ankiety o nieznanym dostawcy.

## Następny zakres

[Wymagania V1.2](REQUIREMENTS-V1.2.md) i [plan V1.2](IMPLEMENTATION-PLAN-V1.2.md)
opisują proponowany pierwszy prototyp: wygląd A, PL/EN, profile, szafa demo,
dwie propozycje i opinie. Nie ma kolejnych pytań wymaganych do jego zaprojektowania.
Dobór AI, koszt rzeczywistych generacji i źródło produktów wymagają późniejszych
sprawdzeń technicznych. Aktualna zmiana dotyczy dokumentacji, nie kodu aplikacji.
