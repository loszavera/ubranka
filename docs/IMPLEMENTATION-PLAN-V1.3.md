# Plan implementacji Ubranka — V1.3

Data: 2026-10-24. Propozycja po teście P2 i zgłoszeniu dodatkowych okazji.
Ten dokument uzupełnia [plan V1.2](IMPLEMENTATION-PLAN-V1.2.md) o P2.1.
Pozostałe etapy P0–P5 i ich zależności pozostają bez zmian. Aktualne wymagania:
[V1.3](REQUIREMENTS-V1.3.md), dziedziczące pełną bazę V1.2.

## Stan i upoważnienie

P2 jest zaimplementowany i sprawdzony zgodnie z [raportem](P2-VERIFICATION.md).
Użytkownicy potwierdzili wykonanie własnego testu oraz zgłosili potrzebę
dodatkowych okazji, np. wesela. Poprosili o propozycję kontynuacji.
Niniejszy plan nie uruchamia implementacji P2.1 ani usług P3.

## Rekomendowany następny etap: P2.1 — okazje i dobór do sytuacji

Cel: obsłużyć zgłoszony scenariusz i doprecyzować dobór, zachowując prosty wybór
dwóch zestawów. W aktualnym kodzie P2 zgodność okazji tylko dodaje punkty rankingu;
nie wyklucza zestawów opisanych inną okazją. Sam nowy przycisk nie wystarczy.

Proponowany zakres do akceptacji:

1. Wybór okazji przed rundą, niezależny od profilu gustu. Dotychczasowe wybory
   pozostają; nowe to wesele jako gość, praca, randka i impreza, w PL/EN.
2. Rozszerzenie modelu dopuszczalnych okazji i przykładów ubrań/zestawów dla
   obu grup odzieży. Dany zestaw może pasować do kilku okazji. Dla wesela
   przygotować przykłady pozwalające sprawdzić oba tryby porównania.
3. Filtrowanie zgodności z okazją przed rankingiem gustu. Nie przekraczać budżetu
   ani nie podsuwać niewłaściwej okazji jako zastępczej propozycji. Jedna pasująca
   propozycja lub brak wyników są poprawnymi stanami.
4. Odtwarzanie dotychczasowego zapisu P2 z zachowaniem profili, opinii, szafy,
   języka i domyślnego trybu; bez wymuszania wyczyszczenia danych demonstracyjnych.
5. Testy wyboru okazji, budżetu, obu trybów i migracji, kontrola WWW PL/EN,
   eksporty platform oraz podgląd Vercel z dev. Raport i dokumentacja po wykonaniu.

Rezultat do odbioru: „Wybieram wesele i budżet, dostaję najwyżej dwie pasujące
propozycje albo informację, że brak zestawów”. Odbiór według A-12 z V1.3.
Jest to nadal prototyp demonstracyjny; P2.1 nie wymaga nowych kont ani usług płatnych.

## Kolejny większy etap po P2.1

P3 z V1.2: prywatna szafa z własnymi zdjęciami oraz ograniczone sprawdzenie
jakości i kosztu wizualizacji. Przed jego uruchomieniem przygotować konkretną
propozycję dostawców, kosztów, zakresu danych, retencji i usuwania oraz zakres
pierwszej iteracji do akceptacji. Nie przesyłać realnych zdjęć na podstawie
samej ogólnej deklaracji dalszej budowy. Plan 150 PLN/mies. nie aktywuje rozliczeń.

## Historia

V1.3 wstawia P2.1 jako odpowiedź na feedback i zachowuje kierunek własnej szafy
przed integracjami sklepów. Wersje V1.0–V1.2 pozostają bez zmian.
