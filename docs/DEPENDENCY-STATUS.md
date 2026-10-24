# Stan zależności — 2026-10-24

Zakres: prototyp P2, Expo SDK 57; audyt odświeżony po dodaniu AsyncStorage,
SVG, expo-network oraz narzędzi testowych. Aktualny raport P2:
`artifacts/p2-npm-audit.json`; liczba i źródła zgłoszeń pozostają takie jak w P0.

## Wynik audytu

`npm audit --json` zgłasza **8 wpisów pakietów: 5 high, 3 moderate, 0 critical**.
Są to **3 źródłowe zgłoszenia bezpieczeństwa** oraz wpisy ich zależności nadrzędnych,
a nie osiem niezależnych podatności. Surowy raport zapisano lokalnie w
`artifacts/npm-audit.json` (katalog ignorowany przez Git).

| Pakiet i ścieżka | Zgłoszenie | Zakres i dostępna poprawka |
| --- | --- | --- |
| `node-forge@1.4.0` ← `@expo/cli@57.0.32` oraz `@expo/code-signing-certificates@0.0.6` | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), high: weryfikacja podpisów RSA | Zależność narzędzi CLI/podpisywania. W dniu przeglądu latest npm to 1.4.0; advisory nie wskazuje naprawionej wersji. |
| `zod@3.25.76` ← `@expo/cli@57.0.32` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), high: nadmierne zużycie pamięci podczas walidacji | Importy stwierdzono w schematach DevTools/MCP serwera CLI. CLI wymaga `^3.25.76`; aktualna poprawka jest w 4.6.6+, poza tym zakresem. |
| `decode-uri-component@0.2.2` ← `query-string@7.1.3` ← `expo-router@57.0.29` | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), moderate: kosztowne dekodowanie niepoprawnych URL | Zależność routera aplikacji, więc nie wyłącznie narzędzi developerskich. Poprawka 0.5.0+; obecne latest 0.5.1 jest ESM, a query-string 7 wymaga `^0.2.2` i używa CommonJS. |

Nie wykonano analizy osiągalności wszystkich podatnych funkcji ani próby wykorzystania
tych problemów w Ubranka. Sam raport i obecność pakietu nie dowodzą podatności
konkretnego ekranu. Nie należy też traktować udanego builda jako dowodu jej braku.

## Dlaczego nie zastosowano automatycznej naprawy

- Audyt proponuje m.in. przejście Expo do 54.0.38 lub Routera do 58.0.26.
  To niespójne zmiany głównych wersji względem wybranego zestawu SDK 57.
- Zod 4 wymaga sprawdzenia zgodności API i narzędzi Expo. Brak poprawki w aktualnej linii Zod 3.
- Sam override dekodera do 0.5.1 zmienia także sposób eksportowania modułu;
  nie jest zweryfikowaną zamianą dla CommonJS query-string 7.
- node-forge nie ma obecnie wydanej poprawki wskazanej przez advisory.
- Nie używać `npm audit fix --force`, nie wyciszać raportu i nie dodawać
  niesprawdzonych override tylko po to, by uzyskać zerowy licznik.

## Obecny zakres i ograniczenie ekspozycji

P2 zawiera lokalne profile, opinie, szafę demo i ranking fikcyjnych zestawów:
bez kont, uploadu zdjęć, płatności ani backendu. Ustawienia i opinie są lokalne.
Do podglądu WWW przygotowany jest eksport statycznych plików SPA; serwera Expo CLI
nie należy wystawiać jako publicznego backendu. Serwery developerskie uruchamiać
w kontrolowanym środowisku, a test telefonu traktować jako test techniczny.

To ograniczenie zakresu prac, **nie dowód usunięcia podatności**. Zależność dekodera
należy ponownie ocenić przy rozbudowie routingu, parametrów URL i linków aplikacji.

## Pozostałe komunikaty instalacji

- `eslint@9.39.5` jest oznaczony w npm jako deprecated. Aktualne pluginy
  `eslint-plugin-react@7.37.5` i `eslint-plugin-import@2.32.0` deklarują zgodność
  do ESLint 9; samo przejście na latest 10.13.0 nie jest zgodnym uaktualnieniem
  całego zestawu. Lint aktualnego projektu przechodzi.
- Pominięty postinstall `unrs-resolver@1.12.2` nie wymagał dodatkowego zatwierdzenia
  na tej stacji: opcjonalny `@unrs/resolver-binding-win32-x64-msvc@1.12.2` jest
  zainstalowany, bezpośredni `require('unrs-resolver')` działa i udostępnia
  `ResolverFactory`. Lint również przechodzi. Nie uruchamiano pominiętego skryptu.
  Dodatkowo czysta instalacja i lint na runnerze Ubuntu przeszły w
  [CI dla 289480f](https://github.com/loszavera/ubranka/actions/runs/40090246634).

## Następny przegląd

1. Przed wdrażaniem rzeczywistych danych i funkcji odświeżyć audyt oraz status
   poprawek upstream; zweryfikować aktualny SDK wspierany przez Expo Go.
2. Sprawdzić spójną migrację Expo/Routera, która usuwa stary dekoder,
   i zgodny zestaw ESLint/pluginów. Nie aktualizować pojedynczego pakietu Expo na inną linię SDK.
3. Jeśli upstream nadal nie dostarcza poprawki, udokumentować analizę osiągalności
   oraz wybrać kontrolowaną migrację lub utrzymywaną poprawkę z testem regresyjnym.
4. Po zmianach uruchomić `npm run check`, `npm run check:dependencies`,
   `npm run doctor`, `npm run build:all`, test WWW i testy na urządzeniach.
   Zaktualizować ten dokument i zachować nowy raport audytu.
