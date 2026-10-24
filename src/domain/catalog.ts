import type { Audience, Outfit, Tier, WardrobeItem } from './model.ts';

// All items, prices and shipping costs are illustrative P2 fixtures, not shop offers.
function item(
  id: string, pl: string, en: string, category: WardrobeItem['category'],
  color: string, audience: Audience, price: number, tier: Tier = 'economy',
): WardrobeItem {
  return { id, name: { pl, en }, category, color, audience, price, shipping: 12, tier, tags: [color, category] };
}

export const ITEMS: WardrobeItem[] = [
  item('w-knit', 'Kremowy sweter', 'Cream knit', 'top', '#EDE3D3', 'women', 89),
  item('w-wide-trousers', 'Granatowe szerokie spodnie', 'Navy wide-leg trousers', 'bottom', '#263449', 'women', 129),
  item('w-sneakers', 'Białe sneakersy', 'White sneakers', 'shoes', '#F7F5EF', 'women', 99),
  item('w-black-blazer', 'Czarna marynarka', 'Black blazer', 'layer', '#302D31', 'women', 169, 'premium'),
  item('w-white-top', 'Biały top', 'White top', 'top', '#F7F5EF', 'women', 49),
  item('w-beige-trousers', 'Beżowe spodnie', 'Beige trousers', 'bottom', '#C7B49A', 'women', 99),
  item('w-cream-loafers', 'Kremowe mokasyny', 'Cream loafers', 'shoes', '#E3D7C1', 'women', 129, 'premium'),
  item('w-cardigan', 'Kardigan taupe', 'Taupe cardigan', 'layer', '#A58E7C', 'women', 79),
  item('w-jeans', 'Niebieskie proste jeansy', 'Straight blue jeans', 'bottom', '#617C94', 'women', 99),
  item('w-tan-loafers', 'Karmelowe mokasyny', 'Tan loafers', 'shoes', '#AA744C', 'women', 109),
  item('w-navy-blazer', 'Granatowa marynarka', 'Navy blazer', 'layer', '#263449', 'women', 159, 'premium'),
  item('w-blue-shirt', 'Błękitna koszula', 'Pale blue shirt', 'top', '#BCD0DC', 'women', 69),
  item('w-tailored-trousers', 'Granatowe spodnie garniturowe', 'Navy tailored trousers', 'bottom', '#263449', 'women', 119, 'premium'),
  item('w-black-loafers', 'Czarne mokasyny', 'Black loafers', 'shoes', '#302D31', 'women', 99, 'premium'),
  item('m-knit', 'Sweter ecru', 'Ecru knit', 'top', '#EDE3D3', 'men', 99),
  item('m-navy-chinos', 'Granatowe chinosy', 'Navy chinos', 'bottom', '#263449', 'men', 129),
  item('m-sneakers', 'Białe sneakersy', 'White sneakers', 'shoes', '#F7F5EF', 'men', 99),
  item('m-navy-blazer', 'Granatowa marynarka', 'Navy blazer', 'layer', '#263449', 'men', 149, 'premium'),
  item('m-blue-shirt', 'Błękitna koszula', 'Light blue shirt', 'top', '#BCD0DC', 'men', 79),
  item('m-beige-chinos', 'Beżowe chinosy', 'Beige chinos', 'bottom', '#C7B49A', 'men', 99),
  item('m-brown-loafers', 'Brązowe mokasyny', 'Brown loafers', 'shoes', '#78523D', 'men', 119, 'premium'),
  item('m-overshirt', 'Oliwkowa koszula wierzchnia', 'Olive overshirt', 'layer', '#78816A', 'men', 89),
  item('m-white-tee', 'Biały T-shirt', 'White T-shirt', 'top', '#F7F5EF', 'men', 39),
  item('m-jeans', 'Grafitowe jeansy', 'Charcoal jeans', 'bottom', '#515358', 'men', 119),
  item('m-charcoal-blazer', 'Grafitowa marynarka', 'Charcoal blazer', 'layer', '#515358', 'men', 159, 'premium'),
  item('m-white-shirt', 'Biała koszula', 'White shirt', 'top', '#F7F5EF', 'men', 69),
  item('m-tailored-trousers', 'Grafitowe spodnie garniturowe', 'Charcoal tailored trousers', 'bottom', '#515358', 'men', 119, 'premium'),
  item('m-black-derby', 'Czarne półbuty derby', 'Black derby shoes', 'shoes', '#302D31', 'men', 99, 'premium'),
];

export const OUTFITS: Outfit[] = [
  {
    id: 'w1', imageKey: 'w1', audience: 'women', occasion: 'casual', tier: 'economy',
    name: { pl: 'Lekko na co dzień', en: 'Everyday ease' },
    description: { pl: 'Miękka dzianina, swobodny krój i Twoje sneakersy.', en: 'Soft knitwear, relaxed trousers and your sneakers.' },
    itemIds: ['w-knit', 'w-wide-trousers', 'w-sneakers'],
    tags: ['minimal', 'navy', 'soft'], priorities: { comfort: 1, quality: 0.6, versatility: 0.9 },
  },
  {
    id: 'w2', imageKey: 'w2', audience: 'women', occasion: 'elegant', tier: 'premium',
    name: { pl: 'Spokojna elegancja', en: 'Quiet elegance' },
    description: { pl: 'Wyrazista marynarka i jasne spodnie w równowadze.', en: 'A sharp blazer balanced with light trousers.' },
    itemIds: ['w-black-blazer', 'w-white-top', 'w-beige-trousers', 'w-cream-loafers'],
    tags: ['tailored', 'neutral', 'contrast'], priorities: { comfort: 0.7, quality: 1, versatility: 0.8 },
  },
  {
    id: 'w3', imageKey: 'w3', audience: 'women', occasion: 'casual', tier: 'economy',
    name: { pl: 'Ciepłe odcienie', en: 'Warm tones' },
    description: { pl: 'Kardigan i jeansy, które łatwo połączyć z resztą szafy.', en: 'A cardigan and jeans that mix easily with your wardrobe.' },
    itemIds: ['w-cardigan', 'w-white-top', 'w-jeans', 'w-tan-loafers'],
    tags: ['earth', 'denim', 'layered'], priorities: { comfort: 0.9, quality: 0.7, versatility: 1 },
  },
  {
    id: 'w4', imageKey: 'w4', audience: 'women', occasion: 'elegant', tier: 'premium',
    name: { pl: 'Granatowy klasyk', en: 'Navy classic' },
    description: { pl: 'Tonalny zestaw z błękitną koszulą na ważniejszy dzień.', en: 'A tonal outfit with a pale blue shirt for a polished day.' },
    itemIds: ['w-navy-blazer', 'w-blue-shirt', 'w-tailored-trousers', 'w-black-loafers'],
    tags: ['tailored', 'navy', 'minimal'], priorities: { comfort: 0.6, quality: 1, versatility: 0.9 },
  },
  {
    id: 'm1', imageKey: 'm1', audience: 'men', occasion: 'casual', tier: 'economy',
    name: { pl: 'Swobodny klasyk', en: 'Relaxed classic' },
    description: { pl: 'Sweter ecru, chinosy i sneakersy na codzienny rytm.', en: 'An ecru knit, chinos and sneakers for your everyday rhythm.' },
    itemIds: ['m-knit', 'm-navy-chinos', 'm-sneakers'],
    tags: ['minimal', 'navy', 'soft'], priorities: { comfort: 1, quality: 0.6, versatility: 0.9 },
  },
  {
    id: 'm2', imageKey: 'm2', audience: 'men', occasion: 'elegant', tier: 'premium',
    name: { pl: 'Elegancja bez wysiłku', en: 'Effortless polish' },
    description: { pl: 'Granat i beż z lekką koszulą i mokasynami.', en: 'Navy and beige with a light shirt and loafers.' },
    itemIds: ['m-navy-blazer', 'm-blue-shirt', 'm-beige-chinos', 'm-brown-loafers'],
    tags: ['tailored', 'neutral', 'contrast'], priorities: { comfort: 0.7, quality: 1, versatility: 0.8 },
  },
  {
    id: 'm3', imageKey: 'm3', audience: 'men', occasion: 'casual', tier: 'economy',
    name: { pl: 'Miejski luz', en: 'City ease' },
    description: { pl: 'Oliwkowa warstwa, prosty T-shirt i ciemny denim.', en: 'An olive layer, a simple tee and dark denim.' },
    itemIds: ['m-overshirt', 'm-white-tee', 'm-jeans', 'm-sneakers'],
    tags: ['earth', 'denim', 'layered'], priorities: { comfort: 0.9, quality: 0.7, versatility: 1 },
  },
  {
    id: 'm4', imageKey: 'm4', audience: 'men', occasion: 'elegant', tier: 'premium',
    name: { pl: 'Grafitowa pewność', en: 'Charcoal confidence' },
    description: { pl: 'Spójny garniturowy zestaw z białą koszulą.', en: 'A coordinated tailored look with a crisp white shirt.' },
    itemIds: ['m-charcoal-blazer', 'm-white-shirt', 'm-tailored-trousers', 'm-black-derby'],
    tags: ['tailored', 'charcoal', 'minimal'], priorities: { comfort: 0.6, quality: 1, versatility: 0.9 },
  },
];
