# Ilustracje zestawów P2.1

Data: 2026-10-24. Cztery oryginalne ilustracje wygenerowane wbudowanym narzędziem
imagegen, po jednej na zestaw. Nie użyto API projektu ani CLI i nie konfigurowano
płatnego dostawcy. Narzędzie nie potwierdza konkretnej wersji modelu Images.

## Zakres i kontrola

- Ilustracje przedstawiają fikcyjne dorosłe osoby; nie użyto zdjęć użytkowników,
  sklepów ani obrazów wejściowych. Nie są ofertą handlową ani wynikiem przymiarki.
- Obejrzano wszystkie cztery wyniki: pełna głowa i obuwie pozostają w kadrze,
  ubrania odpowiadają katalogowi, ciepłe kremowe tło pasuje do kierunku A.
  Nie stwierdzono napisów, widocznych marek lub niezamówionych dodatków.
- PNG mają 1024 × 1536 px (2:3). Oryginalne wyniki skopiowano z generated_images
  bez przetwarzania. Istniejące ilustracje w1–w4 i m1–m4 pozostają niezmienione.
- Nie zakładamy zachowania tożsamości osoby między niezależnymi generacjami
  ani potwierdzenia fizycznego dopasowania ubrania. Ceny to dane demonstracyjne.
- Prototyp określa ogólny scenariusz gościa weselnego. Katalog nie interpretuje
  rzeczywistego zaproszenia, indywidualnego dress code'u ani warunków pogodowych.

## Pliki i zgodność katalogu

| ID | Plik | Zestaw | Segment | Demo z dostawą |
| --- | --- | --- | --- | --- |
| w5 | [PNG](../../assets/outfits/w5.png) | Przygaszona niebieska sukienka midi, beżowe czółenka | Ekonomiczny | 302 PLN |
| w6 | [PNG](../../assets/outfits/w6.png) | Śliwkowa sukienka midi, ciemne czółenka | Markowy | 452 PLN |
| m5 | [PNG](../../assets/outfits/m5.png) | Granatowy garnitur, biała koszula z granatowym krawatem, czarne derby | Ekonomiczny | 434 PLN |
| m6 | [PNG](../../assets/outfits/m6.png) | Grafitowy garnitur, błękitna koszula z szarym krawatem, brązowe sznurowane półbuty | Markowy | 490 PLN |

Koszt nowych rzeczy obejmuje demonstracyjne 12 PLN dostawy za rzecz.
Krawat jest częścią pozycji koszuli; nie ma ukrytej dodatkowej płatnej pozycji.
Zestawy damskie są kompletne przez sukienkę i buty; garnitury obejmują marynarkę,
koszulę z krawatem, spodnie i buty. Aktualne kwoty rozstrzyga
[katalog](../../src/domain/catalog.ts).

## Dokładne prompty

Każde wywołanie miało `transparent_background: false`, bez obrazów referencyjnych.

### w5

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult woman around 30, shoulder-length brown hair.
Exact outfit: muted dusty blue midi dress with short sleeves, a simple fitted waist and softly flared skirt; nude beige closed-toe pumps with a modest heel. This is a wedding guest outfit, not bridal clothing. Dress hem below the knee and both shoes fully visible.
```

### w6

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult woman around 35, mid-length dark brown hair.
Exact outfit: deep muted plum midi wrap-style dress with elbow-length sleeves and a modest neckline, softly draped skirt without a high slit; dark plum almost black closed-toe pumps with a modest heel. This is a wedding guest outfit, not bridal clothing. Dress hem below the knee and both shoes fully visible.
```

### m5

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult man around 35, short brown hair.
Exact outfit: matching dark navy two-piece suit, jacket worn open, white long-sleeve dress shirt, dark navy tie, matching navy tailored trousers, black lace-up derby dress shoes. Wedding guest, tasteful and approachable. Show the whole suit and both shoes. No waistcoat, pocket square or boutonniere.
```

### m6

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult man around 40, short dark brown hair.
Exact outfit: matching dark charcoal two-piece suit, jacket worn open, pale blue long-sleeve dress shirt, muted grey tie, matching charcoal tailored trousers, brown lace-up dress shoes. Wedding guest, tasteful and approachable. Show the whole suit and both shoes. No waistcoat, pocket square or boutonniere.
```
