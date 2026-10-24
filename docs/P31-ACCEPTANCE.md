# P3.1 — odbiór na telefonach

Data: 2026-10-24. Podgląd testowy:
https://ubranka-git-dev-risk-every-asset.vercel.app/?wardrobe=1.
Może być potrzebne istniejące logowanie Vercel. Nie zmieniamy ochrony podglądu.
Każda osoba używa swojego wcześniej wskazanego konta Google.

Dev korzysta z oddzielnego projektu testowego Supabase. Na tym etapie wybierzcie
obraz syntetyczny, bez zdjęć osób lub innych prywatnych danych. Własne zdjęcia
przewidziano dla późniejszego środowiska pilotażu po odbiorze.

1. **Oba konta:** Kasia i Aleksy logują się osobno. Pojawia się własna pusta szafa.
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
Kasia, Safari/iPhone, Chrome/Android i natywne buildy pozostają nieprzetestowane.
Raport: [P31-VERIFICATION.md](P31-VERIFICATION.md).
