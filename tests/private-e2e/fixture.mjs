import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { stripJpegMetadata } from '../../src/private/photos.core.ts';

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
  return { accountId: id, state: { revision: 1, data: { locale, profiles: [], activeProfileId: '', feedback: [], askReason: true } }, items: [],
    bodyFit: { revision: 1, data: { heightCm: null, chestCm: null, waistCm: null, hipsCm: null, sizeSystem: 'EU', topSize: '', bottomSize: '', shoeSize: '' }, photo: null, photoDeletion: null },
    styling: { revision: 1, data: { outfits: [], feedback: [] } },
    visualization: { mode: 'off', jobs: [], consent: { accepted: false, version: 'p33-ai-v1' }, limits: {
      results: 30, attempts: 40, dailyAttempts: 5, usedResults: 0, usedAttempts: 0, usedDailyAttempts: 0,
      reservedPln: 0, spentPln: 0, budgetPln: 0, trialEndsAt: null,
      monthResetsAt: '2027-01-01T00:00:00Z', dayResetsAt: '2026-12-02T00:00:00Z',
    } },
  };
}

export async function syntheticPhoto(page, mimeType = 'image/jpeg') {
  return Buffer.from(await page.evaluate(async mimeType => {
    const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 120;
    const context = canvas.getContext('2d'); context.fillStyle = '#7d3b66'; context.fillRect(0, 0, 80, 120);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.9));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }, mimeType));
}

export async function installBackend(page, { existingItem = false, ownedOutfits = false, syntheticTrial = false, privatePilot = false, locale = 'pl', noSession = false } = {}) {
  const image = await syntheticPhoto(page);
  const canonicalImage = Buffer.from(stripJpegMetadata(image));
  const canonical = { version: 'p33c-jpeg-v1', sha256: createHash('sha256').update(canonicalImage).digest('hex'), bytes: canonicalImage.length, width: 80, height: 120 };
  const png = syntheticTrial || privatePilot ? await syntheticPhoto(page, 'image/png') : null;
  const state = snapshot(ACCOUNT_A, locale);
  const second = snapshot(ACCOUNT_B, locale);
  const objects = new Map();
  const logs = [];
  const photoRequests = [];
  const unexpected = [];
  const operations = new Map();
  const intents = new Map();
  const intentOwners = new Map();
  const control = { state, second, objects, logs, photoRequests, unexpected, failPhoto: 0, holdPhoto: null, holdDownload: null, completedDownloads: 0, pendingDelete: false, failDelete: false, pendingAccountDelete: false, deny: false,
    loseVisualizationResponse: false, dropVisualizationBeforeReserve: false, holdVisualization: null, autoFinishVisualization: true, activeDownloads: 0, maxDownloads: 0,
    failCanonical: false, corruptCanonical: false, canonicalImage, intents };
  if (existingItem) {
    const mainPath = `${ACCOUNT_A}/${ITEM_ID}/${PHOTO_ID}/main.jpg`; const thumbPath = `${ACCOUNT_A}/${ITEM_ID}/${PHOTO_ID}/thumb.jpg`;
    objects.set(mainPath, image); objects.set(thumbPath, image);
    state.items.push({ id: ITEM_ID, revision: 1, status: 'active', name: 'Koszula testowa', color: 'śliwkowy', category: 'top', occasions: ['casual'], size: 'M', photoKind: 'garment',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      photo: { id: PHOTO_ID, mainPath, thumbPath, mimeType: 'image/jpeg', bytes: image.length, thumbBytes: image.length } });
  }
  if (ownedOutfits || syntheticTrial || privatePilot) {
    state.state.data.profiles = [structuredClone(demo.profiles[0])];
    state.state.data.activeProfileId = demo.profiles[0].id;
    for (const [index, category, name, occasions] of [
      [1, 'top', 'Własna koszula', ['casual', 'wedding']],
      [2, 'bottom', 'Własne spodnie', ['casual', 'wedding']],
      [3, 'shoes', 'Własne buty', ['casual', 'wedding']],
      [4, 'top', 'Druga koszula', ['casual']],
    ]) {
      const itemId = `55555555-5555-4555-8555-${String(index).padStart(12, '0')}`;
      const photoId = `66666666-6666-4666-8666-${String(index).padStart(12, '0')}`;
      const mainPath = `${ACCOUNT_A}/${itemId}/${photoId}/main.jpg`;
      const thumbPath = `${ACCOUNT_A}/${itemId}/${photoId}/thumb.jpg`;
      objects.set(mainPath, image); objects.set(thumbPath, image);
      state.items.push({ id: itemId, revision: 1, status: 'active', name, color: 'granatowy', category,
        occasions, size: 'M', photoKind: 'garment', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        photo: { id: photoId, mainPath, thumbPath, mimeType: 'image/jpeg', bytes: image.length, thumbBytes: image.length } });
    }
  }
  if (privatePilot) {
    const mainPath = `${ACCOUNT_A}/${ACCOUNT_A}/${PHOTO_ID}/main.jpg`; const thumbPath = `${ACCOUNT_A}/${ACCOUNT_A}/${PHOTO_ID}/thumb.jpg`;
    objects.set(mainPath, image); objects.set(thumbPath, image);
    state.bodyFit.photo = { id: PHOTO_ID, mainPath, thumbPath, mimeType: 'image/jpeg', bytes: image.length, thumbBytes: image.length };
    state.visualization.mode = privatePilot === 'off' ? 'off' : 'private_pilot';
    state.visualization.consent = { accepted: false, revision: 0, version: 'p33c-ai-v1.2' };
    state.visualization.monthlyBudget = { budgetPln: 25, spentPln: 1.49, reservedPln: 0, availablePln: 23.51, resetsAt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).toISOString() };
    state.visualization.pilot = { id: 'p33c-v1', status: privatePilot === 'off' ? 'prepared' : 'active', eligible: true, startsAt: new Date().toISOString(), endsAt: privatePilot === 'off' ? null : new Date(Date.now() + 86_400_000).toISOString(),
      maxSends: 60, accountMaxSends: 30, dailyMaxSends: 5, sentCount: 0, accountSentCount: 0, dailySentCount: 0, budgetPln: 25, spentPln: 0, reservedPln: 0, availablePln: 23.51, blocked: false };
  }
  control.seedPrivateResult = (id, legacy = false) => {
    const mainPath = `${ACCOUNT_A}/${id}/${id}/main.png`; const thumbPath = `${ACCOUNT_A}/${id}/${id}/thumb.${legacy ? 'png' : 'jpg'}`;
    objects.set(mainPath, png); objects.set(thumbPath, legacy ? png : image);
    const result = { mainPath, thumbPath, bytes: png.length, thumbBytes: legacy ? png.length : image.length, mimeType: 'image/png', ...(legacy ? {} : { thumbMimeType: 'image/jpeg', width: 1024, height: 1536, thumbWidth: 600, thumbHeight: 900 }) };
    let job = state.visualization.jobs.find(value => value.id === id);
    if (!job) { job = { id, outfitId: state.styling.data.outfits[0]?.id ?? ITEM_ID, revision: 1, trialId: 'p33c-v1', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(), errorCode: null }; state.visualization.jobs.push(job); }
    Object.assign(job, { status: 'succeeded', result, completedAt: new Date().toISOString(), reservedPln: 0, spentPln: 0.25, review: null });
    return job;
  };
  if (syntheticTrial) {
    const mainPath = `${ACCOUNT_A}/${ACCOUNT_A}/${PHOTO_ID}/main.jpg`; const thumbPath = `${ACCOUNT_A}/${ACCOUNT_A}/${PHOTO_ID}/thumb.jpg`;
    objects.set(mainPath, image); objects.set(thumbPath, image);
    state.bodyFit.photo = { id: PHOTO_ID, mainPath, thumbPath, mimeType: 'image/jpeg', bytes: image.length, thumbBytes: image.length };
    state.visualization.mode = 'synthetic_trial';
    state.visualization.trial = { id: 'synthetic-trial', endsAt: new Date(Date.now() + 3_600_000).toISOString(), budgetPln: 10, spentPln: 0, reservedPln: 0, maxSends: 6, sentCount: 0, blocked: false,
      cases: ['B01', 'B03', 'B05'].map(id => ({ id, label: `Fikcyjny przypadek ${id}`, personPath: mainPath, itemPaths: state.items.slice(0, 3).map(item => item.photo.mainPath), reservePln: 10, model: 'gpt-image-2.5-flare-2026-09-08', promptVersion: 'p33b-v1', jobId: null, sent: false })) };
  }
  control.completeVisualization = (caseId, unknown = false) => {
    const trial = state.visualization.trial; const chosen = trial.cases.find(value => value.id === caseId);
    const job = state.visualization.jobs.find(value => value.id === chosen.jobId);
    job.revision++;
    if (unknown) { job.status = 'outcome_unknown'; job.errorCode = 'OUTCOME_UNKNOWN'; trial.blocked = true; return; }
    const mainPath = `${ACCOUNT_A}/${job.id}/${job.id}/main.png`; const thumbPath = `${ACCOUNT_A}/${job.id}/${job.id}/thumb.png`;
    objects.set(mainPath, png); objects.set(thumbPath, png);
    Object.assign(job, { status: 'succeeded', spentPln: 0.32, completedAt: new Date().toISOString(), result: { mainPath, thumbPath, mimeType: 'image/png', thumbMimeType: 'image/png', bytes: png.length, thumbBytes: png.length, expiresAt: job.expiresAt } });
    trial.reservedPln -= job.reservedPln; trial.spentPln += 0.32; job.reservedPln = 0;
    trial.cases.forEach(value => { value.reservePln = 1; });
  };
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
      case 'getVisualizationIntent': {
        const intent = intents.get(body.intentId);
        return intent && intentOwners.get(intent.id) === subject ? json({ data: intent }) : fail('NOT_FOUND');
      }
      case 'downloadCanonicalInput': {
        photoRequests.push({ url: request.url(), method: request.method(), contentType: request.headers()['content-type'], apikey: request.headers().apikey, accountId: subject, body });
        const intent = intents.get(body.intentId);
        if (control.failCanonical || !intent || intentOwners.get(intent.id) !== subject || !intent.inputs.some(input => input.photoId === body.photoId)
          || intent.bodyRevision !== current.bodyFit.revision || intent.stylingRevision !== current.styling.revision || Date.parse(intent.expiresAt) <= Date.now()) return fail('CANONICAL_INPUT_INVALID');
        control.activeDownloads++; control.maxDownloads = Math.max(control.maxDownloads, control.activeDownloads);
        try {
          if (control.holdDownload) await control.holdDownload;
          const bytes = Buffer.from(canonicalImage); if (control.corruptCanonical) bytes[bytes.length - 3] ^= 1;
          await route.fulfill({ status: 200, headers: { ...headers, 'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store' }, contentType: 'image/jpeg', body: bytes });
          control.completedDownloads++;
        } finally { control.activeDownloads--; }
        return;
      }
      case 'downloadPhoto': {
        photoRequests.push({ url: request.url(), method: request.method(), contentType: request.headers()['content-type'], apikey: request.headers().apikey, accountId: subject, body });
        const photo = [...current.items.filter(value => value.status === 'active').map(value => value.photo), current.bodyFit.photo,
          ...current.visualization.jobs.filter(job => job.status === 'succeeded' && Date.parse(job.expiresAt) > Date.now()).map(job => job.result)]
          .find(value => value && [value.mainPath, value.thumbPath].includes(body.path));
        if (!photo || !body.path.startsWith(`${subject}/`) || !objects.has(body.path)) return fail('FORBIDDEN', 403);
        // Capture the already-authorized response, then allow tests to deliver it
        // after the client switches accounts and must abort/discard the read.
        const bytes = objects.get(body.path);
        control.activeDownloads++; control.maxDownloads = Math.max(control.maxDownloads, control.activeDownloads);
        try {
          if (control.holdDownload) await control.holdDownload;
          await route.fulfill({ status: 200, headers: { ...headers, 'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store' }, contentType: body.path === photo.thumbPath ? photo.thumbMimeType ?? photo.mimeType : photo.mimeType, body: bytes });
          control.completedDownloads++;
        } finally { control.activeDownloads--; }
        return;
      }
      case 'saveState':
        if (body.expectedRevision !== current.state.revision) return fail('CONFLICT');
        current.state = { revision: current.state.revision + 1, data: body.data }; return json({ data: current.state });
      case 'saveBodyFit':
        if (body.expectedRevision !== current.bodyFit.revision) return fail('CONFLICT');
        current.bodyFit = { ...current.bodyFit, revision: current.bodyFit.revision + 1, data: body.data };
        return json({ data: current.bodyFit });
      case 'uploadBodyPhoto': {
        if (control.holdPhoto) await control.holdPhoto;
        if (control.failPhoto > 0) { control.failPhoto--; return fail('STORAGE', 503); }
        if (operations.has(body.operationId)) return json({ data: operations.get(body.operationId) });
        if (body.expectedRevision !== current.bodyFit.revision) return fail('CONFLICT');
        if (body.storageConsentVersion !== 'p33a-body-v1') return fail('CONSENT_REQUIRED', 400);
        const main = Buffer.from(body.mainBase64, 'base64'); const thumb = Buffer.from(body.thumbBase64, 'base64');
        const mainPath = `${subject}/${subject}/${body.operationId}/main.jpg`; const thumbPath = `${subject}/${subject}/${body.operationId}/thumb.jpg`;
        if (current.bodyFit.photo) { objects.delete(current.bodyFit.photo.mainPath); objects.delete(current.bodyFit.photo.thumbPath); }
        objects.set(mainPath, main); objects.set(thumbPath, thumb);
        current.bodyFit = { ...current.bodyFit, revision: current.bodyFit.revision + 1, photoDeletion: null,
          photo: { id: body.operationId, mainPath, thumbPath, mimeType: 'image/jpeg', bytes: main.length, thumbBytes: thumb.length } };
        operations.set(body.operationId, structuredClone(current.bodyFit)); return json({ data: current.bodyFit });
      }
      case 'deleteBodyPhoto':
        if (body.expectedRevision !== current.bodyFit.revision) return fail('CONFLICT');
        if (current.bodyFit.photo) { objects.delete(current.bodyFit.photo.mainPath); objects.delete(current.bodyFit.photo.thumbPath); }
        current.bodyFit = { ...current.bodyFit, revision: current.bodyFit.revision + 1, photo: null, photoDeletion: control.pendingDelete ? 'pending' : null };
        return json({ data: { status: control.pendingDelete ? 'pending' : 'deleted' } });
      case 'saveStyling':
        if (body.expectedRevision !== current.styling.revision) return fail('CONFLICT');
        current.styling = { revision: current.styling.revision + 1, data: body.data }; return json({ data: current.styling });
      case 'prepareVisualization': {
        if (body.expectedBodyRevision !== current.bodyFit.revision || body.expectedStylingRevision !== current.styling.revision) return fail('CONFLICT');
        const outfit = current.styling.data.outfits.find(value => value.id === body.outfitId);
        if (!outfit || !current.bodyFit.photo || !current.visualization.pilot) return fail('NOT_FOUND');
        const photos = [current.bodyFit.photo, ...outfit.itemIds.map(id => current.items.find(value => value.id === id)?.photo)];
        if (photos.some(photo => !photo)) return fail('NOT_FOUND');
        const id = `77777777-7777-4777-8777-${String(intents.size + 1).padStart(12, '0')}`;
        const intent = { id, trialId: body.trialId, outfitId: body.outfitId, fingerprint: `${body.outfitId}:${current.bodyFit.revision}`, bodyRevision: current.bodyFit.revision, stylingRevision: current.styling.revision, consentRevision: current.visualization.consent.revision, expiresAt: new Date(Date.now() + 600_000).toISOString(), reservePln: current.visualization.pilot.sentCount ? 1 : 23.51, jobId: null,
          inputs: photos.map((photo, index) => ({ photoId: photo.id, path: photo.mainPath, thumbPath: photo.thumbPath, bytes: photo.bytes, kind: index ? 'item' : 'body', itemId: index ? outfit.itemIds[index - 1] : null, canonical: { ...canonical } })) };
        intent.manifestHash = createHash('sha256').update(JSON.stringify(intent.inputs)).digest('hex');
        const used = [...intents.values()].find(value => value.fingerprint === intent.fingerprint && value.jobId); if (used) intent.jobId = used.jobId;
        intents.set(id, intent); intentOwners.set(id, subject); return json({ data: intent });
      }
      case 'setAiConsent': {
        if (body.accepted !== false) return fail('AI_DISABLED', 403);
        if (body.expectedConsentRevision !== current.visualization.consent.revision) return fail('CONFLICT');
        current.visualization.consent = { accepted: false, version: 'p33c-ai-v1.2', revision: current.visualization.consent.revision + 1 };
        return json({ data: current.visualization.consent });
      }
      case 'requestVisualization': {
        if (control.dropVisualizationBeforeReserve) return route.abort('failed');
        if (body.trialId) {
          const pilot = current.visualization.pilot; const intent = intents.get(body.intentId);
          if (current.visualization.mode !== 'private_pilot' || !pilot || pilot.blocked) return fail('AI_DISABLED', 403);
          if (!intent || intent.jobId || body.expectedConsentRevision !== current.visualization.consent.revision) return fail('CONFLICT');
          if (body.accepted !== true || body.consentVersion !== 'p33c-ai-v1.2') return fail('AI_CONSENT_REQUIRED');
          if (body.expectedManifestHash !== intent.manifestHash) return fail('CANONICAL_INPUT_INVALID');
          intent.jobId = body.operationId; pilot.sentCount++; pilot.accountSentCount++; pilot.dailySentCount++;
          current.visualization.consent = { accepted: true, version: 'p33c-ai-v1.2', revision: current.visualization.consent.revision + 1 };
          const job = { id: body.operationId, revision: 1, outfitId: intent.outfitId, trialId: pilot.id, intentId: intent.id, status: 'sent', createdAt: new Date().toISOString(), completedAt: null, expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(), errorCode: null, reservedPln: intent.reservePln, spentPln: null, result: null, review: null };
          current.visualization.jobs.push(job); pilot.reservedPln = intent.reservePln;
          if (control.autoFinishVisualization) { control.seedPrivateResult(job.id); pilot.reservedPln = 0; pilot.spentPln += 0.25; pilot.availablePln -= 0.25; }
          if (control.loseVisualizationResponse) return route.abort('failed');
          return json({ data: job }, 202);
        }
        const trial = current.visualization.trial;
        if (current.visualization.mode !== 'synthetic_trial' || !trial) return fail('AI_DISABLED', 403);
        const chosen = trial.cases.find(value => value.id === body.caseId);
        if (!chosen || chosen.jobId || chosen.sent || trial.blocked || trial.sentCount >= 6 || Date.parse(trial.endsAt) <= Date.now()
          || current.visualization.jobs.some(job => ['reserved', 'sent', 'outcome_unknown'].includes(job.status))) return fail('TRIAL_BLOCKED');
        if (body.accepted !== true || body.consentVersion !== 'p33b-synthetic-v1') return fail('AI_CONSENT_REQUIRED');
        chosen.jobId = body.operationId; chosen.sent = true; trial.sentCount++; trial.reservedPln += chosen.reservePln;
        const job = { id: body.operationId, revision: 1, outfitId: ITEM_ID, status: 'sent', createdAt: new Date().toISOString(), completedAt: null,
          expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(), errorCode: null, reservedPln: chosen.reservePln, spentPln: null, result: null, review: null };
        current.visualization.jobs.push(job);
        if (control.holdVisualization) await control.holdVisualization;
        if (control.loseVisualizationResponse) return route.abort('failed');
        if (control.autoFinishVisualization) control.completeVisualization(chosen.id);
        return json({ data: job }, 202);
      }
      case 'reviewVisualization': {
        const job = current.visualization.jobs.find(value => value.id === body.jobId);
        if (!job || job.revision !== body.expectedRevision) return fail('CONFLICT');
        job.review = { scores: body.scores, criticalError: body.criticalError, note: body.note }; job.revision++;
        return json({ data: job });
      }
      case 'getVisualization': {
        const job = current.visualization.jobs.find(value => value.id === body.jobId);
        return job ? json({ data: job }) : fail('NOT_FOUND', 404);
      }
      case 'cancelVisualization': {
        const job = current.visualization.jobs.find(value => value.id === body.jobId);
        if (!job || job.revision !== body.expectedRevision) return fail('CONFLICT');
        job.status = 'cancelled'; job.revision++; return json({ data: job });
      }
      case 'deleteVisualization': {
        const job = current.visualization.jobs.find(value => value.id === body.jobId);
        if (job?.result) { objects.delete(job.result.mainPath); objects.delete(job.result.thumbPath); }
        current.visualization.jobs = current.visualization.jobs.filter(value => value.id !== body.jobId);
        return json({ data: { status: 'deleted' } });
      }
      case 'deleteAiData':
        if (body.expectedRevision !== current.bodyFit.revision) return fail('CONFLICT');
        current.visualization.jobs = []; return json({ data: { status: 'deleted' } });
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
        if (control.failDelete) return fail('SERVICE_UNAVAILABLE', 503);
        if (!item || item.revision !== body.expectedRevision) return fail('CONFLICT');
        if (control.pendingDelete) {
          // Match the real backend: access is revoked but files and the quota
          // tombstone remain until the cleanup worker confirms deletion.
          Object.assign(item, { status: 'deleting', photo: null, revision: item.revision + 1 });
          return json({ data: { status: 'pending' } });
        }
        if (item.photo) { objects.delete(item.photo.mainPath); objects.delete(item.photo.thumbPath); }
        current.items = current.items.filter(value => value.id !== body.itemId);
        return json({ data: { status: 'deleted' } });
      case 'export': return json({ data: { exportedAt: new Date().toISOString(), state: current.state, items: current.items,
        bodyFit: current.bodyFit, styling: current.styling, visualization: current.visualization } });
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
