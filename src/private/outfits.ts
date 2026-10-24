import { OCCASIONS, type Occasion, type Profile } from '../domain/model.ts';
import { PrivateError, type PrivateCategory, type PrivateItem } from './model.ts';

export interface SavedPrivateOutfit {
  id: string;
  profileId: string;
  occasion: Occasion;
  itemIds: string[];
  itemRevisions: Record<string, number>;
  createdAt: string;
}

export interface PrivateOutfitFeedback {
  profileId: string;
  outfitId: string;
  itemIds: string[];
  vote: 'like' | 'dislike';
  reason?: string;
}

export type PrivateOutfitKind = 'separates' | 'dress';
export type PrivateOutfitReason = 'own_wardrobe' | 'occasion_match' | 'coordinated_colors'
  | 'versatile_items' | 'liked_items' | 'liked_colors';
export type PrivateOutfitNotice = 'missing_photos' | 'unknown_colors' | 'priority_not_measured';
export type PrivateRecommendationNotice = 'empty_wardrobe' | 'no_matching_occasion'
  | 'incomplete_wardrobe' | 'no_more_outfits' | 'only_one_outfit' | 'priority_not_measured' | 'size_mismatch';
export type PrivateOutfitIssue = 'missing_items' | 'items_changed' | 'occasion_mismatch'
  | 'incomplete_outfit' | 'profile_mismatch' | 'size_mismatch';

export interface PrivateOutfitSizePreferences { topSize?: string; bottomSize?: string }

export interface PrivateOutfit {
  id: string;
  accountId: string;
  profileId: string;
  occasion: Occasion;
  kind: PrivateOutfitKind;
  itemIds: string[];
  itemRevisions: Record<string, number>;
  score: number;
  reasons: PrivateOutfitReason[];
  notices: PrivateOutfitNotice[];
  newSpendPln: 0;
}

export interface PrivateRecommendationRequest {
  accountId: string;
  // Only the current account's authenticated snapshot belongs here. Ownership
  // is enforced by the backend; PrivateItem intentionally has no owner field.
  items: readonly PrivateItem[];
  profile: Profile;
  occasion?: Occasion;
  feedback?: readonly PrivateOutfitFeedback[];
  excludeIds?: readonly string[];
  bodyFit?: PrivateOutfitSizePreferences;
}

export interface PrivateRecommendations {
  outfits: PrivateOutfit[];
  missingAlternatives: { kind: PrivateOutfitKind; categories: PrivateCategory[] }[];
  notices: PrivateRecommendationNotice[];
  sizeExcluded: number;
}

const categoryOrder: Record<PrivateCategory, number> = {
  top: 0, dress: 0, bottom: 1, layer: 2, shoes: 3, accessory: 4,
};
const neutralColors = new Set(['black', 'white', 'gray', 'beige', 'cream', 'brown', 'navy']);
const colorAliases: Record<string, readonly string[]> = {
  black: ['black', 'czarny', 'czarna', 'czarne', 'czern'],
  white: ['white', 'bialy', 'biala', 'biale', 'biel'],
  gray: ['gray', 'grey', 'szary', 'szara', 'szare', 'szarosc', 'grafit', 'grafitowy', 'grafitowa', 'charcoal'],
  beige: ['beige', 'bezowy', 'bezowa', 'bezowe', 'bez', 'taupe', 'nude'],
  cream: ['cream', 'ivory', 'ecru', 'kremowy', 'kremowa', 'kremowe', 'smietankowy'],
  brown: ['brown', 'tan', 'camel', 'braz', 'brazowy', 'brazowa', 'brazowe', 'karmelowy'],
  navy: ['navy', 'navy blue', 'granat', 'granatowy', 'granatowa', 'granatowe'],
  blue: ['blue', 'niebieski', 'niebieska', 'niebieskie', 'blekit', 'blekitny', 'blekitna', 'denim'],
  green: ['green', 'zielony', 'zielona', 'zielone', 'zielen'],
  olive: ['olive', 'oliwkowy', 'oliwkowa', 'oliwkowe', 'khaki'],
  red: ['red', 'czerwony', 'czerwona', 'czerwone', 'czerwien', 'burgundy', 'bordowy', 'bordowa'],
  pink: ['pink', 'roz', 'rozowy', 'rozowa', 'rozowe'],
  purple: ['purple', 'fiolet', 'fioletowy', 'fioletowa', 'plum', 'sliwkowy', 'sliwkowa'],
  yellow: ['yellow', 'zolty', 'zolta', 'zolte', 'mustard', 'musztardowy'],
  orange: ['orange', 'pomarancz', 'pomaranczowy', 'pomaranczowa', 'pomaranczowe'],
};

function colorOf(value: string): string | null {
  const normalized = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  return Object.entries(colorAliases).find(([, aliases]) => aliases.includes(normalized))?.[0] ?? null;
}

function ordered(items: readonly PrivateItem[]): PrivateItem[] {
  return [...items].sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category] || a.id.localeCompare(b.id));
}

function hasSizeMismatch(item: PrivateItem, bodyFit?: PrivateOutfitSizePreferences): boolean {
  const expected = item.category === 'bottom' ? bodyFit?.bottomSize
    : ['top', 'dress', 'layer'].includes(item.category) ? bodyFit?.topSize : undefined;
  const garmentLabel = item.size.trim().toUpperCase();
  const personLabel = expected?.trim().toUpperCase();
  const letters = /^(XXS|XS|S|M|L|XL|XXL|XXXL)$/;
  // Compare explicit labels only. Numeric sizes, ranges, "uni" and unknown
  // systems cannot safely be converted, especially for shoes.
  return !!personLabel && letters.test(garmentLabel) && letters.test(personLabel) && garmentLabel !== personLabel;
}

/** Structural completeness only; ownership, status, occasion and versions are checked separately. */
export function isCompletePrivateOutfit(items: readonly Pick<PrivateItem, 'category'>[]): boolean {
  const categories = new Set(items.map(item => item.category));
  if (categories.size !== items.length) return false;
  return (items.length === 3 && ['top', 'bottom', 'shoes'].every(category => categories.has(category as PrivateCategory)))
    || ((items.length === 2 || items.length === 3) && categories.has('dress') && categories.has('shoes')
      && (items.length === 2 || categories.has('layer')));
}

// Deterministic UI/record identity, not a cryptographic hash or an authorization
// check. Bind versions as well as membership so changed photos need a new review.
function outfitId(accountId: string, profileId: string, occasion: Occasion, items: readonly PrivateItem[]): string {
  const value = JSON.stringify(['private-outfit-v1', accountId, profileId, occasion,
    [...items].sort((a, b) => a.id.localeCompare(b.id)).map(item => [item.id, item.revision])]);
  const words = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  for (let i = 0; i < value.length; i++) {
    for (let j = 0; j < words.length; j++) words[j] = Math.imul(words[j] ^ (value.charCodeAt(i) + j), 0x01000193) >>> 0;
  }
  const raw = words.map(word => word.toString(16).padStart(8, '0')).join('');
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-5${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20)}`;
}

interface Affinity {
  items: Map<string, number>;
  colors: Map<string, number>;
  itemColors: Map<string, string | null>;
  occasionCounts: Map<string, number>;
}
function affinityFor(items: readonly PrivateItem[], profileId: string, feedback: readonly PrivateOutfitFeedback[]): Affinity {
  const available = new Map(items.filter(item => item.status === 'active').map(item => [item.id, item]));
  const affinity: Affinity = { items: new Map(), colors: new Map(),
    itemColors: new Map([...available.values()].map(item => [item.id, colorOf(item.color)])),
    occasionCounts: new Map([...available.values()].map(item => [item.id, new Set(item.occasions).size])),
  };
  // Updating an opinion replaces the previous opinion of that outfit/profile.
  const latest = new Map(feedback.filter(entry => entry.profileId === profileId).map(entry => [entry.outfitId, entry]));
  for (const entry of latest.values()) {
    const sign = entry.vote === 'like' ? 1 : -1;
    const colorKeys = new Set<string>();
    for (const id of new Set(entry.itemIds)) {
      const item = available.get(id);
      if (!item) continue;
      affinity.items.set(id, (affinity.items.get(id) ?? 0) + sign);
      const color = affinity.itemColors.get(id);
      if (color) colorKeys.add(`${item.category}:${color}`);
    }
    for (const key of colorKeys) affinity.colors.set(key, (affinity.colors.get(key) ?? 0) + sign);
  }
  return affinity;
}

function makeOutfit(accountId: string, profile: Profile, occasion: Occasion, selected: readonly PrivateItem[], affinity: Affinity): PrivateOutfit {
  const items = ordered(selected);
  const colors = items.map(item => affinity.itemColors.get(item.id) ?? null);
  const accents = new Set(colors.filter((color): color is string => color !== null && !neutralColors.has(color)));
  const knownColors = colors.every(color => color !== null);
  const coordinated = knownColors && accents.size <= 1;
  const itemAffinity = items.reduce((sum, item) => sum + (affinity.items.get(item.id) ?? 0), 0) / items.length;
  const colorAffinity = items.reduce((sum, item) => sum + (affinity.colors.get(`${item.category}:${affinity.itemColors.get(item.id)}`) ?? 0), 0) / items.length;
  const versatility = profile.priority === 'versatility'
    ? items.reduce((sum, item) => sum + (affinity.occasionCounts.get(item.id) ?? 0), 0) / items.length : 0;
  const reasons: PrivateOutfitReason[] = ['own_wardrobe', 'occasion_match'];
  const notices: PrivateOutfitNotice[] = [];
  if (coordinated) reasons.push('coordinated_colors');
  if (versatility > 1) reasons.push('versatile_items');
  if (itemAffinity > 0) reasons.push('liked_items');
  if (colorAffinity > 0) reasons.push('liked_colors');
  if (items.some(item => !item.photo)) notices.push('missing_photos');
  if (!knownColors) notices.push('unknown_colors');
  if (profile.priority !== 'versatility') notices.push('priority_not_measured');
  return {
    id: outfitId(accountId, profile.id, occasion, items), accountId, profileId: profile.id, occasion,
    kind: items.some(item => item.category === 'dress') ? 'dress' : 'separates',
    itemIds: items.map(item => item.id), itemRevisions: Object.fromEntries(items.map(item => [item.id, item.revision])),
    score: (coordinated ? 8 : 0) + versatility * 2 + itemAffinity * 18 + colorAffinity * 6,
    reasons, notices, newSpendPln: 0,
  };
}

export function recommendPrivateOutfits({ accountId, items, profile, occasion = profile.occasion,
  feedback = [], excludeIds = [], bodyFit }: PrivateRecommendationRequest): PrivateRecommendations {
  if (!accountId || !profile.id || !OCCASIONS.includes(occasion)) throw new PrivateError('INVALID_INPUT');
  const active = items.filter(item => item.status === 'active');
  // Occasion eligibility is never relaxed by feedback or to fill the second card.
  const matchingOccasion = active.filter(item => item.occasions.includes(occasion));
  const eligible = matchingOccasion.filter(item => !hasSizeMismatch(item, bodyFit));
  const sizeExcluded = matchingOccasion.length - eligible.length;
  const byCategory = (category: PrivateCategory) => eligible.filter(item => item.category === category);
  const tops = byCategory('top'), bottoms = byCategory('bottom'), shoes = byCategory('shoes');
  const dresses = byCategory('dress'), layers = byCategory('layer');
  const alternatives: { kind: PrivateOutfitKind; categories: PrivateCategory[] }[] = [
    { kind: 'separates', categories: ['top', 'bottom', 'shoes'] },
    { kind: 'dress', categories: ['dress', 'shoes'] },
  ];
  const missingAlternatives = alternatives.map(alternative => ({ ...alternative,
    categories: alternative.categories.filter(category => byCategory(category).length === 0),
  })).filter(alternative => alternative.categories.length > 0);
  const affinity = affinityFor(active, profile.id, feedback);
  const excluded = new Set(excludeIds);
  const best: PrivateOutfit[] = [];
  let completeCount = 0;
  const consider = (selection: PrivateItem[]) => {
    if (new Set(selection.map(item => item.id)).size !== selection.length) return;
    completeCount++;
    const outfit = makeOutfit(accountId, profile, occasion, selection, affinity);
    if (excluded.has(outfit.id) || best.some(previous => previous.id === outfit.id)) return;
    best.push(outfit);
    best.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    if (best.length > 2) best.pop();
  };
  for (const top of tops) for (const bottom of bottoms) for (const shoe of shoes) consider([top, bottom, shoe]);
  for (const dress of dresses) for (const shoe of shoes) {
    consider([dress, shoe]);
    for (const layer of layers) consider([dress, layer, shoe]);
  }
  const notices: PrivateRecommendationNotice[] = [];
  if (active.length === 0) notices.push('empty_wardrobe');
  else if (matchingOccasion.length === 0) notices.push('no_matching_occasion');
  else if (completeCount === 0) notices.push('incomplete_wardrobe');
  else if (best.length === 0) notices.push('no_more_outfits');
  else if (best.length === 1) notices.push('only_one_outfit');
  if (sizeExcluded > 0) notices.push('size_mismatch');
  if (profile.priority !== 'versatility') notices.push('priority_not_measured');
  return { outfits: best, missingAlternatives, notices, sizeExcluded };
}

export interface RehydratePrivateOutfitRequest {
  savedOutfit: SavedPrivateOutfit;
  accountId: string;
  items: readonly PrivateItem[];
  profile: Profile;
  feedback?: readonly PrivateOutfitFeedback[];
  bodyFit?: PrivateOutfitSizePreferences;
}

export function rehydratePrivateOutfit({ savedOutfit, accountId, items, profile, feedback = [], bodyFit }: RehydratePrivateOutfitRequest): {
  outfit: PrivateOutfit | null; issue: PrivateOutfitIssue | null;
} {
  const invalid = (issue: PrivateOutfitIssue) => ({ outfit: null, issue });
  if (savedOutfit.profileId !== profile.id) return invalid('profile_mismatch');
  const available = new Map(items.filter(item => item.status === 'active').map(item => [item.id, item]));
  const selected = savedOutfit.itemIds.map(id => available.get(id));
  if (selected.some(item => item === undefined)) return invalid('missing_items');
  const resolved = selected as PrivateItem[];
  if (new Set(savedOutfit.itemIds).size !== savedOutfit.itemIds.length || !isCompletePrivateOutfit(resolved)) return invalid('incomplete_outfit');
  if (!OCCASIONS.includes(savedOutfit.occasion) || resolved.some(item => !item.occasions.includes(savedOutfit.occasion))) return invalid('occasion_mismatch');
  if (resolved.some(item => savedOutfit.itemRevisions[item.id] !== item.revision)) return invalid('items_changed');
  if (resolved.some(item => hasSizeMismatch(item, bodyFit))) return invalid('size_mismatch');
  return { outfit: { ...makeOutfit(accountId, profile, savedOutfit.occasion, resolved, affinityFor(items, profile.id, feedback)), id: savedOutfit.id }, issue: null };
}

export interface SwapPrivateOutfitItemRequest {
  outfit: PrivateOutfit;
  itemId: string;
  replacementId: string;
  items: readonly PrivateItem[];
  profile: Profile;
  feedback?: readonly PrivateOutfitFeedback[];
  bodyFit?: PrivateOutfitSizePreferences;
}

export function swapPrivateOutfitItem({ outfit, itemId, replacementId, items, profile, feedback = [], bodyFit }: SwapPrivateOutfitItemRequest): PrivateOutfit {
  const resolved = rehydratePrivateOutfit({ savedOutfit: { ...outfit, createdAt: '' }, accountId: outfit.accountId, items, profile, feedback, bodyFit });
  if (!resolved.outfit) throw new PrivateError('STALE_OUTFIT');
  const current = items.find(item => item.id === itemId && outfit.itemIds.includes(item.id));
  const replacement = items.find(item => item.id === replacementId && item.status === 'active');
  if (!current || !replacement || current.category !== replacement.category
    || !replacement.occasions.includes(outfit.occasion) || hasSizeMismatch(replacement, bodyFit)
    || (replacementId !== itemId && outfit.itemIds.includes(replacementId))) throw new PrivateError('INVALID_REPLACEMENT');
  const selected = outfit.itemIds.map(id => id === itemId ? replacement : items.find(item => item.id === id)!);
  return makeOutfit(outfit.accountId, profile, outfit.occasion, selected, affinityFor(items, profile.id, feedback));
}
