# Ubranka — instrukcje dla agentów

## Cel i źródła prawdy

Wirtualny stylista na iOS, Android i WWW. Pomysłodawczyni: Kasia. Właściciel
repozytorium i osoba kierująca pracą: Aleksy. Komunikuj się po polsku.
Nazwy w kodzie i komunikaty commitów mogą być po angielsku.

Przed pracą przeczytaj ten plik, docs/PROJECT-STATUS.md oraz aktualne wymagania
i plan wskazane w README.md. Sprawdź git status, gałąź i ostatnie commity.
Aktualne instrukcje użytkownika i faktyczny stan projektu mają pierwszeństwo
przed dawnymi rozmowami. Odróżniaj propozycje od przyjętych wymagań.

## Bieżący etap

P1: wywiad i odpowiedzi uzupełniające zapisane w dokumentacji V1.2. Wybrany
wygląd A — Krem i śliwka. Q21–Q23 i Q25 rozstrzygnięte; Q24 określa wstępny
kierunek zdjęć, szczegóły dostawcy wymagają wyjaśnienia przed realnym uploadem.
Ekran aplikacji nadal jest testem technicznym P0. Następny proponowany zakres
to prototyp A z PL/EN, profilami, szafą demo, dwiema propozycjami i opiniami.
Zapisuj otwarte decyzje; nie uznawaj propozycji za zatwierdzone ani nie rozpoczynaj
samodzielnie następnego etapu tylko dlatego, że opisano go w planie.

## Współpraca

- Początkowo jeden czat łączy zarządzanie i implementację. Subagenci mogą wykonywać
  rozdzielone zadania i niezależne przeglądy. Nie edytujcie naraz tych samych plików.
- Nowy czat PM/developer twórz tylko na prośbę użytkownika. Gdy powstanie:
  PM ustala zakres i odbiór, developer realizuje przydział; przekazanie zawiera
  gałąź, commit, pliki, wyniki kontroli i pozostałe ograniczenia.
- Równoległe zmiany kodu prowadź w osobnych worktree/gałęziach.
- Aktualizuj status po istotnym kroku. Oddziel wykonane, zweryfikowane i oczekujące.

### Proponowanie następnego kroku

Ustalenie użytkownika z 2026-10-24:

- Na końcu każdej odpowiedzi kończącej turę zaproponuj jeden rekomendowany
  następny krok do akceptacji. Podaj krótko zakres i oczekiwany rezultat.
- Dołącz gotową, naturalną odpowiedź do skopiowania lub kliknięcia, np.
  „Zatwierdzam P2. Rozpocznij implementację opisanego prototypu na dev”.
  Użytkownik nie powinien zgadywać, co napisać, aby uruchomić pracę.
- Akceptuj także krótkie „tak”, „działaj” lub podobne, gdy jednoznacznie odnoszą
  się do ostatniej propozycji. Nie wymagaj specjalnej formuły ani ponownej zgody.
- Nowy proponowany zakres rozpocznij po akceptacji użytkownika. Brak odpowiedzi
  nie jest akceptacją; inna wiadomość może zmieniać kierunek lub zakres pracy.
- Najpierw dokończ już zatwierdzone zadanie. Nie zastępuj wykonania propozycją,
  nie pytaj ponownie o zgodę na rutynowe czynności w zaakceptowanym zakresie
  i nie rozbijaj zatwierdzonego etapu na zbędne potwierdzenia.

## Git

- Repozytorium: https://github.com/loszavera/ubranka.
- dev jest gałęzią codziennej pracy; main zawiera stabilny punkt publikacji.
- Początkowa infrastruktura trafia na obie gałęzie. Późniejsze wydania do main
  wymagają uzgodnionego odbioru zakresu; rozpoczęcie prac nie oznacza publikacji.
- Nie używaj force push, nie usuwaj cudzych zmian, zachowuj historię.
- Przed push sprawdź diff i zakres plików, po push zgodność lokalnego i zdalnego SHA.
- Repozytorium jest publiczne. Nie commituj zdjęć użytkowników, danych osobowych,
  kluczy, tokenów, lokalnych logów ani konfiguracji kont usług.

## Technologia

- TypeScript strict, React Native, Expo SDK57, Expo Router, npm + package-lock.json.
- Node 24; dokładna wersja w .nvmrc. Expo CLI jest lokalne.
- Ekrany w src/app/; komponenty i logika poza katalogiem routingu.
- WWW: Metro, web.output=single, eksport dist/, konfiguracja SPA w vercel.json.
- Zmiany SDK/trybu eksportu wymagają sprawdzenia Expo Go i hostingu.
- Przed użyciem API Expo/RN sprawdź dokumentację zainstalowanej wersji:
  https://docs.expo.dev/versions/v57.0.0/ i https://docs.expo.dev/llms.txt.
- Biblioteki aplikacji dodawaj przez npx expo install. Aktualizuj lockfile.
  Nie dodawaj zależności na zapas.
- Nie twórz ręcznie ios/ i android/. Konfiguruj natywne zachowanie przez Expo config.
  Własne moduły natywne mogą wymagać development build zamiast Expo Go.
- Backend, dostawca AI, katalogi sklepów i płatności pozostają do ustalenia.
- Od pierwszego prototypu planuj interfejs PL/EN: teksty w słownikach poza
  komponentami, zapamiętywany wybór użytkownika. Polski jest początkowy.
  Język nie zmienia rynku PL, cen PLN ani dostawy do Polski.

## Kontrola jakości

- Zmiany kodu: npm run check oraz właściwy build.
- Zmiany zależności: npm run check:dependencies oraz npm run doctor.
- Zmiany wspólnego UI/routingu: npm run build:all i sprawdzenie WWW na małym ekranie.
- Eksport JavaScript nie jest testem aplikacji na fizycznym telefonie.
- Dodawaj testy istotnych reguł biznesowych, budżetów i integracji, gdy powstaną.
  Nie pisz testów pustych atrap tylko dla liczby testów.
- Mock nie dowodzi działania katalogu, AI, zakupu ani synchronizacji.
- Raportuj zmiany, dowód weryfikacji, link do wyniku i ograniczenia.

## Produkt i dane

- Projektuj na telefon: czytelność, duże cele dotykowe, kontrast, dostępne etykiety,
  klawiatura na WWW i spokojna oprawa graficzna.
- Odbiorcy: kobiety i mężczyźni bez sprecyzowanego stylu lub czasu na zakupy,
  najpierw użytek własny, docelowo komercyjny rynek polski.
- Priorytety: poznanie gustu, zestawy z własnej szafy, pomoc w zakupach.
- Podstawowy wybór to maksymalnie dwie propozycje z prostym tak/nie, na prośbę.
  Oba tryby to dwa pełne zestawy: „Najlepiej dopasowane” i „Ekonomiczny / markowy”.
  Początkowy domyślny to najlepiej dopasowane; użytkownik może zmienić domyślny.
- Budżet zestawu obejmuje nowe zakupy i dostawy. Własne rzeczy to 0 PLN nowego
  wydatku. Brak znanego kosztu dostawy/opłaty nie jest równoznaczny z 0 PLN.
- Polubienie uczy gustu; nie dodaje do koszyka ani nie zatwierdza zakupu.
  Powód odrzucenia jest opcjonalny; pytanie o niego można wyłączyć w ustawieniach.
- Szafa przyjmuje zdjęcie rzeczy i zdjęcie na osobie. Wymagana wizualizacja
  na osobie nie jest dowodem fizycznego dopasowania rozmiaru.
- Sklepy Vinted, Zara, Zalando, Reserved i H&M to oczekiwane źródła; dostęp
  do katalogów i koszyków nie został potwierdzony. Nie deklaruj integracji na podstawie mocka.
- Około 150 PLN/mies. to cel kosztowy pilotażu, nie uruchomiony limit ani zgoda
  na aktywację rozliczeń. Planowane 30 wizualizacji/osobę/mies. daje 60 dla dwóch
  osób; nie oznacza 30 par ani wdrożonego limitu. Mierz koszt także ponowień.
- Zachowaj przyszły cel automatycznych zakupów. Wdrożenie wymaga doprecyzowania
  zgód, limitów, anulowania i integracji. Pierwszy etap zakupowy to lista
  z linkami; użytkownik kończy zakup w sklepach. Zatwierdzenie listy nie składa zamówienia.
- Zdjęcia wymagają świadomego przesłania, kontroli dostępu, zasad przechowywania
  i usuwania. Q24 jest wstępnym kierunkiem prywatnego zapisu do usunięcia, nie zgodą
  na dowolnego dostawcę. Przed realnym uploadem wyjaśnij konkretną usługę, dane,
  retencję i usuwanie oraz wdroż prywatny zapis. Do tego czasu używaj danych sztucznych.
- Sekrety AI/płatności tylko na serwerze. EXPO_PUBLIC_* jest publiczne.
  Nie przechowuj numerów kart ani CVV.
- Realne płatności, płatne usługi, publikacja i zmiany kont muszą mieścić się
  w aktualnym upoważnieniu użytkownika. Nie rozszerzaj zgód samodzielnie.

## Wersjonowanie dokumentów

Wymagania i plan mają oddzielne wersje. Po inicjalizacji zachowaj V1.0 jako bazę.
Istotne nowe ustalenia zapisuj w kolejnej wersji (np. V1.1), ze zmianami i datą;
aktualizuj linki w README i statusie. Drobne poprawki redakcyjne mogą pozostać
w tej samej wersji z notatką. Wersja dokumentu nie jest wersją aplikacji (0.1.0).
