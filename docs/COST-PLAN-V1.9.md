# Koszty Ubranka — V1.9: cykl życia klucza C2

Data: 2026-10-27. Zatwierdzona zmiana [V1.8](COST-PLAN-V1.8.md),
powiązana z [planem V1.10](IMPLEMENTATION-PLAN-V1.10.md).
Wszystkie kwoty, rezerwy, sposób finansowania i ograniczenia V1.8 pozostają
bez zmian. Zastępujemy wyłącznie warunek wygaśnięcia klucza w sekcji Zakończenie.

Nowy klucz C2 jest, zgodnie z jawną zgodą właściciela, bezterminowy: tylko
Images Request w projekcie Ubranka i wyłącznie sekrety Supabase. Wysyłki
aplikacji nadal mają skończony termin 30 dni. Klucz nie wygasa automatycznie;
po zakończeniu operator musi go unieważnić i usunąć sekret. Pozostawiony
klucz zachowuje ważność u dostawcy, choć aplikacja już odmawia nowych wysłań.

Budżet: 25 PLN na cały C2 oraz 25 PLN/miesiąc UTC wspólnie z wcześniejszym B;
60 wysłań / 30 na konto / 5 na konto na dobę UTC. Brak retry i płatnych testów
operatora. Pierwsza rezerwa obejmuje cały dostępny budżet; następne co najmniej
`max(1 PLN, 2 × największy koszt C + 0,20 PLN)`. Przyjęte żądanie może przekroczyć
rezerwę i budżet. Źródło finansowania: istniejące kredyty; auto-reload całej
organizacji pozostaje OFF, bez nowych wpłat i abonamentów.

2026-10-27 ponownie potwierdzono [stawki modelu](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare):
5/8/30 USD za milion tokenów tekstu wejściowego / obrazów wejściowych / wyjścia.
Przypięty model i parametry nie zmieniają się; przelicznik budżetowy 6,765 PLN/USD
pozostaje konserwatywną rezerwą, a nie rzeczywistym kursem ani podatkiem konta.
Dowody finansowania i dokładne dane konta pozostają poza Git.
[Raport aktywacji i testów](P33C2-VERIFICATION.md).
