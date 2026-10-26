# Plan implementacji Ubranka — V1.9: zatwierdzone P3.3C2

Data: 2026-10-26. Rozwinięcie [V1.8](IMPLEMENTATION-PLAN-V1.8.md).
**C1 odebrane. C2 zatwierdzone 2026-10-26 do implementacji i warunkowej aktywacji.**
Użytkownik przyjął limity, granicę ceny, zasady AI V1.2 oraz wyłączenie auto-reload
całej organizacji. Wykonanie i dowody: [raport C2](P33C2-VERIFICATION.md).
Ta adnotacja zapisuje zgodę, nie oznacza aktywacji ani wysłania zdjęć.
[Wymagania V1.9](REQUIREMENTS-V1.9.md), [koszty V1.8](COST-PLAN-V1.8.md),
[zasady AI V1.2](P33-AI-DATA-POLICY-V1.2.md).

## Zatwierdzony rezultat

Na głównym adresie aplikacji każda osoba wybiera jeden zapisany zestaw, sprawdza
zdjęcie sylwetki i 1–3 zdjęcia rzeczy, akceptuje zasady i świadomie wysyła te
wejścia do OpenAI. Powstaje jeden prywatny obraz z ostrą miniaturą, powiększeniem,
pobraniem, oceną wierności i usunięciem. Odmowa AI nie blokuje szafy i zestawów.

| Granica | Zatwierdzony zakres |
| --- | --- |
| Uczestnicy i interfejs | Dwa obecne zaproszone konta, WWW PL/EN. Każdy sam uruchamia swoje generacje. |
| Czas | 30 kolejnych dni od aktywacji zapisanej w UTC. Daty pokazane w aplikacji; bez przedłużenia. |
| Wysłania | 60 łącznie, 30/konto, 5/konto/dobę UTC, wliczając błędy. Brak ponowień i płatnych testów operatora. |
| Koszt | 25 PLN całego trialu oraz wspólny limit aplikacji 25 PLN/miesiąc UTC, razem z wcześniejszym B. |
| Finansowanie | Istniejące kredyty; zatwierdzone wyłączenie auto-reload całej organizacji i pozostawienie OFF. Bez nowych wpłat, doładowań i abonamentów na C2. |
| Dane | OpenAI dostaje tylko zatwierdzone wejścia, stałą instrukcję i pseudonim bezpieczeństwa. Supabase Frankfurt przechowuje prywatne wyniki przez 30 dni. |
| Zakończenie | Serwer odmawia nowych wysłań; klucz wygasa. Kontrola końcowa unieważnia klucz, usuwa sekret i zapisuje raport zbiorczy. |

## Co jest gotowe, co trzeba wykonać

Gotowe C1 (`fa55b36`): prywatny podgląd/eksport, dokładne wejścia, receipt,
podstawy zgód, atomowa rezerwacja kosztu i miejsca, prywatny koordynator,
rozliczenie, retencja i usuwanie. [233 testy i hosted QA](P33C1-VERIFICATION.md).
Odczyt chmury 2026-10-26 17:18 UTC: `ai_enabled=false`, `c_enabled=false`,
globalna blokada ON; C prepared, bez dat, uczestników i prób. B zamknięte,
miesiąc i B nadal mają 149 groszy / zero rezerw. To odczyt, nie nowa konfiguracja.

**C2 wymaga integracji, nie samego przełączenia flagi.** Edge/SQL/worker nadal
bezwarunkowo odmawiają generacji C, a bootstrap zgłasza OFF. Nie oznaczamy
prywatnej płatnej ścieżki jako sprawdzonej na podstawie mocków C1 lub próby B.

## Kolejność wykonania C2

1. **Integracja na dev przy OFF.** Połączyć UI → autoryzowane Edge → plan/rezerwacja
   C → worker → pojedyncze Images edits → prywatny Storage → rozliczenie.
   Weryfikować konto, dopuszczenie do C, zgodę V1.2/revision, wersje i bajty wejść,
   parametry modelu, czas, koszt oraz miejsce. Zachować starsze zgody jako historię;
   nie przepisywać zgody V1.1 na V1.2. B nadal zamknięte i bez ścieżki wysyłania.
   Przygotować kopie wejściowe bez AI: zachować proporcje, usunąć metadane,
   zmieścić JPEG w 1024×1536 i 1 MB. To przyjęty limit kopii C2;
   obecna szafa i walidator prywatny dopuszczają 1600 px. Nie zastępować ich
   ograniczonym kontraktem B bez przygotowania kopii.
   Użytkownik ogląda właśnie kopie do wysłania, a serwer weryfikuje ich bajty;
   nie zmieniać ich po zgodzie. Źródła szafy pozostają niezmienione. Jeśli kopii
   nie da się przygotować w granicach, czytelna odmowa przed rezerwacją/wysłaniem.
2. **Jedno wysłanie.** Trwały znacznik przed kontaktem z dostawcą, jeden globalny
   request, wspólny deadline i zero retry/fallbacku. Utrata odpowiedzi oznacza
   odczyt stanu, nigdy drugi POST. Tych samych wersji wejść/zestawu nie ponawia
   nowy UUID, drugie urządzenie ani ponowna zgoda. Brak usage utrzymuje blokadę.
   Rejestr bez zdjęć: identyfikator odpowiedzi dostawcy, usage, koszt, czasy etapów
   i powód zatrzymania. Bez surowego payloadu lub odpowiedzi w logach.
3. **Bezpłatna weryfikacja.** Testy poniżej używają tylko syntetycznych kont/obrazów
   i kontrolowanego transportu dostawcy. Zero płatnych generacji przygotowawczych.
   Po udanych testach publikacja na main nadal przy OFF; kontrola wdrożenia.
4. **Finansowanie i klucz.** Ponowny odczyt cen, salda, limitów, danych i możliwości
   wygaśnięcia klucza. Po osobnej zgodzie C2 wyłączyć auto-reload organizacji;
   dotyczy także innych projektów API, nie abonamentu ChatGPT. Nie kupować kredytów,
   nie zwiększać limitów i nie włączać doładowań po próbie. Jeśli warunku nie można
   potwierdzić, zachować OFF. Użyć nowego klucza tylko do Images Request, tylko
   w sekretach Supabase, z wygaśnięciem najpóźniej na koniec C2. Nie przechowywać
   dodatkowego klucza administracyjnego do samodzielnego zarządzania sekretami.
   **Warunek aktywacji: potwierdzone wygaśnięcie tego konkretnego klucza.**
   Jeżeli usługa nie umożliwia wymaganego terminu, zachować OFF i przedstawić
   inny sposób zakończenia do uzgodnienia; nie zastępować TTL obietnicą czuwania agenta.
5. **Aktywacja.** Przypisać dokładnie dwa zatwierdzone konta, zapisać początek/koniec
   i wersję limitów w przygotowanym C, bez resetowania B lub miesiąca.
   Włączyć wyłącznie autoryzowaną ścieżkę C. Aplikacja pokazuje datę końca,
   pozostałe próby, koszt/rezerwy oraz komunikaty stop. Każda osoba potwierdza
   politykę i konkretne zdjęcia we własnym interfejsie; zgoda w czacie tego nie
   zastępuje. Operator nie otwiera i nie wysyła jej zdjęć.
6. **Pierwszy pomiar i dalsze użycie.** Pierwszy klik uczestnika rezerwuje cały
   wolny budżet do odczytu usage; to jeden z 60 slotów. Potem rezerwa wynosi
   co najmniej max(1 PLN, 2 × najwyższy koszt C + 0,20 PLN). Błąd/nieznany koszt
   lub przekroczenie rezerwy zatrzymuje następne wysłania. To nie gwarantuje
   maksymalnej ceny już przyjętego przez dostawcę żądania: taka operacja może
   przekroczyć rezerwę, a nawet 25 PLN. Nie obiecywać twardego limitu rachunku.
7. **Koniec.** Daty/limity i globalny wyłącznik blokują nowe wysłania na serwerze,
   niezależnie od otwartego czatu i komputera. Ustawione wygaśnięcie klucza ogranicza
   jego życie; brak kontroli operatora nie wydłuża trialu. Rozliczyć wysłaną próbę
   także przy OFF i po kasacji konta. Gotowy wynik pozostaje do własnego terminu.
   Kontrola końcowa potwierdza OFF/wygaśnięcie, unieważnia klucz, usuwa sekret
   i zapisuje zbiorczy raport; nie deklarować tych czynności jako wykonanych na
   podstawie samego końca daty. Nie tworzymy teraz automatyzacji Codex.

## Testy wymagane przed aktywacją

| Obszar | Dowód |
| --- | --- |
| Wysyłanie C | Pełne połączenie handlera i workera z kontrolowanym transportem; dokładne bajty, model, polityka, pseudonim, jeden POST; stare A/B niedostępne. |
| Izolacja i zgody | Dwa konta syntetyczne; cudze wejścia/wyniki odrzucone, brak zgody, stale intent, revoke→reaccept, podmiana/usunięcie wejścia i konta przed/po wysłaniu. |
| Limity i awarie | 60/30/5, 30 dni, miesiąc UTC, istniejące wydatki B, pierwsza rezerwa, unknown, koszt ponad rezerwą, dwa zatwierdzane konkurencyjne żądania, restart/timeout bez drugiego wysłania. |
| Wynik i dane | Autoryzowany podgląd/eksport/ocena, MIME i rozmiary, 100/250 MB z rezerwami, wygaśnięcie, zwykły cleanup, brak późnego odtworzenia usuniętego wyniku. |
| Zamykanie | Odmowa po terminie i limicie; rozliczenie przy OFF; ważne wyniki czytelne po końcu; minimalne metadane bez prywatnych wejść. |

Wykonać `check`, testy klienta/backendu/kodeka, `check:backend`, E2E demo/prywatne
i `build:all`; zależności/doctor jeśli ulegną zmianie. Rzeczywisty hosted QA tylko
na świeżych syntetycznych kontach, z posprzątaniem; bez ręcznego globalnego cleanupu.
Potwierdzony test WWW C1 Aleksego (2026-10-26): Chrome na PC oraz Chrome na Androidzie,
bez modeli/wersji. 2026-10-26 użytkownik uzupełnił zakres Kasi: iPhone/Safari.
To deklaracja urządzenia pilotażu, nie osobny dowód testu C2.
Odbiór C1 już przyjęty,
nie wymaga ponownej akceptacji; nieznane platformy nie dostają fikcyjnego PASS.

## Odbiór i granice

Ocena przydatności przez każdą osobę, jawny koszt wszystkich wysłań i błędów,
brak wycieku/duplikatu, działające usuwanie i zamknięcie. Raport publiczny tylko
zbiorczy: bez fotografii, prywatnych hashy/ścieżek, promptów i identyfikatorów.
Brak gwarancji dopasowania rozmiaru i jakości wszystkich ubrań; gorszy obraz
nie uruchamia ponowienia. Po C2 stop przed D, sklepami i premierą komercyjną.
