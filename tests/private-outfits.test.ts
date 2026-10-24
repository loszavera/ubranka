import test from 'node:test';
import assert from 'node:assert/strict';
import type { Occasion, Profile } from '../src/domain/model.ts';
import type { PrivateCategory, PrivateItem } from '../src/private/model.ts';
import { isCompletePrivateOutfit, recommendPrivateOutfits, rehydratePrivateOutfit, swapPrivateOutfitItem,
  type PrivateOutfit, type PrivateOutfitFeedback, type SavedPrivateOutfit } from '../src/private/outfits.ts';

const profile: Profile = { id: 'style-a', name: 'Codzienny', audience: 'women', occasion: 'casual', budget: 0, priority: 'versatility', defaultMode: 'best' };
const accountId = 'owner-a';
function item(id: string, category: PrivateCategory, color = 'czarny', occasions: Occasion[] = ['casual']): PrivateItem {
  return { id, category, color, occasions, name: id, size: '', photoKind: 'garment', revision: 1,
    status: 'active', photo: null, createdAt: '2026-10-25T00:00:00Z', updatedAt: '2026-10-25T00:00:00Z' };
}
const separates = () => [item('top', 'top', 'white'), item('bottom', 'bottom', 'navy'), item('shoes', 'shoes')];
const recommend = (items: PrivateItem[], extra: Partial<Parameters<typeof recommendPrivateOutfits>[0]> = {}) =>
  recommendPrivateOutfits({ accountId, profile, items, ...extra });
const saved = (outfit: PrivateOutfit): SavedPrivateOutfit => ({ ...outfit, createdAt: '2026-10-25T00:00:00Z' });
const feedback = (profileId: string, itemIds: string[], vote: 'like' | 'dislike', outfitId = 'previous'): PrivateOutfitFeedback => ({ profileId, itemIds, vote, outfitId });

test('private recommendations contain at most two distinct complete active owned sets at zero new spend', () => {
  const items = [...separates(), item('top2', 'top', 'beige'), item('top3', 'top', 'pink'), item('scarf', 'accessory'), { ...item('deleted', 'top'), status: 'deleting' as const }];
  const before = JSON.stringify(items);
  const result = recommend(items);
  assert.equal(result.outfits.length, 2);
  assert.equal(new Set(result.outfits.map(outfit => outfit.id)).size, 2);
  for (const outfit of result.outfits) {
    assert.equal(outfit.accountId, accountId);
    assert.equal(outfit.newSpendPln, 0);
    assert.equal(isCompletePrivateOutfit(outfit.itemIds.map(id => items.find(entry => entry.id === id)!)), true);
    assert.ok(outfit.itemIds.every(id => id !== 'scarf' && id !== 'deleted'));
    assert.deepEqual(outfit.itemRevisions, Object.fromEntries(outfit.itemIds.map(id => [id, 1])));
  }
  assert.equal(JSON.stringify(items), before);
});

test('occasion eligibility precedes even strong preference feedback and does not fill a second slot', () => {
  const items = [...separates(), item('wedding-top', 'top', 'white', ['wedding'])];
  const result = recommend(items, { feedback: Array.from({ length: 30 }, (_, index) => feedback(profile.id, ['wedding-top'], 'like', String(index))) });
  assert.equal(result.outfits.length, 1);
  assert.equal(result.outfits[0].itemIds.includes('wedding-top'), false);
  assert.ok(result.notices.includes('only_one_outfit'));
  assert.equal(recommend(items, { occasion: 'wedding' }).outfits.length, 0);
  assert.equal(profile.occasion, 'casual');
});

test('explicit round occasion is independent of the saved profile default', () => {
  const items = [item('dress', 'dress', 'navy', ['wedding']), item('pumps', 'shoes', 'beige', ['wedding'])];
  assert.equal(recommend(items).outfits.length, 0);
  const result = recommend(items, { occasion: 'wedding' });
  assert.equal(result.outfits.length, 1);
  assert.equal(result.outfits[0].occasion, 'wedding');
  assert.equal(profile.occasion, 'casual');
});

test('only supported complete structures are valid; a layer never replaces a required slot', () => {
  assert.equal(isCompletePrivateOutfit(separates()), true);
  assert.equal(isCompletePrivateOutfit([item('dress', 'dress'), item('shoes', 'shoes')]), true);
  assert.equal(isCompletePrivateOutfit([item('dress', 'dress'), item('shoes', 'shoes'), item('layer', 'layer')]), true);
  assert.equal(isCompletePrivateOutfit([item('dress', 'dress')]), false);
  assert.equal(isCompletePrivateOutfit([item('top', 'top'), item('layer', 'layer'), item('shoes', 'shoes')]), false);
  assert.equal(isCompletePrivateOutfit([...separates(), item('layer', 'layer')]), false);
  assert.equal(isCompletePrivateOutfit([item('dress', 'dress'), item('shoes', 'shoes'), item('bag', 'accessory')]), false);
  assert.equal(isCompletePrivateOutfit([item('dress', 'dress'), item('shoes', 'shoes'), item('shoes2', 'shoes')]), false);
});

test('dress can receive an optional matching layer while all generated outfits stay within three items', () => {
  const items = [item('dress', 'dress'), item('shoes', 'shoes'), item('layer', 'layer')];
  const result = recommend(items);
  assert.equal(result.outfits.length, 2);
  assert.deepEqual(result.outfits.map(outfit => outfit.itemIds.length).sort(), [2, 3]);
  assert.ok(result.outfits.every(outfit => outfit.kind === 'dress'));
});

test('missing slots are reported as alternatives without inventing garments or borrowing demo items', () => {
  const result = recommend([item('top', 'top'), item('layer', 'layer')]);
  assert.deepEqual(result.outfits, []);
  assert.deepEqual(result.missingAlternatives, [
    { kind: 'separates', categories: ['bottom', 'shoes'] }, { kind: 'dress', categories: ['dress', 'shoes'] },
  ]);
  assert.ok(result.notices.includes('incomplete_wardrobe'));
  assert.ok(recommend([]).notices.includes('empty_wardrobe'));
  assert.ok(recommend([item('formal', 'dress', 'navy', ['elegant'])]).notices.includes('no_matching_occasion'));
});

test('identifiers and ranking are stable across input ordering and change with scope or source revision', () => {
  const items = separates();
  const initial = recommend(items).outfits[0];
  assert.deepEqual(recommend([...items].reverse()).outfits[0], initial);
  assert.match(initial.id, /^[a-f\d]{8}-[a-f\d]{4}-5[a-f\d]{3}-a[a-f\d]{3}-[a-f\d]{12}$/);
  assert.notEqual(recommend(items, { accountId: 'owner-b' }).outfits[0].id, initial.id);
  assert.notEqual(recommend(items, { profile: { ...profile, id: 'style-b' } }).outfits[0].id, initial.id);
  assert.notEqual(recommend(items.map(entry => ({ ...entry, revision: 2 }))).outfits[0].id, initial.id);
  assert.deepEqual(recommend(items, { excludeIds: [initial.id] }).outfits, []);
  assert.ok(recommend(items, { excludeIds: [initial.id] }).notices.includes('no_more_outfits'));
});

test('color coordination recognizes Polish and English metadata, but unknown colors stay unmeasured', () => {
  const items = [item('neutral', 'top', 'BIAŁY'), item('accent', 'top', 'czerwony'), item('bottom', 'bottom', 'niebieski'), item('shoes', 'shoes', 'black')];
  const result = recommend(items);
  assert.equal(result.outfits[0].itemIds.includes('neutral'), true);
  assert.ok(result.outfits[0].reasons.includes('coordinated_colors'));
  assert.ok(!result.outfits[1].reasons.includes('coordinated_colors'));
  const unknown = recommend(separates().map(entry => ({ ...entry, color: 'wielokolorowy wzór' }))).outfits[0];
  assert.ok(unknown.notices.includes('unknown_colors'));
  assert.ok(!unknown.reasons.includes('coordinated_colors'));
});

test('feedback learns shared items and same-category colors only within the selected profile', () => {
  const items = [...separates(), item('top2', 'top', 'white')];
  const baseline = recommend(items);
  const liked = baseline.outfits[1];
  const ownVote = feedback(profile.id, liked.itemIds, 'like');
  assert.equal(recommend(items, { feedback: [ownVote] }).outfits[0].id, liked.id);
  assert.deepEqual(recommend(items, { feedback: [{ ...ownVote, profileId: 'other-style' }] }), baseline);
  const newSameColor = item('new-white-top', 'top', 'biały');
  const transfer = recommend([...items, newSameColor], { feedback: [feedback(profile.id, ['top'], 'like')], excludeIds: baseline.outfits.map(outfit => outfit.id) });
  assert.ok(transfer.outfits[0].reasons.includes('liked_colors'));
  assert.equal(transfer.outfits[0].itemIds.includes(newSameColor.id), true);
});

test('updated dislike replaces a previous like; missing and demo feedback cannot invent preferences', () => {
  const items = [...separates(), item('top2', 'top', 'beige')];
  const candidate = recommend(items).outfits[0];
  const like = feedback(profile.id, candidate.itemIds, 'like');
  const dislike = { ...like, vote: 'dislike' as const };
  assert.deepEqual(recommend(items, { feedback: [like, dislike] }), recommend(items, { feedback: [dislike] }));
  assert.notEqual(recommend(items, { feedback: [dislike] }).outfits[0].id, candidate.id);
  assert.deepEqual(recommend(items, { feedback: [feedback(profile.id, ['w-demo-item'], 'like')] }), recommend(items));
});

test('versatility uses explicit occasion coverage; missing comfort/quality and photos are disclosed', () => {
  const items = [...separates(), item('versatile-top', 'top', 'white', ['casual', 'work', 'date'])];
  const result = recommend(items);
  assert.equal(result.outfits[0].itemIds.includes('versatile-top'), true);
  assert.ok(result.outfits[0].reasons.includes('versatile_items'));
  assert.ok(result.outfits[0].notices.includes('missing_photos'));
  for (const priority of ['comfort', 'quality'] as const) {
    const unmeasured = recommend(separates(), { profile: { ...profile, priority } });
    assert.ok(unmeasured.notices.includes('priority_not_measured'));
    assert.ok(unmeasured.outfits[0].notices.includes('priority_not_measured'));
    assert.ok(!unmeasured.outfits[0].reasons.includes('versatile_items'));
  }
});

test('manual swap preserves category, occasion and exact active references without mutating the original', () => {
  const items = [...separates(), item('replacement', 'top', 'beige')];
  const outfit = recommend(separates()).outfits[0];
  const before = JSON.stringify(outfit);
  const swapped = swapPrivateOutfitItem({ outfit, itemId: 'top', replacementId: 'replacement', items, profile });
  assert.deepEqual(swapped.itemIds, ['replacement', 'bottom', 'shoes']);
  assert.equal(swapped.newSpendPln, 0);
  assert.notEqual(swapped.id, outfit.id);
  assert.equal(JSON.stringify(outfit), before);
  assert.throws(() => swapPrivateOutfitItem({ outfit, itemId: 'top', replacementId: 'bottom', items, profile }), /INVALID_REPLACEMENT/);
  assert.throws(() => swapPrivateOutfitItem({ outfit, itemId: 'absent', replacementId: 'replacement', items, profile }), /INVALID_REPLACEMENT/);
  for (const replacement of [{ ...item('replacement', 'top'), status: 'deleting' as const }, item('replacement', 'top', 'white', ['wedding'])]) {
    assert.throws(() => swapPrivateOutfitItem({ outfit, itemId: 'top', replacementId: 'replacement', items: [...separates(), replacement], profile }), /INVALID_REPLACEMENT/);
  }
});

test('saved outfits with missing/deleting, changed, inappropriate or incomplete references cannot be active', () => {
  const items = separates();
  const outfit = recommend(items).outfits[0];
  const request = { savedOutfit: saved(outfit), accountId, items, profile };
  assert.deepEqual(rehydratePrivateOutfit(request), { outfit, issue: null });
  assert.equal(rehydratePrivateOutfit({ ...request, items: items.slice(1) }).issue, 'missing_items');
  assert.equal(rehydratePrivateOutfit({ ...request, items: items.map(entry => ({ ...entry, status: 'deleting' })) }).issue, 'missing_items');
  assert.equal(rehydratePrivateOutfit({ ...request, items: items.map(entry => ({ ...entry, revision: 2 })) }).issue, 'items_changed');
  assert.equal(rehydratePrivateOutfit({ ...request, items: items.map(entry => ({ ...entry, occasions: ['work'] })) }).issue, 'occasion_mismatch');
  assert.equal(rehydratePrivateOutfit({ ...request, profile: { ...profile, id: 'different' } }).issue, 'profile_mismatch');
  assert.equal(rehydratePrivateOutfit({ ...request, savedOutfit: { ...saved(outfit), itemIds: ['top'] } }).issue, 'incomplete_outfit');
  assert.throws(() => swapPrivateOutfitItem({ outfit, itemId: 'top', replacementId: 'top', items: items.map(entry => ({ ...entry, revision: 2 })), profile }), /STALE_OUTFIT/);
});

test('outfit logic performs no network calls, including incomplete and stale inputs', () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('NETWORK_FORBIDDEN'); };
  try {
    const items = separates();
    const outfit = recommend(items).outfits[0];
    rehydratePrivateOutfit({ savedOutfit: saved(outfit), accountId, items: [], profile });
    recommend([]);
    swapPrivateOutfitItem({ outfit, itemId: 'top', replacementId: 'top', items, profile });
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test('only contradictory explicit letter-size labels are excluded, after the occasion filter', () => {
  const items = [...separates().map(entry => ({ ...entry, size: ' M ' })),
    { ...item('small-top', 'top'), size: 'S' },
    { ...item('large-bottom', 'bottom'), size: 'L' },
    { ...item('formal-top', 'top', 'black', ['wedding']), size: 'XS' }];
  const result = recommend(items, { bodyFit: { topSize: 'm', bottomSize: ' M ' } });
  assert.equal(result.sizeExcluded, 2);
  assert.ok(result.notices.includes('size_mismatch'));
  assert.equal(result.outfits.length, 1);
  assert.deepEqual(result.outfits[0].itemIds, ['top', 'bottom', 'shoes']);
  const noTop = recommend(items.filter(entry => entry.id !== 'top'), { bodyFit: { topSize: 'M', bottomSize: 'M' } });
  assert.equal(noTop.outfits.length, 0);
  assert.ok(noTop.missingAlternatives.find(entry => entry.kind === 'separates')?.categories.includes('top'));
});

test('unknown, numeric, universal and mixed sizes pass without guessed conversion; shoes are not compared', () => {
  for (const unknown of ['', '38', 'uni', 'M/L', 'M (EU 38)', 'one size', '2XL']) {
    const result = recommend(separates().map(entry => ({ ...entry, size: unknown })), { bodyFit: { topSize: 'S', bottomSize: 'S' } });
    assert.equal(result.sizeExcluded, 0, unknown);
    assert.equal(result.outfits.length, 1, unknown);
    const unknownProfile = recommend(separates().map(entry => ({ ...entry, size: 'XL' })), { bodyFit: { topSize: unknown, bottomSize: unknown } });
    assert.equal(unknownProfile.sizeExcluded, 0, unknown);
  }
  const items = separates().map(entry => ({ ...entry, size: entry.category === 'shoes' ? 'XXXL' : 'M' }));
  assert.equal(recommend(items, { bodyFit: { topSize: 'M', bottomSize: 'M' } }).outfits.length, 1);
  assert.equal(recommend(items).sizeExcluded, 0);
});

test('dress/layer use the top label; changed body labels invalidate saved selections and incompatible swaps', () => {
  const items = [{ ...item('dress', 'dress'), size: 'M' }, item('shoes', 'shoes'), { ...item('layer', 'layer'), size: 'S' }];
  const result = recommend(items, { bodyFit: { topSize: 'M' } });
  assert.equal(result.sizeExcluded, 1);
  assert.equal(result.outfits.length, 1);
  assert.equal(rehydratePrivateOutfit({ savedOutfit: saved(result.outfits[0]), accountId, items, profile, bodyFit: { topSize: 'L' } }).issue, 'size_mismatch');
  assert.throws(() => swapPrivateOutfitItem({ outfit: result.outfits[0], itemId: 'dress', replacementId: 'other-dress', items: [...items, { ...item('other-dress', 'dress'), size: 'XS' }], profile, bodyFit: { topSize: 'M' } }), /INVALID_REPLACEMENT/);
});
