# P3.3 — zasady danych AI V1.1: propozycja pilotażu C

Data: 2026-10-26. Rozwinięcie [V1.0](P33-AI-DATA-POLICY-V1.0.md) oraz
[przyjętych zasad szafy](P3-DATA-POLICY-V1.0.md).
**Odbiór B jest potwierdzony. Aktualizacja 2026-10-26: przygotowanie C1
zatwierdzono; prywatny pilotaż C2 i przesyłanie zdjęć do AI nadal nie są zatwierdzone.**
Aktualne zdjęcia pozostają w dotychczasowym prywatnym Supabase; planowanie
nie jest zgodą na przekazanie ich OpenAI. C1 przygotowuje mechanizmy przy AI OFF;
dopiero osobna zgoda C2 oraz decyzja każdej osoby pozwolą na pojedyncze wysłania.

## Dane i odbiorcy po ewentualnej aktywacji C2

| Odbiorca | Dane i cel |
| --- | --- |
| Istniejący Supabase Frankfurt | Profil, prywatne zdjęcie sylwetki, rzeczy, zestawy, wyniki/miniatury oraz minimalne wersje zgód i rozliczenia. Oddzielny dostęp właściciela. |
| OpenAI Images API | Wyłącznie zatwierdzona kopia jednego własnego zdjęcia dorosłej osoby i 1–3 wybrane zdjęcia rzeczy oraz stała instrukcja wizualizacji jednego zestawu. |
| Vercel / Google | Dotychczasowy hosting / logowanie. Nie pośredniczą w wysyłaniu zdjęć do OpenAI. |

Bez emaila, imienia konta, wymiarów, historii ocen i całej szafy w żądaniu AI.
Bez dowolnych instrukcji z nazw rzeczy, publicznych/signed URL i Files API.
Wysyłamy bajty po usunięciu EXIF/GPS; nie używamy twarzy do identyfikacji.
Dostawcy przetwarzają również techniczne metadane połączenia.
Klucz wyłącznie na serwerze, bez dostępu klienta. Widok kosztów w aplikacji
pokazuje administratorowi agregaty, bez fotografii drugiej osoby. Administrator
infrastruktury z uprzywilejowanym dostępem ma techniczną możliwość dostępu do
Storage; nie jest to szyfrowanie end-to-end. Testy operatora nie obejmują
przeglądania prywatnych zdjęć uczestników. Publiczny raport nie zawiera prywatnych
zdjęć, promptów, ścieżek, hashy prywatnych wejść ani identyfikatorów kont.

## Zasady OpenAI sprawdzone 2026-10-26

Dane API domyślnie nie służą treningowi bez opt-in. Dla Images edits tabela
przewiduje brak stanu aplikacyjnego i do 30 dni logów monitorowania nadużyć,
z wyjątkami dłuższego przechowywania. Obrazy mogą podlegać kontroli bezpieczeństwa;
potencjalne CSAM może zostać zachowane do ręcznej oceny. ZDR wymaga zatwierdzenia
i nie jest tu zadeklarowane. Nie obiecujemy przetwarzania wyłącznie w UE.
Usunięcie w Ubranka nie usuwa natychmiast logów OpenAI. Przed C2 sprawdzimy
ustawienia projektu; nie włączamy udostępniania danych do treningu.
[Oficjalne zasady OpenAI](https://developers.openai.com/api/docs/guides/your-data).

Supabase Frankfurt nie oznacza szyfrowania end-to-end ani gwarancji UE dla
każdego podwykonawcy. Jeżeli wyłączność UE okaże się wymagana, przed C2 trzeba
uzgodnić inną konfigurację/dostawcę. Ten dokument opisuje techniczny pilotaż,
nie potwierdza zgodności prawnej przyszłej usługi komercyjnej.

## Zgoda i kontrola użytkownika

1. Zapis sylwetki w Supabase pozostaje oddzielony od przekazania zdjęć do AI.
   Każda osoba we własnym koncie potwierdza zasady i dokładnie pokazane wejścia
   dla jednego zlecenia. Zgoda właściciela projektu nie zastępuje tej decyzji.
2. Potwierdzenie nie jest domyślnie zaznaczone. Zmiana wejść lub warunków
   unieważnia ekran potwierdzenia; serwer weryfikuje rewizje przed wysłaniem.
   Dopuszczamy tylko własne zdjęcia dorosłego uczestnika oraz rzeczy, do których
   ma prawa; bez osób postronnych, dzieci, dokumentów i intymnych ujęć.
3. Wycofanie zgody zatrzymuje przyszłe wysyłki, anuluje niewysłane zadania
   i uniemożliwia publikację późnego wyniku. Już wysłanej kopii nie można cofnąć;
   koszt zostaje rozliczony. Ponowne udzielenie zgody nie przywraca starego jobu.
4. **„Usuń wyniki AI” usuwa wyniki i miniatury, bez szafy oraz zdjęcia sylwetki.**
   To doprecyzowanie wcześniejszej propozycji V1.0. Osobne usunięcie/wymiana
   zdjęcia sylwetki lub rzeczy usuwa także zależne wizualizacje. Usunięcie
   całego konta obejmuje wszystkie jego dane według zasad szafy.
5. Wycofanie zgody samo nie usuwa wcześniejszych gotowych wyników; użytkownik
   może je usunąć osobno. Odmowa AI nie blokuje korzystania z szafy i zestawów.

Krótka informacja przed przyciskiem, również w EN: pokazane zdjęcia trafią
do OpenAI; wynik będzie prywatny przez 30 dni; dane mogą pozostawać w logach
dostawcy według powyższych zasad. Obraz może zmienić cechy ubrania lub sylwetki
i nie potwierdza rozmiaru. Każde wysłanie zużywa budżet, także gdy wynik się nie podoba.

## Retencja i usuwanie

| Dane | Proponowane zasady C |
| --- | --- |
| Profil, obecne zdjęcie sylwetki, szafa | Dotychczasowe zasady: do usunięcia/wymiany/kasacji konta. Zdjęcie sylwetki ≤1 MB, miniatura ≤100 kB, dłuższy bok ≤1600 px. |
| Kopie wejściowe AI | Przetwarzanie w pamięci serwera bez dodatkowego archiwum. Osierocone pliki techniczne: cel usunięcia ≤24 h. |
| Wynik i miniatura | Wygaśnięcie po 30 dniach od zapisu lub wcześniejsze usunięcie; PNG ≤8 MB, miniatura ≤100 000 B. 30 aktywnych wyników/100 MB AI w 250 MB konta, wraz z rezerwami. |
| Rejestr C | Wersja/rewizja zgody, minimalne powiązania wejść, stan, czasy, usage i koszt: 90 dni od zamknięcia zadania. Bez zdjęć i pełnych promptów. Aktualna zgoda przez okres obowiązywania. |
| Liczniki pilotażu | Nie odnawiają się po usunięciu obrazu/konta. Po kasacji konta odłączenie identyfikatorów i pozostawienie zbiorczych kwot/liczby zużytych slotów; brak automatycznego ponownego dopuszczenia. Po zamknięciu C pozostaje raport zbiorczy. |
| Logi aplikacyjne | Do 7 dni, bez zdjęć, tokenów, URL zdjęć, wymiarów i pełnych poleceń. Logi samych usług mają odrębne zasady. |

Usunięcie, wygaśnięcie lub unieważnienie wejścia natychmiast blokuje nowe odczyty.
Cel fizycznego usunięcia aktywnych plików ≤24 h przy działającej usłudze, przez
istniejący cleanup; awaria nie przywraca odczytu. Sprawdzenie przed publikacją
wyniku zapobiega przywróceniu usuniętych danych. Niepowiązana opinia ani inny
zestaw nie unieważniają wyniku. Brak miejsca nie powoduje cichego usunięcia szafy.

Pełny podgląd i miniatura korzystają z tej samej autoryzacji. Logout/zmiana konta
anulują pobieranie i czyszczą kontrolowane kopie aplikacji. Minimalny receipt
trial/UUID pozostaje po logout, aby zapobiec ponowieniu; bez zdjęć i tokenów,
oddzielony od AsyncStorage demo. Znosi go autorytatywne potwierdzenie trwałego
jobu/slotu lub kasacja konta na danym urządzeniu; serwer nadal chroni przed duplikatem.

Eksport obejmuje dostępne własne obrazy i metadane. Plik zapisany przez użytkownika
poza aplikacją oraz kopie urządzenia nie podlegają późniejszemu zdalnemu usunięciu.
Koniec trial nie kasuje przedwcześnie ważnych wyników; blokuje nowe wysłania.
Wynik wcześniej wysłanego zadania może być zapisany w krótkim oknie pracy
workera, o ile nie wycofano zgody ani nie unieważniono wejść. Koszt rozliczamy
także po usunięciu konta, bez zatrzymywania jego zdjęć lub osobistych identyfikatorów.
Nie dodajemy usługi backupu i nie rozszerzamy obecnej dostępności planu Free.
