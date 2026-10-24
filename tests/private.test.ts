import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/domain/state.ts';
import { bytesToBase64, emptyPrivateSettings, importReceiptId, mergeP2Import, normalizeItemFields, PrivateError, type PrivateItem, type PrivateSnapshot } from '../src/private/model.ts';
import { createWardrobeCall, WardrobeApi, type WardrobeCall } from '../src/private/api.ts';
import { PrivateStore, type UploadPhoto } from '../src/private/store.ts';

const userA = { id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', email: 'a@example.invalid' };
const userB = { id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', email: 'b@example.invalid' };
const itemId = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const fields = { name: 'Koszula', category: 'top' as const, color: 'Biały', occasions: ['work' as const], size: 'M', photoKind: 'garment' as const };
const item: PrivateItem = { ...fields, id: itemId, revision: 1, status: 'active', photo: null, createdAt: '2026-10-24T00:00:00Z', updatedAt: '2026-10-24T00:00:00Z' };
const snapshot = (id = userA.id): PrivateSnapshot => ({ accountId: id, state: { revision: 0, data: emptyPrivateSettings() }, items: [] });
const wrap = (handler: (action: string, payload: Record<string, unknown>) => Promise<unknown>): WardrobeCall => async <T>(action: string, payload: Record<string, unknown> = {}): Promise<T> => await handler(action, payload) as T;
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

test('selective import copies only chosen profiles and optional feedback; never demo ownership or photos', () => {
  const local = createInitialState(); local.feedback.push({ profileId: 'everyday', outfitId: 'w-look-1', vote: 'like' });
  const original = JSON.stringify(local);
  const imported = mergeP2Import(emptyPrivateSettings(), local, ['everyday'], true);
  assert.deepEqual(imported.profiles.map(profile => profile.id), ['p2:everyday']);
  assert.equal(imported.feedback[0].profileId, 'p2:everyday');
  assert.equal(imported.activeProfileId, 'p2:everyday');
  assert.equal('ownedItemIds' in imported, false);
  assert.equal(JSON.stringify(local), original);
  const edited = { ...imported, profiles: imported.profiles.map(profile => ({ ...profile, name: 'Moja edycja' })) };
  const again = mergeP2Import(edited, local, ['everyday'], true);
  assert.equal(again.profiles.length, 1); assert.equal(again.profiles[0].name, 'Moja edycja'); assert.equal(again.feedback.length, 1);
  assert.equal(mergeP2Import(emptyPrivateSettings(), local, ['everyday'], false).feedback.length, 0);
});

test('import receipt repeats only for same owner, selected source data and feedback choice', () => {
  const local = createInitialState();
  const key = importReceiptId(userA.id, local, ['elegant', 'everyday'], true);
  assert.equal(key, importReceiptId(userA.id, local, ['everyday', 'elegant'], true));
  assert.notEqual(key, importReceiptId(userB.id, local, ['everyday', 'elegant'], true));
  assert.notEqual(key, importReceiptId(userA.id, local, ['everyday', 'elegant'], false));
  assert.match(key, /^[a-f\d]{8}-[a-f\d]{4}-5[a-f\d]{3}-a[a-f\d]{3}-[a-f\d]{12}$/);
});

test('item validation preserves explicit occasions and rejects empty labels without manufacturing defaults', () => {
  assert.deepEqual(normalizeItemFields({ ...fields, name: ' Koszula ', occasions: ['work', 'work'] }), fields);
  assert.throws(() => normalizeItemFields({ ...fields, name: '  ' }), /INVALID_INPUT/);
  assert.throws(() => normalizeItemFields({ ...fields, occasions: [] }), /INVALID_INPUT/);
});

test('base64 bytes round trip binary lengths without Buffer dependency on native', () => {
  for (const length of [0, 1, 2, 3, 255, 100_000]) {
    const bytes = Uint8Array.from({ length }, (_, index) => index % 256);
    assert.deepEqual(Buffer.from(bytesToBase64(bytes), 'base64'), Buffer.from(bytes));
  }
});

test('transport sends JWT separately from public key and never exposes provider error contents', async () => {
  let request: RequestInit | undefined;
  const call = createWardrobeCall({ url: 'https://project.supabase.co', publishableKey: 'public', accessToken: async () => 'private-session', fetch: async (_url, init) => {
    request = init;
    return new Response(JSON.stringify({ error: { code: 'CONFLICT', message: 'secret-private-session-do-not-display' } }), { status: 409 });
  } });
  await assert.rejects(call('saveState', { expectedRevision: 3 }), error => error instanceof PrivateError && error.code === 'CONFLICT' && error.message === 'CONFLICT');
  assert.equal(new Headers(request?.headers).get('Authorization'), 'Bearer private-session');
  assert.equal(new Headers(request?.headers).get('apikey'), 'public');
  assert.equal(request?.cache, 'no-store');
  assert.equal(JSON.parse(String(request?.body)).expectedRevision, 3);
  const signedOut = createWardrobeCall({ url: 'https://project.supabase.co', publishableKey: 'public', accessToken: async () => null, fetch: async () => { throw new Error('must not call'); } });
  await assert.rejects(signedOut('bootstrap'), /SIGNED_OUT/);
});

test('switching accounts aborts and discards a late previous account response, clearing private state', async () => {
  const response = deferred<PrivateSnapshot>(); let cleared = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async () => response.promise)), () => itemId, () => { cleared++; });
  store.setIdentity(userA); const pending = store.refresh();
  store.setIdentity(userB);
  response.resolve(snapshot()); await pending;
  assert.equal(store.getSnapshot().identity?.id, userB.id);
  assert.equal(store.getSnapshot().snapshot, null);
  assert.ok(cleared >= 2);
});

test('conflicting update preserves loaded data and never retries with a newer revision', async () => {
  const calls: string[] = [];
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    calls.push(action);
    if (action === 'bootstrap') return snapshot();
    assert.equal(payload.expectedRevision, 0); throw new PrivateError('CONFLICT');
  })), () => itemId);
  store.setIdentity(userA); await store.refresh();
  const changed = { ...emptyPrivateSettings(), locale: 'en' as const };
  await assert.rejects(store.saveSettings(changed, 0), /CONFLICT/);
  assert.equal(store.getSnapshot().snapshot?.state.data.locale, 'pl');
  assert.equal(store.getSnapshot().error, 'CONFLICT');
  assert.deepEqual(calls, ['bootstrap', 'saveState']);
});

test('late refresh cannot overwrite a completed settings mutation', async () => {
  const oldRefresh = deferred<PrivateSnapshot>(); let bootstrapCalls = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    if (action === 'bootstrap') return ++bootstrapCalls === 1 ? snapshot() : oldRefresh.promise;
    return { revision: 1, data: payload.data };
  })), () => itemId);
  store.setIdentity(userA); await store.refresh();
  const pending = store.refresh();
  await store.saveSettings({ ...emptyPrivateSettings(), locale: 'en' }, 0);
  oldRefresh.resolve(snapshot()); await pending;
  assert.equal(store.getSnapshot().snapshot?.state.revision, 1);
  assert.equal(store.getSnapshot().snapshot?.state.data.locale, 'en');
});

test('failed photo upload can be retried without recreating item or changing operation identity', async () => {
  const operations: unknown[] = []; let creates = 0; let uploads = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    if (action === 'bootstrap') return snapshot();
    if (action === 'createItem') { creates++; return item; }
    if (action === 'uploadPhoto') {
      uploads++; operations.push(payload.operationId);
      if (uploads === 1) throw new PrivateError('NETWORK');
      return { ...item, revision: 2 };
    }
    throw new Error('unexpected');
  })), () => 'dddddddd-dddd-4ddd-addd-dddddddddddd');
  store.setIdentity(userA); await store.refresh();
  const photo: UploadPhoto = { main: { bytes: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }, thumbnail: { bytes: new Uint8Array([4, 5]), mimeType: 'image/jpeg' } };
  await assert.rejects(store.saveItem({ ...fields, id: itemId }, photo), /NETWORK/);
  assert.equal(store.getSnapshot().snapshot?.items[0].id, itemId);
  assert.deepEqual(store.getSnapshot().pendingSave, { itemId, baseRevision: undefined, revision: 1 });
  await store.saveItem({ ...fields, id: itemId }, photo);
  assert.equal(creates, 1); assert.equal(uploads, 2); assert.equal(operations[0], operations[1]);
  assert.equal(store.getSnapshot().snapshot?.items.length, 1);
  assert.equal(store.getSnapshot().pendingSave, null);
});

test('editing fields after partial create updates that item with the known revision before retrying its photo', async () => {
  let current = item; let failPhoto = true; let creates = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async (action, payload) => {
    if (action === 'bootstrap') return snapshot();
    if (action === 'createItem') { creates++; return current; }
    if (action === 'updateItem') {
      assert.equal(payload.expectedRevision, 1); current = { ...current, name: String(payload.name), revision: 2 }; return current;
    }
    if (action === 'uploadPhoto') { if (failPhoto) { failPhoto = false; throw new PrivateError('NETWORK'); } return { ...current, revision: 3 }; }
    throw new Error('unexpected');
  })), () => itemId);
  store.setIdentity(userA); await store.refresh();
  const photo: UploadPhoto = { main: { bytes: new Uint8Array([1]), mimeType: 'image/jpeg' }, thumbnail: { bytes: new Uint8Array([1]), mimeType: 'image/jpeg' } };
  await assert.rejects(store.saveItem({ ...fields, id: itemId }, photo), /NETWORK/);
  await store.saveItem({ ...fields, id: itemId, name: 'Nowa nazwa' }, photo);
  assert.equal(creates, 1); assert.equal(store.getSnapshot().snapshot?.items[0].name, 'Nowa nazwa');
});

test('uncertain create retry refuses a different server draft instead of falsely reporting it saved', async () => {
  const store = new PrivateStore(new WardrobeApi(wrap(async action => action === 'bootstrap' ? snapshot() : { ...item, name: 'Earlier attempt' })), () => itemId);
  store.setIdentity(userA); await store.refresh();
  await assert.rejects(store.saveItem({ ...fields, id: itemId }), /CONFLICT/);
});

test('logout during creation does not continue to photo upload or repopulate private state', async () => {
  const creation = deferred<PrivateItem>(); const calls: string[] = [];
  const store = new PrivateStore(new WardrobeApi(wrap(async action => {
    calls.push(action); if (action === 'bootstrap') return snapshot(); if (action === 'createItem') return creation.promise; throw new Error('must not upload');
  })), () => itemId);
  store.setIdentity(userA); await store.refresh();
  const photo: UploadPhoto = { main: { bytes: new Uint8Array([1]), mimeType: 'image/jpeg' }, thumbnail: { bytes: new Uint8Array([1]), mimeType: 'image/jpeg' } };
  const pending = store.saveItem({ ...fields, id: itemId }, photo);
  store.setIdentity(null); creation.resolve(item);
  await assert.rejects(pending, /SESSION_CHANGED/);
  assert.equal(store.getSnapshot().snapshot, null);
  assert.deepEqual(calls, ['bootstrap', 'createItem']);
});

test('pending deletion keeps the quota tombstone through refresh and restart until confirmed cleanup', async () => {
  let items: PrivateItem[] = [item]; let offline = false;
  const api = new WardrobeApi(wrap(async action => {
    if (action === 'bootstrap') {
      if (offline) throw new PrivateError('NETWORK');
      return { ...snapshot(), items: structuredClone(items) };
    }
    items = [{ ...item, status: 'deleting', photo: null, revision: 2 }];
    return { status: 'pending' };
  }));
  const store = new PrivateStore(api, () => itemId);
  store.setIdentity(userA); await store.refresh();
  const result = await store.deleteItem(item);
  assert.equal(result.status, 'pending');
  assert.equal(store.getSnapshot().snapshot?.items.length, 1);
  assert.equal(store.getSnapshot().snapshot?.items[0].status, 'deleting');
  assert.equal(store.getSnapshot().deletion, null); // No stale global item-deletion notice.
  await store.refresh();
  assert.equal(store.getSnapshot().snapshot?.items[0].status, 'deleting');
  offline = true; await store.refresh();
  assert.equal(store.getSnapshot().snapshot?.items.length, 1);
  assert.equal(store.getSnapshot().error, 'NETWORK');
  offline = false;
  const restarted = new PrivateStore(api, () => itemId);
  restarted.setIdentity(userA); await restarted.refresh();
  assert.equal(restarted.getSnapshot().snapshot?.items[0].status, 'deleting');
  items = []; await store.refresh(); await restarted.refresh();
  assert.equal(store.getSnapshot().snapshot?.items.length, 0);
  assert.equal(restarted.getSnapshot().snapshot?.items.length, 0);
  assert.equal(store.getSnapshot().deletion, null);
});

test('rejected deletion keeps the active item and does not claim removal or clear its photo cache', async () => {
  let clears = 0;
  const store = new PrivateStore(new WardrobeApi(wrap(async action => {
    if (action === 'bootstrap') return { ...snapshot(), items: [item] };
    throw new PrivateError('NETWORK');
  })), () => itemId, () => { clears++; });
  store.setIdentity(userA); await store.refresh(); const before = clears;
  await assert.rejects(store.deleteItem(item), /NETWORK/);
  assert.deepEqual(store.getSnapshot().snapshot?.items, [item]);
  assert.equal(store.getSnapshot().deletion, null);
  assert.equal(clears, before);
});

test('photo-only pending deletion remains pending when an active item has no current photo', async () => {
  const store = new PrivateStore(new WardrobeApi(wrap(async action => action === 'bootstrap' ? { ...snapshot(), items: [item] } : { status: 'pending' })), () => itemId);
  store.setIdentity(userA); await store.refresh();
  await store.deletePhoto(item); await store.refresh();
  assert.equal(store.getSnapshot().snapshot?.items[0].status, 'active');
  assert.equal(store.getSnapshot().snapshot?.items[0].photo, null);
  assert.equal(store.getSnapshot().deletion?.status, 'pending');
});

test('authoritative access denial clears loaded private state and photo cache; network failure preserves it', async () => {
  for (const code of ['UNAUTHENTICATED', 'ACCOUNT_UNAVAILABLE', 'NOT_INVITED', 'SIGNED_OUT', 'NETWORK']) {
    let failure = false; let clears = 0;
    const loaded = { ...snapshot(), items: [item] };
    const store = new PrivateStore(new WardrobeApi(wrap(async () => {
      if (failure) throw new PrivateError(code);
      return loaded;
    })), () => itemId, () => { clears++; });
    store.setIdentity(userA); await store.refresh();
    assert.equal(store.getSnapshot().snapshot?.items[0].id, itemId);
    const before = clears; failure = true;
    await store.refresh();
    assert.equal(store.getSnapshot().error, code);
    assert.equal(store.getSnapshot().loading, false);
    if (code === 'NETWORK') {
      assert.equal(store.getSnapshot().identity?.id, userA.id);
      assert.equal(store.getSnapshot().snapshot?.items[0].id, itemId);
      assert.equal(clears, before);
    } else {
      assert.equal(store.getSnapshot().identity, null);
      assert.equal(store.getSnapshot().snapshot, null);
      assert.equal(store.getSnapshot().pendingSave, null);
      assert.ok(clears > before);
    }
  }
});

test('authoritative denial during a write clears private state without treating an ordinary conflict as revocation', async () => {
  for (const code of ['ACCOUNT_UNAVAILABLE', 'CONFLICT']) {
    const store = new PrivateStore(new WardrobeApi(wrap(async action => {
      if (action === 'bootstrap') return snapshot();
      throw new PrivateError(code);
    })), () => itemId);
    store.setIdentity(userA); await store.refresh();
    await assert.rejects(store.saveSettings(emptyPrivateSettings(), 0), error => error instanceof PrivateError && error.code === code);
    assert.equal(store.getSnapshot().error, code);
    assert.equal(store.getSnapshot().busy, false);
    assert.equal(store.getSnapshot().snapshot === null, code === 'ACCOUNT_UNAVAILABLE');
  }
});
