# P3.1 — konfiguracja i odbiór usług

Data: 2026-10-24. Użytkownik zatwierdził darmowe usługi, implementację dev,
testy i podgląd, a następnie przeniesienie P3.1 na main i testowanie tam przed
premierą. Publikacja pod https://ubranka.vercel.app i jej kontrola przeszły;
[raport main](P31-MAIN.md). To zgoda na
wdrożenie zaakceptowanego zakresu, nie odbiór funkcji. Nie ma zgody na płatne AI,
nowe abonamenty ani P3.2/P3.3.
Kod można weryfikować lokalnie bez kont usług. Taki test nie potwierdza chmury.

## Stan dostępu

- Vercel/GitHub są połączone; projekt `ubranka`, istniejący podgląd gałęzi dev.
- Google Cloud `ubranka-2026` (nazwa Ubranka), bez rozliczeń. Utworzono klienta
  WWW dla testowego Supabase z dokładnym callbackiem `/auth/v1/callback`.
  Google Auth pozostaje External/Testing, dwa wskazane konta na liście test users.
  Zapisano wyłącznie podstawowe zakresy email/profile/openid; brak Gmail/Drive/Photos.
- Użytkownik podał prywatnie oba konta Google i wyraźnie zaakceptował Google API
  Services User Data Policy wraz z upoważnieniem do zaznaczenia zgody. Wcześniejsza
  przeszkoda zgody jest rozwiązana. Sterowanie Google odzyskano przez nową kartę;
  formularz i klient są zapisane. Logowanie właściciela przez Google na dev oraz
  powrót do prywatnej szafy i wylogowanie sprawdzono w przeglądarce.
- Połączenie Supabase potwierdzone. W wybranej organizacji Risk Every Asset
  (Free) utworzono `ubranka-test`, Frankfurt `eu-central-1`. Wdrożono migrację
  `private_wardrobe`, harmonogram oraz poprawkę `private_photo_edge_reads`.
  Edge `wardrobe` obsługuje teraz również POST `downloadPhoto` ze świeżą kontrolą RLS;
  `wardrobe-cleanup` odpowiada HTTP 200. Szczegóły odbioru w raporcie weryfikacji.
  Prywatna allowlista zawiera dwa wskazane konta; adresów nie zapisano w repozytorium.
- RLS trzech tabel i prywatny bucket potwierdzone w chmurze. Nowe odczyty klienta
  nie używają bezpośrednich GET Storage, które w teście zachowały odpowiedź CDN po
  zmianie reguły dostępu. Istniejące kopie testowe/cache oceniono oddzielnie.
  Do main wykorzystujemy ten sam istniejący projekt `ubranka-test`, nadal Free
  we Frankfurcie i dla tych samych dwóch zaproszonych kont. Nie tworzymy nowej
  usługi, nie migrujemy danych i nie zmieniamy retencji. Docelowy podział
  pilotażu i produkcji ustalimy ponownie przed premierą komercyjną.
- Właściciel autoryzował oficjalne CLI 2.122.0 przez link i kod z telefonu.
  Ustawiono Google, hook Before User Created, dokładne redirecty, sekrety Edge/Vault
  i cron co 10 minut. Email/password, SMS, konta anonimowe i manual linking są
  wyłączone. Różnice zadeklarowanej konfiguracji sprawdzono przez `config diff`.
  Email włączono wyłącznie na czas przygotowania syntetycznych sesji testowych,
  po czym wyłączono; te sesje nie są przedstawiane jako logowanie Google.
  Jednorazowego linku, kodu ani stałego tokenu nie zapisujemy w repozytorium.
- Potwierdzona konfiguracja Vercel obejmuje URL i nowoczesny klucz publiczny
  Supabase w Preview dla gałęzi `dev` oraz Production/main. Supabase Site URL
  wskazuje main; dodano jego dokładny callback aplikacji, zachowując dev.
  `config diff` nie wykazał różnic zadeklarowanej konfiguracji. CORS main/dev
  odpowiada HTTP 204 z dokładnym originem, obcy origin HTTP 403. Callback Google
  do Supabase nie zmienił się. Powrót OAuth na główny adres, odczyt istniejącego
  zdjęcia przez zalogowanego właściciela i wylogowanie przeszły kontrolę.
  `.env.local` zawiera te same publiczne wartości; sekrety administracyjne
  i OAuth są poza kodem i repozytorium.
- Prywatna szafa w chmurze jest wspólna dla dev/main: ta sama osoba widzi
  te same dane po zalogowaniu, a druga osoba nadal ma odrębne konto i szafę.
  Lokalny zapis demo pozostaje osobny dla każdego adresu.
- Poprawka zdjęć i sprzątanie przeszły testy chmury; CI i podgląd są gotowe.
  Pozostaje [scenariusz użytkowników na telefonach](P31-ACCEPTANCE.md).
  Aktualne wyniki i ograniczenia: [P31-VERIFICATION.md](P31-VERIFICATION.md).

Ten stan trzeba odświeżyć po odpowiedzi użytkownika, a nie ponownie żądać zgód,
których już udzielił. Użytkownik może potwierdzić połączenie i warunki zdalnie.

## Procedura konfiguracji i odtworzenia środowiska

Poniższe kroki opisują istniejącą konfigurację i zatwierdzone rozszerzenie jej
na adres main. Nie są poleceniem ponownego tworzenia usług. Stan ukończenia
publikacji sprawdzaj w [statusie](PROJECT-STATUS.md); testy fizycznych telefonów
pozostają do wykonania.

1. Potwierdzić istniejący Supabase `ubranka-test`, plan Free i region
   `eu-central-1`. Dev i main mają używać tego samego projektu; nie tworzyć
   osobnego pilota ani aktywować Pro w ramach tej publikacji.
2. Zachować wdrożoną [konfigurację backendu](P31-BACKEND.md), prywatną allowlistę,
   Before User Created hook, Edge i harmonogram sprzątania. Przeniesienie
   frontendu na main nie wymaga nowej migracji bazy ani przenoszenia danych.
3. Zachować [Google Auth](https://console.cloud.google.com/auth/overview?project=ubranka-2026)
   w ramach udzielonej już akceptacji [warunków Google](https://developers.google.com/terms/api-services-user-data-policy).
   Istniejący web OAuth client nadal używa callbacku tego samego projektu Supabase.
   Zakres podstawowy: openid/email/profile. Bez Gmail/Drive/Photos, bez Cloud Billing.
   Sekret OAuth wpisać do Supabase, nie do aplikacji/publicznego repozytorium.
4. Ograniczyć przekierowania Supabase i dozwolone originy Edge do dokładnych
   adresów aplikacji: main, stałego dev i lokalnych testów;
   powrót aplikacji `/?wardrobe=1`. Nie dodawać wildcardu dla wszystkich podglądów.
   Google ma odrębną listę test users; lista danych Supabase pozostaje niezależną kontrolą.
5. Vercel Preview **tylko branch dev** oraz Production/main:
   `EXPO_PUBLIC_SUPABASE_URL` i `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   wskazujące ten sam testowy projekt. Lokalne
   wartości w ignorowanym `.env.local`; `.env.example` nie zawiera kluczy.
   Nie używać service_role/sb_secret w EXPO_PUBLIC. Po wdrożeniu sprawdzić
   główny adres i rzeczywisty powrót OAuth do prywatnej szafy.
6. Wykonać testy dwóch kont na danych syntetycznych: rzeczywiste OAuth, odrzucenie
   konta spoza listy, zdjęcie, odczyt na drugim urządzeniu, konflikty, eksport,
   wylogowanie i usunięcie z weryfikacją Storage/Auth oraz zadania serwerowego.
7. Po potwierdzeniu wdrożenia skierować odbiór na https://ubranka.vercel.app.
   Publikacja przed premierą nie wymaga osobnej zgody tylko z powodu gałęzi
   i nie jest odbiorem funkcji. Test użytkowników:
   Safari iPhone/Chrome Android. HEIC ma na razie jasną odmowę; JPG/PNG/WebP są
   przetwarzane. Natywne OAuth wymaga development build, nie Expo Go.

## Dane i dowody

Zachować tylko techniczny raport bez tokenów, adresów kont i zdjęć użytkowników.
Zdjęcia testowe muszą być syntetyczne. Syntetyczne sekrety testów Playwright nie
działają w chmurze; nie wolno publikować ich konfiguracji jako podglądu usługi.
W razie braku konfiguracji aplikacja pokazuje jawny komunikat i blokuje logowanie;
nie ma zastępczego konta ani pozorowanego zapisu prywatnych danych.
