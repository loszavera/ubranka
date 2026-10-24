# P3.1 — konfiguracja i odbiór usług

Data: 2026-10-24. Użytkownik zatwierdził darmowe usługi, implementację dev,
testy i podgląd. Nie ma zgody na płatny AI, nowe abonamenty ani P3.1 na main.
Kod można weryfikować lokalnie bez kont usług. Taki test nie potwierdza chmury.

## Stan dostępu

- Vercel/GitHub są połączone; projekt `ubranka`, istniejący podgląd gałęzi dev.
- Utworzono osobny projekt Google Cloud `ubranka-2026` (nazwa Ubranka).
  Nie utworzono jeszcze klienta OAuth ani nie podłączono rozliczeń.
- Formularz Google Auth: nazwa Ubranka, External/Testing, kontakt właściciela.
  Zapis konfiguracji czeka na wyraźną akceptację Google API Services User Data Policy.
  Automatyczny przegląd odrzucił zaznaczenie tej zgody na podstawie samego upoważnienia OAuth.
- Zaproponowano wtyczkę Supabase. Podłączenie nie jest jeszcze potwierdzone;
  nie utworzono projektu Supabase i nie wdrożono migracji, funkcji lub harmonogramu.
- Dwa adresy kont Google do listy dostępu pozostają do prywatnego wskazania.

Ten stan trzeba odświeżyć po odpowiedzi użytkownika, a nie ponownie żądać zgód,
których już udzielił. Użytkownik może potwierdzić połączenie i warunki zdalnie.

## Dokończenie już zatwierdzonej konfiguracji

1. Sprawdzić połączenie Supabase i istniejące organizacje/projekty. Utworzyć
   osobne projekty test/pilot wyłącznie w dostępnych miejscach Free, region
   `eu-central-1`. Brak miejsca Free zgłosić bez aktywacji Pro.
2. Przed migracją potwierdzić ID/region/plan docelowego projektu. Wykonać
   [konfigurację backendu](P31-BACKEND.md), razem z prywatną allowlistą,
   Before User Created hook, Edge i harmonogramem sprzątania.
3. Dokończyć [Google Auth](https://console.cloud.google.com/auth/overview?project=ubranka-2026)
   po akceptacji [warunków Google](https://developers.google.com/terms/api-services-user-data-policy).
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
