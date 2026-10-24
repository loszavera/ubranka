# Źródła ubrań i zakupy — rozpoznanie V1.1

Data sprawdzenia: 2026-10-24. Status: rozpoznanie dokumentacji, bez integracji.
Podstawa produktowa: odpowiedzi Aleksego i Kasi, punkty 6, 11, 13 i 18.

## Ustalone potrzeby i granica dowodu

Źródła wskazane przez użytkowników to Vinted, Zara, Zalando, Reserved i H&M;
rynek początkowy to Polska. Potrzebny jest koszyk do zatwierdzenia, a budżet
dotyczy całego zestawu. Polubienie propozycji służy uczeniu gustu i nie jest zakupem.

Lista sklepów jest wymaganiem kierunkowym. Nie potwierdza dostępu Ubranka do ich
katalogów, zdjęć, stanów, koszyków ani składania zamówień. Dostęp kont projektu,
umowy, limity i ceny integracji pozostają niezweryfikowane. Nie wywoływano API,
nie pobierano katalogów, nie zakładano kont i nie składano zamówień.

## Co potwierdzają oficjalne źródła

| Źródło | Potwierdzone w dokumentacji | Wniosek dla Ubranka |
| --- | --- | --- |
| Vinted | Pro Integrations wymaga dopuszczenia konta firmy Pro. Dokumentacja obejmuje własne oferty, ich stany, sprzedaż i etykiety wysyłkowe. [Dokumentacja Vinted](https://pro-docs.svc.vinted.com/) | To integracja sprzedawcy. Nie potwierdzono wyszukiwania całego rynku ani zakupu w imieniu kupującego. Dostęp projektu nieznany. |
| Zara | Polska pomoc opisuje koszyk, wybór dostawy i płatność na stronie Zara, także jako gość. [Zakupy online](https://www.zara.com/pl/pl/help-center/OnlinePurchases) | Nie potwierdzono udokumentowanego dostępu Ubranka do API katalogu ani koszyka kupującego. Otwieranie strony produktu nie jest integracją zamówień. |
| Zalando | Partner Program pozwala sprzedawcom przesyłać własne produkty, ceny i stany oraz obsługiwać zamówienia; bezpośrednia integracja wymaga wcześniejszej akceptacji. [Opcje integracji](https://partner.zalando.com/university/article/integration-options) | Nie należy traktować tego API jako otwartego katalogu konsumenckiego czy możliwości zakupów dla użytkowników Ubranka. Dostęp projektu nieznany. |
| Reserved | Pomoc dla Polski opisuje dostępność wybranego rozmiaru i ostrzega o opóźnieniu aktualizacji stanów. [Dostępność produktów](https://www.reserved.com/pl/pl/help-product-availability) | Nie potwierdzono udokumentowanego API katalogu ani koszyka dostępnego projektowi. Dokumentacja pomocy potwierdza zachowanie sklepu, nie uprawnienie do integracji. |
| H&M | Oficjalny Partner Tech Hub opisuje integracje dla partnerów, dostęp na zaproszenie i weryfikację organizacji. [Partner Tech Hub](https://partnertechhub.hmgroup.com/) | Zakres katalogu i zakupów dla rynku PL oraz możliwość przyjęcia Ubranka pozostają nieznane. Sam portal partnerski nie potwierdza otwartego API kupującego. |

„Nie potwierdzono” nie znaczy „nie istnieje”. Wyszukiwanie publicznych informacji
nie wyklucza indywidualnych umów, feedów ani programów partnerskich.
Informację H&M odczytano z indeksowanego opisu oficjalnej strony; bez logowania
nie zweryfikowano zawartości dokumentacji partnera ani jej punktów końcowych.

## Zestaw Ubranka a zamówienia sklepowe

Technicznie możemy zaprojektować listę elementów jednego zestawu pochodzących
z kilku sklepów. Taka lista sama nie tworzy koszyków u sprzedawców, nie rezerwuje
produktów, nie łączy płatności i nie dowodzi złożenia zamówienia.

Zara i Reserved wyraźnie podają, że dodanie artykułu do koszyka nie jest rezerwacją.
Przed finalizacją potrzebna jest ponowna kontrola wybranego rozmiaru i dostępności.
[Zara: dostępność](https://www.zara.com/pl/pl/help-center/ItemsAvailability),
[Reserved: dostępność](https://www.reserved.com/pl/pl/help-product-availability).

Potwierdzenie przyszłego zamówienia powinno wskazywać konkretne produkty,
warianty, sprzedawców i pełny koszt. Nie znamy jeszcze zasad wliczania dostaw
i opłat w budżet zestawu. Propozycja: prezentować je osobno i nie przedstawiać
samej sumy cen ubrań jako gwarantowanej końcowej kwoty do zapłaty.

## Specyfika Vinted

Vinted opisuje zestaw zakupowy jako przedmioty od tej samej osoby sprzedającej.
Po zakupie oferty stają się niedostępne dla innych. Do ceny doliczane są opłata
Vinted i wysyłka. [Kupowanie zestawu w Polsce](https://www.vinted.pl/help/260).
Koszt wysyłki zależy m.in. od paczki i lokalizacji oraz jest widoczny w podsumowaniu.
[Wysyłka w Vinted](https://www.vinted.pl/help/753).

Wniosek projektowy: ogłoszenie używanej rzeczy należy modelować jako konkretną
ofertę sprzedawcy, bez zakładania pełnej rozmiarówki ani kolejnej identycznej sztuki.
Potrzebne pola to identyfikator/link, sprzedawca, deklarowany rozmiar i stan rzeczy,
cena, moment sprawdzenia oraz aktualna dostępność. Brak danych nie może stawać się
pewnym dopasowaniem. Sprzedaż rzeczy wymaga nowej propozycji, nie cichej podmiany.
Zestaw stylistyczny z rzeczy kilku sprzedawców nie jest jednym zestawem Vinted.

## Propozycja taniego pilotażu — do przyjęcia, nie ustalone wymaganie

1. Prototyp UX korzysta z jawnych danych demonstracyjnych i własnych materiałów.
2. Możliwy pierwszy realny katalog to ręcznie dodawane linki i opisy; opcjonalnie
   zdjęcie lub zrzut przekazany świadomie przez użytkownika, z ustalonym sposobem
   użycia i przechowywania materiału. Bez automatycznego pobierania ofert.
3. Ubranka może przygotowywać listę zakupową z linkami do konkretnych produktów;
   użytkownik kończy zakup w danym sklepie. To wariant uproszczony wymagający
   uzgodnienia, ponieważ może nie spełnić oczekiwania „koszyka do zatwierdzenia”.
4. Równolegle należy zweryfikować jedną rzeczywistą drogę dostępu do katalogu
   i dopiero na jej podstawie zobowiązać się do integracji pierwszego sklepu.

Nieoficjalny scraper lub API firmy trzeciej nie stanowi samo w sobie potwierdzenia
uprawnień, jakości i trwałości źródła. Nie wybrano takiej usługi. Pilotaż prywatny
nie rozstrzyga warunków późniejszego publicznego użycia danych i zdjęć.

## Decyzja do doprecyzowania i warunki dalszej pracy

Pytanie produktowe: czy „koszyk do zatwierdzenia” oznacza na początek listę zakupów
z przejściem do sklepów, czy jedno potwierdzenie w Ubranka ma już tworzyć i opłacać
zamówienia? Drugi wariant wymaga sprawdzonych integracji zakupowych, rozliczenia
częściowego powodzenia i ustalenia zachowania przy zmianie ceny lub braku rozmiaru.
Nie ma obecnie dowodu, że da się go zapewnić dla wszystkich pięciu źródeł.

Przed podłączeniem wybranego źródła trzeba potwierdzić: rynek PL, zakres katalogu,
rozmiary i ceny, dostęp konta, użycie zdjęć, odświeżanie stanów, limity i koszty,
oraz osobno sposób tworzenia koszyka i zamówienia. Źródło uznajemy za działające
dopiero po sprawdzeniu rzeczywistych odpowiedzi i zmian dostępności; mock nie wystarcza.

Historia: V1.1, 2026-10-24 — pierwsze rozpoznanie źródeł po wywiadzie produktowym.
