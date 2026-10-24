# Koszty i oszczędny pilotaż — V1.1

Data sprawdzenia źródeł: 2026-10-24. Status: propozycja do planowania, nie konfiguracja usług.
Podstawa: odpowiedź 20 — około 150 PLN miesięcznie, możliwie taniej; początkowo Aleksy i Kasia.
Kwota jest celem kosztowym, nie zgodą na uruchomienie rozliczeń ani zakup kredytów API.

## Rekomendacja

Rozpocząć od dwóch użytkowników, posiadanej garderoby i Supabase Free jako kandydata na bazę,
logowanie, prywatne zdjęcia oraz funkcje serwerowe. Zachować istniejący podgląd Vercel, o ile
wybrany plan i faktyczny sposób używania projektu odpowiadają jego warunkom.
Wariant do 150 PLN jest możliwym celem małego pilotażu, a nie potwierdzonym kosztem działającej usługi.
Nie znamy jeszcze liczby zdjęć, sesji ani wizualizacji; nie wykonano pomiarów płatnego API.

## Infrastruktura i alternatywy

| Opcja | Zweryfikowane warunki | Wniosek dla Ubranka |
| --- | --- | --- |
| Supabase Free | 0 USD/mies., 500 MB bazy, 1 GB plików, 50 tys. aktywnych użytkowników/mies., 5 GB transferu i 5 GB transferu z cache, 500 tys. wywołań Edge Functions; projekt może być wstrzymany po tygodniu nieaktywności. | Najprostszy kandydat na mały pilotaż; mierzyć zdjęcia i transfer, skompresować pliki przed zapisem. |
| Supabase Pro | Od 25 USD/mies. | Nie włączać na zapas; ponownie przeliczyć budżet przy potrzebie płatnego planu. |

Źródło: [cennik Supabase](https://supabase.com/pricing). Limity nie dowodzą poprawnej konfiguracji uprawnień,
logowania, poczty ani kopii zapasowych — te elementy wymagają implementacji i osobnej weryfikacji.

Vercel Hobby jest bezpłatny i ograniczony do osobistego, niekomercyjnego użycia. Nie zakładamy,
że sam brak przychodów automatycznie kwalifikuje rozwój produktu komercyjnego do Hobby.
Nie ustalono w tym badaniu planu rozliczeniowego obecnego zespołu. [Warunki Hobby](https://vercel.com/docs/plans/hobby).
Vercel Pro ma opłatę platformową 20 USD/mies., obejmującą jedno miejsce wdrażającego i 20 USD
kredytu na użycie; nadwyżki oraz dodatkowe miejsca mogą zwiększyć rachunek.
[Cennik Pro](https://vercel.com/docs/plans/pro-plan). Przed komercjalizacją wybrać właściwy plan lub hosting.

Tańszy wariant do oceny przy takim przejściu: statyczny eksport Expo na Firebase Hosting Spark,
przy pozostawieniu zdjęć i backendu w Supabase. Hosting ma bezpłatne 10 GB plików i 10 GB transferu
miesięcznie; na Spark przekroczenie transferu może wyłączyć stronę do następnego miesiąca.
To alternatywa wymagająca migracji, nie wykonana zmiana. [Firebase Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing).

Firebase jako pełny backend także jest opcją, lecz Cloud Storage for Firebase wymaga planu Blaze
i konta rozliczeniowego od 03.02.2026; darmowe limity nie oznaczają braku możliwości naliczenia opłat.
Dlatego na start preferujemy ocenę Supabase Free. [Wymagania Cloud Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

## AI i wizualizacja na osobie

Wizualizacja na osobie lub zdjęciu użytkownika pozostaje wymaganiem. Propozycja oszczędności:
uruchamiać ją przyciskiem dla wybranego zestawu, zachowywać wynik i nie generować automatycznie
dwóch nowych obrazów przy każdej rundzie. Częstotliwość pozostaje do uzgodnienia z Kasią i Aleksym.
Dwóch propozycji zestawów nie należy utożsamiać z dwoma płatnymi renderami w każdej rundzie.

GPT Image 2.5 Flare i Sunburst mają standardowe stawki za milion tokenów: tekst wejściowy 5 USD,
obraz wejściowy 8 USD, obraz wyjściowy 30 USD. Równe stawki nie oznaczają równego kosztu obrazu;
zużycie zależy od modelu, jakości i danych. [Koszty generowania obrazów](https://developers.openai.com/api/docs/guides/image-generation#cost-and-latency).
Nie przenosimy ceny „za obraz” ani kalkulatora starszego GPT Image 2 na wersję 2.5.
[GPT Image 2.5 Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare).

Roboczy koszt bez zniżek cache: `(5 × tokeny tekstu + 8 × tokeny obrazu wejściowego + 30 × tokeny obrazu wyjściowego) / 1 000 000 USD`.
Przy Responses API dochodzi zużycie modelu prowadzącego. Osobno liczymy analizę zdjęć, rekomendacje,
przechowywanie, transfer, ponowienia oraz ewentualne podatki i przewalutowanie.
Przyszła, osobno zatwierdzona mała próba musi zapisać rzeczywiste `usage`, ustawienia i koszt;
dopiero jej wyniki pozwolą podać liczbę wizualizacji mieszczących się w budżecie.

Subskrypcja ChatGPT i API mają odrębne rozliczenia. Posiadany abonament nie pokrywa wywołań AI
z aplikacji Ubranka. [OpenAI: rozliczenia ChatGPT i API](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform).

## Podział budżetu do kalibracji

To proponowane pule wydatków dla dwóch osób, a nie prognoza zużycia ani gwarancja cen:

| Pozycja | Pula miesięczna |
| --- | ---: |
| Hosting i backend w bezpłatnych limitach, przy odpowiednim planie | 0 PLN |
| Analiza zdjęć, profil i rekomendacje AI | do 25 PLN |
| Wizualizacje na osobie | do 75 PLN |
| Rezerwa: zmienność zużycia, kurs, podatki, poczta i inne opłaty | 50 PLN |
| Łączny cel | 150 PLN |

Włączenie Vercel Pro albo Supabase Pro wymaga ponownego podziału tych samych 150 PLN;
ich abonamentów nie można dopisać poza tabelą. Pilotaż bez płatnych wywołań może kosztować 0 PLN
w limitach usług, ale nie potwierdza działających wizualizacji AI. Nie zakładamy darmowego katalogu sklepów,
opłat za domenę, publikacji sklepowej ani komercyjnej skali; ich koszt pozostaje do ustalenia.

## Kontrola kosztów przed podłączeniem AI

- Analizować zdjęcie przy dodaniu lub zmianie; ponownie używać zapisanego opisu i zaakceptowanych wyników.
- Po stronie serwera prowadzić rejestr kosztów, rezerwować pulę przed żądaniem i rozliczać faktyczne `usage`.
- Ograniczyć jednoczesne generacje, rozmiary, jakość, liczbę obrazów i ponowienia; zabezpieczyć podwójne kliknięcie.
- Po wykorzystaniu puli blokować nowe płatne żądania; zachować dostęp do szafy i wcześniejszych propozycji.
- Ustawić także limity dostawcy z rezerwą. OpenAI opisuje opcję `Enforce a hard limit`, lecz egzekwowanie
  nie jest natychmiastowe; same alerty nie zatrzymują żądań. [Limity OpenAI](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform).
- Przed aktywacją ustalić liczbę użytkowników, sesji i wizualizacji, okres przechowywania zdjęć oraz
  czy 150 PLN obejmuje istniejące abonamenty właściciela. W tej propozycji to budżet nowych kosztów aplikacji.

Weryfikacja: przeczytano oficjalne cenniki i dokumentację; nie zakładano kont, nie zmieniano planów,
nie uruchamiano płatnych generacji i nie potwierdzono jeszcze jakości wirtualnej przymiarki.
