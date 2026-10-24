# Ilustracje zestawów P2

Data: 2026-10-24. Osiem oryginalnych ilustracji wygenerowano wbudowanym narzędziem imagegen.
Nie użyto klucza API projektu ani CLI. Narzędzie nie udostępnia wyboru ani potwierdzenia
konkretnej wersji modelu; nie przypisujemy obrazom niepotwierdzonej wersji Images.

## Przeznaczenie i kontrola

- Zasoby są demonstracyjnymi ilustracjami dla prototypu P2, nie ofertami sklepów,
  zdjęciami Kasi/Aleksego ani dowodem działania wirtualnej przymiarki.
- Wszystkie osoby są fikcyjne i dorosłe. Nie użyto zdjęć wejściowych ani materiałów sklepów.
- Obejrzano wszystkie osiem obrazów: pokazują pełną postać i obuwie, zgodny zestaw
  ubrań, jednolite ciepłe tło; nie zawierają napisów ani widocznych marek.
- Każdy PNG ma proporcje 2:3, 1024 × 1536 px. Przy wyświetlaniu zachować pełny kadr
  zamiast ucinać głowę lub buty; najlepiej kontener o tych samych proporcjach.
- Wygląd twarzy i ubrań jest generowany i ilustracyjny. Nie zakładamy zachowania
  tożsamości osoby między niezależnymi generacjami ani fizycznego dopasowania rozmiaru.
- Oryginały skopiowano z katalogu generated_images do repozytorium bez przerabiania.

## Pliki

| ID | Plik | Ubrania |
| --- | --- | --- |
| w1 | [PNG](../../assets/outfits/w1.png) | cream crewneck knit sweater, navy wide-leg trousers, white low sneakers |
| w2 | [PNG](../../assets/outfits/w2.png) | black relaxed blazer worn open, white simple top, beige tailored trousers, cream loafers |
| w3 | [PNG](../../assets/outfits/w3.png) | taupe cardigan worn open, white simple top, medium blue straight jeans, tan loafers |
| w4 | [PNG](../../assets/outfits/w4.png) | navy tailored blazer worn open, pale blue shirt, navy tailored trousers, black loafers |
| m1 | [PNG](../../assets/outfits/m1.png) | ecru crewneck sweater, navy chinos, white low sneakers |
| m2 | [PNG](../../assets/outfits/m2.png) | navy blazer worn open, light blue shirt, beige chinos, brown loafers |
| m3 | [PNG](../../assets/outfits/m3.png) | olive overshirt worn open over a white T-shirt, charcoal jeans, white low sneakers |
| m4 | [PNG](../../assets/outfits/m4.png) | charcoal blazer worn open, white shirt, charcoal tailored trousers, black derby shoes |

## Dokładne prompty

Każda pozycja to oddzielne wywołanie narzędzia, z nieprzezroczystym tłem
(`transparent_background: false`), bez obrazów referencyjnych.

### w1

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult woman around 30, mid-length brown hair.
Exact outfit: cream crewneck knit sweater, navy wide-leg trousers, white low sneakers.
```

### w2

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult woman around 30, mid-length brown hair.
Exact outfit: black relaxed blazer worn open, white simple top, beige tailored trousers, cream loafers.
```

### w3

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult woman around 30, mid-length brown hair.
Exact outfit: taupe cardigan worn open, white simple top, medium blue straight jeans, tan loafers.
```

### w4

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult woman around 30, mid-length brown hair.
Exact outfit: navy tailored blazer worn open, pale blue shirt, navy tailored trousers, black loafers.
```

### m1

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult man around 35, short brown hair.
Exact outfit: ecru crewneck sweater, navy chinos, white low sneakers.
```

### m2

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult man around 35, short brown hair.
Exact outfit: navy blazer worn open, light blue shirt, beige chinos, brown loafers.
```

### m3

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult man around 35, short brown hair.
Exact outfit: olive overshirt worn open over a white T-shirt, charcoal jeans, white low sneakers.
```

### m4

```text
Use case: photorealistic-natural. Asset type: outfit card photo for Ubranka, a virtual stylist demo app. Create one realistic premium fashion editorial full-body studio portrait, vertical 2:3 image, 1024 x 1536. Scene: plain warm ivory studio backdrop and floor, subtle grounded shadow. Composition: entire head and both shoes fully visible with ample breathing room above and below; person occupies about 82% of image height, centered front view, neutral natural pose facing camera, hands relaxed visibly, no perspective distortion. Soft daylight, calm elegant approachable mood, realistic natural body proportions and fabric texture. Subject is a wholly fictional adult, not a real customer or celebrity. Exact outfit as specified; show every specified garment clearly. No text, letters, logos, watermarks, brand markings, shopping bags, handbags, hats, sunglasses, jewellery or unnecessary accessories. Do not add garments not in the outfit. This is a standalone editorial illustration, not a UI screenshot, not real merchandise and not a result of actual virtual try-on.
Subject: A fictional adult man around 35, short brown hair.
Exact outfit: charcoal blazer worn open, white shirt, charcoal tailored trousers, black derby shoes.
```
