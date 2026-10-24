import { Buffer } from 'node:buffer';

export const ACCOUNT_A = '11111111-1111-4111-8111-111111111111';
export const ACCOUNT_B = '22222222-2222-4222-8222-222222222222';
export const ITEM_ID = '33333333-3333-4333-8333-333333333333';
const PHOTO_ID = '44444444-4444-4444-8444-444444444444';
// Matches the project-scoped storageKey in the real Supabase client.
export const authKey = 'ubranka:private:ubranka-test.supabase.co:auth';
export const demoKey = 'ubranka:p2:v1';
export const button = (page, name) => page.getByRole('button', { name, exact: true });

export function session(id = ACCOUNT_A) {
  const now = Math.floor(Date.now() / 1000);
  const user = { id, aud: 'authenticated', role: 'authenticated', email: id === ACCOUNT_A ? 'synthetic-a@example.test' : 'synthetic-b@example.test',
    email_confirmed_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: {} };
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return { access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, aud: 'authenticated', role: 'authenticated', email: user.email, iat: now, exp: now + 3600 })}.c3ludGhldGljLXNpZ25hdHVyZQ`,
    refresh_token: 'synthetic-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, user };
}

export const demo = {
  version: 2, locale: 'pl', onboarded: true, activeProfileId: 'everyday',
  profiles: [
    { id: 'everyday', name: 'Mój codzienny', audience: 'women', occasion: 'casual', budget: 500, priority: 'comfort', defaultMode: 'best' },
    { id: 'elegant', name: 'Cudzy elegancki', audience: 'men', occasion: 'elegant', budget: 800, priority: 'quality', defaultMode: 'value' },
  ], ownedItemIds: ['w-sneakers'], feedback: [{ profileId: 'everyday', outfitId: 'w1', vote: 'like' }], askReason: true,
};

export function snapshot(id = ACCOUNT_A, locale = 'pl') {
  return { accountId: id, state: { revision: 1, data: { locale, profiles: [], activeProfileId: '', feedback: [], askReason: true } }, items: [] };
}

export async function syntheticPhoto(page) {
  return Buffer.from(await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 120;
    const context = canvas.getContext('2d'); context.fillStyle = '#7d3b66'; context.fillRect(0, 0, 80, 120);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }));
}

export async function installBackend(page, { existingItem = false, locale = 'pl', noSession = false } = {}) {
  const image = await syntheticPhoto(page);
  const state = snapshot(ACCOUNT_A, locale);
  const second = snapshot(ACCOUNT_B, locale);
  const objects = new Map();
  const logs = [];
  const photoRequests = [];
  const unexpected = [];
  const operations = new Map();
  const control = { state, second, objects, logs, photoRequests, unexpected, failPhoto: 0, holdPhoto: null, holdDownload: null, completedDownloads: 0, pendingDelete: false, pendingAccountDelete: false, deny: false };
  if (existingItem) {
    const mainPath = `${ACCOUNT_A}/${ITEM_ID}/${PHOTO_ID}/main.jpg`; const thumbPath = `${ACCOUNT_A}/${ITEM_ID}/${PHOTO_ID}/thumb.jpg`;
    objects.set(mainPath, image); objects.set(thumbPath, image);
    state.items.push({ id: ITEM_ID, revision: 1, status: 'active', name: 'Koszula testowa', color: 'śliwkowy', category: 'top', occasions: ['casual'], size: 'M', photoKind: 'garment',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      photo: { id: PHOTO_ID, mainPath, thumbPath, mimeType: 'image/jpeg', bytes: image.length, thumbBytes: image.length } });
  }
  await page.addInitScript(({ authKey, demoKey, auth, demo }) => {
    if (!sessionStorage.getItem('private-test-seeded')) {
      if (auth) localStorage.setItem(authKey, JSON.stringify(auth));
      localStorage.setItem(demoKey, JSON.stringify(demo));
      sessionStorage.setItem('private-test-seeded', '1');
    }
  }, { authKey, demoKey, auth: noSession ? null : session(), demo });
  await page.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === 'http://127.0.0.1:4185') return route.continue();
    if (url.origin !== 'https://ubranka-test.supabase.co') { unexpected.push(request.url()); return route.abort(); }
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Cache-Control': 'no-store' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const auth = request.headers().authorization;
    const id = auth === `Bearer ${session(ACCOUNT_B).access_token}` ? ACCOUNT_B : ACCOUNT_A;
    // Compare JWT subject, since wall-clock iat may tick after fixture setup.
    let subject;
    try { subject = JSON.parse(Buffer.from((auth ?? '').split('.')[1], 'base64url')).sub; } catch { subject = null; }
    const current = subject === ACCOUNT_B ? second : state;
    const json = (data, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(data) });
    const fail = (code, status = 409) => json({ error: { code } }, status);
    if (url.pathname.startsWith('/auth/v1/logout')) return route.fulfill({ status: 204, headers });
    if (url.pathname.startsWith('/auth/v1/user')) return json(session(subject ?? id).user);
    // Any direct Storage or signed URL request is a privacy regression. Photos
    // must use the uncached Edge POST endpoint for fresh access checks.
    if (url.pathname.startsWith('/storage/')) { unexpected.push(request.url()); return route.abort(); }
    if (url.pathname !== '/functions/v1/wardrobe') { unexpected.push(request.url()); return route.abort(); }
    if (request.method() !== 'POST') { unexpected.push(`${request.method()} ${request.url()}`); return route.abort(); }
    if (![ACCOUNT_A, ACCOUNT_B].includes(subject)) return fail('SIGNED_OUT', 401);
    const body = request.postDataJSON(); logs.push(structuredClone(body));
    if (control.deny) return fail('NOT_INVITED', 403);
    const fields = Object.fromEntries(['name', 'color', 'category', 'occasions', 'size', 'photoKind'].map(key => [key, body[key]]));
    let item = current.items.find(value => value.id === body.itemId);
    switch (body.action) {
      case 'bootstrap': return json({ data: current });
      case 'downloadPhoto': {
        photoRequests.push({ url: request.url(), method: request.method(), contentType: request.headers()['content-type'], apikey: request.headers().apikey, accountId: subject, body });
        const photo = current.items.find(value => value.status === 'active' && value.photo && [value.photo.mainPath, value.photo.thumbPath].includes(body.path))?.photo;
        if (!photo || !body.path.startsWith(`${subject}/`) || !objects.has(body.path)) return fail('FORBIDDEN', 403);
        // Capture the already-authorized response, then allow tests to deliver it
        // after the client switches accounts and must abort/discard the read.
        const bytes = objects.get(body.path);
        if (control.holdDownload) await control.holdDownload;
        await route.fulfill({ status: 200, headers: { ...headers, 'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store' }, contentType: 'image/jpeg', body: bytes });
        control.completedDownloads++;
        return;
      }
      case 'saveState':
        if (body.expectedRevision !== current.state.revision) return fail('CONFLICT');
        current.state = { revision: current.state.revision + 1, data: body.data }; return json({ data: current.state });
      case 'createItem':
        if (!item) { item = { id: body.itemId, ...fields, revision: 1, status: 'active', photo: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }; current.items.push(item); }
        return json({ data: item });
      case 'updateItem':
        if (!item || item.revision !== body.expectedRevision) return fail('CONFLICT');
        Object.assign(item, fields, { revision: item.revision + 1 }); return json({ data: item });
      case 'uploadPhoto': {
        if (control.holdPhoto) await control.holdPhoto;
        if (control.failPhoto > 0) { control.failPhoto--; return fail('STORAGE', 503); }
        if (operations.has(body.operationId)) return json({ data: operations.get(body.operationId) });
        if (!item || item.revision !== body.expectedRevision) return fail('CONFLICT');
        const main = Buffer.from(body.mainBase64, 'base64'); const thumb = Buffer.from(body.thumbBase64, 'base64');
        const mainPath = `${subject}/${item.id}/${body.operationId}/main.jpg`; const thumbPath = `${subject}/${item.id}/${body.operationId}/thumb.jpg`;
        objects.set(mainPath, main); objects.set(thumbPath, thumb);
        item.photo = { id: body.operationId, mainPath, thumbPath, mimeType: 'image/jpeg', bytes: main.length, thumbBytes: thumb.length };
        item.revision++; operations.set(body.operationId, structuredClone(item)); return json({ data: item });
      }
      case 'deleteItem':
        if (!item || item.revision !== body.expectedRevision) return fail('CONFLICT');
        if (item.photo) { objects.delete(item.photo.mainPath); objects.delete(item.photo.thumbPath); }
        current.items = current.items.filter(value => value.id !== body.itemId);
        return json({ data: { status: control.pendingDelete ? 'pending' : 'deleted' } });
      case 'export': return json({ data: { exportedAt: new Date().toISOString(), state: current.state, items: current.items } });
      case 'deleteAccount': current.items = []; objects.clear(); return json({ data: { status: control.pendingAccountDelete ? 'pending' : 'deleted' } });
      default: unexpected.push(body.action); return fail('UNSUPPORTED', 400);
    }
  });
  page.on('pageerror', error => { throw error; });
  return control;
}

export async function openWardrobe(page) {
  await page.goto('/?wardrobe=1');
  await page.getByRole('heading', { name: /Twoja prywatna szafa|Your private wardrobe/ }).waitFor();
}

export async function choosePhoto(page) {
  const bytes = await syntheticPhoto(page);
  const chooser = page.waitForEvent('filechooser');
  await button(page, 'Wybierz zdjęcie').click();
  await (await chooser).setFiles({ name: 'synthetic.jpg', mimeType: 'image/jpeg', buffer: bytes });
  await button(page, 'Rozumiem zasady przechowywania zdjęć').click();
}
