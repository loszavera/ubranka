# Plan implementacji Ubranka — V1.2

Data: 2026-10-24. Status: plan po wyborze szaty A i odpowiedziach Q21–Q25.
Ustalenia użytkowników są zapisane; szczegółowy zakres wykonania i kryteria odbioru
pozostają planem. Ta aktualizacja dokumentacji nie uruchamia implementacji ani usług.
Podstawa: [Wymagania V1.2](REQUIREMENTS-V1.2.md), [rejestr decyzji](DECISIONS.md)
i zachowane [V1.0](IMPLEMENTATION-PLAN-V1.0.md) oraz [V1.1](IMPLEMENTATION-PLAN-V1.1.md).

## Kierunek i zależności

Najpierw poznajemy gust i tworzymy zestawy z własnej szafy. Integracje sklepów
rozszerzają ten przepływ o dokupowanie rzeczy. Pierwszy etap zakupowy kończy się
listą z linkami; użytkownik finalizuje zakup w sklepie. Składanie zamówień przez
Ubranka i samodzielne zakupy pozostają osobnym późniejszym etapem.

Wizualizacja na osobie jest wymaganiem produktu, dlatego jej wykonalność, jakość
i koszt sprawdzamy wcześnie, zanim uzależnimy cały projekt od konkretnej usługi.
Wygenerowana koncepcja wyglądu ekranu nie dowodzi działania wirtualnej przymierzalni.

Podział P0–P5 zachowuje ciągłość z V1.0. Wygląd A oraz Q21–Q23/Q25 są ustalone;
Q24 wstępnie określa kierunek, a dane konkretnego dostawcy wymagają wyjaśnienia
przed realnym przesłaniem zdjęć. Nie powtarzamy zamkniętej rundy pytań.
Każdy etap kończy się małym wynikiem do obejrzenia i aktualizacją statusu.

Najbliższy proponowany zakres to prototyp A z interfejsem PL/EN, profilami,
szafą demonstracyjną, dwoma trybami pary i opiniami. Realne zdjęcia, usługi AI
i katalogi sklepów mają odrębne zależności P3/P4; makieta nie dowodzi ich działania.

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

Stan: otrzymano pierwsze 20 odpowiedzi oraz doprecyzowania. Wybrano kierunek
A — Krem i śliwka, a odpowiedzi przeniesiono do wymagań i planu V1.2.
Wygląd jest wybrany, lecz interaktywny UX i dostępność nie zostały jeszcze odebrane.

| Decyzja | Stan po odpowiedziach |
| --- | --- |
| Wygląd | A — Krem i śliwka; realizacja komponentami, bez wklejania obrazka zamiast UI. |
| Języki | Kasia PL, Aleksy preferuje EN, dopuszcza dodanie później. Do prototypu planujemy PL/EN przez słowniki i osobiste ustawienie; rynek PL i PLN pozostają bez zmian. |
| Q21 | Oba tryby; początkowo dwa najlepiej dopasowane pełne zestawy. Użytkownik wybiera własny domyślny. |
| Q22 | Budżet na nowe rzeczy i dostawy; własne rzeczy 0 PLN nowego wydatku. |
| Q23 | Lista z linkami wystarczy na początek; zakup kończy się w sklepie. |
| Q24 | Wstępny kierunek: prywatne zdjęcia do usunięcia i użycie AI. Konkretną usługę, dane i retencję/usuwanie wyjaśniamy przed realnym przesłaniem. |
| Q25 | 30 wizualizacji na osobę miesięcznie, 60 łącznie dla dwóch osób; planowane użycie, nie gwarantowany koszt ani skonfigurowany limit. |

Pozostałe przygotowanie do realizacji:

1. Zachować V1.0/V1.1 jako historię; używać ustaleń V1.2 do prototypu.
2. Zaprojektować krótki start i stopniowe uzupełnianie profilu. Wymiary/rozmiary
   i zdjęcia są obowiązkowe do dobierania ubrań; opracować konkretne pola,
   rodzaje zdjęć i kolejność ich pozyskania bez uznawania trybu bez zdjęć za przyjęty.
3. Przełożyć A na kolory, typografię, komponenty i zachowanie na telefonie;
   od początku oddzielić teksty PL/EN od logiki ekranów.
4. Uzgodnić konkretny zakres wykonania P2 oraz właściwe kryteria A-01–A-11.
   Nie wszystkie kryteria dotyczą pierwszego demonstratora.
5. Dobór backendu/AI i źródeł oprzeć na [planie kosztów V1.2](COST-PLAN-V1.2.md)
   i [analizie sklepów](RETAILER-FEASIBILITY-V1.1.md), z aktualnym wolumenem
   60 wizualizacji i zakresem listy z linkami z V1.2.

Zależność dla następnych etapów: uzgodniony konkretny zakres, a nie samo istnienie
planu. Obecne odpowiedzi wystarczają do jego przygotowania bez nowej ankiety.
Powiązania: R-02–R-10, R-17–R-25, Q-11.

## P2 — Profile, szafa demonstracyjna i dwie propozycje

Zależność: uzgodniony zakres wykonania; wygląd A jest wybrany. Etap korzysta z jawnie oznaczonych danych
demonstracyjnych; wprowadzanie realnych zdjęć i synchronizacja należą do P3.

- Wdrożyć komponenty kierunku A z czytelnym kontrastem, dużymi celami dotykowymi
  i etykietami dostępności. Dopasować układ do małego ekranu oraz dłuższych tekstów.
- Utworzyć słowniki PL/EN, przełącznik i zapis języka użytkownika; etykiety,
  komunikaty oraz stany błędów nie powinny być wpisywane na stałe w komponentach.
  Zmiana języka zachowuje dane i PLN; dodanie języka nie przebudowuje ekranów.
- Zbudować krótki start, edycję i przełączanie kilku profili stylu oraz budżet
  nowych rzeczy z dostawą. Własne rzeczy kosztują 0 PLN nowego wydatku;
  nieznane opłaty mają jawny stan. Uwzględnić dodatkowe priorytety użytkownika.
- Przygotować model szafy i demonstracyjne ubrania, a następnie zestawy z własnych
  rzeczy. Ten przepływ powstaje przed integracją katalogów sklepów.
- Zbudować rundę najwyżej dwóch pełnych zestawów: początkowo najlepiej
  dopasowanych, z możliwością przełączenia na ekonomiczny/markowy i zapisania
  własnego trybu domyślnego. Dodać „podoba mi się” i odrzucenie; oddzielić gust
  od przyszłej listy zakupowej. Oba tryby sprawdzić na danych demonstracyjnych.
- Po odrzuceniu obu pokazać kolejną parę; powód można pominąć lub wyłączyć pytanie
  w ustawieniach. Dodać zakończenie sesji, pusty wynik, błąd i brak sieci.
- Utrwalić stan demonstratora w uzgodnionym zakresie. Sprawdzić, że aktywny profil,
  budżet i opinie wpływają na wybór na kontrolowanym zestawie przykładów.
- Uzgodnić kontrakty danych dla konta, profilu, rzeczy w szafie, produktu sklepu,
  zestawu, opinii i przyszłej wizualizacji; nie dodawać usług na zapas.

Proponowany odbiór: działający przepływ start → profil → szafa → para → opinia
w wyglądzie A i PL/EN, sprawdzony na WWW i oddzielnie iOS/Android.
A-01–A-03, A-11 oraz część A-05 realizujemy
na danych demo i tak oznaczamy dowód; nie jest to odbiór rozpoznawania zdjęć ani
rzeczywistych rekomendacji AI. Powiązania: R-02–R-03, R-05–R-10, R-12–R-13,
R-20–R-21, R-24, Q-01–Q-03, Q-08, Q-10–Q-11.

## P3 — Prywatna szafa, zdjęcia i wykonalność wizualizacji

Zależność: konkretne zasady danych i usług rozwijające wstępne Q24 oraz odbiór
zakresu. Wolumen planistyczny jest znany: 30 wizualizacji/osobę/miesiąc, 60 razem.
Prywatna szafa i zestawy z własnych ubrań mają pierwszeństwo przed uruchomieniem P4.

### P3a — Ograniczone sprawdzenie wizualizacji

To wczesna część P3, możliwa do przygotowania równolegle z P2 na sztucznych lub
odpowiednio uprawnionych materiałach. Uruchomienie usługi płatnej wymaga zakresu
mieszczącego się w upoważnieniu; miesięczny cel 150 PLN sam go nie udziela.

- Wybrać niewielki, z góry ustalony zestaw przypadków dla kobiety i mężczyzny,
  ubioru codziennego/eleganckiego oraz jednej rzeczy i pełnego zestawu.
- Ustalić limit liczby prób, kwoty i ponowień przed uruchomieniem porównania usług.
  Raport obejmuje koszt pojedynczego zaakceptowanego wyniku i czas oczekiwania.
- Przeliczyć pomiary na 60 wizualizacji miesięcznie. Jeden obraz jednego zestawu
  na osobie to roboczo jedna wizualizacja, para obrazów to dwie; ponowienia oraz
  nieudane próby raportować osobno jako możliwy koszt. Sprawdzić całość względem
  około 150 PLN wraz z analizą zdjęć i opłatami stałymi, bez gwarantowania wyniku.
- Ocenić zachowanie wyglądu osoby, koloru/kroju rzeczy, kompletności zestawu
  i widocznych błędów. Zdjęcie generowane nie dowodzi rozmiaru ani fizycznego fitu.
- Sprawdzić wymagania wejściowe zdjęć, zasady przechowywania u dostawcy i możliwość
  usunięcia. Przed realnym przesłaniem przedstawić konkretną usługę, zakres danych,
  retencję/usuwanie i przebieg funkcji. Wstępne „chyba tak” nie upoważnia do
  wysyłania zdjęć do dowolnej nieznanej usługi. Nie wysyłać ich w obecnym etapie.
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
- Wyjaśnić, że prywatny zapis zdjęć pozwala ponownie z nich korzystać, a alternatywa
  z usunięciem oryginału po analizie zachowuje opis, lecz może wymagać ponownego
  przesłania do przymiarki. Osobno obsłużyć kopie w aplikacji i retencję u dostawcy.
- Rozszerzyć zapis o osobisty język PL/EN oraz domyślny tryb pary; synchronizacja
  nie może nadpisywać ustawień innego użytkownika.
- Układać dwie propozycje z posiadanych ubrań według okazji, aktywnego profilu
  i opinii. Utrwalać sygnały gustu; dobrać AI tylko do potrzeb wymagających AI.
- Po pozytywnej ocenie P3a włączyć wizualizację z limitami, czytelnym czasem
  oczekiwania i obsługą błędów, bez automatycznych nieograniczonych ponowień.

Proponowany odbiór: zapis/odczyt/edycja/usunięcie, synchronizacja i izolacja dwóch
kont sprawdzone w rzeczywistym środowisku testowym; oba typy zdjęć działają;
powstają zestawy z konkretnych rzeczy użytkownika. A-04, A-06 i A-09 mają dowody
oddzielone od makiet P2. Powiązania: R-04, R-05, R-10, R-12–R-13, R-20–R-25,
Q-04–Q-05, Q-09–Q-11.

## P4 — Produkty do dokupienia i lista z linkami

Zależność: sprawdzony przepływ szafy i zweryfikowany sposób dostępu do każdego
uruchamianego źródła. Q21–Q23 są rozstrzygnięte. Vinted, Zara, Zalando, Reserved
i H&M są oczekiwaną listą; nie obiecujemy jednoczesnej integracji wszystkich.

- Dla pierwszego rzeczywiście dostępnego źródła potwierdzić dozwolony dostęp,
  zakres danych i sposób aktualizacji. Kolejne źródła dodawać po osobnej weryfikacji.
  Wprowadzanie produktu linkiem może być wariantem do uzgodnienia, nie ukrytą
  deklaracją automatycznego przeszukiwania pięciu sklepów.
- Zapisywać pochodzenie, link, cenę/walutę, czas sprawdzenia, rozmiar i dostępność.
  Obsłużyć brak informacji i zmianę oferty; nie prezentować danych nieznanych jako pewne.
- Filtrować według profilu, sylwetki/rozmiarów, budżetu i dodatkowych priorytetów;
  tworzyć pełne zestawy z nowych rzeczy albo nowych i własnych.
- Podłączyć realne produkty do obu trybów pary z P2. Droższa marka nie może
  znosić budżetu ani głównych kryteriów dopasowania; pierwszy domyślny tryb nadal
  proponuje dwa najlepiej dopasowane pełne zestawy.
- Przygotować listę nowych rzeczy z linkami do produktów. Użytkownik finalizuje
  zakupy w sklepach; Ubranka nie tworzy zamówień, nie płaci i nie rezerwuje towaru.
  „Podoba mi się” nadal tylko zapisuje gust, bez dodawania rzeczy do listy.
- Pokazać pozycje, źródła, nowe wydatki i dostawy oraz sprawdzić aktualność ofert.
  Własne rzeczy to 0 PLN nowego wydatku. Obowiązkowe opłaty i nieznane koszty
  dostawy są jawne; otwarcie linku nie zmienia statusu na „kupione”.

Proponowany odbiór: A-05, A-07 i A-08 na rzeczywistym źródle, ze scenariuszem
zestawu do pracy do 500 PLN i posiadanych butów. Raport wylicza, które sklepy
działają, jak potwierdzono listę z linkami i co pozostaje nieobsługiwane.
Powiązania: R-06–R-11, R-13–R-15, Q-06–Q-07.

## P5 — Pilotaż, komercjalizacja i późniejsze zakupy automatyczne

Zależność: odebrany konkretny zakres P2–P4; nie wszystkie docelowe integracje
muszą istnieć, ale ograniczenia pilotażu wymagają uzgodnienia z użytkownikami.

- Uruchomić uzgodniony pilotaż, mierzyć trafność, liczbę rund do decyzji, błędy
  i koszt. Porównać koszt stały/zmienny z około 150 PLN miesięcznie przy
  30 wizualizacjach na osobę (60 łącznie), uwzględniając ponowienia.
- Wprowadzić uzgodnione limity kosztów i wizualizacji z A-10; próg kwoty oraz
  reakcję na jego osiągnięcie skonfigurować przed wywołaniami płatnymi.
- Przed komercyjnym udostępnieniem ustalić model przychodów, konta i koszty
  dystrybucji iOS/Android, warunki usług oraz obsługę danych i użytkowników.
- Automatyczne kupowanie zachować jako oddzielny przyszły zakres: zgody, limity,
  wyłączenie, historia, anulowanie, błędy płatności/zamówienia i zwroty.
- Dla automatyzacji dobrać partnerów i operatora płatności, bez przechowywania
  numerów kart/CVV. Zweryfikować ponowienia i brak podwójnego zamówienia.
- Przejść od sandboxu operatora do realnych zakupów wyłącznie w osobno ustalonym
  zakresie; wcześniejszy odbiór listy z linkami nie uruchamia automatycznych płatności.

Proponowany odbiór pilotażu: zapisane wyniki oraz koszt względem limitu.
Odbiór późniejszej automatyzacji: uzgodnione scenariusze, awarie i kontrola wydatków
sprawdzone w sandboxie, z osobnym zakresem startu zakupów rzeczywistych.
Powiązania: R-14–R-15, R-18, R-23, R-25, Q-07, Q-09.

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
- Sprawdzić oba języki, zachowanie danych przy przełączaniu, trwały domyślny tryb
  pary i sumowanie kosztów nowych rzeczy z dostawą. Dane szafy nie zależą od języka.
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
| V1.2 | 2026-10-24 | Wybór A, plan PL/EN w prototypie, oba tryby z osobistym domyślnym, budżet nowych rzeczy z dostawą, lista z linkami, wyjaśnienie wstępnego Q24 i próba kosztów dla 60 wizualizacji miesięcznie. |

Wersja planu nie jest wersją aplikacji. Bieżące wykonanie i wyniki kontroli
pozostają w [PROJECT-STATUS.md](PROJECT-STATUS.md); dalsze istotne ustalenia
tworzą nową wersję planu zamiast nadpisywania V1.0/V1.1.
