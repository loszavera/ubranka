# P3.3 — proponowane zasady danych AI V1.0

Data: 2026-10-25. **Projekt do akceptacji, jeszcze niewdrożony.** Uzupełnia
[przyjęte zasady P3.1](P3-DATA-POLICY-V1.0.md); nie zmienia obecnej retencji szafy.
Akceptacja raportu P3.2 ani niniejszego planowania nie jest zgodą na przekazanie
prywatnych zdjęć OpenAI. To zasady techniczne pilotażu, nie ocena zgodności prawnej
przyszłej usługi komercyjnej.

## Co i dokąd trafi po osobnym uruchomieniu

| Odbiorca | Proponowane dane i cel |
| --- | --- |
| Obecny Supabase Frankfurt | Prywatny profil sylwetki: opcjonalny wzrost, obwody klatki/talii/bioder, rozmiary góry/dołu/butów i system rozmiarów; kopia jednego zdjęcia osoby, wybrane rzeczy, zestawy, wyniki oraz minimalny rejestr zgód/zadań/kosztów. Nowe obiekty są przypisane do właściciela. |
| OpenAI Images API | Tylko zaakceptowana kopia zdjęcia osoby, 1–3 wybrane zdjęcia rzeczy i krótka instrukcja ubrania tej osoby. Cel: jeden obraz wskazanego zestawu. |
| Vercel | Dotychczasowy hosting WWW; w rekomendowanym wariancie nie pośredniczy w transferze zdjęć do AI. Przeniesienie generatora do Vercel wymaga aktualizacji tego opisu przed wdrożeniem. |
| Google | Dotychczasowe logowanie. Bez zdjęć, wymiarów i wyników AI. |

OpenAI nie otrzymuje emaila, imienia konta, pełnej szafy, wymiarów, historii ocen,
identyfikatorów Supabase ani danych logowania użytkownika. Żądanie wychodzi
z serwera Ubranka; protokół i dostawca nadal przetwarzają techniczne metadane.
Przesyłamy bajty, bez publicznych/signed URL i bez trwałego Files API.
Szablon polecenia jest kontrolowany przez aplikację, bez dowolnych instrukcji
z nazw rzeczy. Fotografie bez metadanych EXIF/GPS, z ograniczonym rozmiarem.

## Zasady dostawcy sprawdzone 2026-10-25

Dane API domyślnie nie służą treningowi bez opt-in. Dla `/images/edits` OpenAI
nie przechowuje stanu aplikacyjnego; logi monitorowania nadużyć mogą zawierać
treści do 30 dni, a w określonych przypadkach dłużej. Obrazy oznaczone jako
potencjalne CSAM mogą być zatrzymane do ręcznej kontroli również przy ZDR.
ZDR wymaga zatwierdzenia; zgodność modelu z ZDR nie oznacza włączenia go na koncie.
Regionalne przetwarzanie obrazów w Europie wymaga dodatkowej kwalifikacji
(enhanced ZDR/MAM), konfiguracji projektu i regionalnego endpointu. Nie zakładamy
tej dostępności ani przetwarzania wyłącznie w UE. Przed C należy odczytać faktyczne
ustawienia danych projektu; nie włączać udostępniania danych na potrzeby treningu.
[Oficjalne zasady danych OpenAI](https://developers.openai.com/api/docs/guides/your-data).

Usunięcie obrazu w Ubranka nie kasuje natychmiast logów dostawcy. Supabase
Frankfurt również nie oznacza szyfrowania end-to-end ani wyłączności UE dla
wszystkich podwykonawców/logów. Nie obiecujemy ani takiej wyłączności, ani ZDR.

## Zgoda w aplikacji

1. Oddzielne wyjaśnienie zapisu zdjęcia sylwetki w Supabase, przed uploadem.
2. Przed pierwszym AI: dostawca, zakres danych, retencja, brak gwarancji rozmiaru,
   możliwość odmowy/wycofania. Brak domyślnego zaznaczenia zgody. Każda osoba
   potwierdza we własnym koncie; zgoda administratora nie zastępuje jej decyzji.
3. Każde zlecenie pokazuje dokładne miniatury wejść, model, szacowaną rezerwę
   i dostępny limit. Jeden przycisk „Wyślij te zdjęcia do OpenAI i wygeneruj”.
4. Pilotaż dotyczy własnych zdjęć dorosłego użytkownika i rzeczy, do których ma
   prawo. Bez zdjęć dzieci, osób postronnych, dokumentów czy intymnych ujęć.
   To ograniczenie materiałów pilotażu; nie tworzymy systemu identyfikacji twarzy.
5. Wycofanie zgody blokuje nowe wysyłki i anuluje jeszcze niewysłane zadania.
   Osobne „Usuń dane AI” usuwa profilowe zdjęcie i wyniki; sama odmowa AI nie
   kasuje szafy. Wysłanej już kopii nie da się cofnąć przyciskiem.

Przykładowe krótkie wyjaśnienie (UI otrzyma też EN):

> Do OpenAI wyślemy pokazane zdjęcie Twojej sylwetki i wybrane zdjęcia ubrań.
> Wynik zapisze się prywatnie w Ubranka na 30 dni. OpenAI może zachować treści
> w logach bezpieczeństwa, zwykle do 30 dni, z wyjątkami. Usunięcie w Ubranka
> nie usuwa natychmiast tych logów. Wizualizacja może zmienić ubranie i nie
> potwierdza rozmiaru. Możesz korzystać z szafy bez tej funkcji.

## Proponowana retencja i limity aplikacji

| Dane | Retencja / limit |
| --- | --- |
| Profil sylwetki i aktualne zdjęcie | Do usunięcia/wymiany lub usunięcia konta. Jedno zdjęcie/konto, główna kopia ≤1 MB, miniatura ≤100 kB, dłuższy bok ≤1600 px; rozmiary opcjonalne. |
| Kopie wejść dla AI | Preferowane przygotowanie w pamięci serwera; bez dodatkowego trwałego archiwum. Ewentualny osierocony plik techniczny usuwany w celu operacyjnym ≤24 h. |
| Wynik AI i miniatura | Automatyczne wygaśnięcie po 30 dniach od utworzenia lub wcześniejsze usunięcie. Maks. 30 przechowywanych wyników i 100 MB danych AI/konto, w ramach istniejących 250 MB/konto. Wynik PNG ≤8 MB, miniatura ≤100 kB. Liczy się także rezerwa operacji w toku. |
| Zestawy i opinie | Do usunięcia przez właściciela/konta; wynik graficzny może wygasnąć wcześniej niż sam zapis listy rzeczy. |
| Rejestr zgód i zleceń | Minimalne wersje zgód, ID/wersje wejść, stan, czas, parametry, usage i koszt: 90 dni od zamknięcia; bez kopii zdjęć i pełnych promptów zawierających dane użytkownika. Aktualną zgodę zachowujemy przez jej obowiązywanie. |
| Logi operacyjne | Do 7 dni, bez zdjęć, tokenów, URL do zdjęć, wymiarów i pełnej treści poleceń. Retencja logów usług jest osobna. |

Limit miejsca nie powoduje cichego usuwania szafy. Przed wywołaniem rezerwujemy
miejsce na wynik; przy braku miejsca prosimy o usunięcie wybranych wyników.
Nie usuwamy odrzuconych prób z liczników kosztu. Usunięcie konta usuwa powiązanie
rejestru z kontem; do rozliczenia okresu pozostają wyłącznie zbiorcze kwoty projektu,
bez identyfikatorów użytkownika, zdjęć, promptów i ścieżek. Nierozliczony koszt
nie upoważnia do zachowania zdjęć ani otwarcia następnych wywołań.

Usunięcie/wymiana zdjęcia sylwetki, zdjęcia rzeczy lub rzeczy unieważnia oczekujące
zadania i usuwa zależne wizualizacje, także miniatury. Natychmiast blokujemy nowe
odczyty; fizyczne czyszczenie aktywnego magazynu: cel ≤24 h przy działającej usłudze.
Po terminie wynik nie jest dostępny nawet jeżeli cleanup dopiero czeka na wykonanie.
Serwer ponownie sprawdza usunięcie przed publikacją wyniku. Obiekty zapisane
w wyścigu pozostają niedostępne i trafiają do sprzątania, zamiast wracać do UI.

Pobranie pliku przez użytkownika, kopie urządzenia i logi dostawców pozostają
poza możliwością natychmiastowego odwołania. Eksport własnych danych obejmuje
aktywne zdjęcie sylwetki, istniejące wyniki, zestawy i własny rejestr AI; bez sekretów.
Nie dodajemy nowej usługi backupu; obowiązują ograniczenia Free opisane w V1.0.
