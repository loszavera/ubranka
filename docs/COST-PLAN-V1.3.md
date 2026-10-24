# P3 — usługi i koszty V1.3

Data sprawdzenia: 2026-10-24. **Plan do zatwierdzenia; brak uruchomionych opłat.**
Zastępuje szacunki usług z V1.1/V1.2 w poniższym zakresie. Zachowuje cel około
150 PLN/mies. i wolumen 30 wizualizacji/osobę, 60 łącznie.

## P3.1 — najtańszy użyteczny wariant

Rekomendacja: Supabase Free + obecny Vercel + Google OAuth. Cel to **0 PLN nowych
abonamentów** w małym pilotażu. Nie oznacza to potwierdzenia zerowego rachunku
obecnego zespołu Vercel — jego plan nie był dostępny w odpowiedzi narzędzia.
Nie zmieniono kont usług, limitów ani rozliczeń.

| Usługa | Cennik / ograniczenie | Decyzja proponowana |
| --- | --- | --- |
| Supabase Free | 0 USD, 500 MB DB, 1 GB Storage, 5 GB egress i osobno 5 GB cached egress; do 2 aktywnych projektów; pauza po tygodniu nieaktywności. | Dwa dostępne projekty na test i pilot, brak automatycznych backupów. Jeśli limit konta jest już zajęty, nie aktywować Pro automatycznie. |
| Supabase Pro | Od 25 USD/mies. z pierwszym projektem; dodatkowy projekt od 10 USD/mies.; 7 dni backupów DB. | Rozważyć przy wymaganiu stałej dostępności, nie kupować w P3.1. Backup DB nie jest backupem zdjęć. |
| Vercel | Hobby darmowy tylko do osobistego, niekomercyjnego użycia; Pro od 20 USD/mies. z możliwością opłat za użycie. | Zachować obecny plan. Warunki ponownie ocenić przed komercyjnym uruchomieniem. |
| Google OAuth | W tym wariancie nie planujemy SMS ani wysyłki email OTP; wymagana konfiguracja klienta i konta obu osób. | Brak nowego płatnego produktu logowania; nie uruchamiać dodatkowych API Google. |
| Resend — alternatywa | Free: 3000 wiadomości/mies., 100/dzień; wymagana własna zweryfikowana domena. | Tylko gdy zostanie wybrany email OTP zamiast Google. Domena/odnowienie to osobny koszt. |
| Firebase — alternatywa | Storage wymaga Blaze i Cloud Billing; opłaty za użycie, darmowe limity zależne od regionu. | Drugi wybór; nie jest wariantem bez aktywacji rozliczeń dla nowego Storage. |

Źródła: [Supabase](https://supabase.com/pricing),
[Vercel Hobby](https://vercel.com/docs/plans/hobby), [Vercel Pro](https://vercel.com/docs/plans/pro-plan),
[Resend](https://resend.com/pricing), [domena Resend](https://resend.com/docs/dashboard/domains/introduction),
[Firebase Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

100 rzeczy × (1 MB zdjęcie + 0,1 MB miniatura) × 2 osoby = około **220 MB**.
To estymacja dla ustalonych limitów, nie aktualne użycie. Proponowany limit 250 MB
na konto zostawia rezerwę na przetwarzanie. Miniatury tworzymy w aplikacji;
lista ładuje je stopniowo, bez płatnego przekształcania każdego odczytu.
Transfer też jest ograniczony: darmowy magazyn nie oznacza nieograniczonego pobierania.

## AI — scenariusze, nie obietnica ceny

Kandydaci: [GPT Image 2.5 Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst)
i [Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare).
Standardowo za 1 mln tokenów: tekst wejściowy 5 USD, obraz wejściowy 8 USD,
obraz wyjściowy 30 USD. Nie przenosimy dawnych tabel ceny obrazu na modele 2.5.
Abonament ChatGPT nie finansuje wywołań aplikacji przez API;
[rozliczenia są odrębne](https://learn.chatgpt.com/docs/pricing).

Przykład rachunku dla 60 zaakceptowanych wyników i 15 dodatkowych prób:
75 wywołań, każde z 1000 tokenów tekstu i 10 000 tokenów obrazów wejściowych.
Kurs **5 PLN/USD jest wyłącznie założeniem planistycznym**, nie bieżącym notowaniem.

| Założone tokeny obrazu wyjściowego / próbę | USD / próbę | 75 prób w PLN przed podatkami |
| --- | ---: | ---: |
| 2000 | 0,145 | 54,38 |
| 4000 | 0,205 | 76,88 |
| 8000 | 0,325 | 121,88 |

Wzór: `(1000×5 + 10000×8 + tokeny_wyjścia×30) / 1000000 × 75 × 5`.
To analiza wrażliwości, nie zmierzony koszt medium ani gwarancja 60 udanych wyników.
Brakuje podatków, opłat/przewalutowania, analizy rzeczy, ewentualnych abonamentów
i dopłat regionalnych. Próba pokaże rzeczywiste tokeny i odsetek odrzuconych wyników.

Pełne P3 z darmową infrastrukturą może zmieścić się w 150 PLN, ale wariant wysokiego
zużycia może go przekroczyć. Dwa płatne abonamenty Supabase Pro + Vercel Pro to
co najmniej 45 USD (225 PLN przy założeniu 5 PLN/USD), przed AI i podatkami;
dwa projekty Supabase zwiększają ten próg o kolejne co najmniej 10 USD.
Nie przedstawiamy budżetu pilota jako budżetu gotowej usługi komercyjnej.

## Proponowane ograniczenia

- P3.1: bez płatnego AI i nowych abonamentów. Dostępność i backup Free opisane
  w [polityce danych](P3-DATA-POLICY-V1.0.md); brak automatycznej zmiany planu.
- P3.2: osobno zatwierdzona próba do **12 wywołań / 25 PLN**, zależnie od tego,
  który limit zostanie osiągnięty pierwszy. Wliczamy dwie początkowe próby kalibracyjne,
  wszystkie błędy i ponowienia. Przykładowo 12 × 0,325 USD × 5 = 19,50 PLN przed
  podatkami; pozostaje bufor, lecz nie gwarantujemy wykonania całych 12 prób.
- Aplikacja rezerwuje przewidywany koszt przed zleceniem, zapisuje rzeczywisty
  koszt i blokuje kolejną próbę, gdy koszt jest nieznany lub zabraknie rezerwy.
  Nie powtarza niepewnego requestu automatycznie. Brak wiarygodnej górnej estymacji
  wymaga zatrzymania próby, nie zgadywania.
- Po pomiarach ustalamy miesięczne pule (wstępnie 75 PLN wizualizacje, 25 PLN
  analiza/rekomendacje, 50 PLN pozostałe koszty/rezerwa) w ramach 150 PLN.
  30 zaakceptowanych wyników/osobę jest oddzielne od rejestru wszystkich płatnych prób.
- Limit aplikacji uzupełnia limit projektu u dostawcy i alert. OpenAI umożliwia
  twardy limit, ale jego egzekwowanie jest opóźnione, więc może wystąpić niewielkie
  przekroczenie. Bufor oraz ograniczenie równoległych zleceń są konieczne.
  [Spend limits](https://developers.openai.com/api/docs/guides/spend-limits).

Przed płatnym startem ponownie sprawdzić cenę/model, dostęp konta, minimalną wpłatę,
podatki i rzeczywiste użycie infrastruktury. Ten dokument niczego nie kupuje.
