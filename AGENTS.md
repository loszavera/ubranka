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

P2 zatwierdzono do implementacji, testów i podglądu Vercel z dev (2026-10-24).
Powstał prototyp A — Krem i śliwka: PL/EN, krótki start, profile, szafa demo,
dwa tryby propozycji, opinie i zapis lokalny. Wyniki i stan publikacji:
docs/PROJECT-STATUS.md oraz docs/P2-VERIFICATION.md. Kasia i Aleksy potwierdzili
test P2 i zgłosili dodatkowe okazje, np. wesele. Wymagania/plan V1.3 zapisują
feedback oraz P2.1, zatwierdzony 2026-10-24: wesele jako gość, praca, randka,
impreza, dopasowanie do okazji, zachowanie danych P2, testy i podgląd dev.
Okazja bieżącej rundy jest niezależna od domyślnej okazji profilu. Najpierw
filtruj dopuszczalne okazje, potem oceniaj gust; nie wypełniaj pary niepasującym
zestawem. Stan V2 odczytuje V1 pod niezmienionym kluczem `ubranka:p2:v1`.
P2.1 zostało następnie odebrane przez użytkownika i jawnie dopuszczone do main
(2026-10-24). Publikacja i test produkcyjny: docs/P21-PRODUCTION.md. Praca pozostaje
na dev. Aktualne wymagania i plan V1.4 zawierają propozycję P3, koszty V1.3 i
P3-DATA-POLICY-V1.0.md. Użytkownik **zatwierdził implementację P3.1** (2026-10-24):
Supabase Free/Frankfurt, Google OAuth, limity zdjęć i zasady danych V1.0,
konfigurację darmowych usług, testy i podgląd dev. Usługi i kod P3.1 są wdrożone
na dev, testy chmury i CI przeszły. Odbiór obu osób na telefonach pozostaje otwarty:
docs/P31-ACCEPTANCE.md. Faktyczne wyniki i ograniczenia zapisuj w statusie.
Użytkownik następnie zatwierdził przeniesienie P3.1 na main i testowanie tam przed
premierą (2026-10-24). Publikacja i kontrola logowania/odczytu zdjęcia przeszły;
raport: docs/P31-MAIN.md. Adres odbioru to
https://ubranka.vercel.app. Dev pozostaje warsztatem. Ta zgoda nie oznacza odbioru
funkcji. P3.2 (próba AI), P3.3 i nowe zakresy nadal wymagają osobnego uzgodnienia.
Nie aktywuj płatnego AI ani nowych abonamentów.
Właściciel połączył Supabase z ChatGPT, wskazał organizację Risk Every Asset,
podał prywatnie oba konta oraz wyraźnie zaakceptował Google API Services User
Data Policy z upoważnieniem do zaznaczenia zgody. Nie pytaj o to ponownie.
Jest poza domem: potrzebne czynności właściciela przygotowuj do wykonania na
telefonie; nie zakładaj dostępu do lokalnej klawiatury. Stan dostępu i usług:
docs/P31-SETUP.md. Linków/kodów logowania CLI i adresów kont nie commituj.
Dev i main korzystają z tego samego istniejącego Supabase Free `ubranka-test`
we Frankfurcie i tych samych dwóch zaproszonych kont. Prywatne dane w chmurze są
wspólne dla obu adresów; nie powstaje nowa usługa, migracja danych ani zmiana retencji.
Docelowy podział środowisk pilotażu i produkcji ustalimy przed premierą komercyjną.
Lokalny zapis demo P2 na adresie dev i main jest osobny; publikacja kodu nie
przenosi localStorage.
Nie dopisuj na tej podstawie testu natywnego. Q21–Q23 i Q25 są rozstrzygnięte; Q24 określa wstępny
kierunek zdjęć, szczegóły dostawcy wymagają wyjaśnienia przed realnym uploadem.
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
- Każdą proponowaną odpowiedź zatwierdzającą podawaj w osobnym bloku kodu
  Markdown (```text), który można skopiować jednym kliknięciem. W bloku umieść
  wyłącznie kompletną, naturalną wiadomość użytkownika, gotową do wysłania.
  Nie zastępuj bloku tekstem w akapicie, cytatem ani przyciskiem codex-followup.
  Użytkownik nie powinien zgadywać, co napisać, aby uruchomić pracę.
- Przygotowana treść zgody jest propozycją, a nie udzieloną zgodą. Prośba
  o zmianę jej formatu lub zapamiętanie preferencji nie uruchamia implementacji.
- Akceptuj także krótkie „tak”, „działaj” lub podobne, gdy jednoznacznie odnoszą
  się do ostatniej propozycji. Nie wymagaj specjalnej formuły ani ponownej zgody.
- Nowy proponowany zakres rozpocznij po akceptacji użytkownika. Brak odpowiedzi
  nie jest akceptacją; inna wiadomość może zmieniać kierunek lub zakres pracy.
- Najpierw dokończ już zatwierdzone zadanie. Nie zastępuj wykonania propozycją,
  nie pytaj ponownie o zgodę na rutynowe czynności w zaakceptowanym zakresie
  i nie rozbijaj zatwierdzonego etapu na zbędne potwierdzenia.

## Git

- Repozytorium: https://github.com/loszavera/ubranka.
- dev jest gałęzią codziennej pracy; main zasila adres odbioru https://ubranka.vercel.app.
- Przed premierą komercyjną można publikować zatwierdzony zakres na main i tam
  go testować, bez osobnej zgody lub odbioru wyłącznie z powodu zmiany gałęzi.
  Nadal wykonuj wymagane testy i sprawdzaj wdrożenie. Publikacja nie oznacza
  odbioru funkcji ani zgody na nowy etap, usługę płatną lub abonament.
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
- Backend P3.1: Supabase Auth/Postgres/private Storage Frankfurt, Google OAuth.
  Dostawca AI, katalogi sklepów i płatności wymagają kolejnego zakresu.
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
- P2: `npm test` sprawdza reguły domeny, `npm run test:e2e` buduje WWW i sprawdza
  przepływy Playwright (Edge na Windows, Chromium w CI). Raporty w artifacts/.
- P3.1: `npm run test:backend` wykonuje migrację/RLS na Postgresie PGlite;
  `npm run check:backend` sprawdza Edge w Deno. `npm run test:private:e2e`
  buduje osobny export z syntetyczną konfiguracją, przechwytuje usługi i sprawdza UI.
  Tych testów nie przedstawiaj jako dowodu rzeczywistego Google/Supabase.
  Test hosted: supabase/tests/live.test.mjs, tylko osobne środowisko/dane sztuczne.
  Nie publikuj artifacts/private-web ani testowych kluczy do Vercel.
  Eksporty build:web/build:all czyszczą cache Metro: po syntetycznym E2E cache
  może zachować testowe EXPO_PUBLIC mimo innego .env. Sprawdź adres projektu
  w przeznaczonym do wdrożenia pakiecie; nie usuwaj flagi --clear.
- AsyncStorage zawiera wyłącznie stan demo. Nie przesłaniaj błędu odczytu
  domyślnym profilem z możliwością zapisu; retry nie może utracić nowych zmian.
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
