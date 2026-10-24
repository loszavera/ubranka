import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

// Explicit opt-in, synthetic accounts only. Never logs sessions or photo data.
if (process.env.WARDROBE_TEST_SYNTHETIC !== 'true') throw new Error('Synthetic test opt-in required');
const config = JSON.parse(await readFile(process.env.WARDROBE_TEST_SESSIONS, 'utf8'));
const { url, key, accounts } = config;
const image = await readFile(process.env.WARDROBE_TEST_PHOTO);
assert.ok(image.length <= 100_000, 'Use a synthetic JPEG under 100 kB');
const [a, b] = accounts.map(value => value.session.access_token);
const checks = [];
const record = name => checks.push(name);
async function request(token, path, body) {
  return fetch(url + path, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(20_000) });
}
async function call(token, action, payload = {}, expected = 200) {
  const response = await request(token, '/functions/v1/wardrobe', { action, ...payload });
  const json = await response.json();
  assert.equal(response.status, expected, `${action}: HTTP ${response.status}, code ${json.error?.code ?? ''}`);
  record(`${action}:${expected}`); return expected === 200 ? json.data : json.error;
}
async function photo(token, path, readable) {
  const response = await request(token, '/functions/v1/wardrobe', { action: 'downloadPhoto', path });
  assert.equal(response.ok, readable, 'fresh private photo authorization');
  if (readable) {
    assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), image);
  }
  record(`photo:${readable ? 'owner-byte-match-no-store' : 'denied'}`);
}
for (const token of [a, b]) {
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  const user = await response.json();
  assert.equal(user.user_metadata?.synthetic_fixture, 'p33a');
  assert.ok(user.email.endsWith('@example.test'));
}
let first = await call(a, 'bootstrap');
const other = await call(b, 'bootstrap');
assert.notEqual(first.accountId, other.accountId);
assert.equal(first.items.length, 0, 'Start only with an empty dedicated synthetic account');
assert.equal(first.visualization.mode, 'off');
assert.equal(first.visualization.limits.spentPln, 0);
const sizes = { heightCm: 172.5, chestCm: 92, waistCm: 75, hipsCm: 99, sizeSystem: 'EU', topSize: 'M', bottomSize: 'M', shoeSize: '39' };
let body = await call(a, 'saveBodyFit', { expectedRevision: first.bodyFit.revision, data: sizes });
assert.equal(body.data.heightCm, 172.5);
await call(a, 'saveBodyFit', { expectedRevision: first.bodyFit.revision, data: sizes }, 409);
const races = await Promise.all([1, 2].map(() => request(a, '/functions/v1/wardrobe', { action: 'saveBodyFit', expectedRevision: body.revision, data: sizes })));
assert.deepEqual(races.map(x => x.status).sort(), [200, 409]); record('same-revision-writes-exactly-one');
first = await call(a, 'bootstrap'); body = first.bodyFit;
const photoPayload = { expectedRevision: body.revision, operationId: randomUUID(), mimeType: 'image/jpeg',
  mainBase64: image.toString('base64'), thumbBase64: image.toString('base64'), storageConsentVersion: 'p33a-body-v1' };
body = await call(a, 'uploadBodyPhoto', photoPayload);
const repeated = await call(a, 'uploadBodyPhoto', photoPayload);
assert.equal(repeated.photo.id, body.photo.id); record('body-upload-idempotent');
for (const path of [body.photo.mainPath, body.photo.thumbPath]) {
  await photo(a, path, true); await photo(b, path, false);
  for (const token of [a, b]) {
    const response = await fetch(`${url}/storage/v1/object/authenticated/wardrobe-private/${path}`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    assert.equal(response.ok, false); record('direct-storage-denied-after-warm-read');
  }
}
assert.equal((await call(b, 'bootstrap')).bodyFit.photo, null);
const direct = await fetch(`${url}/rest/v1/wardrobe_body_fit?select=*`, { headers: { apikey: key, Authorization: `Bearer ${b}` } });
assert.equal(direct.status, 200);
assert.equal((await direct.json()).some(x => x.account_id === first.accountId), false);
record('body-table-cross-account-isolation');
const profile = { id: randomUUID(), name: 'Synthetic P3.3A', audience: 'women', occasion: 'casual', budget: 500, priority: 'comfort', defaultMode: 'best' };
await call(a, 'saveState', { expectedRevision: first.state.revision, data: { ...first.state.data, profiles: [profile], activeProfileId: profile.id } });
const items = [];
for (const category of ['top', 'bottom', 'shoes']) {
  let item = await call(a, 'createItem', { itemId: randomUUID(), name: `Synthetic ${category}`, category, color: 'blue', occasions: ['casual', 'wedding'], size: 'M', photoKind: 'garment' });
  item = await call(a, 'uploadPhoto', { itemId: item.id, expectedRevision: item.revision, operationId: randomUUID(), mimeType: 'image/jpeg', mainBase64: image.toString('base64'), thumbBase64: image.toString('base64') });
  items.push(item);
}
const outfit = { id: randomUUID(), profileId: profile.id, occasion: 'casual', itemIds: items.map(x => x.id), itemRevisions: Object.fromEntries(items.map(x => [x.id, x.revision])), createdAt: new Date().toISOString() };
const styling = await call(a, 'saveStyling', { expectedRevision: first.styling.revision, data: { outfits: [outfit], feedback: [{ profileId: profile.id, outfitId: outfit.id, itemIds: outfit.itemIds, vote: 'like' }] } });
assert.equal(styling.data.outfits.length, 1);
await call(a, 'saveStyling', { expectedRevision: first.styling.revision, data: styling.data }, 409);
assert.equal((await call(b, 'bootstrap')).styling.data.outfits.length, 0);
const payload = { operationId: randomUUID(), outfitId: outfit.id, expectedStylingRevision: styling.revision, expectedBodyRevision: body.revision };
const off = await call(a, 'requestVisualization', payload, 403);
assert.equal(off.code, 'AI_DISABLED');
const directOff = await request(a, '/rest/v1/rpc/wardrobe_execute', { p_action: 'requestVisualization', p_payload: payload });
assert.equal(directOff.ok, false); assert.match(JSON.stringify(await directOff.json()), /AI_DISABLED/); record('direct-rpc-ai-off');
const exported = await call(a, 'export');
assert.equal(exported.bodyFit.data.heightCm, 172.5);
assert.equal(exported.styling.data.outfits[0].id, outfit.id);
assert.equal(exported.visualization.jobs.length, 0);
assert.equal(exported.visualization.limits.spentPln, 0); record('export-private-body-styling-real-zero-cost');
const oldPhoto = body.photo;
await call(a, 'deleteBodyPhoto', { expectedRevision: body.revision });
await photo(a, oldPhoto.mainPath, false); await photo(a, oldPhoto.thumbPath, false);
first = await call(a, 'bootstrap');
assert.equal(first.bodyFit.photo, null); assert.equal(first.bodyFit.data.heightCm, 172.5);
assert.equal(first.items.length, 3); record('body-delete-preserves-wardrobe-and-sizes');
// Keep one synthetic body image for subsequent deployed UI verification.
body = await call(a, 'uploadBodyPhoto', { ...photoPayload, expectedRevision: first.bodyFit.revision, operationId: randomUUID() });
const final = await call(a, 'bootstrap');
assert.equal(final.visualization.jobs.length, 0); assert.equal(final.visualization.limits.usedAttempts, 0);
await writeFile('artifacts/p33a-hosted-report.json', JSON.stringify({ testedAt: new Date().toISOString(), passed: true, checks,
  paidCalls: 0, scope: 'Two dedicated synthetic Auth sessions, real Supabase Edge/Storage/Postgres. Does not test Google login or physical devices.',
  cleanup: 'Synthetic accounts retained only for deployed UI verification; delete through application API afterwards.' }, null, 2));
console.log(JSON.stringify({ passed: true, checks: checks.length, paidCalls: 0 }));
