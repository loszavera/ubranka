# P3.1 — główny adres do testów przed premierą

Data: 2026-10-24. Użytkownik polecił przenieść P3.1 na main i ustalił, że
przed premierą można tam testować. Main jest adresem odbioru; dev pozostaje
gałęzią pracy. Publikacja nie oznacza odbioru funkcji lub zgody na kolejny etap.

## Publikacja

- Main: fast-forward `270359f` → `115b765cc315ebb0b23e332efe91da5c471ba7eb`,
  bez force push. Po push local/remote main i dev wskazywały ten sam commit.
- Vercel: `dpl_2obmzhuWFReCHZWSaFNdX9z1U8BD`, **READY**, target Production,
  source `115b765`. Adres: https://ubranka.vercel.app/?wardrobe=1.
- Kod aplikacji, backendu, testów, zależności i konfiguracji buildu jest identyczny
  z `2cc3a0e`, dla którego [pełne CI przeszło](https://github.com/loszavera/ubranka/actions/runs/40127417984).
  Nie powtarzano niezmienionych testów domeny/backendu. Po zmianie adresu
  sprawdzono rzeczywistą konfigurację i przepływ przeglądarki opisany poniżej.
- Kolejny commit dopisuje wyłącznie niniejszy raport i zasady współpracy;
  nie zmienia aplikacji. Jego stan wdrożenia zapisujemy w lokalnym receipt,
  bez tworzenia kolejnego commita wyłącznie dla identyfikatora wdrożenia.

## Konfiguracja i wynik kontroli

- Production/main ma dwie publiczne zmienne Supabase; Preview/dev zachowano.
  Sekrety serwerowe i OAuth nie są częścią aplikacji ani repozytorium.
- Ten sam istniejący Supabase Free `ubranka-test`, Frankfurt, dwa zaproszone
  konta. Bez nowej usługi, migracji danych, zmiany uprawnień do cudzych szaf
  lub zmiany retencji. Prywatne dane są wspólne dla main/dev; demo pozostaje lokalne.
- Supabase Site URL wskazuje `https://ubranka.vercel.app`; dopisano dokładny
  callback `/?wardrobe=1`. Pozostawiono dokładne callbacki dev i localhost.
  Google nadal wraca do istniejącego callbacku Supabase, bez zmiany klienta/scopes.
  Końcowy `config diff`: **0 zadeklarowanych różnic**.
- CORS: main i dev **204** z dokładnym Access-Control-Allow-Origin;
  obcy origin **403**. Nie dodano wildcardu.
- HTTP głównego adresu **200**, właściwy eksport Expo. Na Chrome wykonano:
  Google account chooser właściciela → main → prywatna szafa → odczyt istniejącego
  zdjęcia → wylogowanie. **PASS**, zero błędów konsoli. Załadowanie zdjęcia
  potwierdzono również przez DOM (`complete` i dodatni `naturalWidth`).
  Nie zmieniano ani nie usuwano istniejących rzeczy, zdjęć lub konta.
- Lokalnie, poza Git: `artifacts/p31-main-http.json`, `p31-main-cors.json`,
  `p31-main-preview.png` (widok po wylogowaniu, bez danych konta) i receipt wdrożenia.

## Pozostały odbiór

Google Kasi oraz fizyczne telefony, aparat/wybór pliku, eksport i wygoda obsługi
wymagają sprawdzenia przez użytkowników według [checklisty](P31-ACCEPTANCE.md).
Odczyt istniejącego zdjęcia na main nie zastępuje testu dodania zdjęcia z telefonu.
Wcześniejsze wyniki backendu, trwałego usuwania i UI: [raport P3.1](P31-VERIFICATION.md).
Podział środowisk pilotażu i produkcji wróci przed premierą komercyjną.
P3.2/P3.3 i płatne AI nadal nie są uruchomione.
