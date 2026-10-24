# P2 — weryfikacja i odbiór

Data: 2026-10-24. Zakres: zatwierdzony prototyp zgodny z V1.2, na `dev`.
Sprawdzamy przepływ UI → stan → zapis lokalny → ranking → UI. Backend,
katalog sklepów, przymiarka AI i składanie zamówienia nie należą do P2.

## Wykonane kontrole

| Kontrola | Wynik i dowód |
| --- | --- |
| `npm run check` | PASS, TypeScript strict i ESLint bez błędów. |
| `npm test` | PASS, 11 testów: koszt z dostawą, własne rzeczy 0, nieznana dostawa, budżet, obie grupy ubrań, maks. dwa wyniki, wyczerpanie, oba tryby, wpływ opinii per profil, brak skutków zakupowych i walidacja zapisu. `artifacts/p2-domain-tests.log`. |
| `npm run test:e2e` | PASS, 8 scenariuszy w Edge na Windows, produkcyjny eksport WWW. Raport `artifacts/e2e-results.json`; zrzuty `artifacts/e2e/`. |
| `npm run check:dependencies` | PASS, wersje zgodne z Expo SDK57; `artifacts/p2-dependencies.log`. |
| `npm run doctor` | PASS, 21/21; `artifacts/p2-doctor.log`. |
| `npm run build:all` | PASS, WWW oraz bytecode Hermes dla iOS/Androida; `artifacts/p2-build-all.log`. |
| Audyt npm | 8 znanych wpisów (5 high, 3 moderate), 0 critical; `artifacts/p2-npm-audit.json`, omówienie w DEPENDENCY-STATUS.md. |
| Przegląd wizualny | Obejrzane ekrany powitania, propozycji i szafy, PL/EN, desktop i telefon. 8 ilustracji sprawdzonych względem katalogu. |
| Niezależny przegląd kodu | Poprawiono retry odczytu, stan aktywnych przycisków dla czytników WWW i natywną obserwację sieci. Dodano brakujące szkice kontraktów P3/P4. |

Scenariusze przeglądarkowe obejmują:

1. Walidację budżetu, krótki start, dwie propozycje, polubienie, PL/EN i reload.
2. Odrzucenie obu, pominięcie/zapis powodu, wyłączenie pytania i koniec przykładów.
3. Utworzenie/edycję męskiego profilu, oba segmenty cenowe, zapis trybu i izolację opinii.
4. Budżet 0 PLN: brak wyniku, zaznaczenie wszystkich rzeczy zestawu jako własnych,
   koszt elementów i dostawy równy 0, utratę dopasowania po usunięciu własności.
5. Uszkodzony zapis, brak możliwości przypadkowego nadpisania i potwierdzany reset.
6. Wymuszoną awarię odczytu oraz przywrócenie zapisanych ustawień po retry.
7. Wymuszoną awarię zapisu, widoczny błąd, zapis bieżącej opinii po retry i pracę
   załadowanego interfejsu po wyłączeniu sieci.
8. Szerokości 320/360/390/1440 px, PL/EN, brak poziomego przepełnienia,
   widoczne karty i dostęp klawiaturą. Błędy JavaScript kończą test niepowodzeniem.

Raporty, ślady i zrzuty są lokalne, ignorowane w Git. Dane testowe są fikcyjne.
Testy działają od czystego kontekstu przeglądarki i nie zmieniają danych użytkownika.
CI instaluje Chromium i wykonuje te same scenariusze; jego wynik i wdrożenie
Vercel wymagają osobnej kontroli konkretnego commita.

## Granice weryfikacji

- Eksport iOS/Android jest udany; nie przeprowadzono testu na fizycznych urządzeniach,
  VoiceOver/TalkBack, z klawiaturą ekranową ani z dużym systemowym rozmiarem tekstu.
- Brak sieci na WWW sprawdzono po załadowaniu aplikacji. Nie ma jeszcze usługi
  PWA/cache gwarantującej pierwszy start lub reload strony bez internetu.
- Profile oznaczają style na jednym urządzeniu, nie izolowane konta Kasi/Aleksego.
  Dane nie synchronizują się między różnymi adresami podglądu ani przeglądarkami.
- „Markowy” jest demonstracyjnym segmentem; nazwy/ceny nie są ofertami sklepu.
  Dostawa demo jest liczona per rzecz, bez prawdziwego grupowania koszyka sklepu.
- Polubienia wpływają na prosty ranking cech zestawu. Powód odrzucenia jest zapisywany;
  osobna interpretacja semantyczna powodów i AI pozostają późniejszą pracą.
- W repozytorium są wyłącznie wygenerowane ilustracje fikcyjnych dorosłych osób.
  Nie zebrano zdjęć, wymiarów ani danych płatniczych użytkowników.

## Odbiór przez Kasię i Aleksego

Propozycja do akceptacji: około 10 minut na telefonie, osobno na Waszych urządzeniach.
Otwórz stały podgląd dev z [PROJECT-STATUS.md](PROJECT-STATUS.md); w razie potrzeby
zaloguj się w Vercel. To adres testowy, niezależny od stabilnego `ubranka.vercel.app`.

1. Wybierz PL/EN, damskie/męskie, okazję i 500 PLN. Uruchom propozycje.
2. Oceń czytelność dwóch kart i kliknij „Podoba mi się”. To zapis gustu.
3. Przełącz ekonomiczny/markowy i poproś o parę; następnie odrzuć obie,
   pomijając powód. Powinna pojawić się kolejna para lub uczciwy koniec przykładów.
4. W Profilu utwórz lub edytuj drugi styl; zmień język i domyślny tryb.
   Odśwież stronę — dane powinny zostać, a nowa runda czekać na Twoją prośbę.
5. W Szafie zaznacz rzecz jako posiadaną, poproś o zestawy i sprawdź szczegóły kosztu.

Przekaż: co było niejasne, czy przyciski/teksty są wygodne, oraz czy oba tryby
odpowiadają oczekiwaniom. Przy błędzie podaj krok, język, urządzenie i oczekiwany
wynik. Gotowa wiadomość: „Sprawdziliśmy P2. Uwagi Kasi: …; uwagi Aleksego: …”.
Odbiór wyglądu/przepływu nie stanowi zatwierdzenia skuteczności stylisty AI.
