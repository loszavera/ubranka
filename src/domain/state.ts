import { ITEMS, OUTFITS } from './catalog.ts';
import type { AppState, Feedback, Profile } from './model.ts';

export function createInitialState(): AppState {
  return {
    version: 1, locale: 'pl', onboarded: false, activeProfileId: 'everyday',
    profiles: [
      { id: 'everyday', name: 'Na co dzień', audience: 'women', occasion: 'casual', budget: 500, priority: 'comfort', defaultMode: 'best' },
      { id: 'elegant', name: 'Elegancko', audience: 'women', occasion: 'elegant', budget: 500, priority: 'quality', defaultMode: 'best' },
    ],
    ownedItemIds: ['w-sneakers', 'm-sneakers'], feedback: [], askReason: true,
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isProfile(value: unknown): value is Profile {
  return record(value) && nonempty(value.id) && nonempty(value.name)
    && (value.audience === 'women' || value.audience === 'men')
    && (value.occasion === 'casual' || value.occasion === 'elegant')
    && typeof value.budget === 'number' && Number.isFinite(value.budget) && value.budget >= 0
    && (value.priority === 'comfort' || value.priority === 'quality' || value.priority === 'versatility')
    && (value.defaultMode === 'best' || value.defaultMode === 'value');
}

function isFeedback(value: unknown): value is Feedback {
  return record(value) && nonempty(value.profileId) && nonempty(value.outfitId)
    && (value.vote === 'like' || value.vote === 'dislike')
    && (value.reason === undefined || typeof value.reason === 'string');
}

export function restoreState(raw: string): AppState | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1 || (value.locale !== 'pl' && value.locale !== 'en')
      || typeof value.onboarded !== 'boolean' || typeof value.askReason !== 'boolean'
      || !Array.isArray(value.profiles) || value.profiles.length === 0 || !value.profiles.every(isProfile)
      || !Array.isArray(value.ownedItemIds) || !value.ownedItemIds.every(nonempty)
      || !Array.isArray(value.feedback) || !value.feedback.every(isFeedback)) return null;
    const profiles = value.profiles;
    const profileIds = new Set(profiles.map((profile) => profile.id));
    if (profileIds.size !== profiles.length || typeof value.activeProfileId !== 'string'
      || !profileIds.has(value.activeProfileId)) return null;
    const itemIds = new Set(ITEMS.map((item) => item.id));
    const outfitIds = new Set(OUTFITS.map((outfit) => outfit.id));
    if (value.ownedItemIds.some((id) => !itemIds.has(id))
      || value.feedback.some((entry) => !profileIds.has(entry.profileId) || !outfitIds.has(entry.outfitId))) return null;
    // Rebuild only the supported schema; unknown serialized fields are not carried into the app.
    const state: AppState = {
      version: 1, locale: value.locale, onboarded: value.onboarded, askReason: value.askReason,
      activeProfileId: value.activeProfileId,
      profiles: profiles.map(({ id, name, audience, occasion, budget, priority, defaultMode }) =>
        ({ id, name, audience, occasion, budget, priority, defaultMode })),
      ownedItemIds: [...new Set(value.ownedItemIds)], feedback: [],
    };
    return value.feedback.reduce((next, vote) => updateFeedback(next, vote), state);
  } catch {
    return null;
  }
}

export function updateFeedback(state: AppState, feedback: Feedback): AppState {
  if (!isFeedback(feedback) || !state.profiles.some((profile) => profile.id === feedback.profileId)
    || !OUTFITS.some((outfit) => outfit.id === feedback.outfitId)) return state;
  const { profileId, outfitId, vote, reason } = feedback;
  return {
    ...state,
    feedback: [
      ...state.feedback.filter((entry) => entry.profileId !== profileId || entry.outfitId !== outfitId),
      { profileId, outfitId, vote, ...(reason === undefined ? {} : { reason }) },
    ],
  };
}
