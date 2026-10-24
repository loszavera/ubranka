/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { ITEMS, OUTFITS } from '../src/domain/catalog.ts';
import { OCCASIONS, type Profile } from '../src/domain/model.ts';
import { costOfOutfit, recommendOutfits } from '../src/domain/recommendations.ts';
import { createInitialState, restoreState, updateFeedback } from '../src/domain/state.ts';

const initial = createInitialState();
const base = initial.profiles[0];
const recommend = (profile: Profile = base, overrides: Partial<Parameters<typeof recommendOutfits>[0]> = {}) =>
  recommendOutfits({ profile, ownedItemIds: initial.ownedItemIds, feedback: [], excludeIds: [], mode: 'best', ...overrides });
const ids = (outfits: typeof OUTFITS) => outfits.map((outfit) => outfit.id);

// Frozen V1 save, independent of createInitialState: all old IDs, custom profiles,
// an elegant active profile, custom budgets and feedback reasons must survive.
const legacyP2Json = `{
  "version": 1, "locale": "en", "onboarded": true, "askReason": false,
  "activeProfileId": "custom-elegant",
  "profiles": [
    {"id":"everyday","name":"Mój codzienny styl","audience":"women","occasion":"casual","budget":420.5,"priority":"versatility","defaultMode":"value"},
    {"id":"elegant","name":"Elegancko","audience":"women","occasion":"elegant","budget":500,"priority":"quality","defaultMode":"best"},
    {"id":"custom-elegant","name":"Aleksy – praca","audience":"men","occasion":"elegant","budget":777.25,"priority":"comfort","defaultMode":"value"}
  ],
  "ownedItemIds": ["w-knit","w-wide-trousers","w-sneakers","w-black-blazer","w-white-top","w-beige-trousers","w-cream-loafers","w-cardigan","w-jeans","w-tan-loafers","w-navy-blazer","w-blue-shirt","w-tailored-trousers","w-black-loafers","m-knit","m-navy-chinos","m-sneakers","m-navy-blazer","m-blue-shirt","m-beige-chinos","m-brown-loafers","m-overshirt","m-white-tee","m-jeans","m-charcoal-blazer","m-white-shirt","m-tailored-trousers","m-black-derby"],
  "feedback": [
    {"profileId":"everyday","outfitId":"w1","vote":"like"},
    {"profileId":"everyday","outfitId":"w2","vote":"dislike","reason":"price"},
    {"profileId":"everyday","outfitId":"w3","vote":"like"},
    {"profileId":"elegant","outfitId":"w4","vote":"dislike","reason":"color"},
    {"profileId":"custom-elegant","outfitId":"m1","vote":"dislike","reason":"style"},
    {"profileId":"custom-elegant","outfitId":"m2","vote":"like"},
    {"profileId":"custom-elegant","outfitId":"m3","vote":"dislike"},
    {"profileId":"custom-elegant","outfitId":"m4","vote":"like"}
  ]
}`;

test('catalog fixtures describe complete outfits and cover every occasion for both audiences', () => {
  assert.equal(new Set(ITEMS.map((item) => item.id)).size, ITEMS.length);
  assert.equal(new Set(OUTFITS.map((outfit) => outfit.id)).size, OUTFITS.length);
  for (const outfit of OUTFITS) {
    assert.equal(outfit.id, outfit.imageKey);
    assert.ok(outfit.occasions.length > 0 && outfit.occasions.every((occasion) => OCCASIONS.includes(occasion)));
    assert.equal(new Set(outfit.occasions).size, outfit.occasions.length);
    const garments = outfit.itemIds.map((id) => ITEMS.find((item) => item.id === id));
    assert.ok(garments.every((item) => item?.audience === outfit.audience));
    assert.ok(garments.some((item) => item?.category === 'shoes'));
    assert.ok(garments.some((item) => item?.category === 'dress')
      || ['top', 'bottom'].every((category) => garments.some((item) => item?.category === category)));
    assert.ok((costOfOutfit(outfit, []).total ?? Infinity) <= 500);
  }
  for (const audience of ['women', 'men'] as const) {
    for (const occasion of OCCASIONS) {
      const pair = recommend({ ...base, audience }, { occasion, ownedItemIds: [] });
      assert.equal(pair.length, 2, `${audience}/${occasion} needs two demo choices at PLN 500`);
      assert.ok(pair.every((outfit) => outfit.occasions.includes(occasion)));
    }
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

test('rounds never repeat, exceed two, escape the occasion or refill after eligible options end', () => {
  for (const audience of ['women', 'men'] as const) {
    for (const occasion of OCCASIONS) {
      const seen: string[] = [];
      for (let round = 0; round <= OUTFITS.length; round++) {
        const pair = recommend({ ...base, audience }, { occasion, excludeIds: seen });
        assert.ok(pair.length <= 2);
        if (pair.length === 0) break;
        assert.ok(pair.every((outfit) => outfit.audience === audience && outfit.occasions.includes(occasion)));
        assert.ok(pair.every((outfit) => !seen.includes(outfit.id)));
        seen.push(...ids(pair));
      }
      assert.deepEqual(recommend({ ...base, audience }, { occasion, excludeIds: seen }), []);
      assert.equal(seen.length, new Set(seen).size);
      assert.equal(seen.length, OUTFITS.filter((outfit) => outfit.audience === audience && outfit.occasions.includes(occasion)).length);
    }
  }
});

test('occasion restricts eligible candidates while priority changes their order', () => {
  assert.equal(recommend()[0].id, 'w1');
  assert.equal(recommend({ ...base, priority: 'versatility' })[0].id, 'w3');
  assert.ok(recommend({ ...base, occasion: 'elegant' }).every((outfit) => outfit.occasions.includes('elegant')));
});

test('value mode supplies one economy and one premium without exceeding budget or inventing a premium match', () => {
  for (const audience of ['women', 'men'] as const) {
    const pair = recommend({ ...base, audience }, { mode: 'value', occasion: 'wedding', ownedItemIds: [] });
    assert.deepEqual(pair.map((outfit) => outfit.tier), ['economy', 'premium']);
    assert.ok(pair.every((outfit) => outfit.occasions.includes('wedding') && costOfOutfit(outfit, []).total! <= 500));
    const premiumIds = OUTFITS.filter((outfit) => outfit.tier === 'premium').map((outfit) => outfit.id);
    const single = recommend({ ...base, audience }, { mode: 'value', occasion: 'wedding', excludeIds: premiumIds });
    assert.equal(single.length, 1);
    assert.equal(single[0].tier, 'economy');
    const minimum = Math.min(...pair.map((outfit) => costOfOutfit(outfit, []).total!));
    assert.deepEqual(recommend({ ...base, audience, budget: minimum - 0.01 }, { mode: 'value', occasion: 'wedding', ownedItemIds: [] }), []);
  }
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
  // A preserved P2 preference still transfers to suitable looks on another occasion.
  assert.equal(recommend({ ...base, occasion: 'work' })[0].id, 'w2');
  assert.equal(recommend({ ...base, occasion: 'work' }, { feedback: [{ profileId: base.id, outfitId: 'w1', vote: 'like' }] })[0].id, 'w4');
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
  const invalid: unknown[] = [null, [], {}, { ...initial, version: 3 }, { ...initial, locale: 'xx' },
    { ...initial, activeProfileId: 'missing' }, { ...initial, profiles: [] },
    { ...initial, profiles: [{ ...base, budget: -1 }] }, { ...initial, profiles: [{ ...base, occasion: 'unknown' }] }, { ...initial, ownedItemIds: ['unknown'] },
    { ...initial, feedback: [{ profileId: base.id, outfitId: 'w1', vote: 'buy' }] }];
  assert.equal(restoreState('{broken'), null);
  for (const value of invalid) assert.equal(restoreState(JSON.stringify(value)), null);
});

test('round occasion overrides the profile default without mutating it', () => {
  const profile: Profile = { ...base, occasion: 'casual' };
  const before = structuredClone(profile);
  const wedding = recommend(profile, { occasion: 'wedding' });
  assert.equal(wedding.length, 2);
  assert.ok(wedding.every((outfit) => outfit.occasions.includes('wedding')));
  assert.deepEqual(profile, before);
  assert.ok(recommend(profile).every((outfit) => outfit.occasions.includes('casual')));
});

test('occasion stays mandatory even when an unsuitable look is liked and free', () => {
  const casual = OUTFITS.find((outfit) => outfit.id === 'w1')!;
  const feedback = [{ profileId: base.id, outfitId: casual.id, vote: 'like' as const }];
  assert.deepEqual(recommend({ ...base, budget: 0 }, { occasion: 'wedding', ownedItemIds: casual.itemIds, feedback }), []);
  assert.ok(!ids(recommend(base, { occasion: 'wedding', feedback })).includes(casual.id));
  const eligibleIds = OUTFITS.filter((outfit) => outfit.audience === base.audience && outfit.occasions.includes('wedding')).map((outfit) => outfit.id);
  assert.deepEqual(recommend(base, { occasion: 'wedding', excludeIds: eligibleIds, feedback }), []);
});

test('migration reads a frozen P2 V1 save without losing any supported data', () => {
  const previous = JSON.parse(legacyP2Json);
  const migrated = restoreState(legacyP2Json);
  assert.ok(migrated);
  assert.deepEqual(migrated, { ...previous, version: 2 });
  assert.equal(migrated.activeProfileId, 'custom-elegant');
  assert.equal(migrated.profiles.find((profile) => profile.id === migrated.activeProfileId)?.occasion, 'elegant');
  assert.equal(migrated.ownedItemIds.length, 28);
  assert.equal(migrated.feedback.length, 8);
  assert.deepEqual(restoreState(JSON.stringify(migrated)), migrated);
  assert.deepEqual(JSON.parse(legacyP2Json), previous);
});

test('V2 round trip retains new default occasions, custom preferences and old opinions', () => {
  const state = restoreState(legacyP2Json)!;
  state.profiles.push(...(['wedding', 'work', 'date', 'party'] as const).map((occasion) => ({
    ...base, id: `new-${occasion}`, name: occasion, occasion, defaultMode: 'value' as const,
  })));
  state.activeProfileId = 'new-wedding';
  state.feedback.push({ profileId: 'new-wedding', outfitId: 'w5', vote: 'like' });
  assert.deepEqual(restoreState(JSON.stringify(state)), state);
  assert.equal(createInitialState().version, 2);
  assert.equal(restoreState(JSON.stringify({ ...JSON.parse(legacyP2Json), activeProfileId: 'deleted' })), null);
});
