# P3.3 — zasady danych AI V1.2: końcowa propozycja C2

Data: 2026-10-26. **DO ZATWIERDZENIA — nie udzielono zgody na prywatne zdjęcia w AI ani aktywację C2.**
C1 odebrane. Rozwinięcie [V1.1](P33-AI-DATA-POLICY-V1.1.md), [zasad szafy](P3-DATA-POLICY-V1.0.md)
i [planu V1.9](IMPLEMENTATION-PLAN-V1.9.md); koszty: [V1.8](COST-PLAN-V1.8.md). Teraz tylko dokumentacja.

## Dane i odbiorcy po ewentualnej aktywacji

| Odbiorca | Zakres |
| --- | --- |
| Istniejący Supabase Frankfurt | Prywatny profil, sylwetka, szafa, zestawy, wyniki/miniatury, wersje zgód i minimalne rozliczenie. Dostęp użytkownika do własnych danych. |
| OpenAI Images edits | Jedno własne zdjęcie dorosłego uczestnika, 1–3 wybrane zdjęcia ubrań, kontrolowana instrukcja jednego zestawu oraz pseudonimowy `safety_identifier`. |
| Vercel / Google | Dotychczasowy hosting / logowanie; nie pośredniczą w przesyłaniu zdjęć do OpenAI. |

Kopie AI: proponowany limit C2 maks. 1024×1536 i 1 MB każda, bez rozciągania oraz EXIF/GPS.
Przygotowanie bez AI zachowuje źródła szafy; podgląd/zgoda dotyczą dokładnie przekształconych bajtów.
Jeżeli przygotowanie kopii się nie uda, odmowa następuje przed płatnym wysłaniem. Bez emaila, imienia konta,
wymiarów, historii opinii, całej szafy i nazw ubrań używanych jako instrukcje. Bez publicznych/signed URL i Files API.
`safety_identifier` jest stabilnym pseudonimem uczestnika wyliczanym na serwerze, bez jawnego emaila lub ID konta.
Nie jest anonimowością: pozwala dostawcy wiązać żądania tej samej osoby. Dostawca widzi też metadane połączenia.
Projekt C2 przyjmuje ten identyfikator zgodnie z zaleceniem OpenAI; API go nie wymaga. [Safety identifiers](https://developers.openai.com/api/docs/guides/image-generation#safety-identifiers).
Nie identyfikujemy osób po twarzy. Klucz AI wyłącznie w sekretach serwera, bez przeglądarki/Git/EXPO_PUBLIC.

## Zasady dostawcy sprawdzone 2026-10-26

Dane API nie służą treningowi bez opt-in. Images edits nie utrzymuje stanu aplikacyjnego; standardowe logi
monitorowania nadużyć mogą pozostawać do 30 dni, z wyjątkami bezpieczeństwa/prawnymi. Obrazy są sprawdzane
pod kątem CSAM; potencjalne wykrycie może oznaczać zachowanie do ręcznej oceny, także przy ZDR.
Nie obiecujemy ZDR ani przetwarzania AI wyłącznie w UE. Ustawienia sprawdzamy przed C2 bez włączania opt-in.
Usunięcie danych w Ubranka nie usuwa logów OpenAI. [Oficjalne zasady danych](https://developers.openai.com/api/docs/guides/your-data).
Supabase Frankfurt nie oznacza szyfrowania end-to-end ani UE dla całego przepływu. Administrator infrastruktury
ma techniczną możliwość dostępu uprzywilejowanego; testy operatora nie obejmują prywatnych zdjęć uczestników.
To opis technicznego pilotażu, nie potwierdzenie zgodności prawnej przyszłej usługi komercyjnej.

## Osobista zgoda i usuwanie

1. Zgoda właściciela projektu na C2 nie zastępuje decyzji uczestnika. Każda osoba sama akceptuje V1.2
   na swoim koncie i osobno każde wysłanie dokładnie pokazanych zdjęć. Zapis do Supabase nie jest zgodą AI.
2. Potwierdzenie nie jest zaznaczone domyślnie. Zmiana wejść/rewizji/zasad wymaga nowego potwierdzenia;
   serwer sprawdza je przed wysłaniem. Tylko własna dorosła osoba i rzeczy, do których ma prawa;
   bez osób postronnych, dzieci, dokumentów i intymnych ujęć.
3. Wycofanie zgody blokuje przyszłe wysyłki, anuluje niewysłane zadania i publikację spóźnionego wyniku.
   Nie cofa już wysłanej kopii ani kosztu; ponowna zgoda nie wznawia starego zadania.
4. Wycofanie zgody nie usuwa wcześniejszych gotowych obrazów. „Usuń wyniki AI” usuwa obrazy i miniatury,
   bez szafy/sylwetki. Usunięcie lub wymiana wejściowego zdjęcia sylwetki/rzeczy usuwa zależne wizualizacje.
5. Kasacja konta obejmuje wszystkie jego prywatne dane; minimalne rozliczenie nie może utrzymywać zdjęć.
   Odmowa AI nie blokuje szafy/zestawów. Wynik może zmienić ubranie/sylwetkę i nie potwierdza rozmiaru.

Przed przyciskiem PL/EN: dokładne wejścia, odbiorca OpenAI, pseudonim, retencja, koszt także nieudanego wyniku
i granica gwarancji rezerwy. Pierwszy klik uczestnika wchodzi do limitu C2; operator nie generuje na jego zdjęciach.

## Retencja, odczyt i raport

| Dane | Zasada |
| --- | --- |
| Profil, szafa, aktualne zdjęcie sylwetki | Dotychczasowe zasady do usunięcia/wymiany/kasacji konta; bez rozszerzenia dostępu. |
| Kopie wejść AI | Pamięć serwera, bez dodatkowego archiwum; osierocone pliki techniczne: cel usunięcia ≤24 h. |
| Wynik i miniatura | 30 dni od zapisu albo wcześniejsze usunięcie; maks. 30 aktywnych wyników/100 MB AI w 250 MB konta wraz z rezerwami; PNG ≤8 MB, miniatura ≤100 000 B. |
| Zakończone zadanie | Minimalne rewizje/zgody, powiązania wejść, stan, usage, czasy i koszt przez 90 dni od zamknięcia; bez zdjęć i pełnych promptów. Aktualna zgoda przez czas obowiązywania. |
| Nierozstrzygnięty koszt/rezerwa | Do wyjaśnienia, również po 90 dniach; bez zdjęć, pełnych promptów i osobistych identyfikatorów po usunięciu konta. Nie zwalniać kwoty samym upływem czasu. |
| Liczniki i raport | Po kasacji konta odłączenie identyfikatorów, zachowanie zbiorczych kwot i zużytych slotów; brak ponownego dopuszczenia lub resetowania budżetu. |
| Logi aplikacyjne | ≤7 dni, bez zdjęć, tokenów, URL zdjęć, wymiarów i pełnych poleceń; logi dostawców mają odrębne zasady. |

Usunięcie/wygaśnięcie natychmiast blokuje nowe odczyty; fizyczne usunięcie aktywnych plików: cel ≤24 h
przy działającym cleanup. Awaria nie przywraca odczytu. Autoryzowany Edge/no-store obsługuje miniaturę
i pełny PNG; PNG tylko na żądanie, maks. dwa odczyty naraz. Brak miejsca nie usuwa cicho szafy.
Logout/zmiana konta anulują pobieranie i czyszczą kontrolowane kopie. Minimalny receipt UUID/caseId pozostaje
w osobnym scope projektu/konta, bez zdjęć/tokenów, do potwierdzenia trwałego slotu lub kasacji konta na urządzeniu.
Eksport obejmuje własne dostępne obrazy/metadane; pobranych kopii poza aplikacją nie usuniemy zdalnie.
Koniec C2 lub wycofanie zgody nie skracają retencji gotowych wyników. Wynik wysłany przed końcem trialu
może zostać zapisany w oknie pracy workera tylko przy nadal ważnej zgodzie, koncie i wejściach.
Publiczny raport zawiera agregaty kosztów, użyteczności i awarii: bez zdjęć, promptów, ścieżek, hashy
prywatnych materiałów, pseudonimów i identyfikatorów kont. Nowe zastosowania/dostawca wymagają osobnego zakresu.
