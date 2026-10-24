# Wymagania aplikacji Ubranka — V1.2

Data: 2026-10-24. Status: zapis wyboru wyglądu A i doprecyzowań po wywiadzie.
Potwierdzone odpowiedzi oddzielono od sposobu realizacji i proponowanych kryteriów odbioru.
Podstawa: [V1.1](REQUIREMENTS-V1.1.md), opis pomysłu i najnowsze odpowiedzi w czacie.
Oznaczenie „odpowiedź 12” odnosi się do numeracji pierwszego wywiadu.
Wymaganie opisuje cel produktu, nie potwierdza wdrożenia funkcji.

## Cel, odbiorcy i pierwsze zastosowanie

Ubranka to wirtualny stylista dla kobiet i mężczyzn, którzy nie mają sprecyzowanego
stylu lub czasu na zakupy. Najpierw korzystają z niego Aleksy i Kasia; docelowo ma
powstać produkt komercyjny na polski rynek. Kolejność potrzeb jest następująca:
poznanie własnego stylu, układanie zestawów z posiadanych rzeczy, pomoc w zakupach.

Przyjęty przykład zastosowania: „Potrzebuję zestawu do pracy do 500 zł, pasującego
do moich butów, i chcę wybrać w kilka minut”. To scenariusz do sprawdzania produktu,
a nie stały limit wszystkich użytkowników. Budżet liczy rzeczy do dokupienia
i dostawy; posiadane rzeczy to 0 PLN nowego wydatku w danej rundzie (Q22).

Pierwszy zakres odzieży to ubrania codzienne i eleganckie, rynek polski, ceny w PLN
i dostawa do Polski. Kasia wybiera interfejs polski, Aleksy preferuje angielski,
jeśli jego dodanie jest proste; dopuszcza też angielski w późniejszym kroku.
Sposób realizacji przyjęty do planu: od pierwszego prototypu oddzielne słowniki
PL/EN i ustawienie języka użytkownika. Nie zmienia to rynku, waluty ani kraju dostawy.

Wybrany kierunek graficzny to A — Krem i śliwka. Budżet usług wynosi około
150 PLN miesięcznie, możliwie mniej. Planowane użycie to 30 wizualizacji na osobę
miesięcznie, czyli 60 łącznie dla Kasi i Aleksego; koszt wymaga pomiaru.

## Potwierdzone potrzeby i zachowane wymagania

Identyfikatory R-01–R-16 zachowują ciągłość z V1.0. Nowe doprecyzowania nie usuwają
celów wcześniejszej wersji, w szczególności wielu profili stylu ani przyszłych zakupów
automatycznych. „Potwierdzone” oznacza zapisane przez użytkownika, nie gotowe technicznie.

| ID | Wymaganie | Źródło i granica ustalenia |
| --- | --- | --- |
| R-01 | WWW, iOS i Android; WWW wygodne na telefonie. | Opis projektu; każda platforma wymaga własnej weryfikacji. |
| R-02 | Spokojna, przyjemna oprawa A — Krem i śliwka, mało decyzji i przeglądania. | Opis, odpowiedzi 5 i 19 oraz zatwierdzenie A. Wybrano kierunek; makieta nie jest jeszcze działającym UI ani odbiorem wszystkich detali. |
| R-03 | Krótki start zbiera podstawowe potrzeby; aplikacja stopniowo poznaje preferencje przez używanie i opinie. | Odpowiedź 8. Szczegółowy wywiad pozostaje możliwym etapem uzupełniania profilu, nie obowiązkową długą ankietą na wejściu. |
| R-04 | Profilowanie wykorzystuje wymiary/rozmiary i zdjęcia. | Odpowiedź 9 wskazuje te rodzaje danych jako obowiązkowe do dobierania ubrań. Lista pól, liczba i rodzaj zdjęć oraz moment ich zebrania pozostają do opracowania. Nie uzgodniono trybu bez zdjęć. |
| R-05 | Kilka edytowalnych i przełączanych profili stylu. | Zachowane z V1.0; np. codzienny i elegancki. Nie ograniczać konta do jednego profilu. |
| R-06 | Użytkownik określa kwotę na cały zestaw oraz preferencje cenowe. Limit obejmuje rzeczy do dokupienia i dostawy; posiadane ubrania liczymy jako 0 PLN nowego wydatku. | Odpowiedzi 11 i Q22. Obowiązkowe opłaty należy pokazać jako część pełnego kosztu. Nieznana dostawa/opłata nie może być ukryta jako pewne zmieszczenie się w limicie. |
| R-07 | Jedna runda zawiera maksymalnie dwa kompletne zestawy. Początkowy tryb to dwa najlepiej dopasowane; użytkownik może ustawić swój tryb domyślny. | Odpowiedzi 12 i Q21. Bez długiego katalogu alternatyw; drugi tryb opisuje R-09. |
| R-08 | Szybkie „podoba mi się” / „nie”; dostępne przyciski, gest może być dodatkiem. | V1.0 i odpowiedź 13. Pozytywna ocena oznacza sygnał gustu, nie zakup ani dodanie do koszyka. |
| R-09 | Drugi dostępny tryb porównuje dwa pełne zestawy: ekonomiczny i markowy. Może zostać ustawiony przez użytkownika jako domyślny. | V1.0, odpowiedź 12 Aleksego i Q21. Oba zestawy respektują budżet; marka nie zastępuje dopasowania. |
| R-10 | System uwzględnia opinie w kolejnych propozycjach. Po odrzuceniu obu przedstawia następną parę; powód odrzucenia można pominąć, a pytanie wyłączyć w ustawieniach. | Odpowiedzi 13–14. Brak odpowiedniego wyniku musi mieć uczciwy stan pusty. |
| R-11 | Znajdowanie nowych ubrań według wytycznych. Preferowane źródła: Vinted, Zara, Zalando, Reserved i H&M. | Odpowiedź 6. To lista oczekiwanych sklepów, nie potwierdzenie dostępu do API, katalogu, cen ani koszyka. |
| R-12 | Wirtualna szafa rzeczy posiadanych i kupionych. Dodawanie na podstawie zdjęcia ubrania oraz zdjęcia ubrania na osobie. | V1.0; odpowiedź 16: Kasia — zdjęcie rzeczy, Aleksy — zdjęcie na sobie. Wspieranie obu sposobów odpowiada obu potrzebom. |
| R-13 | Kompletne zestawy z własnych rzeczy, nowych produktów albo obu źródeł. | V1.0 i odpowiedź 4. Zestawy z posiadanych ubrań mają pierwszeństwo w proponowanej kolejności prac. |
| R-14 | Pierwszy etap zakupowy przygotowuje listę zakupową z linkami do konkretnych produktów; użytkownik kończy zakupy w sklepach. Samodzielne zakupy i podpięcie metody płatności pozostają późniejszym celem. | Odpowiedź Q23 akceptuje ten zakres „koszyka do zatwierdzenia” z odpowiedzi 18. Lista nie tworzy zamówień ani nie opłaca ich w Ubranka. |
| R-15 | Użytkownik kontroluje wydatki i moment zatwierdzenia zakupów. | V1.0 i odpowiedź 18. Ocena gustu, wybór zestawu i zatwierdzenie zakupu to różne czynności. |
| R-16 | Częste sprawdzanie postępów z telefonu, także poza domową siecią. | Opis organizacji; działający podgląd WWW nie stanowi dowodu działania aplikacji natywnej. |
| R-17 | Odbiorcami są kobiety i mężczyźni bez sprecyzowanego stylu lub czasu na zakupy. | Odpowiedź 1. |
| R-18 | Najpierw pilotaż własny, docelowo produkt komercyjny na polski rynek. | Odpowiedzi 2–3; model zarabiania pozostaje późniejszą decyzją. |
| R-19 | Podstawowe okazje to ubiór codzienny i elegancki. | Odpowiedź 7. Inne style można później rozwinąć bez usuwania wielu profili. |
| R-20 | Główne kryteria to dopasowanie do sylwetki, wygląd i styl; użytkownik może wskazać dodatkowe priorytety. | Odpowiedź 10. Szczegółowe wagi rankingu i lista dodatkowych kryteriów nie zostały zatwierdzone. |
| R-21 | Propozycje powstają na prośbę użytkownika. | Odpowiedź 15. Nie ustalono harmonogramu automatycznych propozycji ani powiadomień. |
| R-22 | Zestaw jest wizualizowany na osobie lub zdjęciu użytkownika. | Odpowiedź 17. Jest to wymaganie produktu; dostawca, koszt, jakość i wykonalność nie są jeszcze potwierdzone. |
| R-23 | Docelowy miesięczny budżet usług dla pilotażu to około 150 PLN; szukamy tańszego wariantu. | Odpowiedź 20. Limit planistyczny nie jest zgodą na subskrypcje, opłaty ani nieograniczone wywołania AI. |
| R-24 | Użytkownik może korzystać z interfejsu polskiego lub angielskiego i zmieniać język. | Doprecyzowanie odpowiedzi 3: Kasia PL, Aleksy preferuje EN, z dopuszczeniem późniejszego dodania. Realizacja od prototypu PL/EN jest decyzją projektową, nie istniejącą funkcją. Język jest niezależny od rynku PL i waluty PLN. |
| R-25 | Pilotaż obejmuje Kasię i Aleksego; planowane użycie wynosi 30 wizualizacji na osobę miesięcznie, 60 łącznie. | Q25. To podstawa kalkulacji, nie obietnica kosztu ani już wdrożony twardy limit. Roboczo jeden obraz jednego zestawu na osobie liczymy jako jedną wizualizację. |

## Propozycja pierwszego przepływu

Poniższy przebieg łączy odpowiedzi, ale nie oznacza odbioru projektu UX:

1. Krótkie rozpoczęcie, ustawienie języka, wybór potrzeb i aktywnego profilu; dane z R-04 zbierane
   w uzgodnionych krokach bez długiego formularza na jednym ekranie.
2. Dodanie rzeczy do szafy ze zdjęcia rzeczy lub zdjęcia na sobie; możliwość
   poprawienia rozpoznanych informacji zamiast przyjmowania ich jako pewnych.
3. Na prośbę użytkownika wybór okazji, budżetu i dodatkowych priorytetów.
4. Dwie kompletne propozycje wykorzystujące własne rzeczy; później także produkty
   do kupienia. Początkowo są to dwa najlepiej dopasowane zestawy. Użytkownik
   może przełączyć tryb na ekonomiczny/markowy i zapisać własny tryb domyślny.
5. „Podoba mi się” uczy preferencji. Odrzucenie prowadzi do kolejnej pary;
   powód jest dobrowolny. Użytkownik może zakończyć rundy w dowolnej chwili.
6. Osobna czynność przygotowuje listę zakupową dla wybranego zestawu. Użytkownik
   przegląda pozycje i koszt, otwiera linki, a zamówienie finalizuje w sklepach.
   Ubranka nie przedstawia samego kliknięcia linku jako złożenia zamówienia.

Wizualizacja na użytkowniku jest częścią docelowego wyboru zestawu. Pierwsze
makiety mogą pokazywać ją wyłącznie demonstracyjnie; nie zastępują dowodu działania
funkcji. Wygenerowany obraz nie potwierdza rozmiaru, fizycznego dopasowania ani
zachowania tkaniny. Te informacje muszą pochodzić również z parametrów i danych produktu.

## Wymagania jakościowe i ograniczenia

Poniższe cele jakościowe z V1.0 są zachowane i rozwinięte. Ich konkretne kryteria
testowe są propozycją do odbioru, a nie twierdzeniem o istniejącej implementacji.

| ID | Cel |
| --- | --- |
| Q-01 | Te same główne przepływy na WWW, iOS i Androidzie; wynik testu opisuje rzeczywistą platformę. Eksport JavaScript nie zastępuje testu na urządzeniu. |
| Q-02 | Czytelny kontrast i tekst, wygodne cele dotykowe, etykiety dla technologii asystujących, klawiatura na WWW; decyzja nie wymaga gestu. |
| Q-03 | Widoczne ładowanie, pusty wynik, błąd i brak sieci; nieudana operacja nie jest przedstawiana jako wykonana. |
| Q-04 | Prywatność parametrów i zdjęć, kontrola dostępu i świadome przesyłanie. Q24 wstępnie przyjmuje prywatny zapis do usunięcia przez użytkownika i użycie AI; przed realnym przesłaniem trzeba wyjaśnić konkretną usługę, zakres danych, retencję i usuwanie. Odpowiedź nie daje nieograniczonej zgody na wysyłanie zdjęć do nieznanego dostawcy. |
| Q-05 | Sekrety wyłącznie na serwerze; `EXPO_PUBLIC_*` jest publiczne. Zdjęcia użytkowników, tokeny i prywatne dane nie trafiają do publicznego repozytorium. |
| Q-06 | Każda rzeczywista oferta ma źródło, link, cenę, walutę i czas pobrania; rozmiar i dostępność są potwierdzone albo jawnie nieznane. Przed zatwierdzeniem zakupów wymagają ponownego sprawdzenia. |
| Q-07 | Docelowe zintegrowane zakupy mają historię, kontrolę kwoty, uzgodnione potwierdzenie i sposób wyłączenia automatyzacji. W pilotażu zakup odbywa się w sklepie; lista Ubranka nie jest dowodem zamówienia. Dane karty obsługuje właściwy operator; aplikacja nie przechowuje numeru karty ani CVV. |
| Q-08 | Odtwarzalne środowisko i lockfile; dokumentacja rozdziela plany, mocki, rzeczywiste integracje i zweryfikowane funkcje. |
| Q-09 | Koszty usług mierzone według użycia, z kalkulacją dla 60 wizualizacji miesięcznie. Para wygenerowanych obrazów liczy się jako dwie wizualizacje; ponowienia i nieudane próby zapisujemy osobno jako możliwy koszt. Twarde limity kwoty i użycia dobieramy po pomiarze, przed płatnym uruchomieniem. |
| Q-10 | Personalizacja uwzględnia aktywny profil i jawne dodatkowe priorytety; rozpoznanie zdjęć można skorygować. Wizualizacja nie jest gwarancją dopasowania ubrania. |
| Q-11 | Teksty interfejsu i etykiety dostępności są oddzielone od logiki w słownikach PL/EN. Zmiana języka nie resetuje szafy, preferencji ani budżetu i nie zmienia kraju zakupów. Dodanie kolejnego języka nie wymaga przebudowy ekranów. |

Model kont i synchronizacji, dokładna lista pól wywiadu, rozmiarówki, algorytm
rekomendacji, dostawcy usług oraz dystrybucja w sklepach mobilnych wymagają projektu
w odpowiednich etapach. Nie są nowymi rozstrzygnięciami wynikającymi z wyboru Expo.
Obecne prace obejmują aktualizację dokumentacji po wyborze A; nie uruchamiają realnych
zdjęć, płatności ani nowych płatnych usług.

## Rozstrzygnięcia po pytaniach uzupełniających

Nie oczekujemy ponownej odpowiedzi na pięć pytań. Q24 jest kierunkiem wstępnym,
którego szczegóły trzeba wyjaśnić przy wyborze dostawcy i wdrożeniu realnych zdjęć.

| ID | Odpowiedź i status | Wpływ |
| --- | --- | --- |
| Q21 | Ustalone: oba tryby, domyślny wybiera użytkownik; początkowo dwa najlepiej dopasowane kompletne zestawy. | R-07 i R-09; trwałe ustawienie osobiste. |
| Q22 | Ustalone: nowe rzeczy wraz z dostawą, własne rzeczy 0 PLN nowego wydatku. | R-06; pełny koszt i jawność nieznanych opłat. |
| Q23 | Ustalone na początek: lista z linkami i finalizacja zakupów w sklepach wystarczy. | R-14; brak integracji składania/opłacania zamówień w pilotażu. |
| Q24 | Wstępnie: „chyba tak”, z prośbą o wyjaśnienie alternatywy. Preferowany kierunek to prywatny zapis zdjęć do usunięcia i użycie AI, po wyjaśnieniu konkretnej usługi i jej zasad. | Q-04; nie interpretować jako nieograniczonej zgody na przekazanie zdjęć dowolnemu dostawcy. |
| Q25 | Ustalone użycie planistyczne: 30 wizualizacji miesięcznie na osobę, dla dwóch osób 60. | R-25 i Q-09; pomiar kosztu i jakości poprzedza obietnicę ceny. |

Alternatywa dla prywatnej szafy ze zdjęciami to usunięcie oryginału po analizie
i zachowanie opisu ubrania. Ogranicza to ilość przechowywanych zdjęć, ale utrudnia
późniejszą wizualizację i ponowną analizę; może wymagać ponownego przesłania zdjęcia.
Przechowywanie w Ubranka i retencja kopii u dostawcy AI to oddzielne zagadnienia.
Usunięcie w aplikacji nie jest automatycznie dowodem usunięcia kopii u dostawcy.

Przed P3 pozostają wybór usług, wyjaśnienie danych i retencji, weryfikacja praw
dostępu oraz ograniczona próba jakości/kosztu. Przed realnym katalogiem P4 trzeba
potwierdzić dostęp do źródła; akceptacja listy z linkami sama tego nie zapewnia.
Te zależności nie wymagają teraz nowej rundy pytań produktowych.

## Proponowane kryteria odbioru

Wszystkie kryteria A-01–A-11 są propozycją do zatwierdzenia wraz z zakresem danego
etapu. Nie stanowią aktualnych wyników testów ani zgody na uruchamianie usług.

| ID | Scenariusz i oczekiwany dowód |
| --- | --- |
| A-01 | Użytkownik tworzy i edytuje dwa profile, przełącza aktywny profil i widzi jego zastosowanie w kolejnej rundzie; zapisany wynik na WWW oraz osobno iOS/Android. |
| A-02 | Jedna runda pokazuje najwyżej dwa pełne zestawy; pierwszy tryb to dwa najlepiej dopasowane. Użytkownik przełącza ekonomiczny/markowy i zapisuje własny tryb domyślny. Pozytywna ocena zapisuje gust bez pozycji listy zakupowej i zamówienia; kontrolowany scenariusz pokazuje wpływ opinii na następne rekomendacje. |
| A-03 | Odrzucenie obu uruchamia następną parę w ramach rozpoczętej przez użytkownika sesji. Pominięcie powodu działa; po wyłączeniu pytania w ustawieniach kolejne odrzucenie go nie wyświetla. Brak kolejnych trafnych propozycji daje stan pusty. |
| A-04 | Dodanie ubrania ze zdjęcia rzeczy i zdjęcia na osobie pozwala skorygować opis, edytować oraz usunąć rzecz; zestaw z własnej szafy wskazuje konkretne zapisane rzeczy. |
| A-05 | Scenariusz pracy do 500 PLN wykorzystuje wskazane posiadane buty jako 0 PLN nowego wydatku; nowe rzeczy i dostawy mieszczą się w limicie. Przekroczenie, obowiązkowa opłata lub nieznana cena/dostawa nie są ukrywane jako zgodność z limitem. |
| A-06 | Wizualizacja przedstawia wskazaną osobę i wybrane ubrania z akceptowalną przez Kasię/Aleksego zgodnością wyglądu. Odbiór obejmuje przykłady błędów, koszt i czas; szczegółowy próg jakości ustalamy po badaniu wykonalności. |
| A-07 | Każdy produkt do kupienia ma sprawdzalne pochodzenie i dane Q-06. Niedostępny rozmiar nie jest rekomendowany jako dostępny; niepotwierdzona oferta ma czytelny stan niepewności. |
| A-08 | Lista zakupowa jest oddzielona od „podoba mi się”; pokazuje pozycje, źródła, koszt i linki. Otwiera właściwy produkt, a finalizacja pozostaje w sklepie. Samo otwarcie linku nie oznacza zakupu, rezerwacji ani wspólnego zamówienia. |
| A-09 | Dwa konta nie odczytują wzajemnie szafy ani zdjęć; usunięcie danych jest sprawdzone zgodnie z przyjętą retencją. Przepływ do zewnętrznego AI odpowiada ustaleniom Q24. |
| A-10 | Raport kosztów uwzględnia 60 planowanych wizualizacji miesięcznie, ponowienia i opłaty stałe. Para obrazów liczy się jako dwie wizualizacje. Skonfigurowany po pomiarze limit zatrzymuje nowe płatne operacje; sama odpowiedź „30” nie jest dowodem działania limitu. |
| A-11 | Główny przepływ i etykiety dostępności działają po polsku i angielsku; zmiana języka zachowuje stan, PLN i rynek PL. Wariant A zachowuje czytelność przy obu językach i powiększonym tekście. |

## Dokumenty towarzyszące i historia

- [Plan implementacji V1.2](IMPLEMENTATION-PLAN-V1.2.md).
- [Uzupełnienie wywiadu V1.2](INTERVIEW-V1.2.md) i [wybrany kierunek A](design/DESIGN-DIRECTION-V1.2.md).
- [Plan kosztów V1.2](COST-PLAN-V1.2.md) — kalkulacja dla ustalonego użycia; źródłowe rozpoznanie usług zachowane w V1.1.
- [Wykonalność źródeł sklepów V1.1](RETAILER-FEASIBILITY-V1.1.md) — dowody dostępu i ograniczenia.
- [Stan projektu](PROJECT-STATUS.md) — jedyne miejsce bieżącego zestawienia tego, co wykonane i sprawdzone.

| Wersja | Data | Zmiana |
| --- | --- | --- |
| V1.0 | 2026-10-24 | Ogólna baza z opisu i podsumowania spotkania; plik zachowany bez nadpisywania. |
| V1.1 | 2026-10-24 | Pierwsze 20 odpowiedzi: odbiorcy, polski rynek, priorytet własnej szafy, dwie propozycje, uczenie gustu, zdjęcia, wizualizacja, koszyk do zatwierdzenia i budżet usług. Zachowano cele V1.0; pięć pytań pozostaje otwartych. |
| V1.2 | 2026-10-24 | Wybrano A; oba tryby pary z początkowym „dwa najlepiej dopasowane”, budżet nowych rzeczy z dostawą, lista z linkami, wstępny kierunek zdjęć i 30 wizualizacji na osobę. Zaplanowano PL/EN jako sposób realizacji preferencji językowych. |

Wersja dokumentu jest niezależna od wersji aplikacji. Dalsze istotne decyzje
wymagają kolejnej wersji; historyczne V1.0 i V1.1 pozostają bez zmian.
