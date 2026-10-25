import test from 'node:test';
import assert from 'node:assert/strict';
import { PrivateAttemptJournal, type AttemptReceiptStorage } from '../src/private/attemptReceipt.ts';
import { WardrobeApi, type WardrobeCall } from '../src/private/api.ts';
import { emptyPrivateSettings, PrivateError, type PrivateSnapshot } from '../src/private/model.ts';
import { PrivateStore } from '../src/private/store.ts';

const account = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'synthetic@example.invalid' };
const other = { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', email: 'other@example.invalid' };
const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const nextId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const receipt = { id, caseId: 'B01' };
const fixture = (accountId = account.id): PrivateSnapshot => ({ accountId, state: { revision: 0, data: emptyPrivateSettings() }, items: [], visualization: {
  mode: 'synthetic_trial', consent: { accepted: false, version: 'p33-ai-v1' }, jobs: [],
  limits: { results: 30, attempts: 40, dailyAttempts: 5, usedResults: 0, usedAttempts: 0, usedDailyAttempts: 0, reservedPln: 0, spentPln: 0, budgetPln: 0, trialEndsAt: null, monthResetsAt: '2099-01-01T00:00:00Z', dayResetsAt: '2099-01-01T00:00:00Z' },
  trial: { id: 'synthetic-trial', endsAt: '2099-01-01T00:00:00Z', budgetPln: 10, spentPln: 0, reservedPln: 0, maxSends: 6, sentCount: 0, blocked: false,
    cases: ['B01', 'B02'].map(caseId => ({ id: caseId, label: 'Synthetic fixture', personPath: 'fixture', itemPaths: ['fixture', 'fixture'], reservePln: 1, model: 'fixture', promptVersion: 'p33b-v1', jobId: null, sent: false })) },
} });
function memory() {
  const values = new Map<string, string>();
  const storage: AttemptReceiptStorage = { get: async key => values.get(key) ?? null, set: async (key, value) => { values.set(key, value); }, delete: async key => { values.delete(key); } };
  return { values, storage, journal: () => new PrivateAttemptJournal(storage) };
}
function api(handler: (action: string, payload: Record<string, unknown>) => Promise<unknown>) {
  const call: WardrobeCall = async <T>(action: string, payload: Record<string, unknown> = {}) => await handler(action, payload) as T;
  return new WardrobeApi(call);
}

test('pre-POST receipt survives disposal, logout and reload before the backend knows a job; only reads can recover', async () => {
  const saved = memory(); let requests = 0;
  const service = api(async action => {
    if (action === 'bootstrap') return fixture();
    if (action === 'getVisualization') throw new PrivateError('NOT_FOUND');
    assert.equal(action, 'requestVisualization'); requests++;
    assert.deepEqual(JSON.parse(saved.values.get(account.id)!), { version: 1, receipts: [receipt] });
    throw new PrivateError('NETWORK');
  });
  const initial = new PrivateStore(service, () => id, undefined, saved.journal());
  initial.setIdentity(account); await initial.refresh();
  await assert.rejects(initial.requestVisualization(id, 'B01', true), /NETWORK/);
  initial.setIdentity(null); initial.dispose();
  const reloaded = new PrivateStore(service, () => nextId, undefined, saved.journal());
  reloaded.setIdentity(account); await reloaded.refresh();
  assert.deepEqual(reloaded.getSnapshot().visualizationAttempt, { ...receipt, status: 'unconfirmed' });
  assert.deepEqual(reloaded.getSnapshot().snapshot?.visualization?.jobs, []);
  await assert.rejects(reloaded.requestVisualization(nextId, 'B01', true), /TRIAL_BLOCKED/);
  await assert.rejects(reloaded.requestVisualization(nextId, 'B02', true), /TRIAL_BLOCKED/);
  await assert.rejects(reloaded.getVisualization(id), /NOT_FOUND/); await reloaded.refresh();
  assert.equal(requests, 1); assert.deepEqual(await saved.journal().read(account.id), [receipt]);
});

test('storage failure stops before POST, and corrupt receipt prevents a ready trial snapshot', async () => {
  const saved = memory(); let requests = 0;
  const service = api(async action => { if (action === 'bootstrap') return fixture(); requests++; throw new Error('Unexpected POST'); });
  const journal = new PrivateAttemptJournal({ ...saved.storage, set: async () => { throw new Error('Quota exceeded'); } });
  const store = new PrivateStore(service, () => id, undefined, journal);
  store.setIdentity(account); await store.refresh();
  await assert.rejects(store.requestVisualization(id, 'B01', true), /ATTEMPT_STORAGE_UNAVAILABLE/); assert.equal(requests, 0);
  saved.values.set(account.id, 'invalid JSON');
  const reloaded = new PrivateStore(service, () => id, undefined, saved.journal());
  reloaded.setIdentity(account); await reloaded.refresh();
  assert.equal(reloaded.getSnapshot().snapshot, null); assert.equal(reloaded.getSnapshot().error, 'ATTEMPT_STORAGE_UNAVAILABLE');
});

test('a permanent server case slot reconciles and removes a receipt even after the job was deleted', async () => {
  const saved = memory(); await saved.journal().write(account.id, receipt); const value = fixture();
  const store = new PrivateStore(api(async () => value), () => id, undefined, saved.journal());
  store.setIdentity(account); await store.refresh();
  assert.equal(store.getSnapshot().visualizationAttempt?.status, 'unconfirmed');
  value.visualization!.trial!.cases[0].jobId = id;
  await store.refresh();
  assert.equal(store.getSnapshot().visualizationAttempt?.status, 'accepted');
  assert.deepEqual(await saved.journal().read(account.id), []);
  await assert.rejects(store.requestVisualization(nextId, 'B01', true), /TRIAL_BLOCKED/);
});

test('receipts are account isolated and account deletion clears only the deleted account', async () => {
  const saved = memory(); await saved.journal().write(account.id, receipt);
  let current = other.id;
  const store = new PrivateStore(api(async action => action === 'bootstrap' ? fixture(current) : { status: 'pending' }), () => id, undefined, saved.journal());
  store.setIdentity(other); await store.refresh();
  assert.equal(store.getSnapshot().visualizationAttempt, null);
  await saved.journal().write(other.id, { id: nextId, caseId: 'B02' });
  current = account.id; store.setIdentity(account); await store.refresh();
  assert.equal(store.getSnapshot().visualizationAttempt?.id, id);
  await store.requestAccountDeletion();
  assert.deepEqual(await saved.journal().read(account.id), []);
  assert.deepEqual(await saved.journal().read(other.id), [{ id: nextId, caseId: 'B02' }]);
});

test('an account change during durable receipt write cannot send a request or install private state', async () => {
  const saved = memory(); let finish!: () => void; let writing!: () => void;
  const started = new Promise<void>(resolve => { writing = resolve; });
  const held = new Promise<void>(resolve => { finish = resolve; }); let requests = 0;
  const journal = new PrivateAttemptJournal({ ...saved.storage, set: async (key, text) => { writing(); await held; await saved.storage.set(key, text); } });
  const store = new PrivateStore(api(async action => { if (action === 'bootstrap') return fixture(); requests++; throw new Error('Unexpected POST'); }), () => id, undefined, journal);
  store.setIdentity(account); await store.refresh();
  const pending = store.requestVisualization(id, 'B01', true); await started;
  store.setIdentity(other); finish(); await assert.rejects(pending, /SESSION_CHANGED/);
  assert.equal(requests, 0); assert.equal(store.getSnapshot().visualizationAttempt, null); assert.equal(store.getSnapshot().snapshot, null);
  assert.deepEqual(await saved.journal().read(account.id), [receipt]);
});

test('serialized receipt removal does not erase a later operation, and persisted content is minimal', async () => {
  const saved = memory(); const journal = saved.journal(); await journal.write(account.id, receipt);
  await Promise.all([journal.remove(account.id, id), journal.write(account.id, { id: nextId, caseId: 'B02' })]);
  assert.deepEqual(JSON.parse(saved.values.get(account.id)!), { version: 1, receipts: [{ id: nextId, caseId: 'B02' }] });
  await assert.rejects(journal.write(account.id, { id, caseId: 'B02' }), /ATTEMPT_STORAGE_UNAVAILABLE/);
  assert.deepEqual(await journal.read(account.id), [{ id: nextId, caseId: 'B02' }]);
});
