# Kontrakty danych — prototyp P2

Data: 2026-10-24. Uzupełnienie [planu V1.2](IMPLEMENTATION-PLAN-V1.2.md)
i [wymagań V1.2](REQUIREMENTS-V1.2.md). Część P2 opisuje kod; szkice P3/P4
określają przyszłe granice danych, bez wyboru dostawcy ani uruchomienia usług.
Nie są gotowym API ani potwierdzeniem działania synchronizacji, zdjęć i zakupów.

## Zaimplementowany model P2

Źródło typów: [model.ts](../src/domain/model.ts). Dane ubrań i zestawów pochodzą
wyłącznie z [katalogu demonstracyjnego](../src/domain/catalog.ts).

| Kontrakt | Pola i znaczenie |
| --- | --- |
| `Profile` | `id`, edytowalne `name`, `audience: women/men`, `occasion: casual/elegant`, `budget`, dodatkowy `priority: comfort/quality/versatility`, zapisany `defaultMode: best/value`. Profile oznaczają style, nie odrębne konta osób. |
| `WardrobeItem` | `id`, `name: {pl, en}`, `category: top/bottom/layer/shoes`, `color`, `audience`, `price`, `shipping: number/null`, `tier: economy/premium`, `tags`. Są to opisy przykładowych rzeczy, bez prawdziwej oferty sklepu lub zdjęcia użytkownika. |
| `Outfit` | `id`, lokalizowane `name` i `description`, `audience`, `occasion`, `tier`, referencje `itemIds`, `imageKey` ilustracji demo, `tags`, wagi `priorities`. Pełny zestaw zawiera górę, dół i buty, ewentualnie warstwę. |
| `Feedback` | `profileId`, `outfitId`, `vote: like/dislike`, opcjonalny `reason`. Jedna aktualna ocena dla pary profil–zestaw; ponowna ocena zastępuje poprzednią. Polubienie nie tworzy listy zakupowej ani zamówienia. |
| `AppState` | `version: 1`, `locale: pl/en`, `onboarded`, `activeProfileId`, `profiles`, `ownedItemIds`, `feedback`, `askReason`. Własność rzeczy jest wspólna dla lokalnych profili stylu. |

Zapis jest lokalny dla danej przeglądarki/aplikacji. Nie ma kont, synchronizacji
ani izolacji dwóch zalogowanych osób. Język zmienia teksty, zachowując dane,
rynek PL i ceny PLN. Trwająca sesja, kolejność obejrzanych propozycji i otwarte
okna są stanem interfejsu; po odświeżeniu użytkownik prosi o nową rundę.

[restoreState](../src/domain/state.ts) sprawdza wersję, typy i referencje do
znanych profili/rzeczy/zestawów. Nieczytelny lub nieobsługiwany zapis zwraca
`null`; aplikacja obsługuje go jako błąd, bez traktowania odczytu jako udanego.

## Koszt i wybór w P2

- Kwoty `price`, `shipping` i `budget` są nieujemnymi liczbami w PLN. Sumy są
  zaokrąglane do groszy. Budżet ogranicza nowy wydatek, nie wartość całej szafy.
- Rzecz wskazana w `ownedItemIds` wnosi 0 PLN ceny i dostawy. Przykładowe opłaty
  dostawy są przypisane do rzeczy; nie odwzorowują koszyka konkretnego sklepu.
- `costOfOutfit` zwraca `{ items, shipping, total, ownedCount }`. `null` w dostawie,
  brak rzeczy lub nieprawidłowa kwota oznaczają `total: null`, a nie koszt 0 PLN.
  Wtedy częściowa suma `shipping` nie potwierdza pełnego kosztu.
- Rekomendacja wymaga znanego pełnego kosztu mieszczącego się w budżecie.
  Uwzględnia odbiorcę, okazję, priorytet, własne rzeczy i opinie aktywnego profilu.
  Zwraca najwyżej dwa zestawy; `value` wybiera ekonomiczny i markowy, jeśli oba
  spełniają warunki. Brak odpowiednika nie pozwala przekroczyć budżetu.

Reguły i przykłady graniczne sprawdza [domain.test.ts](../tests/domain.test.ts).

## Szkice P3 — konto, prywatne rzeczy i wizualizacja

Poniższe pola są projektem kontraktów do rozwinięcia przy realizacji P3, nie
zapisem zbieranych już danych. Identyfikatory są niejawne; daty oznaczają UTC
w formacie ISO 8601. Przyszły schemat wymaga własnej wersji i migracji danych P2.

| Kontrakt roboczy | Minimalny zakres i granica |
| --- | --- |
| `Account` | `id`, `locale`, `activeProfileId`, `createdAt`, `updatedAt`. Powiązanie z uwierzytelnianiem dopiero po wyborze rozwiązania. Serwer ustala właściciela z sesji, nie ufa przesłanemu przez klienta `accountId`. |
| Własne dane | Profile, rzeczy, opinie i zadania wizualizacji otrzymują `accountId`. Rzecz może mieć prywatne `photoIds`, opis skorygowany przez użytkownika i `updatedAt`. Uprawnienia muszą ograniczać odczyt, zmianę i usunięcie do właściciela. |
| `PrivatePhoto` | `id`, `accountId`, `kind: garment/person`, prywatne `objectRef`, `createdAt` i stan usuwania. Referencja nie jest publicznym URL; obrazów i danych sylwetki nie zapisujemy w publicznym repozytorium. Szczegółowe pola rozmiarów/sylwetki pozostają do opracowania. |
| `Visualization` | `id`, `accountId`, `profileId`, `outfitId`, wersja/snapshot elementów zestawu, `inputPhotoIds`, `status: queued/running/succeeded/failed/cancelled`, opcjonalne `resultPhotoId`, `errorCode`, znaczniki czasu. Wynik musi wskazywać konkretny zestaw; stan `succeeded` wymaga dostępnego wyniku. |
| Próba wizualizacji | `id`, `visualizationId`, status, czas, `cost` i `currency` lub jawnie nieznany koszt. Każde ponowienie/nieudana próba jest osobne, aby nie ukrywać kosztów. Limit usług nie wynika z samego istnienia tego kontraktu. |

Przed przesłaniem realnych zdjęć należy ustalić konkretną usługę, zakres danych,
retencję oraz usuwanie w aplikacji i u dostawcy. Dopiero te ustalenia określą
pola polityki, terminy usuwania i sposób potwierdzenia usunięcia. Nie przyjmujemy
domyślnej retencji ani zgody na dowolnego dostawcę na podstawie Q24.
Ilustracja P2 nie jest wynikiem tego kontraktu i nie dowodzi fizycznego dopasowania.

## Szkic P4 — produkt sklepu

`StoreProduct` powinien rozdzielić identyfikator wewnętrzny `id` od
`source: { retailer, productId, url }` oraz zawierać `fetchedAt`, nazwę, wariant
(rozmiar/kolor), `availability: available/unavailable/unknown`, `price`,
`currency: PLN`, `shipping` i `mandatoryFees`. Nieznana cena, dostawa lub opłata
ma wartość `null`; 0 oznacza wyłącznie potwierdzony brak kosztu. Dane muszą
odnosić się do wskazanego wariantu i dostawy do Polski.

Pełny koszt jest znany dopiero po uwzględnieniu wszystkich obowiązkowych opłat.
Dostawa może dotyczyć koszyka i wymagać osobnej wyceny z własnym `fetchedAt`;
nie należy sumować jednej opłaty wielokrotnie ani używać nieaktualnej jako pewnej.
Przed przygotowaniem rzeczywistej listy trzeba sprawdzić aktualność cen,
wariantów i dostępności. `source` i data pobrania nie zastępują tej kontroli.

Zestaw mieszany wskazuje osobno referencje własnych rzeczy i produktów sklepu.
Lista z linkami pozostaje odrębna od opinii. Otwarcie linku nie oznacza zakupu,
rezerwacji ani zmiany rzeczy na posiadaną. Żaden sklep nie jest podłączony w P2;
wybór źródła i dostęp do katalogu wymagają weryfikacji w P4.
