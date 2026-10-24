import { ITEMS, OUTFITS } from './catalog.ts';
import type { ComparisonMode, Feedback, Outfit, Profile } from './model.ts';

const money = (amount: number) => Math.round(amount * 100) / 100;

export function costOfOutfit(outfit: Outfit, ownedIds: string[]): {
  items: number; shipping: number; total: number | null; ownedCount: number;
} {
  const owned = new Set(ownedIds);
  let items = 0;
  let shipping = 0;
  let ownedCount = 0;
  let known = outfit.itemIds.length > 0;
  for (const id of new Set(outfit.itemIds)) {
    const garment = ITEMS.find((entry) => entry.id === id);
    if (!garment) { known = false; continue; }
    if (owned.has(id)) { ownedCount++; continue; }
    if (!Number.isFinite(garment.price) || garment.price < 0) { known = false; continue; }
    items += garment.price;
    if (garment.shipping === null || !Number.isFinite(garment.shipping) || garment.shipping < 0) {
      known = false;
    } else {
      shipping += garment.shipping;
    }
  }
  return { items: money(items), shipping: money(shipping), total: known ? money(items + shipping) : null, ownedCount };
}

interface RecommendationRequest {
  profile: Profile;
  ownedItemIds: string[];
  feedback: Feedback[];
  excludeIds: string[];
  mode: ComparisonMode;
}

export function recommendOutfits({ profile, ownedItemIds, feedback, excludeIds, mode }: RecommendationRequest): Outfit[] {
  if (!Number.isFinite(profile.budget) || profile.budget < 0) return [];
  const excluded = new Set(excludeIds);
  const votes = feedback.filter((entry) => entry.profileId === profile.id);
  const candidates = OUTFITS.filter((outfit) => outfit.audience === profile.audience && !excluded.has(outfit.id))
    .map((outfit) => ({ outfit, cost: costOfOutfit(outfit, ownedItemIds) }))
    .filter(({ cost }) => cost.total !== null && cost.total <= profile.budget)
    .map(({ outfit, cost }) => {
      let score = (outfit.occasion === profile.occasion ? 20 : 0)
        + outfit.priorities[profile.priority] * 20 + cost.ownedCount * 0.5;
      for (const vote of votes) {
        const previous = OUTFITS.find((entry) => entry.id === vote.outfitId && entry.audience === profile.audience);
        if (!previous) continue;
        const commonTags = outfit.tags.filter((tag) => previous.tags.includes(tag)).length;
        // Shared style traits carry the preference to other outfits in this profile.
        score += (vote.vote === 'like' ? 1 : -1) * 18 * commonTags / Math.max(previous.tags.length, 1);
      }
      return { outfit, score };
    })
    .sort((a, b) => b.score - a.score || a.outfit.id.localeCompare(b.outfit.id));

  if (mode === 'value') {
    const economy = candidates.find(({ outfit }) => outfit.tier === 'economy')?.outfit;
    const premium = candidates.find(({ outfit }) => outfit.tier === 'premium')?.outfit;
    return [economy, premium].filter((outfit): outfit is Outfit => outfit !== undefined);
  }
  return candidates.slice(0, 2).map(({ outfit }) => outfit);
}
