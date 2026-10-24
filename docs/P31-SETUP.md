# P3.1 — konfiguracja i odbiór usług

Data: 2026-10-24. Użytkownik zatwierdził darmowe usługi, implementację dev,
testy i podgląd. Nie ma zgody na płatny AI, nowe abonamenty ani P3.1 na main.
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
  Projekt pilotażowy/main pozostaje na później.
- Właściciel autoryzował oficjalne CLI 2.122.0 przez link i kod z telefonu.
  Ustawiono Google, hook Before User Created, dokładne redirecty, sekrety Edge/Vault
  i cron co 10 minut. Email/password, SMS, konta anonimowe i manual linking są
  wyłączone. Różnice zadeklarowanej konfiguracji sprawdzono przez `config diff`.
  Email włączono wyłącznie na czas przygotowania syntetycznych sesji testowych,
  po czym wyłączono; te sesje nie są przedstawiane jako logowanie Google.
  Jednorazowego linku, kodu ani stałego tokenu nie zapisujemy w repozytorium.
- Vercel ma URL i nowoczesny klucz publiczny Supabase wyłącznie w Preview dla
  gałęzi `dev`. Main nie ma tej konfiguracji. `.env.local` zawiera te same publiczne
  wartości; sekrety administracyjne i OAuth są poza kodem i repozytorium.
- Poprawka zdjęć i sprzątanie przeszły testy chmury; CI i podgląd są gotowe.
  Pozostaje [scenariusz użytkowników na telefonach](P31-ACCEPTANCE.md).
  Aktualne wyniki i ograniczenia: [P31-VERIFICATION.md](P31-VERIFICATION.md).

Ten stan trzeba odświeżyć po odpowiedzi użytkownika, a nie ponownie żądać zgód,
których już udzielił. Użytkownik może potwierdzić połączenie i warunki zdalnie.

## Procedura konfiguracji i odtworzenia środowiska

Poniższe kroki wykonano dla testowego projektu. Nie są poleceniem ponownego
utworzenia usług ani wdrożenia na main. Osobny pilot i test fizycznych telefonów
pozostają do uzgodnionego odbioru.

1. Sprawdzić połączenie Supabase i istniejące organizacje/projekty. Utworzyć
   osobne projekty test/pilot wyłącznie w dostępnych miejscach Free, region
   `eu-central-1`. Brak miejsca Free zgłosić bez aktywacji Pro.
2. Przed migracją potwierdzić ID/region/plan docelowego projektu. Wykonać
   [konfigurację backendu](P31-BACKEND.md), razem z prywatną allowlistą,
   Before User Created hook, Edge i harmonogramem sprzątania.
3. Dokończyć [Google Auth](https://console.cloud.google.com/auth/overview?project=ubranka-2026)
   w ramach udzielonej już akceptacji [warunków Google](https://developers.google.com/terms/api-services-user-data-policy).
   Utworzyć web OAuth client z callbackami konkretnych projektów Supabase.
   Zakres podstawowy: openid/email/profile. Bez Gmail/Drive/Photos, bez Cloud Billing.
   Sekret OAuth wpisać do Supabase, nie do aplikacji/publicznego repozytorium.
4. Ograniczyć przekierowania Supabase do stałego adresu dev i lokalnego testu;
   powrót aplikacji `/?wardrobe=1`. Nie dodawać wildcardu dla wszystkich podglądów.
   Google ma odrębną listę test users; lista danych Supabase pozostaje niezależną kontrolą.
5. Vercel Preview **tylko branch dev**: `EXPO_PUBLIC_SUPABASE_URL` oraz
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` wskazujące testowy projekt. Lokalne
   wartości w ignorowanym `.env.local`; `.env.example` nie zawiera kluczy.
   Nie używać service_role/sb_secret w EXPO_PUBLIC. Main/pilot konfigurujemy przy odbiorze.
6. Wykonać testy dwóch kont na danych syntetycznych: rzeczywiste OAuth, odrzucenie
   konta spoza listy, zdjęcie, odczyt na drugim urządzeniu, konflikty, eksport,
   wylogowanie i usunięcie z weryfikacją Storage/Auth oraz zadania serwerowego.
7. Dopiero po wyniku udostępnić działający pilotaż do odbioru. Test użytkowników:
   Safari iPhone/Chrome Android. HEIC ma na razie jasną odmowę; JPG/PNG/WebP są
   przetwarzane. Natywne OAuth wymaga development build, nie Expo Go.

## Dane i dowody

Zachować tylko techniczny raport bez tokenów, adresów kont i zdjęć użytkowników.
Zdjęcia testowe muszą być syntetyczne. Syntetyczne sekrety testów Playwright nie
działają w chmurze; nie wolno publikować ich konfiguracji jako podglądu usługi.
W razie braku konfiguracji aplikacja pokazuje jawny komunikat i blokuje logowanie;
nie ma zastępczego konta ani pozorowanego zapisu prywatnych danych.
