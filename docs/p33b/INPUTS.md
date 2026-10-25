# P3.3B — syntetyczne wejścia i galeria

Przygotowano 2026-10-25 w zatwierdzonym zakresie V1.7. **Offline, bez nowych
generacji, API, kluczy i usług chmurowych.** Materiały pochodzą wyłącznie
z istniejących ilustracji fikcyjnych dorosłych w `assets/outfits/`.
Ich pierwotne pochodzenie opisują [P2](../design/P2-ASSETS.md)
i [P2.1](../design/P21-ASSETS.md). To nie są zdjęcia użytkowników lub sklepów.

## Rejestr przypadków

| ID | Osoba (ten sam JPEG w danej grupie) | Osobne referencje | Ograniczenie |
| --- | --- | --- | --- |
| B01 | w3 | Sweter, szerokie spodnie, sneakersy z w1 | Pas i góra butów częściowo zasłonięte |
| B02 | m3 | Sweter, chinosy, sneakersy z m1 | Pas zasłonięty swetrem, części kieszeni dłoniami |
| B03 | w3 | Przód koszuli, spodnie, mokasyny z w4 | Rękawy/ramiona koszuli i część pasa ukryte; ocena widocznego kroju nogawek |
| B04 | m3 | Przód koszuli, spodnie, derby z m4 | Rękawy/ramiona koszuli i część pasa ukryte |
| B05 | w3 | Sukienka midi i czółenka z w5 | Fragmenty stóp przy butach; małe części sukienki zasłonięte rękami |
| B06 | m3 | Przód koszuli z krawatem, spodnie, półbuty z m5 | Bez marynarki; ograniczenia koszuli/pasa jak wyżej |

B01/B03/B05 mają identyczny hash zdjęcia osoby. B02/B04/B06 również.
Każdemu dedykowanemu kontu można przypisać jeden aktywny profil sylwetki
bez wymiany obrazu między przypadkami. Obrazy ubraniowe nie zawierają całej
postaci ani kompletnego zestawu; każdy przedstawia tylko deklarowaną rzecz.
W B06 koszula z krawatem to jawnie jedna referencja góry, zgodna z pozycją
katalogu. Ten przypadek **nie testuje pełnego garnituru**. Marynarka nie jest
ukrytą czwartą warstwą w B03/B04/B06. Ubrania osoby w obrazie 1 mają zostać
w całości zastąpione, w tym kardigan w3 i oliwkowa koszula wierzchnia m3.

## Co zrobiono z obrazami

Przed obróbką obejrzano osiem źródeł: w1, w3, w4, w5, m1, m3, m4, m5.
Następnie obejrzano wszystkie 23 wejścia na sześciu arkuszach kontrolnych.
Ręcznie wskazane wielokąty zatrzymują widoczne piksele rzeczy. Resztę zastępuje
neutralny krem `RGB(248,245,239)`. Następuje kadrowanie i margines 24 px;
nie ma rozciągania, generowania brakujących rękawów, inpaintingu ani retuszu AI.
Zdjęcia osoby pozostają pełnym kadrem 1024 × 1536.

Wycinki nie są niezależnymi zdjęciami produktów ani flat-lay. Pozostały fragmenty
skóry, dłoni, włosów przy dekolcie, tła i wąskie krawędzie sąsiadujących ubrań.
Maski mają uproszczone, miejscami kanciaste granice. Obrys szczególnie przy
koszulach i pasach spodni nie oznacza rzeczywistego kroju. Zasłonięte partie
pozostają nieznane, a prompt jawnie pozwala wyłącznie na minimalne uzupełnienie
konieczne do ubrania postaci; ich wierności nie da się sprawdzić w tej próbie.
Podobne twarze i sylwetki w syntetycznej bazie ograniczają ocenę zachowania osoby.

Wszystkie końcowe wejścia są RGB JPEG, jakość 90, bez EXIF/ICC/XMP,
bez przezroczystości, każde ≤1 000 000 B i ≤1024 × 1536 px. Obecnie największy
plik ma 219 189 B, najdłuższy prompt 1539 znaków. 23 pliki to sześć wejść osoby
(dwie unikalne treści) i 17 wycinków ubraniowych. Rejestruje się hashe dokładnych
JPEG po obróbce, nie PNG źródłowych. Źródła mają odrębne hashe w provenance.

## Powtarzalność i zamrożenie

Źródło transformacji: [prepare-p33b-inputs.py](../../scripts/prepare-p33b-inputs.py).
Wymaga Python z Pillow **12.3.0**, kodek JPEG **8.0** (wykorzystano środowisko
Codex; nie dodano zależności aplikacji ani nie zmieniono lockfile).

```text
python scripts/prepare-p33b-inputs.py --write
python scripts/prepare-p33b-inputs.py --check
```

`--write` tworzy JPEG oraz dwa identyczne manifesty; nie wysyła danych,
nie wywołuje AI i nie modyfikuje wyników. Odmawia, gdy `summary.json` zapisuje
jakiekolwiek wykonanie lub stan inny niż pending. Po rejestracji wejść w bazie
należy używać tylko `--check`; nie regenerować plików między próbami.
`--check` ponownie oblicza wszystko w pamięci i porównuje każdy bajt z zapisem,
bez zmian plików. Inna wersja kodera zatrzymuje odtwarzanie.

[Manifest](cases.json) i [jego kopia publiczna](../../public/p33b/cases.json)
zawierają kolejność B01–B06, kolejność wejść 1–4 (B05: 1–3), dokładne prompty,
SHA-256 promptu UTF-8 i plików, rozmiary, kategorie, opisy ograniczeń,
źródłowe hashe oraz współrzędne masek. Parametry są stałe:
`gpt-image-2.5-flare-2026-09-08`, `n=1`, medium, 1024x1536, PNG,
opaque, moderation auto. Nie ma `input_fidelity`, streamingu ani dodatkowego
modelu tekstowego. Prompty zapisano przed obejrzeniem jakiegokolwiek wyniku B.

## Galeria i dalsza integracja

`public/p33b/index.html` pokazuje dokładne JPEG wejściowe, ograniczenia,
prompt oraz oczekujące miejsce na wynik. Nie pobiera niczego z API dostawcy.
`public/p33b/summary.json` jest **osobnym rejestrem rzeczywistych wyników**;
manifest wejść pozostaje zamrożony. Obecnie sześć pending, result i ocena null.

Po rzeczywistym pomiarze integrator aktualizuje tytuł/notatkę, `calls`
i wpis danego przypadku w summary. Dopuszczone stany galerii:
`pending`, `sent`, `succeeded`, `failed`, `unknown`, `skipped`.
Wynik jest wyświetlany tylko przy `succeeded`, `result.publicPath` w
`p33b/results/*.png|jpg|webp` oraz 64-znakowym `result.sha256`.
To hash pliku udostępnionego w galerii; jeśli powstanie kopia WebP,
zachować osobno oryginalny SHA PNG w raporcie. Galeria nie weryfikuje
kryptograficznie pliku w przeglądarce — kontrolę bajtów wykonuje integrator.
Ocena to `qualityAssessment: {total, passed, notes}` i musi pochodzić z oględzin
rzeczywistego wyjścia. Brak lub błąd nie znika z listy sześciu przypadków.
Opcjonalne `note` wyjaśnia stan nieudany/nieznany bez ujawniania danych kont.

Przygotowanie tych plików nie dowodzi działania Supabase/OpenAI ani nie
uruchamia próby. Rejestracja rekordów i wersji, limity, finansowanie,
obsługa błędów, dostęp, pomiar i sprzątanie należą do integracji P3.3B.
Nie zapisano tutaj kont, sekretów, salda ani prywatnych zdjęć.

## Weryfikacja przygotowania

- Powtórne `--check`: PASS, wszystkie wygenerowane bajty identyczne.
- Niezależna kontrola sześciu przypadków i 23 JPEG: hashe, kolejność,
  wymiary, rozmiary, RGB, brak EXIF/ICC/XMP oraz dwa wspólne obrazy osoby PASS.
- Lokalny Edge/Playwright: 52 kontrole dla sześciu przypadków przy szerokościach
  390 i 1440 px PASS. Wszystkie wejścia dekodują się; brak błędów JavaScript,
  poziomego przepełnienia i pozornych wyników/ocen. Obejrzano oba zrzuty galerii.
- Manifest SHA-256:
  `0f22b8ec146d4333b5682e2e5f13018a7a6d808ceeb63493d201a27ce36306f9`.
- Nie jest to test aplikacji natywnej, wdrożenia hostingu ani usług AI.
