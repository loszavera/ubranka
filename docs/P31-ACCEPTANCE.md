# P3.1 — odbiór na telefonach

Aktualizacja 2026-10-26: użytkownik potwierdził osobiste logowanie Kasi przez
Google na iPhone/Safari i widok prywatnej szafy. Warunek pierwszego logowania
obu uczestników jest zamknięty. Nie oznacza to testu każdego scenariusza poniżej
ani aplikacji natywnej. Dalszy tekst opisuje historyczny zakres odbioru P3.1.

Data: 2026-10-24. Docelowy adres odbioru:
https://ubranka.vercel.app/?wardrobe=1.
P3.1 jest wdrożone na main. Logowanie właściciela, odczyt istniejącego zdjęcia
i wylogowanie przeszły [kontrolę głównego adresu](P31-MAIN.md).
Dev pozostaje warsztatem; publikacja na main nie oznacza odbioru funkcji.
Każda osoba używa swojego wcześniej wskazanego konta Google.

Wynik zgłoszony przez Aleksego 2026-10-24: większość funkcji działa na telefonie;
Google Kasi pozostaje nieprzetestowane. Zgłoszenie karty pozostającej po usunięciu
jest opisane wraz z poprawką w [P31-DELETION-FIX.md](P31-DELETION-FIX.md).
Po wdrożeniu poprawki użytkownik potwierdził: „przeprowadziłem test. jestem
zadowolony”. Ponowny test usuwania przyjmujemy jako pozytywny, zgłoszenie zamknięte.
Nie jest to potwierdzenie logowania Kasi ani każdego punktu poniższej checklisty.

Main i dev korzystają z tego samego Supabase Free `ubranka-test` we Frankfurcie
i tych samych dwóch zaproszonych kont. Prywatna szafa jest wspólna dla obu adresów;
zapis lokalnego demo pozostaje osobny. Nie zmieniamy limitów ani retencji.
Na ten test wybierzcie obraz syntetyczny, bez zdjęć osób lub innych prywatnych
danych. Docelowy podział środowisk pilotażu i produkcji ustalimy ponownie przed
premierą komercyjną.

1. **Oba konta:** Kasia i Aleksy logują się osobno. Pojawia się własna szafa:
   pusta dla nowego konta lub z jego wcześniejszymi danymi z dev.
   Aleksy może przełączyć język na EN. Konto niewskazane w konfiguracji nie ma dostępu.
2. **Zdjęcie:** dodaj obraz JPG/PNG/WebP, nazwę, kolor i okazję. Sprawdź podgląd,
   zapis, miniaturę, edycję i wymianę. HEIC powinien pokazać jasną odmowę.
   Można też sprawdzić aparat na testowym rysunku, bez fotografowania osoby.
3. **Synchronizacja:** otwórz tę samą szafę na drugim urządzeniu lub w drugiej
   przeglądarce, na tym samym Google. Zmień opis i odśwież drugi widok.
   Druga osoba na własnym koncie nie powinna widzieć tej rzeczy.
4. **Eksport:** w Konto pobierz ZIP. Sprawdź plik danych i obie wersje zdjęcia.
5. **Usuwanie i wylogowanie:** usuń testową rzecz, odśwież drugi widok, wyloguj się.
   Zdjęcie nie powinno pozostać w szafie ani po przejściu na drugie konto.
   Nie trzeba usuwać prawdziwego konta Google/Ubranka — usuwanie konta przeszło
   już próbę na oddzielnych syntetycznych kontach.

Przekażcie: model telefonu/przeglądarkę, punkt checklisty oraz wynik lub krótki
opis błędu. Hasła, kody logowania i zawartość prywatnej szafy nie są potrzebne.

Dotychczas: Google właściciela, rzeczywiste API dwóch syntetycznych kont,
zdjęcia, odcięcie dostępu, fizyczne usuwanie i harmonogram sprawdzone. UI przeszedł
automatyczne testy z kontrolowanymi odpowiedziami usług. Pełny realny wybór pliku
przez automat Chrome zatrzymało uprawnienie rozszerzenia do plików lokalnych.
Logowanie Kasi, Safari/iPhone i natywne buildy pozostają niepotwierdzone.
Test telefonu Aleksego jest potwierdzeniem użytkownika; nie ustalono modelu
urządzenia ani pełnej listy sprawdzonych scenariuszy.
Raport: [P31-VERIFICATION.md](P31-VERIFICATION.md).
