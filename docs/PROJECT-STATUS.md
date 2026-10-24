# Stan projektu Ubranka

Aktualizacja: 2026-10-24. Po przetestowaniu P2 Kasia i Aleksy zgłosili dodatkowe
okazje. Aleksy zatwierdził P2.1: wesele jako gość, praca, randka i impreza,
dobór do okazji, zachowanie danych P2, pracę na dev, testy i podgląd Vercel.
Użytkownik odebrał P2.1 i polecił przenieść całość do main. Wersja produkcyjna
jest opublikowana i sprawdzona. Następnie użytkownik **zatwierdził P3.1**:
Supabase Free/Frankfurt, Google, zdjęcia, synchronizacja, limity i zasady danych
V1.0, testy i podgląd dev. Bez płatnego AI i nowych abonamentów.

**P3.1 jest na main, wdrożenie i kontrola przeszły:** użytkownik zatwierdził przeniesienie
P3.1 i testowanie przed premierą pod https://ubranka.vercel.app. Dev pozostaje
warsztatem. Zgoda zastępuje wcześniejszy warunek „main po odbiorze” w planie V1.4;
nie oznacza odbioru funkcji ani zgody na P3.2/P3.3 lub opłaty.

Usługi są skonfigurowane dla dev i main,
Google właściciela działa, testy chmury i CI przeszły. Wykryty cache zdjęcia
po usunięciu naprawiono odczytem przez Edge. Logowanie Kasi pozostaje
niepotwierdzone. Na main sprawdzono rzeczywiste logowanie
właściciela, odczyt istniejącego zdjęcia i wylogowanie. [Raport](P31-MAIN.md).

Użytkownik następnie zgłosił udany test większości funkcji na telefonie, poza
logowaniem Kasi, oraz pozostającą kartę „Usuwanie w toku”. Potwierdzono przyczynę:
odświeżenie przywracało rekord oczekujący na bezpieczne czyszczenie plików.
Poprawka prezentacji jest na main (`1b342e0`): usunięta rzecz nie wraca po
odświeżeniu, a informacja o czyszczeniu wynika ze stanu serwera. Testy klienta
36/36 i prywatnego UI 10/10 PASS. Naturalny cron o 21:00 UTC usunął zgłoszoną
rzecz i oba pliki; bez błędów oraz ręcznej ingerencji. [Raport](P31-DELETION-FIX.md).
Po wdrożeniu poprawki Aleksy potwierdził pozytywny ponowny test i zadowolenie
z wyniku (2026-10-24). Zgłoszenie usuwania zamknięte. Nie rozszerzamy tej deklaracji
na logowanie Kasi, pełną checklistę urządzeń ani zgodę na P3.2.

## P3.1 — bieżący wynik

- Osobny ekran prywatnej szafy PL/EN, profile, selektywny import P2, zdjęcia
  z galerii/aparatu, edycja, wymiana, eksport ZIP i potwierdzane usuwanie.
- Prywatne dane nie trafiają do zapisu demo. JWT, RLS i kontrola aktywnego konta
  chronią dane; serwer sprawdza limity i wersję przed zmianą. Konflikt wymaga
  świadomego odczytu/porównania nowszego stanu.
- Zdjęcia JPG/PNG/WebP są ponownie kodowane do JPEG bez EXIF/GPS. HEIC ma
  czytelną odmowę. Limit 100 rzeczy/konto, 1 MB + miniatura 100 kB, 1600 px,
  250 MB/konto; niedokończone operacje nadal zajmują limit.
- Projekt Google Cloud `ubranka-2026` pozostaje bez rozliczeń. Użytkownik podał
  oba konta i wyraźnie zaakceptował User Data Policy; nie wymaga to ponownej zgody.
  Klient OAuth jest utworzony, ma dokładny callback Supabase i dwa test users.
  Zakres wyłącznie email/profile/openid. Na podglądzie dev sprawdzono rzeczywiste
  logowanie właściciela, odczyt pustej prywatnej szafy i wylogowanie.
- Supabase połączony: organizacja Risk Every Asset, Free, projekt `ubranka-test`
  we Frankfurcie. Migracja, prywatny bucket, RLS i obie Edge wdrożone. Dwa konta
  wpisane na prywatną listę dostępu. Pięć anonimowych prób API poprawnie odrzuconych.
- Właściciel autoryzował CLI z telefonu. Auth/hook, sekrety Edge/Vault oraz
  harmonogram co 10 minut są skonfigurowane. Faktyczny wywołany przez cron
  request HTTP zakończył się 200. Email/SMS, anonymous i manual linking wyłączone.
- URL i klucz publiczny Supabase są ustawione w Vercel Preview/dev i Production/main.
  Wdrożenie dev `dpl_ErgZM7GMGy8wMrxcYH5DHDqNsFvk` READY, kod `2cc3a0e`,
  zawiera konfigurację i poprawiony transport zdjęć. Nie ujawniono kluczy
  serwerowych, sekretu Google ani adresów kont w repozytorium.
- Konfiguracja main korzysta z tego samego istniejącego
  Supabase Free `ubranka-test` we Frankfurcie i tych samych dwóch zaproszonych
  kont. Prywatne dane w chmurze są wspólne dla dev/main; lokalny zapis demo jest
  osobny. Nie powstaje nowa usługa, migracja danych ani zmiana retencji.
  Podział pilotażu i produkcji zostanie ponownie ustalony przed premierą komercyjną.
- Supabase Site URL wskazuje main; dodano dokładny callback aplikacji main,
  zachowując powroty dev. `config diff` nie wykazał różnic zadeklarowanej
  konfiguracji. CORS main/dev: HTTP 204 z dokładnym originem; obcy origin: HTTP 403.
  Callback klienta Google do tego samego Supabase nie zmienił się.
- Hosted test ujawnił bezpośredni Storage GET z CDN po odebraniu dostępu w RLS.
  Nowa migracja usuwa odczyt Storage użytkowników, a Edge POST `downloadPhoto`
  wykonuje świeżą kontrolę Auth/RLS przed pobraniem bajtów. Backend 14/14 PASS;
  niezależny przegląd backendu i klienta bez uwag blokujących. Hosted live 30
  kontroli PASS; raport rozszerzony 90 kontroli. Naturalny cron 20:00 UTC
  usunął syntetyczne pliki i konta. Nie pozostały syntetyczne zaproszenia.
- TypeScript/ESLint, 34 testy domeny, 14 backendu, 15 regresji WWW, 8 prywatnego UI
  i eksport trzech platform PASS. [Końcowe CI SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40127417984).
  Upload przez automat Chrome wymaga niedostępnego uprawnienia rozszerzenia;
  realny wybór pliku i OAuth Kasi sprawdzą użytkownicy. API zdjęć sprawdzono w chmurze.
- Szczegóły: [konfiguracja](P31-SETUP.md), [backend](P31-BACKEND.md),
  [wyniki i ograniczenia testów](P31-VERIFICATION.md).
- Historyczny etap bez usług, dev `a9ec29a`: Vercel `dpl_DwRjKYjq8fJwcf429RC3FmKhd2vk`
  READY; kontrola online 18:06 UTC PASS (demo, zachowanie zapisu, jawny brak
  konfiguracji usług w PL/EN). Lokalnie: 34 testy logiki, 11 backendu,
  15 regresji WWW i 7 prywatnego UI PASS. Eksport trzech platform PASS.
  [CI dla a9ec29a: SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40119015249),
  wraz z testami na Ubuntu/Chromium. Następny commit zapisuje wyłącznie raport.
  Ten wcześniejszy wynik nie zastępował późniejszych testów chmury opisanych wyżej.

## Aktualne dokumenty

- [Wymagania V1.4](REQUIREMENTS-V1.4.md) i [plan V1.4](IMPLEMENTATION-PLAN-V1.4.md):
  odebrane P2.1, zatwierdzone P3.1, propozycje P3.2/P3.3. Wersje V1.2/V1.3 zachowano.
- [Przyjęte zasady zdjęć](P3-DATA-POLICY-V1.0.md), [koszty V1.3](COST-PLAN-V1.3.md).
- [Publikacja main i test produkcyjny P2.1](P21-PRODUCTION.md).
- [Weryfikacja i scenariusz odbioru P2.1](P21-VERIFICATION.md).
- [Historyczna weryfikacja P2](P2-VERIFICATION.md).
- [Kontrakty danych P2/P2.1 i szkice P3/P4](DATA-CONTRACTS-P2.md).
- [Wybrany wygląd A](design/DESIGN-DIRECTION-V1.2.md), ilustracje
  [P2](design/P2-ASSETS.md) i [P2.1](design/P21-ASSETS.md).
- [Założenia wolumenu AI](COST-PLAN-V1.2.md), [sklepy](RETAILER-FEASIBILITY-V1.1.md),
  [środowisko](SETUP.md), [zależności](DEPENDENCY-STATUS.md), [decyzje](DECISIONS.md).

## Odebrane P2/P2.1

- P2: wygląd A — Krem i śliwka; PL/EN, krótki start, profile stylów, budżety,
  priorytety, dwa tryby propozycji, opinie z opcjonalnym powodem i szafa demo.
- P2.1: sześć okazji w PL/EN. Okazja bieżącej rundy jest oddzielona od domyślnej
  okazji profilu. Zmiana okazji rozpoczyna wybór od nowa, zachowując gust.
- Filtr okazji poprzedza ranking. Maksymalnie dwa wyniki, budżet obejmuje
  dostawę, własne rzeczy kosztują 0 nowego wydatku. Niepasujące propozycje nie
  uzupełniają pary; brak zgodnych wyników jest jawnie komunikowany.
- Katalog ma 37 fikcyjnych rzeczy i 12 zestawów. Cztery nowe ilustracje weselne
  przedstawiają dorosłe fikcyjne osoby. To przykłady dla gości, nie pełna obsługa
  dowolnego dress code'u z zaproszenia.
- Stan V2 czyta V1 pod niezmienionym kluczem zapisu. Zachowane wszystkie stare
  identyfikatory rzeczy/zestawów, profile, język, tryb, szafa i opinie z powodami.
- Nadal działa lokalny zapis, obsługa błędów odczytu/zapisu, potwierdzany reset,
  pusty wynik i praca załadowanego interfejsu bez sieci.

Odebrane demo P2.1 nie ma kont, synchronizacji, własnych zdjęć, AI, prawdziwych ofert sklepów,
listy zakupowej ani płatności. Ilustracje nie są przymiarką na użytkowniku;
reguły nie uwzględniają rzeczywistych wymiarów ani rozmiarów produktów.

## Weryfikacja P2.1

- TypeScript strict i ESLint: PASS.
- Testy domeny: 15/15 PASS; testy WWW w Edge: 13/13 PASS.
- Eksport WWW/iOS/Android: PASS. Fizyczne urządzenia z Expo Go nie były testowane.
- Sprawdzono migrację zamrożonego zapisu V1, oba tryby, budżet, wyczerpanie
  przykładów, PL/EN oraz szerokości 320/360/390/1440 px i klawiaturę WWW.
- Vercel: READY i test online PASS (16:23 UTC). Końcowe CI dla `3c555b5`:
  [SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40111604543),
  w tym 13/13 scenariuszy WWW na Ubuntu/Chromium. Pierwsze CI wykazało zbyt
  wczesny pomiar po resize; poprawiono synchronizację testu bez zmiany aplikacji.
  Dowody i ograniczenia: [raport P2.1](P21-VERIFICATION.md).

Zależności nie zmieniły się w P2.1. W P2 zgodność SDK i Expo Doctor 21/21
przeszły, a audyt zgłosił 8 wpisów (5 high, 3 moderate) z 3 zgłoszeń źródłowych.
Nie zastosowano niesprawdzonych override ani `audit fix --force`.
Szczegóły: [DEPENDENCY-STATUS.md](DEPENDENCY-STATUS.md).

## Git i hosting

- Praca na `dev`. Podgląd: https://ubranka-git-dev-risk-every-asset.vercel.app.
  Chroni go logowanie Vercel. Projekt `ubranka`, zespół Risk Every Asset.
- Docelowy adres odbioru: https://ubranka.vercel.app (`main`, Vercel Production).
  P3.1 jest wdrożone i sprawdzone. Przed premierą zatwierdzony zakres można publikować
  i testować na main bez osobnego odbioru wyłącznie z powodu gałęzi; testy oraz
  jawne ograniczenia pozostają wymagane. To nie jest premiera komercyjna.
- Kod P3.1 `115b765` przeniesiono fast-forward na main; lokalne i zdalne
  gałęzie main/dev były zgodne po push. Vercel `dpl_2obmzhuWFReCHZWSaFNdX9z1U8BD`
  READY, target Production. HTTP 200, Google OAuth → szafa/zdjęcie → logout PASS,
  zero błędów konsoli. Końcowy commit zapisuje wyłącznie dokumentację.
- Historycznie `main` przeniesiono fast-forward z fundamentu `0203382` do odebranego P2.1
  `9bc50acef56f7b41525bfd9fb0cbb682e04fe26a`. Produkcja: https://ubranka.vercel.app.
  Vercel `dpl_21XuJzQigJzLn6Y39NKA9taZ1rvM` READY; test online PASS 16:44 UTC,
  HTTP 200, 0 błędów JavaScript. Kolejny commit aktualizuje wyłącznie dokumentację.
  Lokalny zapis demo dev/main jest osobny; publikacja kodu go nie synchronizuje.
  Prywatna szafa P3.1 korzysta ze wspólnego backendu obu adresów.
- Implementacja, CI i wdrożenie P2: `04ea37775515240e45b2001614dbfccb103e1105`,
  [run SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40102781826),
  Vercel `dpl_Bc6PBTM8s9EU6kS13Si4Zw2dPJuQ` READY i test online PASS.
- P2.1: aplikacja `b74e22c59bebd78e8aeeadb2cba28a100d3eb002`, Vercel
  `dpl_kKpgbeYGGDEYT25R1SRMUKx4keoZ` READY, kontrola online PASS na stałym adresie dev.
- Końcowy kod/testy P2.1: `3c555b56a93067581b312a980896cf5a29a5118d`, CI SUCCESS,
  Vercel `dpl_5rMcGooY9RdwsL4f8vnidys6byA8` READY. Aplikacja i bundle identyczne
  z wynikiem kontroli online. Commit 9bc50ac zapisał raport bez zmian kodu.

Historycznie P0 przeszedł [CI](https://github.com/loszavera/ubranka/actions/runs/40090246634).
Użytkownik potwierdził działanie hostingu oraz zdalnego Codex przez internet mobilny.
P1/V1.1 i V1.2 przeszły przeglądy dokumentacji; wersje historyczne zachowano.

## Następny krok

**Do zatwierdzenia: P3.2 — mała próba jakości i kosztu wizualizacji**, zgodnie
z [planem V1.4](IMPLEMENTATION-PLAN-V1.4.md): sześć przypadków na syntetycznych
obrazach fikcyjnych dorosłych, porównanie Sunburst/Flare, najwyżej 12 płatnych
wywołań łącznie i 25 PLN z buforem. Wszystkie płatne przygotowania, kalibracje,
błędy i ponowienia liczą się do limitów; bez automatycznych ponowień.
Wynik: przykłady do wspólnej oceny, zmierzone koszty/czas, wniosek o wykonalności
i aktualizacja dokumentacji. Zatrzymanie po raporcie, bez wdrażania P3.3.

Przed płatnym wywołaniem sprawdzić dostęp konta, sposób rozliczenia i wiarygodną
rezerwę kosztu. Proponowana zgoda nie obejmuje zakupu kredytów, automatycznych
doładowań, nowych abonamentów ani wysyłania prawdziwych zdjęć użytkowników.
Jeśli potrzebne będzie zasilenie konta, przedstawić konkretną kwotę i poprosić
o odrębną zgodę. Obecna tura jedynie proponuje P3.2 — nie uruchomiła płatnego AI.

Ponownie sprawdzono oficjalne opisy [Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst),
[Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare) i
[rozliczania obrazów](https://developers.openai.com/api/docs/guides/image-generation)
(2026-10-24). Modele obsługują obrazy wejściowe; równe stawki tokenów nie oznaczają
równego kosztu obrazu. Dostępu i salda konta API jeszcze nie sprawdzono.

Równolegle pozostaje krótki test Google Kasi według [checklisty](P31-ACCEPTANCE.md).
Nie blokuje przygotowania próby na danych sztucznych, ale nie wolno przedstawiać
go jako zaliczonego. P3.3 (profil sylwetki, rozpoznawanie, własne zestawy) pozostaje
osobnym etapem po ocenie P3.2. Podział środowisk ustalimy przed premierą komercyjną.
