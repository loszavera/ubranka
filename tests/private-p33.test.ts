import test from 'node:test';
import assert from 'node:assert/strict';
import { WardrobeApi, type WardrobeCall } from '../src/private/api.ts';
import { BODY_STORAGE_CONSENT, emptyBodyFitData, emptyPrivateSettings, normalizeBodyFitData, PrivateError, type PrivateSnapshot, type BodyFit, type VisualizationJob } from '../src/private/model.ts';
import { PrivateStore, type UploadPhoto } from '../src/private/store.ts';

const identity = { id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', email: 'synthetic@example.invalid' };
const operationId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const photo = { id: operationId, mainPath: `${identity.id}/${identity.id}/${operationId}/main.jpg`, thumbPath: `${identity.id}/${identity.id}/${operationId}/thumb.jpg`, mimeType: 'image/jpeg', bytes: 3, thumbBytes: 2 };
const body = (): BodyFit => ({ revision: 0, data: emptyBodyFitData(), photo: null, photoDeletion: null });
const snapshot = (): PrivateSnapshot => ({ accountId: identity.id, state: { revision: 0, data: emptyPrivateSettings() }, items: [], bodyFit: body(), styling: { revision: 0, data: { outfits: [], feedback: [] } }, visualization: {
  mode: 'off', consent: { accepted: false, version: 'p33-ai-v1' }, jobs: [], limits: { results: 30, attempts: 40, dailyAttempts: 5, usedResults: 0, usedAttempts: 0, usedDailyAttempts: 0, reservedPln: 0, spentPln: 0, budgetPln: 0, trialEndsAt: null, monthResetsAt: '2026-11-01T00:00:00Z', dayResetsAt: '2026-10-26T00:00:00Z' },
} });
const prepared = (): UploadPhoto => ({ main: { bytes: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }, thumbnail: { bytes: new Uint8Array([4, 5]), mimeType: 'image/jpeg' } });
const wrap = (handler: (action: string, payload: Record<string, unknown>, signal?: AbortSignal) => Promise<unknown>): WardrobeCall => async <T>(action: string, payload: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> => await handler(action, payload, signal) as T;
const job = (): VisualizationJob => ({ id: operationId, revision: 1, outfitId: operationId, status: 'succeeded', createdAt: '2026-10-25T00:00:00Z', completedAt: '2026-10-25T00:01:00Z', expiresAt: '2099-01-01T00:00:00Z', errorCode: null, reservedPln: 1, spentPln: null, result: photo });

test('body measurements stay optional and precise; do not infer or silently round values', () => {
  assert.deepEqual(normalizeBodyFitData(emptyBodyFitData()), emptyBodyFitData());
  assert.equal(normalizeBodyFitData({ ...emptyBodyFitData(), heightCm: 172.5, topSize: ' M ' }).topSize, 'M');
  for (const heightCm of [0, -1, 300.1, 172.55, Number.NaN, Number.POSITIVE_INFINITY]) assert.throws(() => normalizeBodyFitData({ ...emptyBodyFitData(), heightCm }), /INVALID_BODY_FIT/);
  assert.throws(() => normalizeBodyFitData({ ...emptyBodyFitData(), topSize: 'a'.repeat(31) }), /INVALID_BODY_FIT/);
});

test('body upload requires explicit storage consent and retry keeps one operation without any AI request', async () => {
  const calls: { action: string; payload: Record<string, unknown> }[] = []; let attempts = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    calls.push({ action, payload });
    if (action === 'bootstrap') return snapshot();
    assert.equal(action, 'uploadBodyPhoto');
    if (++attempts === 1) throw new PrivateError('NETWORK');
    return { ...body(), revision: 1, photo };
  })), () => operationId);
  store.setIdentity(identity); await store.refresh(); const upload = prepared();
  await assert.rejects(store.uploadBodyPhoto(0, upload, false), /STORAGE_CONSENT_REQUIRED/);
  assert.equal(calls.length, 1);
  await assert.rejects(store.uploadBodyPhoto(0, upload, true), /NETWORK/);
  await store.uploadBodyPhoto(0, upload, true);
  assert.equal(calls[1].payload.operationId, calls[2].payload.operationId);
  assert.equal(calls[2].payload.storageConsentVersion, BODY_STORAGE_CONSENT);
  assert.equal(calls[2].payload.mainBase64, 'AQID');
  assert.equal(store.getSnapshot().snapshot?.bodyFit?.photo?.id, photo.id);
  assert.equal(store.getSnapshot().snapshot?.visualization?.consent.accepted, false);
});

test('body CAS conflict preserves both cloud snapshot and explicit requested revision without retry', async () => {
  let writes = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    if (action === 'bootstrap') return snapshot();
    writes++; assert.equal(action, 'saveBodyFit'); assert.equal(payload.expectedRevision, 0); throw new PrivateError('CONFLICT');
  })), () => operationId);
  store.setIdentity(identity); await store.refresh();
  await assert.rejects(store.saveBodyFit({ ...emptyBodyFitData(), heightCm: 172.5 }, 0), /CONFLICT/);
  assert.equal(writes, 1); assert.equal(store.getSnapshot().snapshot?.bodyFit?.data.heightCm, null);
  assert.equal(store.getSnapshot().error, 'CONFLICT');
});

test('late body upload after account switch is aborted and never installs private photo into next account', async () => {
  let resolve!: (value: BodyFit) => void; const late = new Promise<BodyFit>(done => { resolve = done; }); let signal: AbortSignal | undefined; let clears = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, _payload, requestSignal) => {
    if (action === 'bootstrap') return snapshot(); signal = requestSignal; return late;
  })), () => operationId, () => { clears++; });
  store.setIdentity(identity); await store.refresh(); const pending = store.uploadBodyPhoto(0, prepared(), true);
  store.setIdentity({ id: operationId, email: 'second@example.invalid' });
  assert.equal(signal?.aborted, true); resolve({ ...body(), revision: 1, photo });
  await assert.rejects(pending, /SESSION_CHANGED/);
  assert.equal(store.getSnapshot().identity?.id, operationId); assert.equal(store.getSnapshot().snapshot, null); assert.ok(clears >= 2);
});

test('acknowledged body deletion hides body and dependent result even when refresh fails, preserving ledger and sizes', async () => {
  const value = snapshot(); value.bodyFit = { ...body(), photo, data: { ...emptyBodyFitData(), topSize: 'M' } }; value.visualization!.jobs = [job()]; value.visualization!.limits.reservedPln = 1;
  let reads = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async action => {
    if (action === 'deleteBodyPhoto') return { status: 'pending' };
    if (++reads === 1) return value; throw new PrivateError('NETWORK');
  })), () => operationId);
  store.setIdentity(identity); await store.refresh(); await assert.rejects(store.deleteBodyPhoto(0), /NETWORK/);
  const after = store.getSnapshot().snapshot!;
  assert.equal(after.bodyFit?.photo, null); assert.equal(after.bodyFit?.photoDeletion, 'pending'); assert.equal(after.bodyFit?.data.topSize, 'M');
  assert.equal(after.visualization?.jobs[0].result, null); assert.equal(after.visualization?.jobs[0].spentPln, null); assert.equal(after.visualization?.limits.reservedPln, 1);
});

test('rejected body deletion retains photo and does not claim deletion success', async () => {
  const value = snapshot(); value.bodyFit!.photo = photo;
  const store = new PrivateStore(new WardrobeApi(wrap(async action => {
    if (action === 'bootstrap') return value; throw new PrivateError('CONFLICT');
  })), () => operationId);
  store.setIdentity(identity); await store.refresh(); await assert.rejects(store.deleteBodyPhoto(0), /CONFLICT/);
  assert.equal(store.getSnapshot().snapshot?.bodyFit?.photo?.id, photo.id); assert.equal(store.getSnapshot().snapshot?.bodyFit?.photoDeletion, null);
});

test('styling feedback sync does not manufacture saved outfits or silently merge a stale revision', async () => {
  let writes = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    if (action === 'bootstrap') return snapshot();
    assert.equal(action, 'saveStyling'); assert.equal(payload.expectedRevision, 0);
    if (++writes > 1) throw new PrivateError('CONFLICT'); return { revision: 1, data: payload.data };
  })), () => operationId);
  store.setIdentity(identity); await store.refresh();
  const data = { outfits: [], feedback: [{ outfitId: operationId, profileId: 'private-style', itemIds: [operationId], vote: 'like' as const }] };
  await store.saveStyling(data, 0); await assert.rejects(store.saveStyling({ outfits: [], feedback: [] }, 0), /CONFLICT/);
  assert.equal(store.getSnapshot().snapshot?.styling?.data.outfits.length, 0); assert.equal(store.getSnapshot().snapshot?.styling?.data.feedback.length, 1);
});

test('acknowledged result deletion survives failed refresh and preserves consumed budget', async () => {
  const value = snapshot(); value.visualization!.jobs = [job()]; value.visualization!.limits.usedAttempts = 1; value.visualization!.limits.reservedPln = 1;
  let reads = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async action => {
    if (action === 'deleteVisualization') return { status: 'deleted' };
    if (++reads === 1) return value; throw new PrivateError('NETWORK');
  })), () => operationId);
  store.setIdentity(identity); await store.refresh(); await assert.rejects(store.deleteVisualization(operationId, 1), /NETWORK/);
  assert.equal(store.getSnapshot().snapshot?.visualization?.jobs.length, 0);
  assert.equal(store.getSnapshot().snapshot?.visualization?.limits.usedAttempts, 1); assert.equal(store.getSnapshot().snapshot?.visualization?.limits.reservedPln, 1);
});

test('deleting all AI data hides controlled inputs on refresh failure while preserving clothes, measurements and budget', async () => {
  const value = snapshot(); value.bodyFit!.photo = photo; value.bodyFit!.data.heightCm = 172.5; value.visualization!.jobs = [job()];
  let reads = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async action => {
    if (action === 'deleteAiData') return { status: 'pending' };
    if (++reads === 1) return value; throw new PrivateError('NETWORK');
  })), () => operationId);
  store.setIdentity(identity); await store.refresh(); await assert.rejects(store.deleteAiData(0), /NETWORK/);
  const after = store.getSnapshot().snapshot!;
  assert.equal(after.bodyFit?.photo, null); assert.equal(after.bodyFit?.data.heightCm, 172.5); assert.deepEqual(after.items, value.items); assert.equal(after.visualization?.jobs.length, 0);
});
