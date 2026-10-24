# P3.1 — widok rzeczy po potwierdzonym usunięciu

Data: 2026-10-24. Użytkownik sprawdził większość funkcji na telefonie; logowanie
Kasi pozostaje otwarte. Zgłosił, że po usunięciu rzeczy znika zdjęcie, ale karta
„Usuwanie w toku” pozostaje w szafie i liczniku także po odświeżeniu.

## Przyczyna potwierdzona w kodzie i chmurze

- Serwer przyjął usunięcie o 20:50:00 UTC i natychmiast odciął odczyt zdjęcia
  przez zwykłą aplikację. Rekord rzeczy/zdjęcia miał stan `deleting`.
- Zdjęcie dodano tuż wcześniej; jego pięciominutowa dzierżawa zapisu kończyła
  się o 20:54:53 UTC. Chroni to przed równoległym uploadem odtwarzającym plik
  już po usunięciu. Nie skracamy tej ochrony.
- Worker działa co 10 minut. Przebieg 20:50 odpowiedział HTTP 200,
  `pending:1, failed:0`; brak prób/błędów kasowania przed końcem dzierżawy.
  Zniknięcie zdjęcia z ekranu oznaczało odcięcie dostępu, nie fizyczne usunięcie.
- Klient usuwał kartę optymistycznie, lecz kolejny bootstrap przywracał rekord
  `deleting`. Siatka i licznik uwzględniały go jak zwykłe ubranie. Poprzednia
  atrapa API usuwała rekord od razu, więc test nie odtwarzał tego przebiegu.

## Poprawka

Karty i licznik pokazują tylko aktywne rzeczy. Po potwierdzonym usunięciu rzecz
nie wraca po odświeżeniu ani ponownym otwarciu aplikacji. Pozostaje osobny
komunikat o czyszczeniu plików w tle, wyliczany ze świeżych danych serwera.
Usuwane rekordy nadal rezerwują limit do końca sprzątania. Błąd API nie jest
pokazywany jako sukces, a błąd odświeżenia nie usuwa ostatniego wiarygodnego stanu.
Samo usunięcie zdjęcia i usunięcie konta zachowują oddzielne znaczenie.

Nie zmieniamy SQL, Edge, harmonogramu, zasad retencji ani istniejących danych.
Załącznik użytkownika jest wyłączony z publicznego Git przez `.gitignore`.

## Weryfikacja i wdrożenie

- Naturalny cron o 21:00 UTC: HTTP 200, `pending:0, failed:0`. O 21:00:27 UTC
  potwierdzono dla zgłoszonej rzeczy: **0 rekordów rzeczy, 0 zdjęć, 0 obiektów
  Storage**. Usunięcie zakończyło się bez ręcznego kasowania lub zmiany danych.
- TypeScript/ESLint: PASS; testy domeny/klienta: **36/36 PASS**.
- Prywatny UI na syntetycznym API: **10/10 PASS**, w tym zachowany rekord
  `deleting` po refresh/reload, zniknięcie komunikatu po cleanup, 100 zajętych
  miejsc i odmowa API bez fałszywego sukcesu. Osobno zachowany pending konta.
- Eksport WWW/iOS/Android: PASS. Przy weryfikacji znaleziono lokalny cache Metro
  zachowujący publiczne ustawienia syntetycznego E2E mimo wczytanego `.env.local`.
  Skrypty build:web/build:all czyszczą teraz cache przez `--clear`. Powtórny
  eksport zawiera właściwy projekt, bez syntetycznego adresu/klucza.
  Wcześniejsze wdrożenie Vercel nie korzystało z tego lokalnego pakietu.
- Niezależny przegląd klienta, ochrony limitu i flag eksportu: bez uwag blokujących.
- Lokalne, ignorowane raporty: `p31-deletion-diagnosis.json`, `p31-delete-check.log`,
  `p31-delete-private-e2e.log`, `p31-delete-build-all.log`, `p31-delete-build-config.json`
  oraz `private-e2e-results.json` w artifacts. Screenshoty PL/EN zawierają
  wyłącznie syntetyczne dane; sprawdzono czytelność komunikatu na 390×844.

## Publikacja

- Poprawka klienta `8dff24d`; eksporty i raport `1b342e06c7184a87ff8ee3afbcbac6a1c5a95bed`.
  Dev i main zsynchronizowane bez force push.
- Vercel `dpl_FMniHUKKEhZdc3V2RMkYA74MnMg7`: **READY**, Production/main.
  Kontrola https://ubranka.vercel.app/?wardrobe=1 o 21:06:38 UTC: HTTP 200,
  pakiet zawiera nowy komunikat sprzątania i właściwy projekt Supabase, bez
  konfiguracji syntetycznej. Ekran logowania uruchamia się; zero błędów konsoli.
- Dowód lokalny: `artifacts/p31-delete-main-verification.json`.
  [CI 40132615564](https://github.com/loszavera/ubranka/actions/runs/40132615564)
  dla `1b342e0`: **SUCCESS**, także pełna regresja WWW i backendu na Ubuntu.
  Kolejny commit zapisuje wyłącznie wyniki w dokumentacji, bez zmian aplikacji.
  Użytkownik następnie potwierdził pozytywny ponowny test: „przeprowadziłem test.
  jestem zadowolony” (2026-10-24). Zgłoszenie usuwania jest zamknięte.
