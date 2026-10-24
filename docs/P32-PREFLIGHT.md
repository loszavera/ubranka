# P3.2 — przygotowanie próby i wynik kontroli przed wywołaniem

Data: 2026-10-25, Europe/Warsaw. **Historyczny wynik preflight** — stan przed
późniejszą decyzją użytkownika. Próba zatwierdzona; płatna część zatrzymana
przed pierwszym żądaniem. 0/12 płatnych wywołań, 0 USD / 0 PLN kosztu próby.
Na tym etapie nie powstały nowe wizualizacje ani wyniki oceny jakości.

**Późniejsza decyzja użytkownika:** „nieważne jaki jest szacunek. po prostu testuj
I zobaczymy”. Rozwiązuje warunek estymacji pierwszej próby: rozpoczynamy pomiar,
zachowując 12 wywołań / 25 PLN, brak automatycznych ponowień i kontrolę kosztów
po każdym żądaniu. Nie pytamy ponownie o ten wyjątek. Bieżący wynik w statusie;
poniżej zachowano dowód przygotowania i przyczynę wcześniejszego zatrzymania.

## Zgoda i wykonane przygotowanie

Użytkownik zatwierdził porównanie na syntetycznych obrazach fikcyjnych dorosłych,
maksymalnie 12 płatnych wywołań oraz 25 PLN łącznie, wliczając przygotowanie,
kalibrację i nieudane próby. Bez automatycznych ponowień, zmian rozliczeń
i abonamentów; po raporcie zatrzymanie przed P3.3. Sposób sfinansowania próby
zatwierdzono osobno; szczegóły konta pozostają prywatne.

- Lokalny, zaszyfrowany klucz poprawnie uwierzytelnił bezpłatny `GET /v1/models`.
  Lista zawiera Sunburst i Flare oraz ich snapshoty `2026-09-08`.
  To nie jest dowód pomyślnego wywołania Images API ani jego jakości.
- W panelu potwierdzono aktywny dostęp i konfigurację limitu projektu.
  Nie zmieniono ustawień ani uprawnień. Nie zamawiano kredytów ręcznie.
- Obejrzano osiem istniejących plików P2/P2.1. Wszystkie przedstawiają fikcyjnych
  dorosłych, mają 1024×1536 px; nie są zdjęciami użytkowników ani sklepów.
- Przygotowano [manifest przypadków i dokładnych promptów](p32/cases.json):
  sześć przypadków, dwie identyczne konfiguracje per przypadek, ścieżki, role,
  rozmiary i SHA-256 wejść. Pierwsza para jednocześnie służy kalibracji.
- Przygotowanie nie wymagało nowej generacji, instalacji zależności ani zmiany
  aplikacji. Zdjęcia nie zostały wysłane do API; nie wywołano endpointu obrazów.

## Macierz do wykonania

| Przypadek | Osoba — obraz 1 | Ubrania — obraz 2 | Modele |
| --- | --- | --- | --- |
| Kobieta, codzienny; również kalibracja | [w1](../assets/outfits/w1.png) | [w3](../assets/outfits/w3.png) | Sunburst / Flare |
| Mężczyzna, codzienny | [m1](../assets/outfits/m1.png) | [m3](../assets/outfits/m3.png) | Sunburst / Flare |
| Kobieta, elegancki | w1 | [w4](../assets/outfits/w4.png) | Sunburst / Flare |
| Mężczyzna, elegancki | m1 | [m4](../assets/outfits/m4.png) | Sunburst / Flare |
| Kobieta, wesele jako gość | w1 | [w5](../assets/outfits/w5.png) | Sunburst / Flare |
| Mężczyzna, wesele jako gość | m1 | [m5](../assets/outfits/m5.png) | Sunburst / Flare |

Bezpośrednie `POST /v1/images/edits`, `n=1`, `quality=medium`,
`size=1024x1536`, PNG, nieprzezroczyste tło, domyślna moderacja, bez streamingu
i obrazów częściowych. Snapshoty modeli są wskazane w manifeście.
Prompt nakazuje zachować osobę, pozę i tło obrazu 1 oraz przenieść wyłącznie
pełny zestaw z obrazu 2. Nie dostrajamy promptu między modelami w tej samej parze.

Źródło wejść: [P2](design/P2-ASSETS.md), [P2.1](design/P21-ASSETS.md).
Zestaw jest fotografią ilustracyjną na drugiej fikcyjnej osobie, a nie trzema
osobnymi zdjęciami produktów. Podobieństwo twarzy, sylwetek i studyjnych ujęć
ogranicza siłę ewentualnego wniosku o zachowaniu osoby. Ta mała próba nie sprawdzi
różnych sylwetek, zdjęć domowych, flat-lay, powtarzalności ani dopasowania rozmiaru.

## Dlaczego zatrzymano płatną część

[Plan kosztowy V1.3](COST-PLAN-V1.3.md) wymaga: „Brak wiarygodnej górnej estymacji
wymaga zatrzymania próby, nie zgadywania”. Nie chodzi o matematyczną gwarancję
co do grosza; potrzebna jest uzasadniona estymacja wszystkich składników.

Aktualnie potwierdzono stawki standardowego Images API za milion tokenów:
tekst wejściowy 5 USD, obrazy wejściowe 8 USD, obraz wyjściowy 30 USD.
Bezpośrednie edycje nie korzystają z rabatu cache. Interaktywny kalkulator
OpenAI dla GPT Image 2.5, medium, 1024×1536 wskazał **343 tokeny wyjścia,
0,01029 USD wyłącznie za wyjście**. Wyraźnie wyklucza tekst i obrazy wejściowe;
nie wolno przedstawiać tej liczby jako ceny całej wizualizacji.

Nie znaleziono aktualnego, właściwego dla modeli 2.5 wzoru lub limitu tokenów
obrazów wejściowych pozwalającego wyznaczyć pełną rezerwę przed pierwszą edycją.
Kalkulator vision nie obejmuje generowania/edycji GPT Image. Historyczne wzory
oraz 10 000 tokenów z wcześniejszego przykładu kosztów nie są potwierdzonym
ograniczeniem dla tej próby. Endpoint edycji nie udostępnia `max_output_tokens`.
Miesięczny limit projektu ma możliwe opóźnienie egzekwowania i nie zastępuje
kontroli kosztu pojedynczego żądania.

Źródła sprawdzone 2026-10-25:
[rozliczanie obrazów i kalkulator](https://developers.openai.com/api/docs/guides/image-generation#cost-and-latency),
[zakres kalkulatora vision](https://developers.openai.com/api/docs/guides/images-vision#calculating-costs),
[parametry edycji](https://developers.openai.com/api/reference/resources/images/methods/edit),
[limity wydatków](https://developers.openai.com/api/docs/guides/spend-limits),
[Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst),
[Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare).

## Rejestr i zasady dalszego pomiaru

Aktualny rejestr: 0 wysłanych płatnych żądań, 0 nieudanych płatnych prób,
0 obrazów wynikowych, 0 USD kosztu. Bezpłatny odczyt listy modeli nie jest
próbą generacji. Nie wpisujemy fikcyjnych tokenów, opóźnień ani ocen jakości.

Po usunięciu przeszkody każde żądanie musi mieć: kolejny numer, identyfikator
przypadku, hash promptu i wejść, model/parametry, czas rozpoczęcia, rezerwę,
request ID, status, czas odpowiedzi, rzeczywiste `usage` i koszt. Najpierw
trwały zapis rezerwy/licznika, potem pojedynczy request. Niepewna odpowiedź
zachowuje rezerwę i zatrzymuje wykonanie; nie jest automatycznie ponawiana.

Koszt USD: `(text_tokens × 5 + image_input_tokens × 8 + image_output_tokens × 30)
/ 1 000 000`. Brak lub niespójne `usage` oznacza nieznany koszt, a nie zero.
Oprócz kosztu API raport obejmie założenia przewalutowania, podatków i bufora.
NBP z 23.10.2026 podaje 3,9247 PLN/USD; kurs banku może być inny.
Planistyczne 5 PLN/USD z V1.3 pozostaje jawnym założeniem, nie notowaniem ani
automatycznym dowodem pokrycia wszystkich opłat.
[NBP, tabela 207/A/NBP/2026](https://nbp.pl/statystyka-i-sprawozdawczosc/kursy/tabela-a/).

Ocena techniczna po generacji: 0–2 za zachowanie osoby, krój/kolory rzeczy,
kompletność, brak artefaktów i użyteczność. Podmiana osoby, brak rzeczy,
istotnie zmieniony krój/kolor lub zdeformowana anatomia są błędami krytycznymi.
Koszt przydatnego wyniku musi uwzględniać także odrzucone i płatne nieudane próby.
Ocena Kasi i Aleksego pozostaje odrębna od oceny technicznej.

## Historyczna decyzja potrzebna do wznowienia — rozstrzygnięta

Zgoda na P3.2 nadal obowiązuje. Brakuje podstawy pełnej estymacji przed pierwszym
wywołaniem. Można ją uzyskać od dostawcy albo osobno zaakceptować wąski wyjątek
dla pojedynczej kalibracji o koszcie znanym dopiero po odpowiedzi. Wyjątek nie
był wtedy udzielony. Późniejsza bezpośrednia decyzja użytkownika opisana na początku
tego pliku pozwoliła rozpocząć pomiar. Nie jest gwarancją kosztu pojedynczego
żądania. Nie rozpoczynamy P3.3 ani wysyłania prawdziwych zdjęć.
