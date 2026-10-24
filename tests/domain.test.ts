/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { ITEMS, OUTFITS } from '../src/domain/catalog.ts';
import type { Profile } from '../src/domain/model.ts';
import { costOfOutfit, recommendOutfits } from '../src/domain/recommendations.ts';
import { createInitialState, restoreState, updateFeedback } from '../src/domain/state.ts';

const initial = createInitialState();
const base = initial.profiles[0];
const recommend = (profile: Profile = base, overrides: Partial<Parameters<typeof recommendOutfits>[0]> = {}) =>
  recommendOutfits({ profile, ownedItemIds: initial.ownedItemIds, feedback: [], excludeIds: [], mode: 'best', ...overrides });
const ids = (outfits: typeof OUTFITS) => outfits.map((outfit) => outfit.id);

test('catalog fixtures describe eight complete outfits with valid audience and image mapping', () => {
  assert.equal(OUTFITS.length, 8);
  assert.equal(new Set(ITEMS.map((item) => item.id)).size, ITEMS.length);
  for (const outfit of OUTFITS) {
    assert.equal(outfit.id, outfit.imageKey);
    const garments = outfit.itemIds.map((id) => ITEMS.find((item) => item.id === id));
    assert.ok(garments.every((item) => item?.audience === outfit.audience));
    for (const category of ['top', 'bottom', 'shoes']) assert.ok(garments.some((item) => item?.category === category));
    assert.ok((costOfOutfit(outfit, []).total ?? Infinity) <= 500);
  }
});

test('new expense includes delivery and excludes the price and delivery of owned items', () => {
  const outfit = OUTFITS[0];
  assert.deepEqual(costOfOutfit(outfit, []), { items: 317, shipping: 36, total: 353, ownedCount: 0 });
  assert.deepEqual(costOfOutfit(outfit, ['w-sneakers']), { items: 218, shipping: 24, total: 242, ownedCount: 1 });
  assert.deepEqual(costOfOutfit(outfit, outfit.itemIds), { items: 0, shipping: 0, total: 0, ownedCount: 3 });
});

test('unknown shipping is not zero and cannot pass the budget filter', () => {
  const knit = ITEMS.find((item) => item.id === 'w-knit')!;
  const original = knit.shipping;
  try {
    knit.shipping = null;
    assert.equal(costOfOutfit(OUTFITS[0], ['w-sneakers']).total, null);
    assert.ok(!ids(recommend()).includes('w1'));
    assert.equal(costOfOutfit(OUTFITS[0], OUTFITS[0].itemIds).total, 0);
  } finally { knit.shipping = original; }
  assert.equal(costOfOutfit({ ...OUTFITS[0], itemIds: ['missing'] }, []).total, null);
});

test('hard budget includes shipping; owned garments can make an outfit affordable', () => {
  assert.deepEqual(recommend({ ...base, budget: 241 }), []);
  assert.deepEqual(ids(recommend({ ...base, budget: 242 })), ['w1']);
  assert.deepEqual(recommend({ ...base, budget: Number.NaN }), []);
  assert.deepEqual(ids(recommend({ ...base, budget: 0 }, { ownedItemIds: OUTFITS[0].itemIds })), ['w1']);
});

test('rounds never contain more than two, honor audience and stop after unseen options end', () => {
  const first = recommend();
  assert.equal(first.length, 2);
  assert.ok(first.every((outfit) => outfit.audience === 'women'));
  const second = recommend(base, { excludeIds: ids(first) });
  assert.equal(second.length, 2);
  assert.ok(second.every((outfit) => !ids(first).includes(outfit.id)));
  assert.deepEqual(recommend(base, { excludeIds: [...ids(first), ...ids(second)] }), []);
  assert.ok(recommend({ ...base, audience: 'men' }).every((outfit) => outfit.audience === 'men'));
});

test('occasion and priority change order while preserving all candidates for later rounds', () => {
  assert.equal(recommend()[0].id, 'w1');
  assert.equal(recommend({ ...base, priority: 'versatility' })[0].id, 'w3');
  assert.ok(recommend({ ...base, occasion: 'elegant' }).every((outfit) => outfit.occasion === 'elegant'));
});

test('value mode supplies one economy and one premium without exceeding budget or inventing a premium match', () => {
  assert.deepEqual(recommend(base, { mode: 'value' }).map((outfit) => outfit.tier), ['economy', 'premium']);
  const constrained = recommend({ ...base, budget: 300 }, { mode: 'value' });
  assert.equal(constrained.length, 1);
  assert.equal(constrained[0].tier, 'economy');
});

test('preferences affect future ranking only within the corresponding profile', () => {
  const feedback = [{ profileId: base.id, outfitId: 'w3', vote: 'like' as const }];
  assert.equal(recommend(base, { feedback })[0].id, 'w3');
  assert.deepEqual(ids(recommend({ ...base, id: 'other' }, { feedback })), ids(recommend()));
  const dislike = [{ profileId: base.id, outfitId: 'w1', vote: 'dislike' as const }];
  assert.equal(recommend(base, { feedback: dislike })[0].id, 'w3');
  // Shared traits transfer: liking the navy casual look promotes navy over a different elegant look.
  assert.equal(recommend({ ...base, occasion: 'elegant' })[0].id, 'w2');
  assert.equal(recommend({ ...base, occasion: 'elegant' }, { feedback: [{ profileId: base.id, outfitId: 'w1', vote: 'like' }] })[0].id, 'w4');
});

test('a new vote replaces the old vote for this profile only and never changes wardrobe or other settings', () => {
  const once = updateFeedback(initial, { profileId: base.id, outfitId: 'w1', vote: 'like' });
  const other = updateFeedback(once, { profileId: 'elegant', outfitId: 'w1', vote: 'like' });
  const replaced = updateFeedback(other, { profileId: base.id, outfitId: 'w1', vote: 'dislike', reason: 'color' });
  assert.equal(replaced.feedback.length, 2);
  assert.equal(replaced.feedback.find((vote) => vote.profileId === base.id)?.vote, 'dislike');
  assert.equal(replaced.feedback.find((vote) => vote.profileId === 'elegant')?.vote, 'like');
  assert.deepEqual({ ...replaced, feedback: [] }, initial);
  assert.equal(initial.feedback.length, 0);
});

test('state round trip retains language, profiles, default mode, ownership and feedback', () => {
  const state = updateFeedback({ ...createInitialState(), locale: 'en', onboarded: true, askReason: false },
    { profileId: base.id, outfitId: 'w2', vote: 'dislike' });
  state.profiles[0].defaultMode = 'value';
  assert.deepEqual(restoreState(JSON.stringify(state)), state);
  const fresh = createInitialState();
  fresh.profiles[0].budget = 10;
  assert.equal(createInitialState().profiles[0].budget, 500);
});

test('malformed or incompatible storage fails safely instead of entering the UI', () => {
  const invalid: unknown[] = [null, [], {}, { ...initial, version: 2 }, { ...initial, locale: 'xx' },
    { ...initial, activeProfileId: 'missing' }, { ...initial, profiles: [] },
    { ...initial, profiles: [{ ...base, budget: -1 }] }, { ...initial, ownedItemIds: ['unknown'] },
    { ...initial, feedback: [{ profileId: base.id, outfitId: 'w1', vote: 'buy' }] }];
  assert.equal(restoreState('{broken'), null);
  for (const value of invalid) assert.equal(restoreState(JSON.stringify(value)), null);
});
