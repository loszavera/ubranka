# Wymagania aplikacji Ubranka — V1.0

Data: 2026-10-24. Status: ogólna baza wymagań do doprecyzowania z Aleksym i Kasią.
Źródło: opis projektu i podsumowanie spotkania przekazane przez Aleksego w czacie.
Znaczniki czasu poniżej pochodzą z tego podsumowania; nie oznaczają niezależnej weryfikacji nagrania.

## Cel produktu

Wirtualny stylista ma ograniczyć wysiłek związany z wyborem ubrań. Użytkownik określa potrzeby,
a aplikacja podsuwa małą liczbę trafnych propozycji, pomaga podejmować szybkie decyzje i układa zestawy.
Docelowo obsługuje ubrania do kupienia, ubrania kupione oraz rzeczy już posiadane, dodane m.in. ze zdjęć.

## Potwierdzone potrzeby

„Potwierdzone” oznacza obecne w opisie pomysłu, a nie wdrożone ani doprecyzowane do wykonania.

| ID | Wymaganie | Źródło |
| --- | --- | --- |
| R-01 | Aplikacja działa na iOS, Androidzie oraz przez stronę WWW, wygodną również na telefonie. | Opis projektu |
| R-02 | Interfejs jest przyjemny wizualnie i ogranicza liczbę decyzji oraz przeglądania. | Opis; 03:01, 07:01 |
| R-03 | Wywiad zbiera preferencje, potrzeby i wytyczne do doboru ubrań. | 01:03, 04:08, 06:30 |
| R-04 | Profilowanie uwzględnia parametry sylwetki i możliwość dostarczenia zdjęć. Obowiązkowość i zakres danych pozostają otwarte. | 02:34 |
| R-05 | Użytkownik może mieć kilka profili stylu, np. elegancki i sportowy, przełączać je oraz edytować. | 07:52, 08:54 |
| R-06 | Użytkownik określa budżet i preferencje cenowe. | 09:08 |
| R-07 | W pojedynczej rundzie aplikacja pokazuje dwie propozycje ubrań, bez rozbudowanej listy alternatyw. | 06:52, 10:55 |
| R-08 | Ocena jest szybka: tak/nie, inspirowana sposobem wyboru w Tinderze; gest nie musi być jedynym sposobem obsługi. | 04:08, 10:28 |
| R-09 | Propozycje mogą obejmować wariant budżetowy i markowy; dokładny sposób porównania wymaga ustalenia. | 09:39 |
| R-10 | Użytkownik może przekazać opinię, w tym powód odrzucenia; kolejne rekomendacje uwzględniają te sygnały. | 11:35 |
| R-11 | Stylista znajduje nowe ubrania do kupienia zgodnie z wytycznymi użytkownika. | Opis projektu |
| R-12 | Użytkownik może prowadzić wirtualną szafę rzeczy kupionych i już posiadanych, również na podstawie zdjęć. | Opis projektu |
| R-13 | Aplikacja dobiera gotowe zestawy z rzeczy do kupienia, z posiadanych lub z ich połączenia. | Opis projektu |
| R-14 | Docelowy pomysł obejmuje samodzielne kupowanie ubrań przez aplikację oraz podpięcie metody płatności. Zakres automatyzacji wymaga dalszych ustaleń. | 11:53, 11:56 |
| R-15 | Użytkownik zachowuje kontrolę nad wydatkami i płatnościami; rozwiązanie ma odpowiadać na obawy o bezpieczeństwo. | 12:08 |
| R-16 | Postępy da się testować na bieżąco, także z telefonu poza domową siecią. | Opis organizacji projektu |

## Proponowane etapy produktu

Poniższy podział jest propozycją realizacji, a nie zmianą powyższych potrzeb.

- Fundament: repozytorium, dokumentacja, środowisko, uruchamialny ekran techniczny i kontrola jakości.
- Prototyp: wywiad, profile, budżet, dwie demonstracyjne propozycje oraz tak/nie i informacja zwrotna.
- Wirtualna szafa: zapis danych, zdjęcia posiadanych rzeczy i edycja garderoby.
- Rekomendacje: rzeczywisty katalog produktów, dostępność, dopasowanie i zestawy nowych/posiadanych ubrań.
- Zakupy: najpierw ustalenie obsługi sklepów i kontroli wydatków; następnie uzgodniona automatyzacja.

Obecny zakres pracy obejmuje wyłącznie fundament. Ekran startowy i dane demonstracyjne nie są dowodem
działania stylisty, rekomendacji, rozpoznawania zdjęć ani zakupów. Wywiad doprecyzowujący nastąpi w kolejnym kroku.

## Wymagania jakościowe — propozycja do uszczegółowienia

| ID | Cel |
| --- | --- |
| Q-01 | Wspólne zachowanie głównych przepływów na WWW, iOS i Androidzie; każda platforma wymaga własnej weryfikacji. |
| Q-02 | Czytelny kontrast i tekst, wygodne cele dotykowe, obsługa decyzji także przyciskami i dostępna nawigacja. |
| Q-03 | Widoczne stany ładowania, pustych wyników, błędów i braku sieci; bez udawania udanych operacji. |
| Q-04 | Dane sylwetki i zdjęcia są prywatne; zasady dostępu, przechowywania i usuwania ustalamy przed realnym uploadem. |
| Q-05 | Sekrety i klucze usług pozostają po stronie serwera; nie trafiają do repozytorium ani aplikacji klienckiej. |
| Q-06 | Ceny, dostępność i linki produktów mają identyfikowalne źródło i moment pobrania. |
| Q-07 | Mechanizm zakupów wymaga uzgodnionych limitów, historii operacji i sposobu wyłączenia; dane karty obsługuje właściwy operator płatności. |
| Q-08 | Zmiany są odtwarzalne z repozytorium i lockfile; dokumentacja rozróżnia działające funkcje, mocki i plan. |

## Otwarte decyzje na następny etap

- Grupa odbiorców, rynek, języki, rozmiarówka i sklepy źródłowe.
- Zakres pierwszej wersji produktu i kolejność funkcji wykraczających poza fundament.
- Szczegóły wywiadu, zdjęć sylwetki, parametrów i zgód; tryb bez zdjęć.
- Znaczenie budżetu: rzecz, zestaw, okres; relacja ceny do marki i jakości.
- Sposób prezentacji dwóch propozycji, częstotliwość rund i reakcja na odrzucenie obu.
- Kryteria dobrego dopasowania i sposób uczenia się na opiniach.
- Model kont, synchronizacji, współdzielenia i retencji danych.
- Dostawcy katalogu, backendu, rozpoznawania obrazów i rekomendacji AI oraz budżet usług.
- Granice automatycznych zakupów, potwierdzenia, limity, zwroty i obsługa nieudanych płatności.
- Docelowa identyfikacja wizualna oraz dystrybucja w sklepach mobilnych.

Nie podejmujemy tych decyzji przez sam wybór stosu technicznego.

## Sposób sprawdzania wymagań

Każda późniejsza funkcja powinna wskazywać odpowiednie ID wymagań, scenariusz sprawdzenia i rzeczywisty wynik.
Podstawowe scenariusze docelowe to: edycja/przełączenie profilu, runda dwóch propozycji, odrzucenie obu,
opinia o odrzuceniu, dodanie rzeczy do szafy i zestaw łączący własną rzecz z propozycją zakupu.
Zakupy wymagają osobnych testów w środowisku testowym operatora przed użyciem realnych płatności.

## Historia wersji

| Wersja | Data | Zmiana |
| --- | --- | --- |
| V1.0 | 2026-10-24 | Pierwsza ogólna baza na podstawie opisu i podsumowania spotkania. |

Po zakończeniu inicjalizacji V1.0 zachowujemy jako bazę. Istotne zmiany zapisujemy w nowym pliku,
np. `REQUIREMENTS-V1.1.md`, z historią zmian oraz aktualizacją odsyłaczy w README i statusie projektu.
