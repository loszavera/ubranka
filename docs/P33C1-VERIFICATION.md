# P3.3C1 — przygotowanie prywatnych wizualizacji

Data: 2026-10-26. Zakres zatwierdzony według [planu V1.8](IMPLEMENTATION-PLAN-V1.8.md).
Raport w trakcie domykania kontroli wdrożenia. C2 nie jest uruchomione.

## Zakres i granice

Większe miniatury, pełny podgląd na żądanie, przygotowanie konkretnych wejść,
wersjonowana zgoda, odrębny nieaktywny pilotaż C, kontrola limitów i usuwanie.
Testy używają fikcyjnych dorosłych i dwóch świeżych kont syntetycznych.
**Zero nowych wywołań AI i kosztu API, bez klucza AI w chmurze i nowych usług.**
Nie odczytywano zdjęć użytkowników w ramach kontroli. B pozostaje zamknięte;
sześć zużytych slotów i jego rozliczenie nie są budżetem C.

## Czytelność

Oryginały PNG 1024×1536 zachowują bajty i SHA-256. Miniatury mają limit
100 000 B. Skończony dobór: 600×900 JPEG q82, q65, następnie 450×675 q65;
awaryjnie mały PNG. Algorytm nie wywołuje AI. Szczegóły i licencje:
[kodek](P33C1-CODEC.md), [noty](../THIRD-PARTY-NOTICES.md).

| Zachowany wynik B | Stary PNG 120×180 (B) | Nowy JPEG 600×900 (B) |
| --- | ---: | ---: |
| B01 | 33 351 | 45 159 |
| B02 | 31 231 | 42 226 |
| B03 | 32 061 | 44 841 |
| B04 | 31 364 | 43 179 |
| B05 | 35 575 | 49 011 |
| B06 | 31 088 | 42 698 |

Wszystkie sześć uzyskało q82 w pierwszym kroku; łącznie 267 114 B.
Ocena wzrokowa porównań: czytelniejsze twarze, kontury i materiał, bez zmiany
kadru/kolorów. Publiczne porównanie `/p33c1/` korzysta wyłącznie z istniejących
obrazów syntetycznych. Jego duży podgląd to już publiczny WebP z galerii B.
Prywatny podgląd aplikacji pobiera autoryzowany oryginalny PNG; to osobna ścieżka.
Galeria `/p33b/`, jej manifesty i obrazy pozostają niezmienione.

Lokalne porównanie: 8 kombinacji PL/EN, 390/1440 px i DPR 1/2 PASS; bez
poziomego przewijania, z pełnym obrazem pobieranym dopiero po otwarciu.
Zrzuty i hashe: `artifacts/p33c1-gallery/`, `p33c1-gallery-local.json`.

## Kodek w rzeczywistym Edge

2026-10-26 09:52:07–09:52:25 UTC: dziewięć bezpłatnych wywołań samego
dekodera we Frankfurcie, bez jobów, Storage, klucza OpenAI i dostawcy AI.
Sześć zachowanych PNG B, szum RGBA oraz graniczny PNG 8 000 000 B i jego
odpowiednik JSON 10 666 814 B. **9/9 HTTP 200**, każda miniatura ≤100 kB.

Przetworzenie B: 180–245 ms. Szum: 471 ms i awaryjny PNG 56 320 B;
graniczny RGBA: JPEG 450×675, 97 864 B po trzech próbach. Parsowanie JSON
z kodekiem: 391 ms. Różnica round-trip obejmuje upload i sieć, nie jest czasem CPU.
W siedmiu zakończonych instancjach runtime CPU wynosiło 255–768 ms; wszystkie
zakończyły się `EarlyDrop`, bez błędu limitu CPU/pamięci. Pamięć raportowana przy
zamknięciu wynosiła 11,6–22,3 MB: **to nie pomiar szczytowego RAM**. Udane
przetworzenie obciążeń w Edge oraz lokalny benchmark nie gwarantują każdego
możliwego obrazu. Płatna integracja C nie była uruchamiana.

Przegląd wykrył i naprawił nadmierną paletę PLTE oraz kolorowe obwódki alpha w
awaryjnym PNG. Regresje odtworzono przed poprawką; po niej 8/8 testów kodeka PASS.
Źródła dowodów lokalnych: `artifacts/p33c1-edge-probes.json` oraz benchmark
w worktree kodeka. Limity i dekoder mają odmowę przed nadmierną alokacją;
błąd miniatury nie inicjuje ponownego żądania AI.

## Klient i kontrola danych

Historia ładuje widoczne miniatury, maksymalnie dwa odczyty naraz. Wyjście poza
widok zwalnia obraz; logout, zmiana konta i usunięcie anulują pobieranie.
„Powiększ” otwiera oryginał z zachowaniem proporcji; można pobrać PNG.
Nowy JPEG i starszy PNG mają jawny kontrakt MIME, wymiarów i rozmiaru.

Przygotowanie pokazuje zdjęcie sylwetki i 1–3 rzeczy z konkretnego zestawu.
Zgoda jest niezaznaczona, a wysłanie w C1 niedostępne. Receipt jest związany
z projektem, kontem, trialem i UUID; utrata odpowiedzi pozwala tylko odczytać
stan. Nie ma automatycznych ponowień. „Usuń wyniki AI” zachowuje szafę i sylwetkę.

Prywatne E2E: 31/31 PASS, w tym 7 scenariuszy C1 i 24 regresje; testy klienta
82/82 PASS. To kontrolowane odpowiedzi usług i dane syntetyczne, nie dowód
działania rzeczywistego OpenAI. PL 390 px oraz EN 320/390 px oceniono wzrokowo.

## Kontrole końcowe

Backend, migracja, współbieżne transakcje, rzeczywiste odczyty/eksport,
sprzątanie fixture, publikacja i CI: wyniki zostaną uzupełnione po zakończeniu.

## Ograniczenia i odbiór

Brak nowych generacji i przesyłania prywatnych zdjęć do AI. C1 nie dowodzi
jakości płatnej integracji C2 ani dopasowania rozmiaru. Nie wykonano testu na
fizycznym iOS/Android; eksport JS i emulacja DPR nie zastępują urządzenia.
Przed C2 konieczny jest test urządzeń rzeczywiście używanych przez uczestników.

Rekomendowany odbiór: sprawdzić porównanie miniatur na telefonie, przygotować
własny zapisany zestaw i obejrzeć ekran wejść przy wyłączonej generacji. Nie
trzeba przesyłać niczego do AI. Akceptacja C1 nie uruchamia C2; jego finansowanie,
klucz, daty i zgody wymagają osobnego zatwierdzenia.
