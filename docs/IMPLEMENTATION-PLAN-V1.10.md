# Plan implementacji Ubranka — V1.10: bezterminowy klucz C2

Data: 2026-10-27. Zatwierdzona przez właściciela korekta [planu V1.9](IMPLEMENTATION-PLAN-V1.9.md).
Dziedziczy cały zakres, testy i limity V1.9. Zastępuje warunek wygaśnięcia klucza
w kroku 4 i mechanizm zakończenia w kroku 7; nie otwiera nowej próby.
[Wymagania V1.10](REQUIREMENTS-V1.10.md), [koszty V1.9](COST-PLAN-V1.9.md),
[zasady AI V1.2](P33-AI-DATA-POLICY-V1.2.md), [raport wykonania](P33C2-VERIFICATION.md).

## Kolejność po potwierdzeniu właściciela

1. Utworzyć nowy klucz projektu Ubranka: Restricted, tylko Images Request,
   ważność Never. Zapisać wartość tylko w sekretach Supabase. Nie wykonywać
   płatnego wywołania sprawdzającego. Nie używać kluczy poprzednich etapów.
2. Dodać migrację rozróżniającą `NON_EXPIRING` od starej ścieżki `EXPIRING`.
   Nowa funkcja aktywacji dostępna wyłącznie właścicielowi wymaga jawnego
   `nonExpiringKeyApproved`, bez fałszywego `keyExpiryVerified`.
   Nie przyjmuje dowolnego deadline: serwer wylicza dokładnie 30 dni od startu.
   `provider_key_expires_at=NULL` oznacza Never; `key_deadline` jest skończonym
   terminem użycia przez aplikację i jest równy końcowi próby.
3. Bezpłatne testy na danych syntetycznych: odmowa dla brakujących/fałszywych
   i dodatkowych bramek, ACL, dokładny termin 30 dni, odmowa po jego upływie,
   brak ponownego otwarcia/resetu, zachowanie B i kosztu miesiąca oraz starej
   ścieżki expiring. Przegląd niezależny, migracja przy OFF i publikacja dev/main.
4. Sprawdzić aktualne kredyty, auto-reload OFF, ceny, dostępne limity usług,
   oba zaproszone konta i wyniki kontroli wdrożenia. Bez odczytu zdjęć uczestników.
   Dopiero potem jednokrotna aktywacja z pięcioma prawdziwymi bramkami:
   finansowanie, auto-reload OFF, zgoda na Never, QA i urządzenia.
5. Po aktywacji sprawdzić daty, dwa konta, limity, zerowy stan nowych prób,
   brak rezerw i niezmienione B. Pierwszy płatny pomiar uruchamia uczestnik
   własnym kliknięciem po osobistej zgodzie. Operator nie wykonuje tej próby.

## Zakończenie i granice

Serwer odmawia nowych wysłań po 30 dniach niezależnie od komputera i czatu.
Harmonogram porządkowy zapisuje zamknięcie jako `TRIAL_EXPIRED`; nie oznacza
to wygaśnięcia klucza OpenAI. Klucz Never pozostaje ważny do odrębnego
unieważnienia przez operatora, który usuwa też sekret i przygotowuje raport.
Nie tworzymy teraz automatyzacji Codex ani klucza administracyjnego do zarządzania
sekretami. Brak kontroli operatora nie przedłuża pilotażu, ale opóźnia odwołanie
dostępu po stronie dostawcy. Nie deklarować tej kontroli jako wykonanej z góry.

Nie zmieniają się zasady danych V1.2, kwoty, liczba wysłań ani brak retry.
Nie gwarantujemy ceny przyjętego żądania do wysokości rezerwy/budżetu.
Gotowe wyniki zachowują własną retencję. Po C2 stop przed D.
