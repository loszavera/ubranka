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

P0: infrastruktura i dokumentacja V1.0. Ekran startowy jest testem technicznym.
Wywiad produktowy i funkcje aplikacji dopiero w kolejnym kroku z użytkownikiem.
Zapisuj otwarte decyzje; nie inicjuj samodzielnie kolejnych etapów.

## Współpraca

- Początkowo jeden czat łączy zarządzanie i implementację. Subagenci mogą wykonywać
  rozdzielone zadania i niezależne przeglądy. Nie edytujcie naraz tych samych plików.
- Nowy czat PM/developer twórz tylko na prośbę użytkownika. Gdy powstanie:
  PM ustala zakres i odbiór, developer realizuje przydział; przekazanie zawiera
  gałąź, commit, pliki, wyniki kontroli i pozostałe ograniczenia.
- Równoległe zmiany kodu prowadź w osobnych worktree/gałęziach.
- Aktualizuj status po istotnym kroku. Oddziel wykonane, zweryfikowane i oczekujące.

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
- Podstawowy wybór to maksymalnie dwie propozycje z prostym tak/nie.
- Zachowaj przyszły cel automatycznych zakupów. Wdrożenie wymaga doprecyzowania
  zgód, limitów, anulowania i integracji. Aktualny etap nie uruchamia zakupów.
- Zdjęcia wymagają świadomego przesłania, kontroli dostępu, zasad przechowywania
  i usuwania. W P0 używaj tylko danych sztucznych.
- Sekrety AI/płatności tylko na serwerze. EXPO_PUBLIC_* jest publiczne.
  Nie przechowuj numerów kart ani CVV.
- Realne płatności, płatne usługi, publikacja i zmiany kont muszą mieścić się
  w aktualnym upoważnieniu użytkownika. Nie rozszerzaj zgód samodzielnie.

## Wersjonowanie dokumentów

Wymagania i plan mają oddzielne wersje. Po inicjalizacji zachowaj V1.0 jako bazę.
Istotne nowe ustalenia zapisuj w kolejnej wersji (np. V1.1), ze zmianami i datą;
aktualizuj linki w README i statusie. Drobne poprawki redakcyjne mogą pozostać
w tej samej wersji z notatką. Wersja dokumentu nie jest wersją aplikacji (0.1.0).
