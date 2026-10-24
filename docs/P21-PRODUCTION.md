# P2.1 — odbiór i publikacja main

Data: 2026-10-24. Użytkownik zaakceptował P2.1 i polecił przenieść całość do main.

- Fast-forward `main`: `0203382a7581124006cbe88a607d1b9a0b5ae2f2` →
  `9bc50acef56f7b41525bfd9fb0cbb682e04fe26a`, bez force push i bez utraty historii.
  Po publikacji lokalne/zdalne main i dev były zgodne; praca wróciła na dev.
- Porównano kod, zasoby, zależności, konfigurację Vercel i testy z `3c555b5`:
  bez różnic względem [CI SUCCESS](https://github.com/loszavera/ubranka/actions/runs/40111604543).
  Wyniki: 15/15 domena, 13/13 WWW, typy/lint, SDK i eksporty platform.
- Vercel Production: `dpl_21XuJzQigJzLn6Y39NKA9taZ1rvM`, main/9bc50ac, **READY**.
  Adres: https://ubranka.vercel.app. Ochrona projektu pozostała bez zmian.
- Test w izolowanej przeglądarce 2026-10-24 16:44 UTC: HTTP 200, start PL,
  damskie/męskie wesele, oba tryby, cztery nowe ilustracje, praca/randka/impreza,
  EN, opinia i reload, migracja zamrożonych danych V1 — PASS, 0 błędów JavaScript.
  Dowód lokalny: `artifacts/p21-production-verification.json` i zrzuty
  `artifacts/p21-production-wedding-*.png` (ignorowane w Git).
- Opublikowany bundle: `entry-803c3255b7cf97d066192f255b6a7d1b.js`, zgodny
  z wersją Linux/CI i podglądem. Nie przeprowadzano nowych testów natywnych.

**Dane na dev i main są osobne**, ponieważ zapis P2 jest lokalny dla adresu strony.
Publikacja kodu nie kasuje danych dev ani nie kopiuje ich do ubranka.vercel.app.
Używając głównego adresu, można zobaczyć start z pustymi ustawieniami; dotychczasowy
zapis pozostaje w przeglądarce pod adresem dev. Import/synchronizacja to proponowane P3.

Po tej publikacji dopisano wyłącznie dokumentację: odbiór, propozycję P3, koszty
i zasady danych. Publikacja tych dokumentów nie dodaje funkcji P3 do aplikacji.
Oryginalny [raport P2.1](P21-VERIFICATION.md) zachowuje historię testów.
