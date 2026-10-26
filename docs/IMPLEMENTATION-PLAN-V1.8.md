# Plan implementacji Ubranka — V1.8

Data: 2026-10-26. Rozwinięcie [V1.7](IMPLEMENTATION-PLAN-V1.7.md).
**P3.3B odebrane z ograniczeniami. Aktualizacja 2026-10-26: użytkownik
zatwierdził implementację C1, testy syntetyczne i podgląd main.** Serwerowe AI
pozostaje OFF, bez klucza AI w chmurze, płatnych wywołań, prywatnych zdjęć w AI
i nowych abonamentów. C2 poniżej nadal jest propozycją wymagającą osobnej zgody.

[Wymagania V1.8](REQUIREMENTS-V1.8.md), [koszty V1.7](COST-PLAN-V1.7.md),
[zasady danych AI V1.1](P33-AI-DATA-POLICY-V1.1.md).

## Rezultat dla użytkowników

Przy jednym z dwóch zestawów z własnej szafy użytkownik wybiera „Zobacz na mnie”.
Widok pokazuje zdjęcie sylwetki i dokładne zdjęcia rzeczy, zasady danych,
rezerwę kosztu i pozostały limit. Po świadomej zgodzie powstaje jeden prywatny
obraz, z czytelnym podglądem, powiększeniem, pobraniem, oceną wierności i usunięciem.
W C1 cały ten przepływ sprawdzamy syntetycznie; na main AI pozostaje wyłączone.

| Zakres do osobnej akceptacji | Rezultat | Granica |
| --- | --- | --- |
| **C1 — wykonane i odebrane 2026-10-26** | Ostrzejsze miniatury i pełny podgląd; gotowy przepływ C, zgody, izolacja danych, limity i [raport testów](P33C1-VERIFICATION.md). Dev → main. | AI OFF także na serwerze, bez klucza AI w chmurze, płatnych wywołań i prywatnych zdjęć w testach AI. Istniejące usługi, bez nowych abonamentów. |
| **C2 — po C1 i osobnej zgodzie** | Pilotaż na dwóch kontach, uruchamiany przez użytkowników we własnej aplikacji: 30 dni / 25 PLN AI łącznie / najwyżej 60 wysłań. | Każda osoba potwierdza własne zdjęcia. Bez retry i automatycznego przedłużenia. Osobny klucz i potwierdzone finansowanie, zamknięcie po próbie. |

To podział proponowanego zakresu C, nie powtórzenie B. Wykorzystujemy sprawdzony
worker i jego rozliczanie, ale B dopuszczało tylko sześć z góry zapisanych
syntetycznych przypadków. C wymaga poprawnego działania dla zmieniających się
prywatnych wejść i odrębnych zgód. Starych sześciu slotów nigdy nie otwieramy.

## C1 — kolejność implementacji po zatwierdzeniu

### 1. Ostrość bez generowania nowych obrazów

- Dzisiejsze 120×180 PNG jest rozciągane w widoku; oryginał 1024×1536 jest ostry.
  Na sześciu zachowanych syntetycznych wynikach B porównać miniatury JPEG:
  punkt startowy **600×900**, limit **100 000 B**. Adaptacyjnie dobierać jakość
  i rozdzielczość, w skończonej liczbie kroków; bez upscale AI.
- Podgląd nie powinien udawać pełnej rozdzielczości. Osobne „Powiększ” ładuje
  oryginalny PNG dopiero na żądanie, z zachowaniem proporcji. Historia nie
  pobiera wszystkich oryginałów; miniatury ładowane przy przewijaniu,
  najwyżej dwa odczyty naraz. PL/EN i dostępna klawiatura.
- Kontrakt wariantu musi jawnie przechowywać MIME, rozmiar i wymiary;
  magazynu/autoryzacji nie wybierać tylko po rozszerzeniu `.png/.jpg`.
  Zachować odczyt i eksport starszych PNG. WebP nie jest teraz wymagany.
- Nowy enkoder wymaga pomiaru w Edge. Nie obiecywać 600×900 dla każdego obrazu
  poniżej 100 kB. Jeśli kompresja nie daje czytelnego wyniku w limitach,
  zachować bezpieczną mniejszą miniaturę z dostępem do oryginału; raport ma
  pokazać ten wyjątek. Błąd miniatury nie uruchamia ponownej generacji AI.
- Testy wydajności na już istniejących plikach i sztucznych obrazach o dużej
  złożoności: CPU, pamięć, rozmiar, dekodowanie WWW/native. Nie zmieniać
  oryginałów, kosztów ani publicznej galerii B. Brak migracji prywatnych zdjęć.

### 2. Osobny pilotaż i poprawny budżet

- Dodać osobny zakres C z datami początku/końca, zatwierdzonymi limitami,
  dwoma wpisami dopuszczenia kont i wersją konfiguracji. C1 zapisuje konfigurację
  jako nieaktywną. Uprawnień nie nadają pola profilu ani `user_metadata`.
- Zachować globalny wyłącznik i blokadę współbieżności. Atomowo rezerwować
  wysłanie, koszt i miejsce; uwzględniać **istniejące pliki wyników i miniatur**,
  pliki wejściowe oraz wszystkie rezerwy. Stara ścieżka rezerwacji z A nie
  wystarczy bez tej kontroli. Domknąć możliwość ominięcia bramek przez stare RPC.
  Zachować wspólny miesięczny rejestr wydatków aplikacji, w tym B; nowy trial
  nie zeruje jego wykorzystania ani nie dodaje drugiego miesięcznego budżetu.
- Receipt obejmuje projekt, konto, trial i UUID; nie zawiera zdjęć ani tokenów.
  Obecne receipty B nadal blokują ponowienie B. Reinstalacja, logout, przejście
  dev/main, usunięcie wyniku i zmiana miesiąca nie resetują limitów C.
  Usunięte konto nie wraca do pilotażu automatycznie przy ponownym logowaniu.
- Po utracie odpowiedzi wyłącznie odczyt istniejącego stanu. Trwały serwerowy
  znacznik wysłania powstaje przed kontaktem z dostawcą; retry, fallback modelu
  i ponowne POST po timeout są wyłączone. To może pozostawić nierozstrzygniętą
  próbę, zamiast ryzykować podwójne obciążenie.
  Ten sam zestaw i te same wersje wejść w danym trial nie dostają drugiego
  wysłania przez nowy UUID. Nowy obraz wymaga zmienionego zestawu/wejść,
  znanego rozliczenia poprzedniej próby i nowego świadomego potwierdzenia.

### 3. Dokładne wejścia i zgoda każdej osoby

- Jedno zdjęcie własnej dorosłej osoby + 1–3 wybrane zdjęcia rzeczy.
  Podgląd zgody musi odpowiadać dokładnie wersjom bajtów do wysłania.
  Ponownie sprawdzić właściciela, aktywne konto, zgodę, aktualność oraz
  dopuszczenie trial przed wysłaniem. Bez dodatkowego AI do opisów/rozpoznawania.
- Powiązać zadanie z treścią konkretnego zestawu i wersjami jego wejść.
  Globalna rewizja stanu może sprawdzać konflikt przy rezerwacji, ale późniejszy
  zapis niepowiązanej opinii lub innego zestawu nie może usuwać prawidłowych wyników.
- Zgoda ma monotoniczną rewizję niezależną od numeru polityki. Wycofanie,
  a następnie ponowne zaznaczenie zgody nie ożywia wcześniejszego zadania.
  Zmiana wejścia wymaga nowego potwierdzenia. Żądanie i jego ekran są wersjonowane.
- Sformułowanie działania jasno wskazuje dostawcę: „Wyślij te zdjęcia do OpenAI
  i wygeneruj”. Bez domyślnie zaznaczonej zgody; aplikacja działa bez AI.

### 4. Wynik, usuwanie i wygaśnięcie

- Autoryzowany odczyt oryginału/miniatury i eksport, bez publicznych/signed URL.
  Odróżnić ocenę „czy podobają mi się ubrania” od „czy obraz wiernie je pokazuje”.
- Wycofanie zgody blokuje nowe wysyłki, anuluje niewysłane zadania i blokuje
  publikację późnego wyniku. Wysłaną próbę nadal rozliczyć. Już gotowe wyniki
  można osobno usunąć; „Usuń wyniki AI” nie usuwa szafy ani zdjęcia sylwetki.
- Usunięcie/wymiana wejścia lub konta natychmiast blokuje nowe odczyty zależnych
  obrazów i późne wyniki; cleanup usuwa pliki, także osierocone. Cel ≤24 h przy
  działającej usłudze. Wygaśnięcie blokuje odczyt niezależnie od terminu cleanupu.
- Zamknięcie trial zatrzymuje **nowe wysłania**, ale nie odczyt jeszcze ważnych
  wyników i rozliczenie żądań już wysłanych. Nie kasować rezerw przed rozliczeniem.
  Nierozstrzygnięty koszt pozostaje zablokowany; nie jest zerem.
  Prawidłowy wynik żądania wysłanego przed końcem okresu może zostać zapisany
  w istniejącym krótkim oknie pracy workera, jeżeli zgoda i wejścia nadal są
  ważne. Spóźniony poza to okno nie wraca do UI. Oddzielić tę regułę od B,
  którego zapis wymagał otwartego trialu. Rozliczenie działa przy OFF oraz po
  usunięciu konta, na minimalnym rejestrze bez identyfikatorów i fotografii.

## Kontrole i odbiór C1

| Kontrola | Oczekiwany dowód |
| --- | --- |
| Czytelność | Sześć miniatur B ≤100 kB, zestawienie wymiarów/rozmiarów; podgląd do 300 CSS px przy DPR 1/2, czytelna twarz i kontury ubrania. Pełny podgląd ma hash oryginału. Osobno ocena wzrokowa, nie tylko dekodowanie. |
| Koszt poprawy miniatur | Zero nowych generacji, niezmienione oryginały, sloty i koszty B. Skończony, zmierzony enkoder mieści się w zasobach Edge. |
| Izolacja i zgody | Dwa konta syntetyczne: odmowa dostępu do cudzego zdjęcia/jobu; revoke→reaccept nie przywraca starego zadania; zmiana niepowiązanej opinii nie usuwa wyniku. |
| Koszty i retry | Dwie rzeczywiście współbieżne, zatwierdzane transakcje rezerwacji na fixture: najwyżej jedna dopuszczona przy wspólnym ograniczeniu. Utrata odpowiedzi przed/po wysłaniu, drugi UUID i dwa urządzenia nie powodują duplikatu. |
| Limity | Testy granic 30/60/5, 25 PLN, końca 30 dni, przejścia miesiąca UTC, aktywnych plików + rezerw 100/250 MB i braku miejsca. Odrzucony obraz nadal liczy się do limitu wysłań. |
| Usuwanie | Podczas pobierania i pracy workera, wygaśnięcie, logout/zmiana konta, eksport i cleanup. Żaden późny wynik nie przywraca usuniętych danych. |
| OFF | Ręczne wywołanie każdej starej i nowej ścieżki generacji na hostingu odmawia; nie ma klucza OpenAI w chmurze. Mock nie potwierdza płatnej integracji C. |

Wykonać `npm run check`, testy domeny/backendu/kodeka, `check:backend`, E2E demo
i prywatne oraz `build:all`; przy zmianie zależności także `check:dependencies`
i `doctor`. Hosted QA tylko na osobnych kontach syntetycznych, bez globalnego
cleanupu i bez fingerprintów prywatnych rekordów. Main: WWW 320/390/1440 px,
PL/EN, historia, powiększenie, eksport i AI OFF. Testy na fizycznym iOS/Android
zaplanować oddzielnie; eksport JS i emulacja DPR nie są testem telefonu.
Brak urządzenia ma pozostać jawnym ograniczeniem, nie fikcyjnym PASS.

Raport C1 ma wskazać commit, CI, podgląd main, wyniki i ograniczenia. Odebranie
C1 nie uruchamia C2. Przed C2 wymagany test na urządzeniach, na których uczestnicy
faktycznie będą korzystać; niezbadane platformy pozostają poza tym pilotażem.

## C2 — proponowany start i koniec, dopiero po oddzielnej zgodzie

1. Odczytać aktualne ustawienia danych/rozliczeń i ceny. Przedstawić jedną konkretną
   zgodę na 30 dni / 25 PLN / 60 wysłań, z granicą ceny pojedynczego żądania oraz
   potwierdzonym sposobem finansowania. Dawne zgody na doładowanie P3.2/B nie
   przechodzą na C. Bez potwierdzenia finansowania płatny start jest zablokowany.
2. Utworzyć nowy ograniczony klucz Images projektu Ubranka, wyłącznie w sekretach
   Supabase; nie używać B ani lokalnego P3.2. Zapisać daty trial na serwerze,
   możliwie krótki okres klucza i procedurę unieważnienia. Bez nowych abonamentów.
3. Każdy użytkownik sam uruchamia zlecenia w swoim koncie. Agent nie przegląda
   i nie wysyła prywatnych zdjęć w ramach testów operatora. Pierwsza próba C2
   rezerwuje cały obecnie dostępny budżet (mniejszy z pozostałego limitu próby
   i wspólnego miesiąca) do odczytu usage; to jeden z 60 slotów.
4. Odczyty kosztów i stanów nie inicjują następnego żądania. Nieznane rozliczenie,
   przekroczenie rezerwy lub błąd izolacji blokuje dalsze generacje. Usunięcie
   zdjęć nigdy nie czeka na ustalenie kosztu.
5. Po terminie, limicie albo wcześniejszym zakończeniu: serwerowe OFF; rozliczyć
   żądanie już wysłane, unieważnić klucz i usunąć sekret. Gdy koszt pozostaje
   nieznany, utrzymać blokadę i zaznaczyć to w raporcie. Bez kolejnego okresu.
   Wyniki wygasają według własnej retencji; użytkownik może je wcześniej usunąć.

Odbiór C2: ocena przydatności przez obie osoby, widoczne zużycie, brak wycieków
i niejawnych ponowień, sprawdzone usuwanie oraz pełne rozliczenie prób. Raport
publiczny tylko zbiorczy, bez prywatnej galerii, promptów i identyfikatorów.
Bez automatycznego przejścia do rozpoznawania D, sklepów ani premiery komercyjnej.

## Podstawa techniczna

Przegląd bieżącego kodu B oraz [raport B](P33B-REPORT.md). Limity Edge sprawdzone
2026-10-26: 256 MB, CPU 2 s/żądanie, Free 150 s czasu workera; brak obsługi
bibliotek wymagających wielowątkowości, np. sharp. To ogranicza wybór enkodera;
nie zmieniamy hostingu, aby ominąć pomiar.
[Dokumentacja Supabase](https://supabase.com/docs/guides/functions/limits).
