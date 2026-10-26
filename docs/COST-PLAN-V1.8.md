# Koszty Ubranka — V1.8: zatwierdzony pilotaż C2

Data: 2026-10-26. **ZATWIERDZONE dla C2**, w tym granica gwarancji ceny oraz wyłączenie
automatycznych doładowań całej organizacji i pozostawienie OFF po pilotażu.
C1 odebrane. Rozwinięcie [V1.7](COST-PLAN-V1.7.md), powiązane z [planem V1.9](IMPLEMENTATION-PLAN-V1.9.md)
i [zasadami danych V1.2](P33-AI-DATA-POLICY-V1.2.md). Wykonanie: [raport C2](P33C2-VERIFICATION.md).
AI pozostaje OFF do spełnienia warunków aktywacji.

## Model i punkt odniesienia

`gpt-image-2.5-flare-2026-09-08`, bezpośrednie Images edits, `n=1`, `quality=medium`,
`size=1024x1536`, PNG/opaque, moderacja auto; bez streamingu, Files API i modelu tekstowego.
Standard: 5/8/30 USD za milion tokenów tekstu wejściowego / obrazów wejściowych / wyjścia,
sprawdzone 2026-10-26; bez rabatu cache w bezpośrednim Images API.
[Model](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare), [koszty i usage](https://developers.openai.com/api/docs/guides/image-generation#cost-and-latency).
B: 6 wywołań, 0,214403 USD i 1,49 PLN budżetowo. To pomiar syntetyczny, nie górna cena zdjęcia prywatnego.
60 żądań podobnych do B oznacza około 14,90 PLN przy średniej lub 16,80 PLN przy największym koszcie B.
To orientacja, nie obietnica dla prywatnych zdjęć ani gwarancja wykonania 60 wysłań.
Ostrzejsza miniatura powstaje z zapisanego wyniku, bez ponownej generacji AI.

## Limity całej próby

| Zakres | Zatwierdzona granica C2 |
| --- | --- |
| Czas | 30 kolejnych dni od aktywacji zapisanej na serwerze, bez automatycznego przedłużenia. |
| Budżet | 25 PLN na cały pilotaż dla obu kont, również przez granicę miesięcy; równolegle dotychczasowe 25 PLN/miesiąc UTC całej aplikacji. B za 149 groszy pozostaje w swoim miesiącu. |
| Wysłania | 60 łącznie, 30/konto w całym pilotażu, 5/konto/dobę UTC. Błędy zajmują slot; bez automatycznych/ręcznych ponowień tej samej operacji. |
| Równoległość | Jedna generacja globalnie, brak niejawnej kolejki i alternatywnego modelu po błędzie. |
| Miejsce | 30 aktywnych wyników i 100 MB AI/konto w 250 MB całego konta; pliki i rezerwy razem. PNG ≤8 MB, miniatura ≤100 000 B. |

Pierwsze kliknięcie uczestnika jest pierwszą płatną próbą i wchodzi do 60; bez dodatkowych płatnych testów operatora.
Każda osoba uruchamia własne zlecenia. Odrzucenie/usunięcie wyniku, nowe UUID lub ponowne logowanie
nie przywracają slotów ani kosztów. Nowe zlecenie wymaga odrębnych wejść lub zestawu, nie ukrytego retry.
30 wysłań nie oznacza 30 dobrych obrazów. Budżet, miejsce, finansowanie lub termin mogą zatrzymać pilot wcześniej.

## Rezerwy i rozliczenie

Pierwsze żądanie C blokuje cały wolny budżet: minimum z pozostałego limitu trialu i miesiąca, po rezerwach.
Rezerwa jest blokadą w liczniku aplikacji, nie zakupem kredytów ani naliczeniem całej kwoty przez OpenAI.
Przykład: jeśli miesiąc zawiera tylko B za 1,49 PLN, wolne jest 23,51 PLN. To przykład księgi aplikacji,
nie saldo kredytów OpenAI. Kolejna rezerwa: `max(1 PLN, 2 × największy rozliczony koszt C + 0,20 PLN)`,
zaokrąglona w górę do grosza. Pierwszy pomiar wymaga jawnej akceptacji braku gwarantowanej ceny żądania.
Jedna transakcja sprawdza osobno: koszt trialu + jego rezerwy + nowa rezerwa ≤25 PLN oraz analogicznie
koszt miesiąca + jego rezerwy + nowa rezerwa ≤25 PLN; sprawdza też sloty, czas, zgodę, wejścia i miejsce.

Pełne rzeczywiste `usage` rozliczamy według zapisanej wersji stawek; kwoty USD zachowujemy dokładnie.
Budżet PLN zaokrąglamy w górę per żądanie, mnożnikiem 6,765 PLN/USD (5 ×1,23 ×1,10): to bufor,
nie bieżący kurs ani podatek konta. Przed startem sprawdzić adekwatność; nie obniżać dla zwiększenia liczby prób.
Brak/niespójność usage, nieznany wynik wysłania lub koszt ponad rezerwę oznaczają globalny STOP nowych wysyłek.
Timeout nie zwalnia rezerwy. Rozliczenie pozostaje wymagane po końcu próby, wycofaniu zgody lub kasacji konta.
Nie obcinamy kosztu do rezerwy; przechowujemy pełną znaną kwotę albo nierozstrzygniętą rezerwę.
**Rezerwa kontroluje nowe wysyłki, nie maksymalną cenę przyjętego żądania.** Nie gwarantujemy faktury do 25 PLN:
pojedyncze przyjęte żądanie może przekroczyć rezerwę, a nawet budżet 25 PLN;
kontrakt nie ma `max_cost`, a limity dostawcy mogą działać z opóźnieniem. [API edits](https://developers.openai.com/api/reference/resources/images/methods/edit), [spend limits](https://developers.openai.com/api/docs/guides/spend-limits).

## Zatwierdzone finansowanie

**Wyłącznie istniejące opłacone kredyty API; zero nowych wpłat, doładowań i abonamentów.** Zgoda finansowa B wygasła.
Właściciel zatwierdził jedną jawną zmianę: **wyłączyć auto-reload w całej organizacji OpenAI**.
Dotyczy to także innych projektów korzystających z jej wspólnych kredytów; nie zmienia abonamentu ChatGPT.
Auto-reload pozostanie OFF po C2, bez automatycznego przywrócenia.
2026-10-26 wyłączono i potwierdzono OFF w panelu; nie dokonano nowych wpłat.
Przed aktywacją trzeba potwierdzić wyłączenie, dostępność finansowania i brak niezatwierdzonych obciążeń.
Jeśli nie można tego potwierdzić albo środków brakuje, pozostaje AI OFF; bez ręcznego doładowania i obejścia.
Kredyty są wspólne: inne projekty mogą je zużyć. Pogorszenie warunków zatrzymuje wysyłki, nie zwiększa budżetu.
Dokładne saldo i pozostałe ustawienia konta pozostają poza repo.

## Zakończenie

Zatwierdzony nowy ograniczony klucz C tylko w sekretach Supabase, z ważnością najpóźniej do końca C2.
Brak potwierdzenia terminu wygaśnięcia tego klucza blokuje aktywację i wymaga uzgodnienia innego sposobu końca.
Po terminie/limicie: AI OFF; kontrola końcowa unieważnia klucz i usuwa sekret. Sam koniec daty nie jest
dowodem usunięcia sekretu. Bez resetowania B/C, nowego okna lub automatycznej zgody na D.
Gotowe prywatne wyniki pozostają dostępne do własnego terminu retencji. Raport publiczny: wyłącznie agregaty.
Istniejące usługi Free bez upgrade; ich limity sprawdzić przed aktywacją. 150 PLN/mies. pozostaje celem całej
aplikacji, odrębnym od 25 PLN AI. Nie zatwierdzono nowych usług, planów ani komercyjnej skali.
