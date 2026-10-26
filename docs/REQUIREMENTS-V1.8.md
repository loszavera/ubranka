# Wymagania Ubranka — V1.8

Data: 2026-10-26. Dodatek do [V1.7](REQUIREMENTS-V1.7.md).
**Kasia i Aleksy zaakceptowali P3.3B z opisanymi ograniczeniami. Zlecili tylko
propozycję P3.3C, w tym poprawę ostrości miniatur. C nie jest zatwierdzone do
implementacji ani uruchomienia.** Nadal brak zgody na nowe płatne wywołania
i przesyłanie prywatnych zdjęć do AI.

[Plan V1.8](IMPLEMENTATION-PLAN-V1.8.md), [koszty V1.7](COST-PLAN-V1.7.md),
[proponowane zasady danych AI V1.1](P33-AI-DATA-POLICY-V1.1.md).
Wymagania wcześniejszych wersji pozostają, z poniższymi doprecyzowaniami.

## Odebrane B i granice odbioru

Sześć udanych syntetycznych generacji, bez ponowień; koszt API 0,214403 USD,
budżetowo 1,49 PLN. AI OFF, klucz B unieważniony/usunięty, zgoda 6/6 wyczerpana.
Odbiór nie potwierdza rozmiaru ubrania, jakości prywatnych zdjęć, testu każdej
platformy ani osobnego logowania Kasi. [Dowody B](P33B-REPORT.md) pozostają
niezmienioną podstawą techniczną. Rozmyta miniatura to osobna poprawka UX.

## Propozycja C do zatwierdzenia

| ID | Proponowane wymaganie |
| --- | --- |
| R-50 | C1 przygotowuje cały przepływ prywatnych wizualizacji oraz poprawę miniatur przy serwerowym AI OFF. Testy na syntetycznych danych, bez klucza AI w chmurze, nowych generacji i abonamentów. C2 to późniejsza osobno zatwierdzana aktywacja pilotażu. |
| R-51 | Czytelny podgląd do około 300 CSS px; kandydat miniatury 600×900 JPEG, najwyżej 100 000 B, ustalony pomiarem. Osobne „Powiększ” pobiera istniejący oryginał PNG 1024×1536, nie powiększa małej miniatury. Zachowana obsługa starszych PNG, prywatny odczyt oraz brak nowych wywołań AI. |
| R-52 | Wizualizacja dotyczy jednego wybranego zestawu z własnej szafy: jedno własne zdjęcie dorosłej osoby i 1–3 zdjęcia rzeczy. Każdy użytkownik osobiście zatwierdza dokładne wejścia i przekazanie ich OpenAI. Wybór zestawu, polubienie, podgląd ani zapis do Supabase nie oznaczają wysyłki. |
| R-53 | C2: dwa imiennie zaproszone konta, 30 dni, 25 PLN AI łącznie, najwyżej 60 wysłań w całym pilotażu i 30 na konto, maks. 5/konto/dobę UTC. Liczą się także błędy; bez ponowień i automatycznego przedłużenia. Osiągnięcie dowolnej granicy zatrzymuje nowe wysyłki. |
| R-54 | Oddzielny identyfikator pilotażu, limity i rejestr C; nigdy reset ani ponowne wykorzystanie B. Rezerwa kosztu i miejsca jest atomowa, wspólna dla obu adresów dev/main. Jeden globalny request AI naraz, bez kolejki nowych płatnych operacji. Nieznany wynik/koszt blokuje kolejne. |
| R-55 | Zgoda i dokładne wersje wejść są weryfikowane przed wysłaniem oraz publikacją wyniku. Odczyt gotowego obrazu sprawdza właściciela, ważność i aktualność wejść; sama późniejsza odmowa nowych wysyłek go nie usuwa. Wycofanie i ponowne udzielenie zgody nie przywraca starego zadania. Zmiana niepowiązanego zestawu lub opinii nie unieważnia innych, nadal aktualnych wyników. |
| R-56 | Prywatna historia, pełny podgląd, eksport, usuwanie i ocena wierności oddzielna od gustu. Wynik oraz miniatura wygasają po 30 dniach; limit 30 aktywnych wyników/100 MB AI w istniejących 250 MB konta, wraz z rezerwami. Mniejszy dostępny limit miejsca może zatrzymać tworzenie wcześniej. |
| R-57 | Wycofanie zgody zatrzymuje wysyłanie; osobne usunięcie wyników nie kasuje szafy ani zdjęcia sylwetki. Usunięcie/wymiana wejścia blokuje i usuwa zależne wyniki. Po końcu C2: AI OFF, unieważnienie klucza, rozliczenie żądań już wysłanych i raport zbiorczy bez prywatnych fotografii. |

Względem wcześniejszej propozycji kosztowej V1.5 **30 wysłań/konto zastępuje
40 prób/konto**: cel 30 wizualizacji nie obejmuje zapasu na poprawki. Nie obiecujemy
30 poprawnych wyników; limit budżetu lub miejsca może zostać osiągnięty wcześniej.
Budżet aplikacji blokuje kolejne operacje, ale nie jest gwarancją ceny żądania
już przyjętego przez dostawcę. Granica ta i finansowanie wymagają odrębnej zgody C2.

Poza C: katalogi sklepów, zakupy, automatyczne rozpoznawanie D, nowe modele,
publiczne udostępnianie prywatnych wyników i premiera komercyjna.
