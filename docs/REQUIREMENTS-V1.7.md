# Wymagania Ubranka — V1.7

Data: 2026-10-25. Dodatek do [V1.6](REQUIREMENTS-V1.6.md).
**P3.3A przetestowane i zaakceptowane przez Kasię i Aleksego.** Użytkownicy
zlecili wyłącznie propozycję P3.3B do zatwierdzenia, bez nowych płatnych wywołań.
[Plan V1.7](IMPLEMENTATION-PLAN-V1.7.md), [koszty V1.6](COST-PLAN-V1.6.md).
Poniższe wymagania B są propozycją; nie uruchamiają implementacji ani usług.

## Co zostało odebrane

Prywatny profil sylwetki i zdjęcie w Supabase, zestawy z własnej szafy,
zapis/opinie oraz przygotowanie wizualizacji z wyłączonym AI, według
[raportu A](P33A-VERIFICATION.md). Nie trzeba ponownie zatwierdzać A.
Ogólny odbiór nie dopisuje szczegółowych wyników konkretnych urządzeń
ani osobnego potwierdzenia logowania Kasi.

## Proponowane wymagania próby P3.3B

| ID | Wymaganie |
| --- | --- |
| R-43 | Rzeczywisty przepływ aplikacja → Supabase → OpenAI → prywatny wynik, dostępny wyłącznie dla zarejestrowanych przypadków syntetycznych. Prywatne konta użytkowników nadal mają AI OFF. |
| R-44 | Sześć przypadków: fikcyjna dorosła kobieta i mężczyzna × codzienny, elegancki i gość weselny. Każdy ma zdjęcie osoby oraz osobne obrazy 2–3 rzeczy. Przygotowanie lokalne z istniejących materiałów, bez nowych generacji. |
| R-45 | Maks. 6 wysłanych płatnych żądań i budżet próby 10 PLN łącznie, z przygotowaniem, błędami i kalibracją. Jedna próba na przypadek, bez retry/fallbacku. Pierwszy pomiar jest jednym z sześciu. |
| R-46 | Serwer sprawdza dopuszczone konto, przypadek, wersje i SHA-256 rzeczywiście wysyłanych bajtów, prompt oraz parametry. Nowy UUID lub podmiana zdjęcia nie odnawia limitu. Uprawnień nie nadają dane edytowalne przez użytkownika. |
| R-47 | Wynik ma historię/stany, prywatny odczyt, pobranie, eksport i usuwanie. Wygaśnięcie/usunięcie wejścia/konta blokuje także późny wynik. Nieznany koszt zatrzymuje następne wywołania. |
| R-48 | Raport obejmuje wszystkie próby, również nieudane: jakość, rzeczywiste usage i koszt, czas, rozmiar oraz granice telemetrii. Próg techniczny: co najmniej 5 z 6 przypadków ≥8/10 bez błędu krytycznego; potem oddzielny odbiór użytkowników. |
| R-49 | Po próbie generator wraca do OFF, klucz B zostaje unieważniony i usunięty z sekretów, a dedykowane dane testowe są sprzątane. Galeria wyłącznie syntetycznych wejść/wyników i raport mogą być opublikowane na main. C nie uruchamia się automatycznie. |

Limit 10 PLN reguluje dopuszczanie kolejnych wysyłek. API nie ma parametru
maksymalnej ceny już trwającego żądania. Zgoda musi obejmować pierwszy pomiar
z tą granicą gwarancji oraz osobno aktualne finansowanie. Odbiór A nie jest taką zgodą.

## Bez zmian i poza B

Wymagania R-33–R-42 pozostają, z doprecyzowaniem izolacji próby. Zdjęcia Kasi,
Aleksego i innych realnych osób nie trafiają do AI. W B brak zakupów, katalogów,
rozpoznawania ubrań, nowych abonamentów i automatycznego zwiększania limitów.
Pilotaż prywatnych zdjęć C oraz rozpoznawanie D pozostają osobnymi decyzjami.
Zasady prywatnych danych z [V1.0](P33-AI-DATA-POLICY-V1.0.md) nie są rozszerzane
przez publikację raportu zawierającego wyłącznie fikcyjne materiały testowe.
