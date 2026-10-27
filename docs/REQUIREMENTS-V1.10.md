# Wymagania Ubranka — V1.10

Data: 2026-10-27. Zatwierdzona zmiana cyklu życia klucza C2.
Podstawą pozostają [wymagania V1.9](REQUIREMENTS-V1.9.md); poniższe zapisy
zastępują wyłącznie R-60 i część R-65 dotyczącą wygaśnięcia klucza.
Pozostałe wymagania, limity i [zasady AI V1.2](P33-AI-DATA-POLICY-V1.2.md)
obowiązują bez zmian. [Plan V1.10](IMPLEMENTATION-PLAN-V1.10.md),
[koszty V1.9](COST-PLAN-V1.9.md), [wykonanie](P33C2-VERIFICATION.md).

## Jawne ustalenie właściciela

2026-10-27 użytkownik potwierdził utworzenie teraz osobnego klucza OpenAI
projektu Ubranka, tylko Images Request, **ważność bezterminowa**, zapis wyłącznie
w sekretach Supabase i dokończenie aktywacji po sprawdzeniu warunków V1.9.
To przyjęta zmiana wcześniejszego warunku TTL, nie propozycja do ponownej akceptacji.

| ID | Aktualne wymaganie |
| --- | --- |
| R-60 | Osobny klucz C2 projektu Ubranka, Restricted: tylko Images Request, ważność Never. Wartość wyłącznie w sekretach Supabase; bez lokalnego pliku, Git, aplikacji, Vercel i dodatkowego klucza administracyjnego. Nie używać kluczy P3.2/B. |
| R-65 | Serwer blokuje nowe wysłania po 30 dniach, limicie albo wcześniejszym stopie, a wysłane żądanie nadal rozlicza. Bezterminowy klucz nie wygasa wraz z pilotażem. Kontrola operatora po zakończeniu musi unieważnić klucz w OpenAI, usunąć sekret Supabase i zapisać raport zbiorczy. Sam koniec daty nie dowodzi tych czynności. |

Klucz poza aplikacją pozostaje technicznie ważny do unieważnienia. Nie udajemy
potwierdzonego wygaśnięcia: zapis operacyjny rozróżnia bezterminową ważność
dostawcy i skończony termin dopuszczania wysłań przez serwer.

Pilot nadal trwa 30 dni, bez przedłużenia: 25 PLN całej próby i wspólne 25 PLN
na miesiąc UTC, 60 wysłań / 30 na konto / 5 na konto na dobę UTC, bez ponowień.
Istniejące kredyty; auto-reload całej organizacji pozostaje OFF. Zero nowych
wpłat, abonamentów i płatnych testów operatora. Każdy osobiście zatwierdza
swoje zdjęcia i wysłanie w aplikacji. Zatrzymanie przed D pozostaje obowiązkowe.
