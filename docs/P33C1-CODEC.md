# P3.3C1 — ostrzejsze miniatury, pomiar lokalny

Data: 2026-10-26. Zakres: zatwierdzone C1, bez nowej generacji i bez zdjęć użytkowników.
Wynik lokalny: sześć syntetycznych oryginałów B daje czytelny JPEG 600×900,
42–49 kB. Pełne PNG zachowują dokładnie wejściowe bajty. Ten raport nie zastępuje
pomiaru Edge ani odbioru Kasi i Aleksego.

## Kontrakt i ograniczenia

- Walidacja oryginału pozostaje: PNG RGB/RGBA8, 1024×1536, maks. 8 000 000 B,
  CRC, bez przeplotu/APNG, ograniczenie rozpakowanego strumienia i metadanych.
  Opcjonalne PLTE: tylko jedno przed IDAT, 3–768 B, długość podzielna przez 3.
  Kontrola poprzedza alokowanie tablic palety przez bibliotekę.
- Maksymalnie trzy próby JPEG: 600×900 q82, 600×900 q65, 450×675 q65. Przy każdym
  powodzeniu limit 100 000 B. Druga próba używa tych samych przeskalowanych pikseli.
- Przeskalowanie obszarowe uwzględnia częściowe piksele brzegowe. Przezroczystość
  JPEG jest składana na białym tle przed uśrednianiem. Nie powstaje powiększenie AI.
- Awaria kodera, błędne bajty JPEG lub przekroczenie limitu we wszystkich próbach
  uruchamia miniaturę PNG 120×180 ≤100 000 B. Poprawny oryginał nadal jest zwracany;
  nie ma ponownego żądania do dostawcy AI. PNG zachowuje kanał alpha; RGB jest
  filtrowane z wagą alpha i odtwarzane po skalowaniu. Ukryte kolory całkowicie
  przezroczystych pikseli nie tworzą obwódek, a całkowicie przezroczysty wynik ma RGB=0.
- Wynik zawiera `thumbnailMimeType`, `thumbnailWidth`, `thumbnailHeight` oraz
  `main`, `thumbnail`, `width`, `height`. Worker mapuje pola na `thumbMimeType`,
  `thumbWidth`, `thumbHeight` w danych klienta; obsługa dawnych PNG należy do workera.
- Metryki: czas dekodowania, skalowania, JPEG i fallbacku, liczba prób, wybrana
  jakość, `thumbnailFallback` i powód (`jpeg_error` / `jpeg_byte_limit`), bajty,
  MIME i wymiary. Błędy kodera nie trafiają do logów jako surowe komunikaty.
- Nowa zależność: `jpeg-js@0.4.4`, bez zależności przechodnich, dokładny integrity
  w `supabase/functions/deno.lock`. Produkcja importuje tylko `lib/encoder.js`.
  Licencje pakietu i kodera są w `THIRD-PARTY-NOTICES.md`. Nie dodano zależności
  aplikacji, kodu natywnego, Sharp/libvips ani procesu zewnętrznego w Edge.

## Dowód lokalny

`deno 2.9.6`, Windows x64. Każdy obraz mierzony w osobnym procesie: pierwsze
wywołanie i dwa kolejne; podane maksima spośród trzech. SHA-256 sześciu wejść jest
sprawdzany względem `docs/p33b/results.json`. Benchmark działa bez uprawnienia
sieciowego i nie czyta katalogów sekretów. Sztuczny szum to deterministyczne,
nieprzezroczyste RGBA 1024×1536.

| Wejście | Miniatura | B | Próby / fallback | CPU maks. ms | Czas maks. ms | RSS procesu maks. MiB |
|---|---|---:|---|---:|---:|---:|
| B01 | JPEG 600×900 q82 | 45 159 | 1 / nie | 547 | 366 | 179,7 |
| B02 | JPEG 600×900 q82 | 42 226 | 1 / nie | 485 | 385 | 182,6 |
| B03 | JPEG 600×900 q82 | 44 841 | 1 / nie | 547 | 346 | 188,6 |
| B04 | JPEG 600×900 q82 | 43 179 | 1 / nie | 639 | 408 | 189,2 |
| B05 | JPEG 600×900 q82 | 49 011 | 1 / nie | 610 | 372 | 190,0 |
| B06 | JPEG 600×900 q82 | 42 698 | 1 / nie | 562 | 351 | 189,1 |
| Szum opaque | PNG 120×180 | 56 320 | 3 / tak | 1 406 | 958 | 237,1 |

`process.cpuUsage()` mierzy CPU procesu, również pracę GC, więc może przekraczać
czas ścienny. RSS obejmuje cały lokalny Deno, moduły i trzy wywołania bez wymuszania
GC; nie jest pomiarem pamięci izolatu Supabase. Zwykłe wejścia miały po pierwszym
wywołaniu ok. 99–103 MiB RSS, szum ok. 186 MiB. Margines dla najgorszego wejścia
wymaga potwierdzenia w rzeczywistym workerze, wraz z parsowaniem JSON/base64.
[Limity Supabase Edge](https://supabase.com/docs/guides/functions/limits) to
2 s CPU i 256 MB; lokalny wynik nie dowodzi spełnienia ich w chmurze.

Testy kodeka po przeglądzie: **8/8 PASS**. Obejmują RGB/RGBA, białe tło przezroczystych pikseli,
dekodowanie wynikowego JPEG, tożsamość oryginału, ograniczenia bajtów, adaptację,
wymuszoną awarię/niepoprawny wynik/przekroczenie limitu kodera, błędny CRC,
wymiary, ucięcie, dodatkowe bajty, nadmiarową dekompresję i niedozwolone chunki.
Przegląd wykrył dwie luki: nieograniczoną długość PLTE i uśrednianie ukrytego RGB
w PNG fallback. Obie najpierw odtworzono testami, następnie poprawiono: test
odrzuca również PLTE 3 MB, nieprawidłową długość/kolejność i duplikat, zachowuje
legalne 1–256 wpisów; mieszanina czerni opaque i czerwieni transparent pozostaje
czarna z częściową alpha, bez czerwonej obwódki. Powyższy benchmark jest pomiarem
pierwotnej implementacji; odrębny ponowny pomiar zapisano w `artifacts/p33c1-codec-review/`.
W ponownym pomiarze SHA-256 wszystkich siedmiu miniaturek pozostają identyczne
(sześć B i szum opaque). Maks. CPU: 516 ms dla B, 1296 ms dla szumu; maks. RSS
procesu: odpowiednio 193,3 i 241,4 MiB. Ograniczenie dowodu lokalnego pozostaje.
Sprawdzenie typów trzech funkcji Edge i benchmarku: **PASS**.
Pillow niezależnie dekoduje sześć JPEG, stare miniatury i wejścia, weryfikuje
hashe i wymiary przed złożeniem plansz.

Ogląd obu plansz przez Codex: przy szerokości 300 px JPEG wyraźnie poprawia
twarze, krawędzie nogawek, kołnierze, fałdy i fakturę względem PNG 120×180.
Nie zauważono istotnej zmiany koloru lub kadru; JPEG jest stratny i nie zastępuje
pełnego PNG do oglądania detali. To sześć zdjęć syntetycznych w podobnych warunkach,
nie dowód jakości dowolnego zdjęcia. Weryfikacja fizycznego iOS/Android i odbiór
przez użytkowników nie zostały wykonane w tym zadaniu.

## Odtwarzanie i artefakty

Z checkoutu zawierającego implementację, z dostępem do lokalnych oryginałów B:

```powershell
npx --yes deno@2.9.6 test --config supabase/functions/deno.json supabase/tests/png-codec.deno.ts
npx --yes deno@2.9.6 run --allow-read --allow-write --allow-run --config supabase/functions/deno.json supabase/tests/png-codec-benchmark.deno.ts --sources-root E:/Alek/Projects/Programming/AI/Ubranka --output artifacts/p33c1-codec
python supabase/tests/png-codec-contact-sheet.py --sources-root E:/Alek/Projects/Programming/AI/Ubranka --artifacts artifacts/p33c1-codec
```

Ostatnia komenda wymaga Pillow. Pomiar nie obejmuje utworzenia szumu, zapisów
plików i przygotowania starych miniaturek do porównania. Powtórne wywołanie skryptu
zastępuje jego własne pliki wyjściowe; dla kolejnego pomiaru można podać inny output.

Ignorowany katalog `artifacts/p33c1-codec/` w worktree pomiaru zawiera:
`benchmark.json` (wszystkie próbki, hashe finalnych bajtów i rzeczywiste MIME/wymiary),
`B01-thumb.jpg`…`B06-thumb.jpg`, `B01-old120.png`…`B06-old120.png`,
`entropy-source.png`, `entropy-thumb.png`, `entropy-old120.png` oraz
`contact-sheet-1.jpg`, `contact-sheet-2.jpg`.
Artefakty do galerii root pobiera z tego katalogu; istniejące `public/p33b/`
i oryginalne PNG nie zostały zmienione. Ten lokalny pomiar obejmował **0 wywołań AI**,
**0 operacji chmurowych** i **0 wdrożeń**. Późniejsze bezpłatne pomiary rzeczywistego
Edge oraz publikację C1 opisuje [raport integracyjny](P33C1-VERIFICATION.md).
