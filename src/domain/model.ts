export type Locale = 'pl' | 'en';
export type Audience = 'women' | 'men';
export type Occasion = 'casual' | 'elegant';
export type ComparisonMode = 'best' | 'value';
export type Priority = 'comfort' | 'quality' | 'versatility';
export type Tier = 'economy' | 'premium';
export type LocalizedText = { pl: string; en: string };

export interface Profile {
  id: string;
  name: string;
  audience: Audience;
  occasion: Occasion;
  budget: number;
  priority: Priority;
  defaultMode: ComparisonMode;
}

export interface WardrobeItem {
  id: string;
  name: LocalizedText;
  category: 'top' | 'bottom' | 'layer' | 'shoes';
  color: string;
  audience: Audience;
  price: number;
  shipping: number | null;
  tier: Tier;
  tags: string[];
}

export interface Outfit {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  audience: Audience;
  occasion: Occasion;
  tier: Tier;
  itemIds: string[];
  imageKey: 'w1' | 'w2' | 'w3' | 'w4' | 'm1' | 'm2' | 'm3' | 'm4';
  tags: string[];
  priorities: Record<Priority, number>;
}

export interface Feedback {
  profileId: string;
  outfitId: string;
  vote: 'like' | 'dislike';
  reason?: string;
}

export interface AppState {
  version: 1;
  locale: Locale;
  onboarded: boolean;
  activeProfileId: string;
  profiles: Profile[];
  ownedItemIds: string[];
  feedback: Feedback[];
  askReason: boolean;
}
