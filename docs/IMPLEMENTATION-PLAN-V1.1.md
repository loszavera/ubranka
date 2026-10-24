# Plan implementacji Ubranka — V1.1

Data: 2026-10-24. Status: plan po pierwszym wywiadzie; kolejność i kryteria dalszej
implementacji są propozycją do uzgodnienia. Aktualna praca obejmuje dokumentację,
analizę wykonalności/kosztów i propozycje wyglądu; nie uruchamia funkcji stylisty.
Podstawa: [Wymagania V1.1](REQUIREMENTS-V1.1.md), [rejestr decyzji](DECISIONS.md)
i zachowany [plan V1.0](IMPLEMENTATION-PLAN-V1.0.md).

## Kierunek i zależności

Najpierw poznajemy gust i tworzymy zestawy z własnej szafy. Integracje sklepów
rozszerzają ten przepływ o dokupowanie rzeczy. Pierwszy etap zakupowy kończy się
koszykiem do zatwierdzenia; samodzielne zakupy pozostają osobnym późniejszym etapem.

Wizualizacja na osobie jest wymaganiem produktu, dlatego jej wykonalność, jakość
i koszt sprawdzamy wcześnie, zanim uzależnimy cały projekt od konkretnej usługi.
Wygenerowana koncepcja wyglądu ekranu nie dowodzi działania wirtualnej przymierzalni.

Podział P0–P5 zachowuje ciągłość z V1.0. Dokładne zadania i wielkość pierwszego
wydania zostaną zatwierdzone po wyborze wyglądu i odpowiedziach Q21–Q25. Każdy etap
kończy się małym wynikiem do obejrzenia i aktualizacją statusu. Nie podajemy terminów
dalszych etapów przed rozstrzygnięciem ich zależności.

## P0 — Fundament i dalsze sprawdzanie na urządzeniach

Stan: infrastruktura i podgląd WWW zostały przygotowane oraz sprawdzone zgodnie
z [PROJECT-STATUS.md](PROJECT-STATUS.md). Aplikacja nadal zawiera ekran techniczny.
Wynik użytkownika „działa” potwierdza jego sprawdzenie podglądu; nie dopisujemy na
tej podstawie przeprowadzonego testu natywnego Expo Go.

Zachowany zakres P0: repozytorium `main`/`dev`, instrukcje agentów i dokumentacja,
TypeScript/React Native/Expo/Router, przypięte zależności, kontrole projektu,
eksport WWW i Vercel, instrukcje telefonu i pracy zdalnej oraz dostęp do usług.

Pozostałe kontrole:

- Zapisać rzeczywiste uruchomienie w Expo Go na fizycznym iOS oraz Androidzie;
  platformę bez wykonanego testu nadal oznaczać jako niesprawdzoną.
- Prowadzić znane problemy zależności w [DEPENDENCY-STATUS.md](DEPENDENCY-STATUS.md),
  oddzielnie od wyników udanego buildu.
- Po kolejnych zmianach weryfikować właściwy commit, wynik CI i wdrożenie;
  poprzedni udany run nie stanowi dowodu dla nowego kodu.

Odbiór pozostaje zgodny z V1.0: znane SHA, instalacja i kontrole, działający ekran
WWW, osobny wynik urządzeń oraz dokumentacja wystarczająca do dalszej pracy.
Powiązania: R-01, R-16, Q-01, Q-08.

## P1 — Ustalenia produktu, wygląd i ograniczenia pilotażu

Stan: pierwsze 20 odpowiedzi otrzymano. Bieżący rezultat to wymagania i plan V1.1,
propozycje wizualne oraz analizy źródeł i kosztów. Nie jest to jeszcze odbiór UX.

1. Zachować V1.0 i udokumentować ustalenia z wywiadu, odróżniając odpowiedzi od
   proponowanego połączenia dwóch zestawów z porównaniem ekonomiczny/markowy.
2. Przedstawić trzy spokojne kierunki wizualne A/B/C do wyboru; zatwierdzić podstawy
   kolorów, typografii, przycisków i czytelności na telefonie.
3. Rozstrzygnąć pięć pytań Q21–Q25: tryb pary, liczenie budżetu, znaczenie koszyka,
   prywatność/przetwarzanie zdjęć oraz wielkość pilotażu i liczba wizualizacji.
4. Zaprojektować krótki start i stopniowe uzupełnianie profilu. Wymiary/rozmiary
   i zdjęcia są obowiązkowe do dobierania ubrań; opracować konkretne pola,
   rodzaje zdjęć i kolejność ich pozyskania bez uznawania trybu bez zdjęć za przyjęty.
5. Uzgodnić zakres pierwszego demonstratora oraz kryteria jego odbioru na podstawie
   A-01–A-10. Nie wszystkie kryteria dotyczą pierwszego wydania.
6. Oprzeć dobór backendu/AI i źródeł na [analizie kosztów](COST-PLAN-V1.1.md)
   i [analizie sklepów](RETAILER-FEASIBILITY-V1.1.md); oddzielić ustalone możliwości
   od wymagających partnerstwa lub niepotwierdzonego dostępu.

Proponowany odbiór: wybrany kierunek wizualny, zapisane odpowiedzi Q21–Q25,
uzgodniony pierwszy przepływ i jawne ograniczenia jego demonstracji.
Zależność dla następnych etapów: odbiór ich konkretnego zakresu, a nie samo
istnienie planu. Powiązania: R-02–R-10, R-17–R-23.

## P2 — Profile, szafa demonstracyjna i dwie propozycje

Zależność: uzgodniony zakres P1 i wygląd. Etap korzysta z jawnie oznaczonych danych
demonstracyjnych; wprowadzanie realnych zdjęć i synchronizacja należą do P3.

- Zbudować krótki start, edycję i przełączanie kilku profili stylu oraz budżet
  całego zestawu według Q22. Uwzględnić dodatkowe priorytety użytkownika.
- Przygotować model szafy i demonstracyjne ubrania, a następnie zestawy z własnych
  rzeczy. Ten przepływ powstaje przed integracją katalogów sklepów.
- Zbudować rundę najwyżej dwóch propozycji według Q21, z przyciskami „podoba mi się”
  i odrzucenia. Rozdzielić zapis gustu od przyszłego koszyka.
- Po odrzuceniu obu pokazać kolejną parę; powód można pominąć lub wyłączyć pytanie
  w ustawieniach. Dodać zakończenie sesji, pusty wynik, błąd i brak sieci.
- Utrwalić stan demonstratora w uzgodnionym zakresie. Sprawdzić, że aktywny profil,
  budżet i opinie wpływają na wybór na kontrolowanym zestawie przykładów.
- Uzgodnić kontrakty danych dla konta, profilu, rzeczy w szafie, produktu sklepu,
  zestawu, opinii i przyszłej wizualizacji; nie dodawać usług na zapas.

Proponowany odbiór: działający przepływ start → profil → szafa → para → opinia,
sprawdzony na WWW i oddzielnie iOS/Android. A-01–A-03 oraz część A-05 realizujemy
na danych demo i tak oznaczamy dowód; nie jest to odbiór rozpoznawania zdjęć ani
rzeczywistych rekomendacji AI. Powiązania: R-03, R-05–R-10, R-12–R-13, R-20–R-21,
Q-01–Q-03, Q-08, Q-10.

## P3 — Prywatna szafa, zdjęcia i wykonalność wizualizacji

Zależność: zasady danych Q24, wolumen Q25 oraz odbiór zakresu. Prywatna szafa
i zestawy z własnych ubrań mają pierwszeństwo przed uruchomieniem P4.

### P3a — Ograniczone sprawdzenie wizualizacji

To wczesna część P3, możliwa do przygotowania równolegle z P2 na sztucznych lub
odpowiednio uprawnionych materiałach. Uruchomienie usługi płatnej wymaga zakresu
mieszczącego się w upoważnieniu; miesięczny cel 150 PLN sam go nie udziela.

- Wybrać niewielki, z góry ustalony zestaw przypadków dla kobiety i mężczyzny,
  ubioru codziennego/eleganckiego oraz jednej rzeczy i pełnego zestawu.
- Ustalić limit liczby prób, kwoty i ponowień przed uruchomieniem porównania usług.
  Raport obejmuje koszt pojedynczego zaakceptowanego wyniku i czas oczekiwania.
- Ocenić zachowanie wyglądu osoby, koloru/kroju rzeczy, kompletności zestawu
  i widocznych błędów. Zdjęcie generowane nie dowodzi rozmiaru ani fizycznego fitu.
- Sprawdzić wymagania wejściowe zdjęć, zasady przechowywania u dostawcy i możliwość
  usunięcia. Nie wysyłać teraz realnych zdjęć użytkowników.
- Przedstawić przykłady i wynik „wykonalne”, „z ograniczeniami” albo „niewykonalne
  w przyjętym budżecie”. Jeśli próba się nie powiedzie, uzgodnić zmianę zakresu;
  nie zastępować po cichu wymaganej wizualizacji zwykłą kolażową kartą zestawu.

Proponowany odbiór: raport jakości/kosztu z ograniczonej próby i decyzja o sposobie
realizacji R-22. Próg jakości zatwierdzają Aleksy/Kasia na przykładach (A-06).

### P3b — Zapis danych i stylizacje z własnej szafy

- Wybrać uwierzytelnianie, bazę i prywatny magazyn zdjęć z kosztami odpowiadającymi
  pilotażowi. Nie traktować darmowego limitu jako gwarancji stałych kosztów.
- Wdrożyć konta, profile, ubrania, opinie, kontrolę dostępu i synchronizację;
  nie zakładać współdzielenia szaf między użytkownikami bez decyzji o tej funkcji.
- Dodać oba sposoby wprowadzania ubrania: zdjęcie rzeczy i zdjęcie na osobie.
  Umożliwić poprawienie rozpoznania, edycję i usuwanie wpisu oraz zdjęcia.
- Wdrożyć ustalone wymiary/rozmiary i zdjęcia sylwetki. Komunikat o przetwarzaniu,
  retencja i usuwanie mają odpowiadać Q24, w tym danym przekazanym do AI.
- Układać dwie propozycje z posiadanych ubrań według okazji, aktywnego profilu
  i opinii. Utrwalać sygnały gustu; dobrać AI tylko do potrzeb wymagających AI.
- Po pozytywnej ocenie P3a włączyć wizualizację z limitami, czytelnym czasem
  oczekiwania i obsługą błędów, bez automatycznych nieograniczonych ponowień.

Proponowany odbiór: zapis/odczyt/edycja/usunięcie, synchronizacja i izolacja dwóch
kont sprawdzone w rzeczywistym środowisku testowym; oba typy zdjęć działają;
powstają zestawy z konkretnych rzeczy użytkownika. A-04, A-06 i A-09 mają dowody
oddzielone od makiet P2. Powiązania: R-04, R-05, R-10, R-12–R-13, R-20–R-23,
Q-04–Q-05, Q-09–Q-10.

## P4 — Produkty do dokupienia i koszyk do zatwierdzenia

Zależność: sprawdzony przepływ szafy, rozstrzygnięcia Q21–Q23 i zweryfikowany
sposób dostępu do każdego uruchamianego źródła. Vinted, Zara, Zalando, Reserved
i H&M są oczekiwaną listą; nie obiecujemy jednoczesnej integracji wszystkich.

- Dla pierwszego rzeczywiście dostępnego źródła potwierdzić dozwolony dostęp,
  zakres danych i sposób aktualizacji. Kolejne źródła dodawać po osobnej weryfikacji.
  Wprowadzanie produktu linkiem może być wariantem do uzgodnienia, nie ukrytą
  deklaracją automatycznego przeszukiwania pięciu sklepów.
- Zapisywać pochodzenie, link, cenę/walutę, czas sprawdzenia, rozmiar i dostępność.
  Obsłużyć brak informacji i zmianę oferty; nie prezentować danych nieznanych jako pewne.
- Filtrować według profilu, sylwetki/rozmiarów, budżetu i dodatkowych priorytetów;
  tworzyć pełne zestawy z nowych rzeczy albo nowych i własnych.
- Wprowadzić porównanie ekonomiczne/markowe według Q21. Droższa marka nie może
  znosić budżetu ani głównych kryteriów dopasowania.
- Zrealizować znaczenie koszyka wybrane w Q23. Lista w Ubranka z linkami ma inne
  kryteria niż koszyk sklepu; nie obiecywać wspólnego zamówienia u wielu sprzedawców
  bez dostępnej integracji. „Podoba mi się” nadal tylko zapisuje gust.
- Przed zatwierdzeniem pokazać pozycje i koszty według Q22 oraz sprawdzić aktualność
  ofert. Gdy potrzebne jest rzeczywiste zamówienie, najpierw ustalić przebieg,
  potwierdzenie, niepowodzenia i środowisko testowe danego sprzedawcy/operatora.

Proponowany odbiór: A-05, A-07 i A-08 na rzeczywistym źródle, ze scenariuszem
zestawu do pracy do 500 PLN i posiadanych butów. Raport wylicza, które sklepy
działają, jaki rodzaj koszyka wdrożono i co pozostaje nieobsługiwane.
Powiązania: R-06–R-11, R-13–R-15, Q-06–Q-07.

## P5 — Pilotaż, komercjalizacja i późniejsze zakupy automatyczne

Zależność: odebrany konkretny zakres P2–P4; nie wszystkie docelowe integracje
muszą istnieć, ale ograniczenia pilotażu wymagają uzgodnienia z użytkownikami.

- Uruchomić uzgodniony pilotaż, mierzyć trafność, liczbę rund do decyzji, błędy
  i koszt. Porównać koszt stały/zmienny z około 150 PLN miesięcznie przy Q25.
- Wprowadzić uzgodnione limity kosztów i wizualizacji z A-10; próg kwoty oraz
  reakcję na jego osiągnięcie skonfigurować przed wywołaniami płatnymi.
- Przed komercyjnym udostępnieniem ustalić model przychodów, konta i koszty
  dystrybucji iOS/Android, warunki usług oraz obsługę danych i użytkowników.
- Automatyczne kupowanie zachować jako oddzielny przyszły zakres: zgody, limity,
  wyłączenie, historia, anulowanie, błędy płatności/zamówienia i zwroty.
- Dla automatyzacji dobrać partnerów i operatora płatności, bez przechowywania
  numerów kart/CVV. Zweryfikować ponowienia i brak podwójnego zamówienia.
- Przejść od sandboxu operatora do realnych zakupów wyłącznie w osobno ustalonym
  zakresie; wcześniejszy odbiór koszyka nie uruchamia automatycznych płatności.

Proponowany odbiór pilotażu: zapisane wyniki oraz koszt względem limitu.
Odbiór późniejszej automatyzacji: uzgodnione scenariusze, awarie i kontrola wydatków
sprawdzone w sandboxie, z osobnym zakresem startu zakupów rzeczywistych.
Powiązania: R-14–R-15, R-18, R-23, Q-07, Q-09.

## Weryfikacja i wydawanie

- Dokumentację sprawdzamy pod kątem spójności odpowiedzi, statusów i odsyłaczy;
  nie przypisujemy jej wyników testów funkcji.
- Zmiany kodu: `npm run check` i właściwy build. Zmiany zależności:
  `npm run check:dependencies` i `npm run doctor`. Wspólny UI/routing:
  `npm run build:all` oraz WWW na małym ekranie.
- Testy automatyczne dotyczą realnych reguł: limitu dwóch propozycji, profili,
  budżetu, rozdzielenia opinii od zakupów, praw dostępu i integracji. Nie tworzyć
  pustych atrap jako dowodu działania usług.
- Testować klawiaturę, czytelność, stany błędów i fizyczne urządzenia. Dowód
  opisuje platformę, dane demonstracyjne/rzeczywiste i pozostające ograniczenia.
- Każdy odbiór wskazuje wymagania R/Q i właściwe proponowane kryteria A po ich
  zatwierdzeniu. Statyczny projekt ekranu nie stanowi odbioru działającego przepływu.
- Pracować na `dev`; zmiany `main` wymagają uzgodnionego odbioru zakresu.
  Zachowywać historię i sprawdzać lokalne/zdalne SHA po upoważnionym push.
- Dokumentować koszty i faktyczne integracje wraz z rozwojem; repozytorium publiczne
  nie może zawierać prywatnych zdjęć, danych osobowych, sekretów ani logów kont.

## Historia wersji

| Wersja | Data | Zmiana |
| --- | --- | --- |
| V1.0 | 2026-10-24 | Pierwszy ogólny plan P0–P5; zachowany jako baza. |
| V1.1 | 2026-10-24 | Plan po 20 odpowiedziach: własna szafa przed sklepami, krótkie profilowanie, dwa zestawy i uczenie gustu, wczesna ograniczona próba wizualizacji, koszyk do zatwierdzenia, pilotaż w docelowym budżecie około 150 PLN. |

Wersja planu nie jest wersją aplikacji. Bieżące wykonanie i wyniki kontroli
pozostają w [PROJECT-STATUS.md](PROJECT-STATUS.md); dalsze istotne ustalenia
tworzą nową wersję planu zamiast nadpisywania V1.0.
