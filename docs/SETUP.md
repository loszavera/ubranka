# Środowisko i testowanie

Stan bazowy: 2026-10-24. Gałąź robocza: dev.

## Stacja robocza

Git 2.53.0, Node 24.18.0 i npm 11.16.0 były już zainstalowane.
Zależności są lokalne w node_modules/; wersje rozstrzyga package-lock.json.
Po pobraniu projektu: npm ci. Używamy npm; nie mieszamy lockfile innych managerów.
Git Credential Manager ma zalogowane konto właściciela repozytorium.
GitHub CLI nie jest wymagane: mamy Git i połączoną integrację GitHub.
Integracja Vercel odpowiada na odczyt zespołów. Nie wymaga lokalnego CLI.

## Podgląd podczas pracy

| Cel | Sposób | Ograniczenie |
| --- | --- | --- |
| WWW z odświeżaniem | npm run web | Serwer działa na tym PC |
| Android / iPhone w Expo Go | npm start, QR | Telefon i PC w tej samej sieci |
| iPhone z Windows | npm run ios, QR | Expo Go, nie symulator |
| Gotowy eksport WWW | npm run build:web, npm run preview | http://localhost:4173 jest lokalny |
| WWW spoza domu | Vercel po połączeniu repozytorium | Link niezależny od PC |
| Expo Go spoza LAN | Opcjonalny tunel Expo | Osobny krok: tunel, sieć i działający PC |

Windows może zapytać o dostęp Node do sieci prywatnej przy podglądzie LAN.
SDK57 wybrano zgodnie z instrukcją Expo Go w okresie przejścia na SDK58.
Przed aktualizacją sprawdź wersję Expo Go na telefonie i dokumentację.
Poprawny eksport nie jest testem urządzenia.
Nie potrzeba teraz Android Studio, Xcode, kont Apple/Google Developer, bazy,
kluczy AI ani danych karty. EAS i development builds konfiguruje się później.

## Vercel — konfiguracja gotowa do połączenia

Repo: loszavera/ubranka. Framework: Other. Root: katalog główny.
Node: 24.x. Install: npm ci. Build: npm run build:web. Output: dist.
Ustawienia buildu zawiera vercel.json; wersję Node wskazuje też package.json.
Production Branch: main; zmiany dev powinny tworzyć Preview.
W integracji GitHub w Vercelu przyznaj dostęp do ubranka, jeżeli import go nie widzi.
Połączenie wtyczki Vercel z Codexem jest odrębne od połączenia Vercel z GitHubem.

W panelu wybierz Add New → Project → Import Git Repository → ubranka.
Publikacja i pierwszy adres wdrożenia muszą zostać potwierdzone osobnym wynikiem.
Sam plik vercel.json nie oznacza aktywnego hostingu.
EXPO_PUBLIC_* jest widoczne w kliencie; nie umieszczaj tam sekretów.

## Codex na telefonie

Przed odejściem otwórz ten projekt i czat w zdalnym Codexie na telefonie,
najlepiej na transmisji komórkowej, i wyślij krótką wiadomość testową.
To potwierdza dostępność tej stacji z zewnątrz. Zostaw Codex, internet i zasilanie.
Windows ma wyłączone automatyczne uśpienie przy zasilaniu sieciowym; na baterii
ustawiono 10 minut. Odczytaliśmy te ustawienia bez zmieniania ich.
Zablokowana sesja może uniemożliwić pracę GUI. Terminal i integracje nie zastępują
testu sesji zdalnej. Nie zmieniaj ustawień bezpieczeństwa na zapas.

## Kontrole

npm run check: TypeScript i ESLint.
npm run check:dependencies: zgodność pakietów z SDK.
npm run doctor: dodatkowa diagnostyka korzystająca z sieci.
npm run build:all: eksport iOS/Android/WWW do dist-all/.
npm run build:web: eksport WWW do dist/.
Lokalne logi: ignorowany artifacts/; podsumowanie w statusie projektu.
CI wykonuje czystą instalację i kontrole (bez sieciowego doctor).

## Źródła

- https://docs.expo.dev/get-started/create-a-project/
- https://docs.expo.dev/versions/v57.0.0/
- https://docs.expo.dev/guides/publishing-websites/
- https://docs.expo.dev/develop/development-builds/introduction/
- https://vercel.com/docs/git
- https://learn.chatgpt.com/docs/mobile
- https://learn.chatgpt.com/codex/remote-connections
