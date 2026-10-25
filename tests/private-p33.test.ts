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

function trialSnapshot(): PrivateSnapshot {
  const value = snapshot();
  value.visualization!.mode = 'synthetic_trial';
  value.visualization!.trial = { id: 'fixture-trial', endsAt: '2099-01-01T00:00:00Z', budgetPln: 10, spentPln: 0, reservedPln: 0, maxSends: 6, sentCount: 0, blocked: false,
    cases: [{ id: 'B01', label: 'Fixture', personPath: photo.mainPath, itemPaths: [photo.mainPath, photo.mainPath], reservePln: 10, model: 'fixture-model', promptVersion: 'p33b-v1', jobId: null, sent: false }] };
  return value;
}

test('B request checks server mode and explicit per-attempt consent before any generation call', async () => {
  let value = snapshot(); let requests = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async action => { if (action === 'bootstrap') return value; requests++; return job(); })), () => operationId);
  store.setIdentity(identity); await store.refresh();
  await assert.rejects(store.requestVisualization(operationId, 'B01', true), /AI_DISABLED/);
  value = trialSnapshot(); await store.refresh();
  await assert.rejects(store.requestVisualization(operationId, 'B01', false), /AI_CONSENT_REQUIRED/);
  assert.equal(requests, 0); assert.equal(store.getSnapshot().visualizationAttempt, null);
});

test('uncertain B request is never replayed, even with a new UUID or read refresh', async () => {
  let requests = 0; const value = trialSnapshot();
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    if (action === 'bootstrap') return value;
    assert.equal(action, 'requestVisualization'); requests++;
    assert.deepEqual(payload, { operationId, caseId: 'B01', consentVersion: 'p33b-synthetic-v1', accepted: true });
    throw new PrivateError('NETWORK');
  })), () => operationId);
  store.setIdentity(identity); await store.refresh();
  await assert.rejects(store.requestVisualization(operationId, 'B01', true), /NETWORK/);
  await store.refresh();
  await assert.rejects(store.requestVisualization('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'B01', true), /TRIAL_BLOCKED/);
  assert.equal(requests, 1); assert.deepEqual(store.getSnapshot().visualizationAttempt, { id: operationId, caseId: 'B01', status: 'unconfirmed' });
});

test('lost response is recovered by a read of the original UUID and server case tombstone remains used', async () => {
  const value = trialSnapshot(); const actions: string[] = [];
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    actions.push(action);
    if (action === 'bootstrap') return value;
    if (action === 'requestVisualization') {
      value.visualization!.trial!.cases[0].jobId = operationId; value.visualization!.trial!.cases[0].sent = true;
      throw new PrivateError('NETWORK');
    }
    assert.equal(action, 'getVisualization'); assert.equal(payload.jobId, operationId); return job();
  })), () => operationId);
  store.setIdentity(identity); await store.refresh(); await assert.rejects(store.requestVisualization(operationId, 'B01', true), /NETWORK/);
  await store.getVisualization(operationId);
  assert.equal(store.getSnapshot().visualizationAttempt?.status, 'accepted');
  assert.equal(store.getSnapshot().snapshot?.visualization?.jobs[0].id, operationId);
  assert.equal(actions.filter(action => action === 'requestVisualization').length, 1);
});

test('B blocks global in-flight reserve, exhausted sends, expired window and server block without touching network', async () => {
  for (const changes of [{ reservedPln: 1 }, { sentCount: 6 }, { endsAt: '2020-01-01T00:00:00Z' }, { blocked: true }]) {
    const value = trialSnapshot(); Object.assign(value.visualization!.trial!, changes); let requests = 0;
    const store = new PrivateStore(new WardrobeApi(wrap(async action => { if (action === 'bootstrap') return value; requests++; return job(); })), () => operationId);
    store.setIdentity(identity); await store.refresh(); await assert.rejects(store.requestVisualization(operationId, 'B01', true), /TRIAL_BLOCKED|AI_DISABLED/);
    assert.equal(requests, 0);
  }
});

test('concurrent click and late generation response cannot cross accounts', async () => {
  let resolve!: (value: VisualizationJob) => void; const pending = new Promise<VisualizationJob>(done => { resolve = done; });
  let signal: AbortSignal | undefined; let requests = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, _payload, requestSignal) => {
    if (action === 'bootstrap') return trialSnapshot(); requests++; signal = requestSignal; return pending;
  })), () => operationId);
  store.setIdentity(identity); await store.refresh(); const first = store.requestVisualization(operationId, 'B01', true);
  await assert.rejects(store.requestVisualization(operationId, 'B01', true), /BUSY/);
  store.setIdentity({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', email: 'other@example.invalid' });
  assert.equal(signal?.aborted, true); resolve(job()); await assert.rejects(first, /SESSION_CHANGED/);
  assert.equal(requests, 1); assert.equal(store.getSnapshot().visualizationAttempt, null); assert.equal(store.getSnapshot().snapshot, null);
});

test('image fidelity review uses its own CAS action and never changes outfit taste feedback', async () => {
  const value = trialSnapshot(); value.visualization!.jobs = [job()]; const calls: string[] = [];
  const review = { scores: { person: 2, garments: 1, completeness: 2, artifacts: 2, usefulness: 1 }, criticalError: true, note: 'Synthetic changed cut' };
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    if (action === 'bootstrap') return value; calls.push(action);
    assert.equal(action, 'reviewVisualization'); assert.equal(payload.expectedRevision, 1); assert.deepEqual(payload.scores, review.scores);
    return { ...job(), revision: 2, review };
  })), () => operationId);
  store.setIdentity(identity); await store.refresh(); await store.reviewVisualization(operationId, 1, review);
  assert.deepEqual(store.getSnapshot().snapshot?.styling?.data.feedback, []);
  assert.deepEqual(store.getSnapshot().snapshot?.visualization?.jobs[0].review, review); assert.deepEqual(calls, ['reviewVisualization']);
});
