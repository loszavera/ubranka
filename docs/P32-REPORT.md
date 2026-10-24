# P3.2 — wynik próby wizualizacji

Data: 2026-10-25, Europe/Warsaw. **Wykonano 12/12 wywołań, bez błędów i ponowień.
Koszt API: 0,432032 USD; rozliczenie budżetu z rezerwą: 2,92269648 PLN z 25 PLN.**
Próba i przegląd techniczny zakończone. **Aktualizacja 2026-10-25: Kasia i Aleksy
zaakceptowali wyniki z opisanymi ograniczeniami.** Odbiór dotyczy próby jako
całości, nie osobnych ocen wszystkich obrazów. Zlecono wyłącznie plan P3.3;
aplikacja nie otrzymała funkcji płatnego generowania.

[Galeria do sprawdzenia na telefonie](https://ubranka.vercel.app/p32/)
zawiera wszystkie wejścia i 12 wyników, z ocenami, kosztami i możliwością
otwarcia pełnego obrazu. Stan publikacji i testu hostingu podaje sekcja weryfikacji.

## Wniosek

**Wizualizacja jest wykonalna kosztowo w sprawdzonych warunkach, z ograniczeniami
wierności ubrań.** Dziesięć wyników spełniło przyjęty próg użyteczności technicznej.
Dwa eleganckie zestawy damskie odrzucono jako wierne odwzorowanie: oba modele
przeniosły zbyt szeroki krój spodni ze zdjęcia bazowego. W jednym męskim zestawie
Sunburst podwinął rękawy, choć zdjęcie referencyjne pokazywało pełną długość.

**Flare jest rekomendowanym kandydatem do dalszego projektu**: miał identyczny
koszt, krótszy średni czas i lepsze odtworzenie rękawów w jednym przypadku.
To wynik tej małej próby, nie ogólny ranking modeli. Wybór do aplikacji i P3.3
wymagają osobnego zatwierdzenia zakresu; odbiór próby został już zapisany.

## Co faktycznie wykonano

- Dwie fikcyjne dorosłe osoby bazowe, każda w wariancie codziennym, eleganckim
  i gościa weselnego. Istniejące ilustracje P2/P2.1; brak zdjęć użytkowników
  i materiałów sklepów. Nie płacono za dodatkowe przygotowanie wejść.
- Każdy przypadek wykonano raz na Sunburst i raz na Flare. Pierwsza para
  jednocześnie służyła kalibracji; nie było dwóch dodatkowych prób.
- Bezpośrednie Images API, snapshoty z 2026-09-08, dwa PNG 1024×1536 jako wejścia,
  jedno wyjście PNG 1024×1536, `medium`, nieprzezroczyste tło, standardowa
  moderacja, bez streamingu i częściowych obrazów. Te same prompty i wejścia
  w każdej parze; żadnego dostrajania po zobaczeniu wyników.
- Żądania sekwencyjne, zapis numeru/rezerwy przed wysłaniem, brak ponowień
  klienta HTTP. Każde zakończyło się HTTP 200 i kompletnym `usage`.
- Użytkownik po [preflight](P32-PREFLIGHT.md) wyraźnie polecił testować mimo
  braku wcześniejszej pełnej estymacji. Nie zwiększono limitów 12 wywołań / 25 PLN.
  Po pierwszych pomiarach rezerwę kolejnych prób oparto na dwukrotności
  największego zmierzonego kosztu danego modelu plus 0,02 USD.
- Sekret pozostał lokalnie pod DPAPI; użyty wyłącznie w pamięci procesu
  i nagłówku autoryzacji do OpenAI. Nie trafił do aplikacji, Git ani Vercel.
  Nie zmieniono ustawień rozliczeń, uprawnień ani abonamentów.

Reprodukowalny opis wejść i promptów: [cases.json](p32/cases.json).
Pomiary z hashami wejść/wyjść i tokenami: [measurements.json](p32/measurements.json).
Oceny: [assessment.json](p32/assessment.json). Publiczne pliki nie zawierają
sekretów, identyfikatorów kont ani szczegółów salda/finansowania. Oryginalne PNG
i pełny lokalny rejestr pozostają poza Git. Galeria używa bezstratnych WebP;
potwierdzono równość pikseli wszystkich 20 kopii względem źródeł.

## Koszt i czas

| Model | Udane wywołania | Koszt API | Średni czas | Użyteczne technicznie |
| --- | ---: | ---: | ---: | ---: |
| Sunburst | 6/6 | 0,216016 USD | 14,77 s | 5/6 |
| Flare | 6/6 | 0,216016 USD | 12,30 s | 5/6 |
| Razem | 12/12 | 0,432032 USD | 11,51–17,40 s na próbę | 10/12 |

Każde żądanie: 3072 tokeny obrazów wejściowych, 225–231 tekstu wejściowego
i 343 obrazu wyjściowego. Średni koszt około **0,036 USD na obraz**.
Rozliczenie opiera się na zwróconym `usage` i aktualnych stawkach: 5/8/30 USD
za milion tokenów tekstu wejściowego / obrazów wejściowych / wyjścia.
[Oficjalny opis kosztów](https://developers.openai.com/api/docs/guides/image-generation#cost-and-latency).

Na budżet zaliczono **2,92 PLN**, przy planistycznym 5 PLN/USD, rezerwie
podatkowej ×1,23 i dodatkowym buforze ×1,10. To konserwatywne przeliczenie,
nie potwierdzona kwota obciążenia karty ani wysokość rzeczywistego podatku.
Według kursu NBP z 23.10.2026 samo zużycie odpowiada około 1,70 PLN przed
podatkami i opłatami. Szczegóły oraz projekcje 60/75 wywołań:
[koszty V1.4](COST-PLAN-V1.4.md).

Koszt na technicznie użyteczny wynik, z uwzględnieniem dwóch odrzuconych:
0,432032 / 10 = **0,0432032 USD**, budżetowo około **0,29 PLN**.
Nie jest to koszt wyniku zaakceptowanego przez użytkowników — odbiór całej próby
nie określa liczby indywidualnie zaakceptowanych obrazów. Limit wywołań został
wyczerpany; pozostały budżet nie uruchamia
następnych prób. Panel rozliczeń może aktualizować dane z opóźnieniem; pomiar
tokenowy nie jest końcową fakturą ani potwierdzeniem operacji na karcie.

## Ocena jakości

Skala techniczna 0–2 za: zachowanie osoby/pozy, krój i kolory ubrań, kompletność,
widoczną anatomię/artefakty oraz użyteczność. Maks. 10; wynik użyteczny:
co najmniej 8 i brak błędu krytycznego. 10/10 oznacza brak zauważonego problemu
w tym obrazie, nie idealną reprodukcję produktu lub potwierdzenie dopasowania.

| Przypadek | Sunburst | Flare | Najważniejsza obserwacja |
| --- | ---: | ---: | --- |
| Kobieta, codzienny | 9/10 | 9/10 | Niewielka zmiana długości/szerokości jeansów; Flare bliższy długości referencji. |
| Mężczyzna, codzienny | 9/10 | 10/10 | Sunburst podwinął rękawy; Flare zachował pełną długość. |
| Kobieta, elegancki | 7/10, odrzucony | 7/10, odrzucony | Oba modele zachowały zbyt szerokie spodnie z pierwszego obrazu. |
| Mężczyzna, elegancki | 10/10 | 10/10 | Kompletne zestawy; drobne różnice faktury i fałd. |
| Kobieta, wesele | 8/10 | 8/10 | Nieco zmienione ustawienie stóp i długość sukienki; kompletny zestaw. |
| Mężczyzna, wesele | 10/10 | 10/10 | Kompletne zestawy; drobne różnice odcienia/faktury. |

Nie zaobserwowano rażących deformacji na widocznych fragmentach. Męskie dłonie
są w kieszeniach, więc ich anatomia praktycznie nie została przetestowana.
Użyto podobnych fikcyjnych twarzy i kontrolowanego studia; wynik oceny zachowania
osoby ma ograniczoną moc. Punktacja pochodzi od agentów; późniejszy odbiór
całej próby przez Kasię/Aleksego nie zmienia jej w indywidualne oceny użytkowników.

## Czego próba nie dowodzi

Nie testowano prawdziwych zdjęć, wielu sylwetek, zdjęć domowych, flat-lay,
zestawów z trzech osobnych fotografii rzeczy ani powtarzalności generacji.
Nie zmierzono kosztu rozpoznawania szafy i rekomendacji. Nie potwierdzono
całkowitego kosztu aplikacji 150 PLN/mies. ani 60 zaakceptowanych wyników.
Samo prywatne przechowywanie zdjęć w UE nie jest zgodą ani dowodem przetwarzania
AI w UE. Dane AI i wdrożenie w aplikacji należą do osobnego planu P3.3.

## Weryfikacja materiałów i publikacji

- PASS: 12 kompletnych odpowiedzi, 12 różnych hashy PNG, zgodność wymiarów,
  rachunku tokenów, sum kosztów i limitów; 20 bezstratnych kopii WebP.
- PASS: TypeScript i ESLint (`npm run check`), eksport WWW (`npm run build:web`).
  Brak zmian kodu aplikacji i jej zależności.
- PASS: galeria z danymi testowymi na 320/390/1024 px, obsługa klawiatury,
  wyboru przypadku i błędu pobrania. Z rzeczywistymi danymi sprawdzono lokalnie
  koszty, oceny, przełączanie i pełne obrazy; brak poziomego przewijania.
- PASS: publikacja `66e5e0590e4ba11d3ad97244dbfedda2b0490ad7` na dev/main,
  zgodne lokalne i zdalne gałęzie, bez przepisywania historii.
- PASS: Vercel Production `dpl_6VhgLoT8s9cNhvBEv6YvauhN1Xob`, stan READY;
  [galeria](https://ubranka.vercel.app/p32/) i jej JSON zwróciły HTTP 200.
  W przeglądarce potwierdzono 12 wyników / 6 przypadków, koszty, wybór W-ELEGANT,
  obie oceny 7/10 i opis błędu, załadowanie czterech obrazów 1024×1536,
  brak poziomego przewijania oraz działający powrót do ekranu aplikacji.
  Brak błędów aplikacji w konsoli; widoczne ostrzeżenia pochodziły z rozszerzenia
  przeglądarki. Nie jest to nowy test logowania ani fizycznego telefonu.
- Publiczny odczyt GitHub Actions nie pokazał uruchomienia dla tego commita.
  Nie przypisujemy mu sukcesu historycznego CI. Lokalne kontrole wymienione
  powyżej oraz build i test faktycznego wdrożenia przeszły.
- Końcowy commit dopisuje wyłącznie dowody publikacji w dokumentacji;
  obrazy, galeria i kod aplikacji pozostają identyczne z przetestowanym wdrożeniem.

## Następny krok

Po odbiorze P3.2 przygotowano [plan V1.6](IMPLEMENTATION-PLAN-V1.6.md),
[zasady danych AI](P33-AI-DATA-POLICY-V1.0.md) i [koszty V1.5](COST-PLAN-V1.5.md).
Rekomendowany do zatwierdzenia P3.3A buduje fundament z AI wyłączonym.
Nie uruchomiono nowych płatnych prób ani implementacji P3.3.
