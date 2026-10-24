# P3 — proponowane zasady danych V1.0

Data: 2026-10-24. **Propozycja techniczna do zatwierdzenia, nie wdrożona polityka
ani potwierdzenie zgodności prawnej.** Dotyczy prywatnego pilotażu dwóch osób.
Przed komercyjnym startem potrzebne są właściwe dokumenty użytkownika/administratora.

## Kto otrzymuje dane

| Odbiorca | P3.1 — proponowany zakres |
| --- | --- |
| Supabase, projekt Frankfurt `eu-central-1` | Identyfikator/email konta, profile stylów, preferencje, opisy rzeczy, prywatne kopie zdjęć i miniatury. |
| Google OAuth | Logowanie i podstawowa tożsamość; nie wysyłamy zdjęć szafy, wymiarów ani opinii. Bez uprawnień Gmail/Drive/Photos. |
| Vercel | Hosting aplikacji i zwykłe dane żądania sieciowego. Zdjęcia idą do prywatnego Storage, nie publicznych assetów/repozytorium. |
| OpenAI | W P3.1 nic. P3.2 tylko syntetyczne materiały po odrębnej zgodzie na próbę. Realne zdjęcia dopiero po akceptacji kolejnego zakresu. |

Frankfurt oznacza region głównych danych projektu, nie zapewnienie, że wszystkie
logi, podwykonawcy i CDN są wyłącznie w UE. Nie jest to szyfrowanie end-to-end:
operatorzy usług i uprawniony administrator mogą technicznie przetwarzać dane.
[Regiony](https://supabase.com/docs/guides/platform/regions).

## Przechowywanie i usuwanie — proponowane reguły aplikacji

| Dane | Proponowana reguła |
| --- | --- |
| Oryginał zdjęcia na telefonie | Aplikacja go nie kasuje; przygotowuje kopię do wysłania. EXIF/GPS usuwane przed transferem. |
| Zdjęcie i miniatura w szafie | Do usunięcia przez właściciela albo usunięcia rzeczy/konta. Brak publicznych linków i automatycznego udostępniania drugiej osobie. |
| Profil/opis/opinia | Do usunięcia odpowiednich danych/konta. Możliwość eksportu własnych danych. |
| Nieukończony upload/osierocone pliki | Cel operacyjny: sprzątanie do 24 h przez kontrolowane zadanie serwerowe; błąd i zaległość widoczne administratorowi. |
| Usuwanie | Natychmiastowe ukrycie, blokada nowych odczytów wymagających sesji i wydawania nowych linków. Wcześniej wydane linki i cache podlegają ograniczeniom poniżej. Cel usunięcia aktywnych plików do 24 h. „Usunięto” dopiero po potwierdzeniu magazynu i bazy, inaczej status oczekujący/błąd. |
| Logi własnej aplikacji | Tylko techniczne zdarzenia i niezbędne identyfikatory, do 7 dni; bez zdjęć, podpisanych URL, tokenów i treści profili. Retencja logów usług jest odrębna. |
| Cache na urządzeniu | Minimalny; czyszczenie widoku i kontrolowanego cache po wylogowaniu, zmianie konta i usunięciu. Kopii pobranej przez użytkownika aplikacja nie potrafi odwołać. |

Terminy 24 h/7 dni są proponowanym zachowaniem aplikacji przy działającej usłudze,
nie gwarancją fizycznego skasowania wszystkich kopii infrastruktury. Darmowy
projekt może zostać wstrzymany; wtedy operacja nie może pozornie zakończyć się sukcesem.

Usuwać obiekty przez Storage API, nie sam rekord SQL. Usunięcie konta: blokada
konta i nowych operacji, skasowanie wszystkich wariantów plików, danych i na końcu
tożsamości Auth. RLS sprawdza aktywność konta oraz rzeczy/zdjęcia, ponieważ istniejący
JWT nie zawsze przestaje działać natychmiast, a plik może oczekiwać na usunięcie.
[Storage delete](https://supabase.com/docs/guides/storage/management/delete-objects),
[konto Auth](https://supabase.com/docs/guides/auth/managing-user-data).

Preferować autoryzowany odczyt z JWT i ograniczony cache. Podpisany URL, gdy potrzebny,
ma krótki czas ważności (propozycja 5 minut); jego termin nie daje gwarancji wyczyszczenia
już pobranej/buforowanej kopii. Smart CDN unieważnia usunięty obiekt z opóźnieniem
do około 60 s, a cache przeglądarki jest oddzielny.
[Zasady CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn).

## Kopie bezpieczeństwa

Supabase Free nie zapewnia automatycznego backupu; backup bazy w płatnym planie
również nie obejmuje zdjęć Storage. W P3.1: eksport na żądanie do pobrania,
oryginały zachowane przez użytkownika, bez dodatkowej kopii zdjęć w innej chmurze.
Nie obiecujemy odzyskania zdjęć po awarii Free. Jeśli później dojdą własne backupy,
ich miejsce, szyfrowanie, retencję i ponowne zastosowanie usunięć po odtworzeniu
trzeba zatwierdzić przed wdrożeniem. [Backupy](https://supabase.com/docs/guides/platform/backups).

## Przyszłe AI — odrębny przepływ i odbiór

Proponujemy przekazywanie wybranej kopii zdjęcia osoby oraz zdjęć rzeczy wyłącznie
po przycisku wizualizacji, bez emaila czy pełnej historii szafy. Wynik wraca do
prywatnego magazynu. Usuwanie obejmie wejścia i wyniki w Ubranka.

Według aktualnych zasad OpenAI dane API domyślnie nie służą do treningu. Images
API nie utrzymuje stanu aplikacyjnego, ale logi monitorowania nadużyć mogą
obejmować treści do 30 dni, z wyjątkami (m.in. obrazy podejrzane o CSAM).
ZDR i regionalne przetwarzanie wymagają kwalifikacji/konfiguracji; nie są domyślnie
zapewnione. Skasowanie pliku w Ubranka nie usuwa natychmiast takich logów.
[Oficjalne zasady danych API](https://developers.openai.com/api/docs/guides/your-data).

Przed realnym użyciem ekran wyjaśnia dostawcę, przekazywane pliki i retencję.
W P3.1 zgoda na przechowywanie w szafie nie jest zgodą na wysłanie do AI.
