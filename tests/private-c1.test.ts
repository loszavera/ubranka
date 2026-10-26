import test from 'node:test';
import assert from 'node:assert/strict';
import { WardrobeApi, type WardrobeCall } from '../src/private/api.ts';
import { PrivateAttemptJournal } from '../src/private/attemptReceipt.ts';
import { emptyBodyFitData, emptyPrivateSettings, PrivateError, type PrivateSnapshot, type VisualizationIntent, type VisualizationJob } from '../src/private/model.ts';
import { PrivateStore } from '../src/private/store.ts';
import { isIntentCurrent, resultVariant } from '../src/private/visualization.ts';
import { PhotoQueue } from '../src/private/photoQueue.ts';

const account = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'synthetic@example.invalid' };
const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const nextId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const photo = (suffix: string) => ({ id: suffix, mainPath: `${account.id}/${suffix}/main.jpg`, thumbPath: `${account.id}/${suffix}/thumb.jpg`, mimeType: 'image/jpeg', bytes: 10, thumbBytes: 3 });
function fixture(): { snapshot: PrivateSnapshot; intent: VisualizationIntent } {
  const body = photo('body'); const dress = photo('dress'); const shoes = photo('shoes');
  const snapshot: PrivateSnapshot = { accountId: account.id, state: { revision: 1, data: emptyPrivateSettings() }, bodyFit: { revision: 1, data: emptyBodyFitData(), photo: body, photoDeletion: null },
    items: [dress, shoes].map((value, index) => ({ id: value.id, revision: 1, status: 'active', name: value.id, category: index ? 'shoes' : 'dress', color: 'navy', occasions: ['casual'], size: 'M', photoKind: 'garment', createdAt: '', updatedAt: '', photo: value })),
    styling: { revision: 1, data: { outfits: [{ id, profileId: 'profile', occasion: 'casual', itemIds: ['dress', 'shoes'], itemRevisions: { dress: 1, shoes: 1 }, createdAt: '' }], feedback: [] } },
    visualization: { mode: 'private_pilot', jobs: [], consent: { accepted: false, version: 'p33c-ai-v1.1', revision: 0 },
      pilot: { id: 'p33c-v1', status: 'active', eligible: true, startsAt: '2026-01-01', endsAt: '2099-01-01', maxSends: 60, accountMaxSends: 30, dailyMaxSends: 5, sentCount: 0, accountSentCount: 0, dailySentCount: 0, budgetPln: 25, spentPln: 0, reservedPln: 0, availablePln: 23.51, blocked: false },
      limits: { results: 30, attempts: 30, dailyAttempts: 5, usedResults: 0, usedAttempts: 0, usedDailyAttempts: 0, reservedPln: 0, spentPln: 0, budgetPln: 25, trialEndsAt: '2099-01-01', monthResetsAt: '2099-01-01', dayResetsAt: '2099-01-01' } } };
  const intent: VisualizationIntent = { id: nextId, trialId: 'p33c-v1', outfitId: id, fingerprint: 'in-memory-only', bodyRevision: 1, stylingRevision: 1, consentRevision: 0, expiresAt: '2099-01-01', reservePln: 23.51, jobId: null, manifestHash: 'a'.repeat(64),
    inputs: [body, dress, shoes].map((value, index) => ({ photoId: value.id, path: value.mainPath, thumbPath: value.thumbPath, bytes: value.bytes, kind: index ? 'item' : 'body', itemId: index ? value.id : null, canonical: { version: 'p33c-jpeg-v1', sha256: 'b'.repeat(64), bytes: 10, width: 1, height: 1 } })) };
  return { snapshot, intent };
}
function service(handler: (action: string, payload: Record<string, unknown>) => Promise<unknown>) {
  const call: WardrobeCall = async <T>(action: string, payload: Record<string, unknown> = {}) => await handler(action, payload) as T;
  return new WardrobeApi(call);
}
function journal() { const values = new Map<string, string>(); return { values, create: () => new PrivateAttemptJournal({ get: async key => values.get(key) ?? null, set: async (key, value) => { values.set(key, value); }, delete: async key => { values.delete(key); } }) }; }
const job = (): VisualizationJob => ({ id, revision: 1, trialId: 'p33c-v1', intentId: nextId, outfitId: id, status: 'sent', createdAt: '2026-01-01', completedAt: null, expiresAt: '2099-01-01', errorCode: null, reservedPln: 23.51, spentPln: null, result: null });

test('C preparation is free and available while OFF; no consent or generation receipt is created', async () => {
  const { snapshot, intent } = fixture(); snapshot.visualization!.mode = 'off'; const actions: string[] = []; const saved = journal();
  const store = new PrivateStore(service(async action => { actions.push(action); return action === 'bootstrap' ? snapshot : intent; }), () => id, undefined, saved.create());
  store.setIdentity(account); await store.refresh(); assert.deepEqual(await store.prepareVisualization(id), intent);
  await assert.rejects(store.requestPrivateVisualization(id, intent, true), /AI_DISABLED/);
  assert.deepEqual(actions, ['bootstrap', 'prepareVisualization']); assert.equal(saved.values.size, 0); assert.equal(snapshot.visualization!.consent.accepted, false);
});

test('C validates displayed input versions, explicit consent, limits and receipt before POST', async () => {
  const { snapshot, intent } = fixture(); let requests = 0; const saved = journal();
  const store = new PrivateStore(service(async (action, payload) => {
    if (action === 'bootstrap') return snapshot;
    requests++; assert.equal(action, 'requestVisualization');
    assert.deepEqual(payload, { operationId: id, trialId: 'p33c-v1', intentId: nextId, accepted: true, consentVersion: 'p33c-ai-v1.2', expectedConsentRevision: 0, expectedManifestHash: 'a'.repeat(64) });
    assert.deepEqual(JSON.parse(saved.values.get(account.id)!), { version: 2, receipts: [{ id, trialId: 'p33c-v1' }] });
    return job();
  }), () => id, undefined, saved.create());
  store.setIdentity(account); await store.refresh();
  await assert.rejects(store.requestPrivateVisualization(id, intent, false), /AI_CONSENT_REQUIRED/);
  await assert.rejects(store.requestPrivateVisualization(id, { ...intent, bodyRevision: 0 }, true), /CONFLICT/);
  await assert.rejects(store.requestPrivateVisualization(id, { ...intent, reservePln: 25 }, true), /TRIAL_BLOCKED/);
  await store.requestPrivateVisualization(id, intent, true); assert.equal(requests, 1); assert.equal(saved.values.size, 0);
  await assert.rejects(store.requestPrivateVisualization(nextId, intent, true), /CASE_USED/);
});

test('C2 refuses a legacy or incomplete copy manifest before persisting a receipt or contacting the provider path', async () => {
  const { snapshot, intent } = fixture(); let requests = 0; const saved = journal();
  const store = new PrivateStore(service(async action => { if (action === 'bootstrap') return snapshot; requests++; return job(); }), () => id, undefined, saved.create());
  store.setIdentity(account); await store.refresh();
  await assert.rejects(store.requestPrivateVisualization(id, { ...intent, manifestHash: undefined }, true), /CANONICAL_INPUT_INVALID/);
  await assert.rejects(store.requestPrivateVisualization(id, { ...intent, inputs: intent.inputs.map(input => ({ ...input, canonical: undefined })) }, true), /CANONICAL_INPUT_INVALID/);
  assert.equal(requests, 0); assert.equal(saved.values.size, 0);
});

test('C2 successful response cannot be submitted again before the next authoritative snapshot', async () => {
  const { snapshot, intent } = fixture(); let requests = 0; const saved = journal();
  const store = new PrivateStore(service(async action => { if (action === 'bootstrap') return snapshot; requests++; return { ...job(), status: 'succeeded', reservedPln: 0, spentPln: 0.25 }; }), () => id, undefined, saved.create());
  store.setIdentity(account); await store.refresh(); await store.requestPrivateVisualization(id, intent, true);
  await assert.rejects(store.requestPrivateVisualization(nextId, intent, true), /CASE_USED/);
  assert.equal(requests, 1);
});

test('a garment revision invalidates C consent even when the photo identifier stays unchanged', () => {
  const { snapshot, intent } = fixture(); assert.equal(isIntentCurrent(snapshot, intent), true);
  snapshot.items[0].revision++; assert.equal(isIntentCurrent(snapshot, intent), false);
});

test('lost C response before visible reservation survives reload/logout and cannot send a new UUID', async () => {
  const { snapshot, intent } = fixture(); const saved = journal(); let posts = 0;
  const api = service(async action => { if (action === 'bootstrap') return snapshot; if (action === 'getVisualization') throw new PrivateError('NOT_FOUND'); posts++; throw new PrivateError('NETWORK'); });
  const first = new PrivateStore(api, () => id, undefined, saved.create()); first.setIdentity(account); await first.refresh();
  await assert.rejects(first.requestPrivateVisualization(id, intent, true), /NETWORK/); first.setIdentity(null); first.dispose();
  const second = new PrivateStore(api, () => nextId, undefined, saved.create()); second.setIdentity(account); await second.refresh();
  assert.deepEqual(second.getSnapshot().visualizationAttempt, { id, trialId: 'p33c-v1', status: 'unconfirmed' });
  await assert.rejects(second.getVisualization(id), /NOT_FOUND/); await assert.rejects(second.requestPrivateVisualization(nextId, intent, true), /TRIAL_BLOCKED/);
  assert.equal(posts, 1); assert.equal(saved.values.size, 1);
});

test('old B receipts survive C journal migration and another account cannot observe a C receipt', async () => {
  const saved = journal(); await saved.create().write(account.id, { id, caseId: 'B01' }); await saved.create().write(account.id, { id: nextId, trialId: 'p33c-v1' });
  assert.deepEqual(await saved.create().read(account.id), [{ id, caseId: 'B01' }, { id: nextId, trialId: 'p33c-v1' }]);
  assert.deepEqual(await saved.create().read(nextId), []);
  await saved.create().remove(account.id, nextId); assert.equal(JSON.parse(saved.values.get(account.id)!).version, 1);
});

test('revoke advances consent, preserves finished results and unknown costs, and stale approval cannot return', async () => {
  const { snapshot, intent } = fixture(); const done = { ...job(), status: 'succeeded' as const, result: { ...photo('result'), mimeType: 'image/png' } }; snapshot.visualization!.jobs = [done];
  const store = new PrivateStore(service(async action => action === 'bootstrap' ? snapshot : { accepted: false, version: 'p33c-ai-v1.1', revision: 1 }), () => id);
  store.setIdentity(account); await store.refresh(); await store.revokeAiConsent(0);
  assert.equal(store.getSnapshot().snapshot?.visualization?.jobs[0].result, done.result); assert.equal(done.spentPln, null);
  assert.equal(isIntentCurrent(store.getSnapshot().snapshot, intent), false);
});

test('C acknowledgement arriving after account switch does not install a result or clear the other account', async () => {
  const { snapshot, intent } = fixture(); const saved = journal(); let resolve!: (value: VisualizationJob) => void;
  const waiting = new Promise<VisualizationJob>(done => { resolve = done; });
  let requested!: () => void; const started = new Promise<void>(done => { requested = done; });
  const store = new PrivateStore(service(async action => { if (action === 'bootstrap') return snapshot; requested(); return waiting; }), () => id, undefined, saved.create());
  store.setIdentity(account); await store.refresh(); const work = store.requestPrivateVisualization(id, intent, true); await started;
  store.setIdentity({ id: nextId, email: 'other@example.invalid' }); resolve(job()); await assert.rejects(work, /SESSION_CHANGED/);
  assert.equal(store.getSnapshot().snapshot, null); assert.equal(store.getSnapshot().visualizationAttempt, null); assert.equal(saved.values.size, 1);
});

test('explicit result variants support new JPEG thumbnails and old PNG without using path extensions', () => {
  const result = { mainPath: 'opaque/a', thumbPath: 'opaque/b', bytes: 100, thumbBytes: 10, mimeType: 'image/png' };
  assert.equal(resultVariant(result, true).extension, 'png');
  assert.deepEqual(resultVariant({ ...result, thumbMimeType: 'image/jpeg', thumbWidth: 600, thumbHeight: 900 }, true), { path: 'opaque/b', mimeType: 'image/jpeg', bytes: 10, width: 600, height: 900, extension: 'jpg' });
});

test('private photo queue admits at most two downloads and aborting a queued request never starts it', async () => {
  const queue = new PhotoQueue(); const controller = new AbortController(); const aborted = new AbortController();
  const releases: (() => void)[] = []; let active = 0; let maximum = 0; const started: number[] = [];
  const work = (n: number) => queue.run(n === 2 ? aborted.signal : controller.signal, async () => { started.push(n); active++; maximum = Math.max(maximum, active); await new Promise<void>(done => releases.push(done)); active--; return n; });
  const promises = [work(0), work(1), work(2), work(3)]; const rejected = assert.rejects(promises[2], /CANCELLED/);
  await Promise.resolve(); assert.deepEqual(started, [0, 1]); aborted.abort(); await rejected;
  releases.shift()!(); await promises[0]; await Promise.resolve(); assert.deepEqual(started, [0, 1, 3]);
  releases.forEach(release => release()); await Promise.all([promises[1], promises[3]]); assert.equal(maximum, 2);
});
