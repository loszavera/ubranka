# P3.3C2 — realizacja i weryfikacja

Aktualizacja: 2026-10-26. **W trakcie implementacji; C2 nieaktywne.**

## Upoważnienie i granice

Użytkownik zatwierdził [plan V1.9](IMPLEMENTATION-PLAN-V1.9.md),
[koszty V1.8](COST-PLAN-V1.8.md) oraz [zasady AI V1.2](P33-AI-DATA-POLICY-V1.2.md):
30 dni, 25 PLN łącznie, maks. 60 wysłań / 30 na konto / 5 na konto na dobę UTC,
bez ponowień i płatnych testów operatora. Jawnie przyjął ryzyko przekroczenia
rezerwy i budżetu przez już przyjęte żądanie.

Finansowanie wyłącznie istniejącymi kredytami. Zatwierdzono wyłączenie auto-reload
całej organizacji OpenAI i pozostawienie OFF po C2, bez nowych wpłat/abonamentów.
Osobny ograniczony klucz tylko w sekretach Supabase, z potwierdzonym wygaśnięciem
najpóźniej z końcem pilotażu. Każdy uczestnik sam zatwierdza własne wejścia w UI.
Operator nie otwiera i nie przesyła prywatnych zdjęć uczestników do AI.

## Bieżący stan

- Punkt startowy: czysty dev `19159d7`; C1 odebrane.
- Integracja klienta, backendu i workera: w toku, w oddzielnych worktree.
- Finansowanie: 2026-10-26 wyłączono auto-reload całej organizacji i potwierdzono
  widoczny stan OFF. Kredyty były dostępne; bez wpłat i zmian abonamentów.
- Testy C2, publikacja, konfiguracja klucza i aktywacja: oczekują.
- Płatne wywołania operatora w C2: 0. Zgoda B pozostaje wyczerpana.
- Potwierdzone urządzenia Aleksego: Chrome na PC i Androidzie. Urządzenie/
  przeglądarka Kasi: iPhone/Safari (odpowiedź użytkownika 2026-10-26). To zakres
  użycia pilotażu, nie wykonany przez agenta test na fizycznym urządzeniu.

## Zakończenie

Po terminie/limicie serwer blokuje nowe wysłania, a przyjęte zlecenie nadal
podlega rozliczeniu. Kontrola końcowa potwierdzi OFF, unieważnienie klucza,
usunięcie sekretu i zbiorczy raport. Tych czynności nie uznajemy za wykonane
na podstawie samego upływu daty. Zatrzymanie przed D.
