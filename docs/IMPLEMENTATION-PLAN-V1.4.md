# Plan implementacji Ubranka — V1.4

Data: 2026-10-24. **Aktualizacja: użytkownik zatwierdził P3.1, Supabase Free/Frankfurt,
Google OAuth oraz politykę danych V1.0. Implementacja trwa na dev; stan usług
i testów: [PROJECT-STATUS.md](PROJECT-STATUS.md). P3.2/P3.3 pozostają propozycją,
bez zgody na płatne AI i nowe abonamenty.** P2.1 został odebrany
i przeniesiony do main. [Wymagania V1.4](REQUIREMENTS-V1.4.md) dziedziczą V1.2/V1.3.

## Rekomendacja

Pozostawić Expo/TypeScript i Vercel. Dodać **Supabase Auth + Postgres + prywatny
Storage w regionie Frankfurt `eu-central-1`**, początkowo w planie Free.
Przyjęto **Google do logowania**, aby nie kupować domeny ani uruchamiać poczty
transakcyjnej na start. Konta aplikacji są osobiste; Aleksy administruje projektem,
Kasia nie potrzebuje dostępu do panelu administracyjnego Supabase.

Szafa i przechowywanie zdjęć nie wymagają AI. Wizualizację sprawdzimy osobną,
ograniczoną próbą. Takie rozdzielenie nie usuwa wymagań rozpoznawania zdjęć,
parametrów sylwetki i wizualizacji; pozwala odbierać działające części oddzielnie.

Plan jest rozwinięciem P3a/P3b z [V1.2](IMPLEMENTATION-PLAN-V1.2.md): P3.1 to
fundament dawnego P3b, P3.2 to próba P3a, P3.3 domyka P3b. P4/P5 nie zmieniają się.

## Wybór usług

| Potrzeba | Rekomendacja | Powód i ograniczenie |
| --- | --- | --- |
| WWW | Obecny Vercel | Ten sam projekt i workflow main/dev. Bieżący plan rozliczeniowy nie został ujawniony przez odczyt narzędzia; brak zmiany abonamentu. |
| Konto i baza | Supabase Auth + Postgres | Jedna usługa dla kont, danych i reguł dostępu; relacje między rzeczami, profilami, zdjęciami i zestawami. |
| Zdjęcia | Supabase private Storage, Frankfurt | Kontrola dostępu przez sesję i reguły właściciela, bez publicznego katalogu zdjęć. |
| Logowanie | Google OAuth, tylko zaproszone dwie osoby | Google otrzymuje dane logowania, nie zdjęcia szafy. Ubranka korzysta z identyfikatora, emaila i podstawowego profilu; bez Gmaila/Drive/Photos. |
| Serwer operacji uprzywilejowanych | Supabase Edge Functions | Usuwanie konta/plików, limity i później wywołania AI; sekrety poza aplikacją. Bez drugiego backendu na start. |
| Wizualizacja — później | Bezpośrednie OpenAI Images API; kandydat GPT Image 2.5 Sunburst, porównanie Flare | Konkretny wybór dopiero po próbie jakości i kosztów. Bez dodatkowej bramki AI na start. |

[Supabase: regiony](https://supabase.com/docs/guides/platform/regions),
[prywatne buckety](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[Google OAuth i zakres danych](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

Alternatywa **Firebase** jest technicznie możliwa, ale Storage wymaga Blaze i
konta rozliczeniowego; nie wybieram jej na pierwszy etap bez nowych opłat.
[Oficjalne wymagania Firebase](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

Jeśli Google nie odpowiada obu osobom: email OTP z custom SMTP, np. Resend Free,
wymaga konta i własnej zweryfikowanej domeny. To zmiana wybranego wariantu do
uzgodnienia, a nie ukryty warunek kosztu 0 PLN. Domyślny SMTP Supabase jest
testowy (adresy zespołu, 2 wiadomości/h), więc nie opieramy na nim pilotażu.
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
[Resend](https://resend.com/pricing), [domena](https://resend.com/docs/dashboard/domains/introduction).

## P3.1 — prywatna szafa: zakres zatwierdzony

Rezultat: „Loguję się na telefonie, dodaję swoje ubranie, widzę je na drugim
urządzeniu i mogę je usunąć; druga osoba nie widzi mojej szafy”.

1. Dwa osobne konta, dostęp ograniczony listą zaproszonych osób, wylogowanie
   i przełączanie kont bez pozostałości zdjęć/danych poprzedniej osoby.
2. Zachowanie wielu profili, PL/EN, budżetu, priorytetów i domyślnej okazji/trybu.
   Synchronizacja danych zalogowanego użytkownika; bez cichego nadpisywania
   nowszej edycji przy konflikcie dwóch urządzeń.
3. Dodanie rzeczy z galerii albo aparatu: zdjęcie rzeczy lub na sobie, podgląd
   przed wysłaniem, krótka nazwa, kategoria, kolor, okazje i opcjonalny rozmiar.
   Ręczna korekta danych, wymiana zdjęcia, usunięcie rzeczy i konta.
4. Przyjęty limit: **100 rzeczy/osobę, jedno zdjęcie na rzecz**, do 1 MB kopii
   głównej po przygotowaniu, miniatura do 100 kB; budżet magazynu 250 MB/konto.
   Dłuższy bok do 1600 px, zachowanie orientacji, usunięcie EXIF/GPS przed uploadem.
   JPG/PNG/WebP jako wynik wejściowy; zdjęcie z iPhone'a wymaga obsługiwanej
   konwersji HEIC albo jasnej odmowy bez wysyłania. Nie obiecywać konwersji bez testu.
5. Zdjęcia prywatne do usunięcia. P3.1 nie wysyła ich do AI. Szczegóły i kopie:
   [przyjęte zasady danych](P3-DATA-POLICY-V1.0.md).
6. Dobrowolny import wybranych profili i opinii z P2, po wskazaniu właściciela.
   Demo pozostaje oddzielne. 37 fikcyjnych ubrań nie jest importowane jako
   własne rzeczy. Lokalny zapis zachowany; ponowienie importu bez duplikatów.
7. Eksport własnych danych i zdjęć do pobrania. Free nie zapewnia automatycznej
   kopii bezpieczeństwa zdjęć; użytkownik zachowuje oryginały na telefonie.
8. Testy dostępu, synchronizacji, błędów, uploadu/usuwania i migracji, podgląd dev
   z danymi sztucznymi, dokumentacja konfiguracji i wyników. Main po odbiorze.

P3.1 nie obejmuje automatycznego rozpoznawania zdjęć, generowania nowych stylizacji,
przymiarki ani sklepów. Funkcje P2 zostają jako wyraźnie oznaczone demo; własna
szafa staje się źródłem do następnej części P3, a nie pozornie gotowego AI.

## P3.2 — mała próba wizualizacji (osobna akceptacja)

- Wyłącznie zdjęcia syntetyczne fikcyjnych dorosłych. Sześć ustalonych przypadków
  dla obu grup, stylu codziennego/eleganckiego/wesela i pełnych zestawów; porównanie
  Sunburst i Flare, najwyżej **12 płatnych wywołań łącznie**, w tym kalibracja.
- Proponowany budżet **25 PLN razem z buforem**. Kończymy wcześniej, gdy kolejna
  próba nie mieści się w pozostałym limicie. Bez automatycznych ponowień.
  Nie jest to zgoda na zakup kredytów; minimalna wpłata dostawcy może być wyższa
  od samego kosztu próby i musi być znana przed aktywacją.
- Jeden obraz zestawu = jedna wizualizacja; oba zestawy = dwa obrazy.
  Przykładowe ustawienie 1024×1536, medium, zdjęcie osoby + do 3 rzeczy;
  rzeczywiste tokeny, czas i błędy rejestrujemy. Nie zgadujemy ceny po nazwie jakości.
- Oceniamy zachowanie osoby, kroju/koloru wszystkich elementów, kompletności,
  artefaktów i kosztu zaakceptowanego wyniku. Raport daje wynik: wykonalne,
  z ograniczeniami albo poza budżetem/jakością. Kasia i Aleksy oceniają przykłady.
- Przed prawdziwymi zdjęciami potrzebne są zaakceptowane zasady danych AI i wynik
  próby. Sama prywatna szafa w UE nie oznacza przetwarzania AI w UE.

[Oficjalny przykład zmiany odzieży](https://developers.openai.com/api/docs/guides/image-prompting),
[koszty i kontrola prób](COST-PLAN-V1.3.md). Wizualizacja nie potwierdza fizycznego dopasowania.

## P3.3 — stylizacje z własnych rzeczy (osobna akceptacja)

Po P3.1 i raporcie P3.2: rozpoznawanie zdjęć z korektą, docelowy profil sylwetki
(proponowane wzrost, rozmiar góry/dołu/butów, potrzebne obwody i zdjęcie sylwetki;
lista/kolejność do odbioru), maksymalnie dwa kompletne zestawy z konkretnych rzeczy,
filtr okazji przed rankingiem i opinie per profil. Wizualizacja tylko na prośbę.

To etap domykający wymagane dane do doboru, a nie decyzja o trwałym trybie bez
zdjęć/wymiarów. W prywatnej szafie wszystko jest już posiadane, więc wydatek wynosi
0 PLN; nie tworzymy sztucznej różnicy „tani/markowy”. Oba tryby P2 pozostają w demo,
a porównanie cen nowych produktów wraca z katalogiem P4. Sposób prezentacji tego
ograniczenia wymaga odbioru przy projektowaniu P3.3.

Wdrożenie AI wymaga kosztu z próby, kontroli 30 wyników/osobę/mies., rejestru każdej
próby, ograniczonej kolejki i braku generacji przy samym wejściu na ekran.
Akceptacja P3.1 nie jest akceptacją P3.2/P3.3 ani płatnych usług.

## Środowiska, bezpieczeństwo i testowanie

- Oddzielny projekt Supabase testowy i pilotażowy (jeśli dostępne są dwa miejsca
  Free). Dev/CI i inne Preview używają wyłącznie danych sztucznych. Produkcyjne
  sekrety nie trafiają do dowolnych branchy. Brak automatycznych migracji bazy
  produkcyjnej przy zwykłym push; zastosowanie i odbiór w uzgodnionym zakresie.
- RLS obejmuje profile, rzeczy, zdjęcia i opinie: właściciel ustalany z sesji,
  kontrola aktywnego konta, brak zaufania do przesłanego accountId. Storage również
  prywatny; odczyt zdjęcia wymaga aktywnego stanu rzeczy/zdjęcia, także podczas
  oczekiwania na fizyczne usunięcie. Sekrety administracyjne wyłącznie w funkcjach serwerowych.
- A nie może listować/odczytać/zmienić/usunąć B przez UI ani ręczne API/ścieżkę.
  Test także po usunięciu konta ze starym tokenem oraz po wylogowaniu.
- Upload: format, orientacja, metadane, rozmiar, zerwane połączenie, anulowanie,
  retry bez duplikatów. Usuwanie obejmuje plik główny, miniaturę i nieukończone operacje.
- Pierwszy odbiór WWW: Safari na iPhonie i Chrome na Androidzie, plus desktop.
  OAuth na natywnym Expo wymaga development build; Expo Go nie zapewnia własnego
  schematu powrotu. Osobny test natywny i ewentualne konta/koszty EAS/Apple
  wymagają ustalenia, bez instalowania/zakupów w ramach samego planu.
  [Dokumentacja Expo OAuth](https://docs.expo.dev/guides/authentication/).

## Kolejność po zatwierdzeniu P3.1

Najpierw lokalny model, ekrany, adapter i testy na danych sztucznych. Następnie
konfiguracja zaakceptowanego Supabase Free i Google OAuth na kontach właściciela,
kontrola reguł dostępu, integracja i test dwóch kont. Do konfiguracji będą potrzebne
logowanie właściciela do usług oraz prywatnie wskazane dwa adresy; nie wpisujemy
ich ani sekretów do publicznego repozytorium. Jeśli brakuje darmowych miejsc,
kont Google lub dostępu, przedstawimy konkretną przeszkodę bez aktywacji płatnego planu.

Po odbiorze bezpiecznego przepływu można zaproponować realny pilotaż i P3.2.
Ta kolejność została zatwierdzona do wykonania. Bieżący status odróżnia gotowy
kod i lokalne testy od rzeczywiście skonfigurowanej chmury; sam commit nie
potwierdza uruchomienia Google/Supabase.
