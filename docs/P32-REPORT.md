# P3.2 — wynik próby wizualizacji

Data: 2026-10-25, Europe/Warsaw. **Wykonano 12/12 wywołań, bez błędów i ponowień.
Koszt API: 0,432032 USD; rozliczenie budżetu z rezerwą: 2,92269648 PLN z 25 PLN.**
Próba i przegląd techniczny zakończone. Ocena Kasi i Aleksego jest oczekująca.
P3.3 nie rozpoczęto; aplikacja nie otrzymała funkcji płatnego generowania.

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
wymagają odbioru przykładów i osobnego zatwierdzenia zakresu.

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
Nie jest to koszt wyniku zaakceptowanego przez użytkowników — ich ocena jest
jeszcze przed nami. Limit wywołań został wyczerpany; pozostały budżet nie uruchamia
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
osoby ma ograniczoną moc. To ocena techniczna agentów, nie odbiór Kasi/Aleksego.

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
- Publikacja GitHub/Vercel i sprawdzenie publicznego adresu: w toku.

## Następny krok

Kasia i Aleksy porównują sześć par w galerii i wskazują, czy taka wierność
wystarcza do orientacyjnej oceny stylizacji. Po ich ocenie przygotować do
zatwierdzenia konkretny zakres P3.3 z zasadami danych AI i kontrolą kosztu.
Bez nowych płatnych prób ani wdrażania P3.3 w ramach tego raportu.
