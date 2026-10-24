# Wymagania aplikacji Ubranka — V1.1

Data: 2026-10-24. Status: ustalenia po pierwszych 20 odpowiedziach Aleksego i Kasi;
propozycje sposobu realizacji oraz kryteriów odbioru oczekują akceptacji.
Podstawa: [V1.0](REQUIREMENTS-V1.0.md), opis pomysłu i odpowiedzi przekazane w czacie.
Oznaczenie „odpowiedź 12” odnosi się do numeracji pierwszego wywiadu.
Wymaganie opisuje cel produktu, nie potwierdza wdrożenia funkcji.

## Cel, odbiorcy i pierwsze zastosowanie

Ubranka to wirtualny stylista dla kobiet i mężczyzn, którzy nie mają sprecyzowanego
stylu lub czasu na zakupy. Najpierw korzystają z niego Aleksy i Kasia; docelowo ma
powstać produkt komercyjny na polski rynek. Kolejność potrzeb jest następująca:
poznanie własnego stylu, układanie zestawów z posiadanych rzeczy, pomoc w zakupach.

Przyjęty przykład zastosowania: „Potrzebuję zestawu do pracy do 500 zł, pasującego
do moich butów, i chcę wybrać w kilka minut”. To scenariusz do sprawdzania produktu,
a nie stały limit wszystkich użytkowników. Dokładny sposób rozliczania własnych
rzeczy i dostawy w budżecie wymaga odpowiedzi Q22.

Pierwszy zakres odzieży to ubrania codzienne i eleganckie. Odpowiedź 3 przyjmuje
wariant z pytania: Polska, polski język interfejsu, ceny w PLN i dostawa do Polski.
Nie rozstrzyga wszystkich przyszłych języków ani rozmiarówek.
Budżet działania usług został podany wprost: około 150 PLN miesięcznie, możliwie mniej.

## Potwierdzone potrzeby i zachowane wymagania

Identyfikatory R-01–R-16 zachowują ciągłość z V1.0. Nowe doprecyzowania nie usuwają
celów wcześniejszej wersji, w szczególności wielu profili stylu ani przyszłych zakupów
automatycznych. „Potwierdzone” oznacza zapisane przez użytkownika, nie gotowe technicznie.

| ID | Wymaganie | Źródło i granica ustalenia |
| --- | --- | --- |
| R-01 | WWW, iOS i Android; WWW wygodne na telefonie. | Opis projektu; każda platforma wymaga własnej weryfikacji. |
| R-02 | Spokojna, przyjemna oprawa, mało decyzji i przeglądania. | Opis; odpowiedzi 5 i 19. Wariant wizualny nie został wybrany. |
| R-03 | Krótki start zbiera podstawowe potrzeby; aplikacja stopniowo poznaje preferencje przez używanie i opinie. | Odpowiedź 8. Szczegółowy wywiad pozostaje możliwym etapem uzupełniania profilu, nie obowiązkową długą ankietą na wejściu. |
| R-04 | Profilowanie wykorzystuje wymiary/rozmiary i zdjęcia. | Odpowiedź 9 wskazuje te rodzaje danych jako obowiązkowe do dobierania ubrań. Lista pól, liczba i rodzaj zdjęć oraz moment ich zebrania pozostają do opracowania. Nie uzgodniono trybu bez zdjęć. |
| R-05 | Kilka edytowalnych i przełączanych profili stylu. | Zachowane z V1.0; np. codzienny i elegancki. Nie ograniczać konta do jednego profilu. |
| R-06 | Użytkownik określa kwotę na cały zestaw oraz preferencje cenowe. | Odpowiedź 11; koszt własnych rzeczy i dostawy pozostaje otwarty w Q22. |
| R-07 | Jedna runda zawiera maksymalnie dwie propozycje, bez długiego katalogu alternatyw. Kasia preferuje dwa kompletne zestawy. | Odpowiedź 12; domyślny sposób połączenia z R-09 do wyboru w Q21. |
| R-08 | Szybkie „podoba mi się” / „nie”; dostępne przyciski, gest może być dodatkiem. | V1.0 i odpowiedź 13. Pozytywna ocena oznacza sygnał gustu, nie zakup ani dodanie do koszyka. |
| R-09 | Możliwość porównania opcji ekonomicznej i markowej. | V1.0 i odpowiedź 12 Aleksego. Obie muszą respektować budżet; marka nie zastępuje dopasowania. |
| R-10 | System uwzględnia opinie w kolejnych propozycjach. Po odrzuceniu obu przedstawia następną parę; powód odrzucenia można pominąć, a pytanie wyłączyć w ustawieniach. | Odpowiedzi 13–14. Brak odpowiedniego wyniku musi mieć uczciwy stan pusty. |
| R-11 | Znajdowanie nowych ubrań według wytycznych. Preferowane źródła: Vinted, Zara, Zalando, Reserved i H&M. | Odpowiedź 6. To lista oczekiwanych sklepów, nie potwierdzenie dostępu do API, katalogu, cen ani koszyka. |
| R-12 | Wirtualna szafa rzeczy posiadanych i kupionych. Dodawanie na podstawie zdjęcia ubrania oraz zdjęcia ubrania na osobie. | V1.0; odpowiedź 16: Kasia — zdjęcie rzeczy, Aleksy — zdjęcie na sobie. Wspieranie obu sposobów odpowiada obu potrzebom. |
| R-13 | Kompletne zestawy z własnych rzeczy, nowych produktów albo obu źródeł. | V1.0 i odpowiedź 4. Zestawy z posiadanych ubrań mają pierwszeństwo w proponowanej kolejności prac. |
| R-14 | Pierwszy etap zakupowy przygotowuje koszyk do zatwierdzenia. Samodzielne zakupy i podpięcie metody płatności pozostają późniejszym celem. | Odpowiedź 18 zawęża pierwszy etap względem docelowego pomysłu V1.0. Znaczenie „koszyka” do ustalenia w Q23. |
| R-15 | Użytkownik kontroluje wydatki i moment zatwierdzenia zakupów. | V1.0 i odpowiedź 18. Ocena gustu, wybór zestawu i zatwierdzenie zakupu to różne czynności. |
| R-16 | Częste sprawdzanie postępów z telefonu, także poza domową siecią. | Opis organizacji; działający podgląd WWW nie stanowi dowodu działania aplikacji natywnej. |
| R-17 | Odbiorcami są kobiety i mężczyźni bez sprecyzowanego stylu lub czasu na zakupy. | Odpowiedź 1. |
| R-18 | Najpierw pilotaż własny, docelowo produkt komercyjny na polski rynek. | Odpowiedzi 2–3; model zarabiania pozostaje późniejszą decyzją. |
| R-19 | Podstawowe okazje to ubiór codzienny i elegancki. | Odpowiedź 7. Inne style można później rozwinąć bez usuwania wielu profili. |
| R-20 | Główne kryteria to dopasowanie do sylwetki, wygląd i styl; użytkownik może wskazać dodatkowe priorytety. | Odpowiedź 10. Szczegółowe wagi rankingu i lista dodatkowych kryteriów nie zostały zatwierdzone. |
| R-21 | Propozycje powstają na prośbę użytkownika. | Odpowiedź 15. Nie ustalono harmonogramu automatycznych propozycji ani powiadomień. |
| R-22 | Zestaw jest wizualizowany na osobie lub zdjęciu użytkownika. | Odpowiedź 17. Jest to wymaganie produktu; dostawca, koszt, jakość i wykonalność nie są jeszcze potwierdzone. |
| R-23 | Docelowy miesięczny budżet usług dla pilotażu to około 150 PLN; szukamy tańszego wariantu. | Odpowiedź 20. Limit planistyczny nie jest zgodą na subskrypcje, opłaty ani nieograniczone wywołania AI. |

## Propozycja pierwszego przepływu

Poniższy przebieg łączy odpowiedzi, ale nie oznacza odbioru projektu UX:

1. Krótkie rozpoczęcie, wybór potrzeb i aktywnego profilu; dane z R-04 zbierane
   w uzgodnionych krokach bez długiego formularza na jednym ekranie.
2. Dodanie rzeczy do szafy ze zdjęcia rzeczy lub zdjęcia na sobie; możliwość
   poprawienia rozpoznanych informacji zamiast przyjmowania ich jako pewnych.
3. Na prośbę użytkownika wybór okazji, budżetu i dodatkowych priorytetów.
4. Dwie kompletne propozycje wykorzystujące własne rzeczy; później także produkty
   do kupienia. Robocza propozycja połączenia preferencji Kasi i Aleksego:
   dwa zestawy, jeden ekonomiczny, drugi markowy, z ustawieniem sposobu porównania.
   Domyślność tego trybu pozostaje otwarta w Q21.
5. „Podoba mi się” uczy preferencji. Odrzucenie prowadzi do kolejnej pary;
   powód jest dobrowolny. Użytkownik może zakończyć rundy w dowolnej chwili.
6. Osobna czynność przygotowuje wybrany zestaw do zakupów; koszyk wymaga
   zatwierdzenia. Zakres wykonania zamówienia zależy od Q23 i integracji sklepu.

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
| Q-04 | Prywatność parametrów i zdjęć, kontrola dostępu, świadome przesyłanie, ustalone zasady retencji/usuwania oraz przekazywania dostawcy AI przed realnym uploadem. Q24 pozostaje otwarte. |
| Q-05 | Sekrety wyłącznie na serwerze; `EXPO_PUBLIC_*` jest publiczne. Zdjęcia użytkowników, tokeny i prywatne dane nie trafiają do publicznego repozytorium. |
| Q-06 | Każda rzeczywista oferta ma źródło, link, cenę, walutę i czas pobrania; rozmiar i dostępność są potwierdzone albo jawnie nieznane. Przed zatwierdzeniem zakupów wymagają ponownego sprawdzenia. |
| Q-07 | Zakupy mają historię, kontrolę kwoty, uzgodnione potwierdzenie i sposób wyłączenia automatyzacji. Dane karty obsługuje właściwy operator; aplikacja nie przechowuje numeru karty ani CVV. |
| Q-08 | Odtwarzalne środowisko i lockfile; dokumentacja rozdziela plany, mocki, rzeczywiste integracje i zweryfikowane funkcje. |
| Q-09 | Koszty usług mierzone według użycia; limit miesięczny i limit wizualizacji ustalane na podstawie Q25. Ponowienia AI nie mogą powodować niekontrolowanych wydatków. |
| Q-10 | Personalizacja uwzględnia aktywny profil i jawne dodatkowe priorytety; rozpoznanie zdjęć można skorygować. Wizualizacja nie jest gwarancją dopasowania ubrania. |

Model kont i synchronizacji, dokładna lista pól wywiadu, rozmiarówki, algorytm
rekomendacji, dostawcy usług oraz dystrybucja w sklepach mobilnych wymagają projektu
w odpowiednich etapach. Nie są nowymi rozstrzygnięciami wynikającymi z wyboru Expo.
Obecne prace obejmują dokumentację i propozycje wizualne; nie uruchamiają realnych
zdjęć, płatności ani nowych płatnych usług.

## Pięć pytań uzupełniających

Poniższe pytania są otwarte. Nie należy traktować sugerowanych odpowiedzi jako
uzgodnień. Wybór kierunku graficznego A/B/C stanowi oddzielny odbiór wizualny.

| ID | Pytanie i proponowany punkt wyjścia | Wpływ |
| --- | --- | --- |
| Q21 | Jaki ma być domyślny tryb: dwa najlepsze kompletne zestawy czy dwa kompletne zestawy ekonomiczny/markowy? Propozycja: oba tryby dostępne w ustawieniach; domyślny do wyboru. | R-07, R-09 i konstrukcja rundy. |
| Q22 | Czy budżet zestawu obejmuje tylko rzeczy do dokupienia, czy także wartość posiadanych ubrań, i czy wliczamy dostawę? Propozycja: nowe rzeczy z dostawą; własne rzeczy jako 0 PLN wydatku w tej rundzie. | R-06, sumowanie cen i scenariusz 500 PLN. |
| Q23 | Czy pierwszy „koszyk do zatwierdzenia” to lista zakupowa w Ubranka z linkami do sklepów, czy rzeczywisty koszyk/zamówienie u sprzedawcy? | Zakres pierwszej integracji zakupowej i znaczenie zatwierdzenia. |
| Q24 | Czy zdjęcia mają być prywatnie przechowywane do usunięcia przez użytkownika i czy można przekazywać je wybranemu dostawcy AI do analizy/wizualizacji? To propozycja; zgoda i szczegóły usuwania danych dostawcy pozostają do ustalenia. | Retencja, prywatność i możliwość uruchomienia wizualizacji na realnej osobie. |
| Q25 | Ilu użytkowników obejmuje pierwszy pilotaż i ile wizualizacji na osobę miesięcznie przewidujemy? | Realność budżetu około 150 PLN i dobór limitów usług. |

## Proponowane kryteria odbioru

Wszystkie kryteria A-01–A-10 są propozycją do zatwierdzenia wraz z zakresem danego
etapu. Nie stanowią aktualnych wyników testów ani zgody na uruchamianie usług.

| ID | Scenariusz i oczekiwany dowód |
| --- | --- |
| A-01 | Użytkownik tworzy i edytuje dwa profile, przełącza aktywny profil i widzi jego zastosowanie w kolejnej rundzie; zapisany wynik na WWW oraz osobno iOS/Android. |
| A-02 | Jedna runda pokazuje najwyżej dwie propozycje. Pozytywna ocena zapisuje sygnał gustu bez pozycji koszyka i zamówienia; kontrolowany scenariusz pokazuje wpływ opinii na następne rekomendacje. |
| A-03 | Odrzucenie obu uruchamia następną parę w ramach rozpoczętej przez użytkownika sesji. Pominięcie powodu działa; po wyłączeniu pytania w ustawieniach kolejne odrzucenie go nie wyświetla. Brak kolejnych trafnych propozycji daje stan pusty. |
| A-04 | Dodanie ubrania ze zdjęcia rzeczy i zdjęcia na osobie pozwala skorygować opis, edytować oraz usunąć rzecz; zestaw z własnej szafy wskazuje konkretne zapisane rzeczy. |
| A-05 | Scenariusz pracy do 500 PLN wykorzystuje wskazane posiadane buty i mieści się w budżecie obliczonym według odpowiedzi Q22; przekroczenie lub nieznana cena/dostawa nie jest ukrywane jako zgodność z limitem. |
| A-06 | Wizualizacja przedstawia wskazaną osobę i wybrane ubrania z akceptowalną przez Kasię/Aleksego zgodnością wyglądu. Odbiór obejmuje przykłady błędów, koszt i czas; szczegółowy próg jakości ustalamy po badaniu wykonalności. |
| A-07 | Każdy produkt do kupienia ma sprawdzalne pochodzenie i dane Q-06. Niedostępny rozmiar nie jest rekomendowany jako dostępny; niepotwierdzona oferta ma czytelny stan niepewności. |
| A-08 | Przygotowanie i zatwierdzenie koszyka jest oddzielone od „podoba mi się”; przed zatwierdzeniem widoczny jest zakres i koszt. Dalsza czynność odpowiada dokładnie uzgodnieniu Q23. |
| A-09 | Dwa konta nie odczytują wzajemnie szafy ani zdjęć; usunięcie danych jest sprawdzone zgodnie z przyjętą retencją. Przepływ do zewnętrznego AI odpowiada ustaleniom Q24. |
| A-10 | Raport pilotażu obejmuje koszt stały, zmienny i wizualizacji przy wolumenie Q25; uzgodniony limit zatrzymuje kolejne płatne operacje zamiast przekraczać budżet. |

## Dokumenty towarzyszące i historia

- [Plan implementacji V1.1](IMPLEMENTATION-PLAN-V1.1.md).
- [Zapis 20 odpowiedzi](INTERVIEW-V1.1.md) i [kierunki wyglądu A/B/C](design/DESIGN-CONCEPTS-V1.1.md).
- [Analiza kosztów V1.1](COST-PLAN-V1.1.md) — propozycje usług i założenia kosztowe.
- [Wykonalność źródeł sklepów V1.1](RETAILER-FEASIBILITY-V1.1.md) — dowody dostępu i ograniczenia.
- [Stan projektu](PROJECT-STATUS.md) — jedyne miejsce bieżącego zestawienia tego, co wykonane i sprawdzone.

| Wersja | Data | Zmiana |
| --- | --- | --- |
| V1.0 | 2026-10-24 | Ogólna baza z opisu i podsumowania spotkania; plik zachowany bez nadpisywania. |
| V1.1 | 2026-10-24 | Pierwsze 20 odpowiedzi: odbiorcy, polski rynek, priorytet własnej szafy, dwie propozycje, uczenie gustu, zdjęcia, wizualizacja, koszyk do zatwierdzenia i budżet usług. Zachowano cele V1.0; pięć pytań pozostaje otwartych. |

Wersja dokumentu jest niezależna od wersji aplikacji. Dalsze istotne decyzje
wymagają kolejnej wersji; nie zastępujemy historycznej V1.0 nowymi ustaleniami.
