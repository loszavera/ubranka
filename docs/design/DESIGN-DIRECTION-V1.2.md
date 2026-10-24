# Wybrany wygląd — V1.2

Data: 2026-10-24. Użytkownik wybrał **A — Krem i śliwka**.
Zastępuje otwarty wybór i rekomendację B z [porównania V1.1](DESIGN-CONCEPTS-V1.1.md).
Źródłowe makiety i prompty pozostają bez zmian jako historia wyboru.

![Wybrany kierunek A — Krem i śliwka](a-krem-sliwka.png)

## Podstawa realizacji

- Ciepłe kremowe tło `#F7F3EE`, śliwkowy kolor główny `#553C50`, subtelne
  lawendowe powierzchnie i ciemny tekst. Paletę wdrażać przez wspólne wartości stylów.
- Miękkie karty, czytelna typografia i duże przyciski. Szczegółowe odstępy,
  rozmiary tekstu i stany trzeba ocenić w działającym układzie na telefonie.
- Dwa pełne zestawy. Początkowy tryb to „Najlepiej dopasowane”; tryb
  „Ekonomiczny / markowy” i domyślną preferencję wybiera użytkownik.
- „Podoba mi się” zapisuje gust; koszyk/lista zakupowa ma osobną czynność.
- Interfejs PL/EN od pierwszego prototypu: teksty w słownikach, zapamiętywany
  wybór języka, uwzględnienie różnych długości tłumaczeń i etykiet dostępności.
  Polski jest początkowym językiem; Aleksy może przełączyć na angielski.
- Język interfejsu nie przełącza rynku, waluty ani kraju dostawy. Oferta nadal
  dotyczy Polski i PLN. Dodatkowe języki nie wymagają osobnej wersji aplikacji.

## Granica zatwierdzenia

Wybrano kierunek estetyczny. Makieta nadal jest obrazem z przykładową osobą,
produktami i cenami, a nie działającą aplikacją ani dowodem wirtualnej przymiarki.
Budżet w przyszłym ekranie pokazuje nowy wydatek: rzeczy do kupienia i dostawy;
ubrania z własnej szafy mają 0 PLN nowego wydatku. Nieznanych opłat nie uznajemy za 0.

Przyciski, tekst i karty implementujemy jako komponenty Expo/React Native.
Nie używamy obrazu całej makiety jako interfejsu. Wymagane są czytelność na małym
ekranie, obsługa powiększania tekstu, kontrast, klawiatura WWW i etykiety czytnika.
Testy obejmą PL i EN oraz przykłady dla kobiet i mężczyzn.

Nie generowano nowych obrazów ani nie zmieniano obecnego ekranu startowego.
