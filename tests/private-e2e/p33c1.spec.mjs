import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
import { ACCOUNT_A, button, installBackend, openWardrobe } from './fixture.mjs';

const consent = 'Potwierdzam własne zdjęcie dorosłej osoby i zgadzam się na to jedno wysłanie pokazanych zdjęć do OpenAI';
const send = 'Wyślij te zdjęcia do OpenAI i wygeneruj';
const fixedId = '99999999-9999-4999-8999-999999999999';
async function prepare(page) {
  await button(page, 'Zestawy').click(); await button(page, 'Dobierz zestawy').click();
  await button(page, 'Zobacz na mnie').first().click();
  await button(page, 'Zapisz zestaw i sprawdź wejścia').click();
  await expect(page.getByRole('img', { name: 'Zdjęcie osoby', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('img', { name: 'Własne buty', exact: true })).toBeVisible();
}
async function history(page) {
  await button(page, 'Anuluj').click(); await button(page, 'Wizualizacje').click();
  await button(page, 'Powiększ').first().scrollIntoViewIfNeeded();
  await expect(page.getByRole('img', { name: 'Wynik wizualizacji', exact: true }).first()).toBeVisible();
}

test('C1 OFF allows exact owned inputs but never submits, accepts consent or creates a receipt', async ({ page }, info) => {
  const backend = await installBackend(page, { privatePilot: 'off' }); await openWardrobe(page); await prepare(page);
  await expect(button(page, consent)).toBeDisabled(); await expect(button(page, send)).toBeDisabled();
  await expect(page.getByText('Rezerwa tego zlecenia: 23.51 PLN', { exact: true })).toBeVisible();
  expect(backend.logs.filter(value => value.action === 'prepareVisualization')).toHaveLength(1);
  expect(backend.logs.filter(value => value.action === 'requestVisualization' || value.action === 'setAiConsent')).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.includes('trial-receipts')))).toEqual([]);
  await page.screenshot({ path: info.outputPath('c1-inputs-off-pl-390.png'), fullPage: true, animations: 'disabled' });
  await button(page, send).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('c1-consent-off-pl-390.png'), animations: 'disabled' });
  expect(backend.state.bodyFit.photo).not.toBeNull(); expect(backend.unexpected).toEqual([]);
});

test('mock C flow sends once, uses JPEG thumbnail and explicit PNG full view, exports and removes results only', async ({ page }, info) => {
  const backend = await installBackend(page, { privatePilot: true }); await openWardrobe(page); await prepare(page);
  await expect(button(page, send)).toBeDisabled(); await button(page, consent).click(); await button(page, send).click();
  await expect(page.getByText('Zlecenie przyjęto. Wynik znajdziesz w Historii wizualizacji.', { exact: true })).toBeVisible();
  await history(page); const job = backend.state.visualization.jobs[0]; const result = job.result;
  expect(backend.photoRequests.filter(value => value.body.path === result.mainPath)).toEqual([]);
  expect(result.thumbMimeType).toBe('image/jpeg');
  await page.screenshot({ path: info.outputPath('c1-result-pl-390.png'), fullPage: true, animations: 'disabled' });
  await button(page, 'Powiększ').click(); await expect(page.getByRole('img', { name: 'Pełny obraz', exact: true })).toBeVisible();
  expect(backend.photoRequests.some(value => value.body.path === result.mainPath)).toBe(true);
  await button(page, 'Pokaż w pełnym rozmiarze').click(); await button(page, 'Dopasuj do ekranu').click();
  await page.screenshot({ path: info.outputPath('c1-full-pl-390.png'), animations: 'disabled' });
  await button(page, 'Zamknij podgląd').click();
  const downloadEvent = page.waitForEvent('download'); await button(page, 'Pobierz wynik').click();
  const downloaded = await downloadEvent; expect(downloaded.suggestedFilename()).toBe('ubranka-visualization.png');
  expect(await readFile(await downloaded.path())).toEqual(backend.objects.get(result.mainPath));
  await button(page, 'Konto').click(); const zipEvent = page.waitForEvent('download'); await button(page, 'Pobierz moje dane i zdjęcia').click();
  const archive = unzipSync(new Uint8Array(await readFile(await (await zipEvent).path())));
  expect(archive[`visualizations/${job.id}.png`]).toBeDefined(); expect(archive[`visualizations/${job.id}-thumbnail.jpg`]).toBeDefined();
  const bodyPhoto = structuredClone(backend.state.bodyFit.photo); const clothes = structuredClone(backend.state.items);
  await button(page, 'Wizualizacje').click(); await button(page, 'Usuń wyniki AI').click(); await button(page, 'Usuń wyniki AI').last().click();
  await expect(page.getByRole('img', { name: 'Wynik wizualizacji', exact: true })).toHaveCount(0);
  expect(backend.state.bodyFit.photo).toEqual(bodyPhoto); expect(backend.state.items).toEqual(clothes);
  expect(backend.state.visualization.pilot.sentCount).toBe(1); expect(backend.state.visualization.pilot.spentPln).toBe(0.25);
  const sends = backend.logs.filter(value => value.action === 'requestVisualization'); expect(sends).toHaveLength(1);
  expect(sends[0]).toMatchObject({ trialId: 'p33c-v1', accepted: true, consentVersion: 'p33c-ai-v1.1', expectedConsentRevision: 0 });
  expect(backend.state.styling.data.feedback).toEqual([]); expect(backend.unexpected).toEqual([]);
});

test('lost C request before reservation stays read-only after reload and never receives another UUID POST', async ({ page }) => {
  const backend = await installBackend(page, { privatePilot: true }); backend.dropVisualizationBeforeReserve = true;
  await openWardrobe(page); await prepare(page); await button(page, consent).click(); await button(page, send).click();
  await expect(page.getByText(/Nie potwierdzono przyjęcia zlecenia/)).toBeVisible();
  const first = backend.logs.find(value => value.action === 'requestVisualization');
  const receiptKey = `ubranka:private:ubranka-test.supabase.co:trial-receipts:${ACCOUNT_A}`;
  expect(JSON.parse(await page.evaluate(key => localStorage.getItem(key), receiptKey))).toEqual({ version: 2, receipts: [{ id: first.operationId, trialId: 'p33c-v1' }] });
  await page.reload(); await button(page, 'Wizualizacje').click(); await expect(page.getByText(/Nie potwierdzono przyjęcia zlecenia/)).toBeVisible();
  await button(page, 'Sprawdź stan zlecenia').click();
  await expect.poll(() => backend.logs.filter(value => value.action === 'getVisualization').length).toBe(1);
  expect(backend.logs.find(value => value.action === 'getVisualization').jobId).toBe(first.operationId);
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toHaveLength(1); expect(backend.unexpected).toEqual([]);
});

test('changed input invalidates displayed confirmation without sending or accepting stale consent', async ({ page }) => {
  const backend = await installBackend(page, { privatePilot: true }); await openWardrobe(page); await prepare(page); await button(page, consent).click();
  backend.state.bodyFit.revision++;
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByText(/Zdjęcia, zestaw albo warunki zmieniły się/)).toBeVisible();
  await expect(button(page, send)).toBeDisabled(); await expect(button(page, consent)).toHaveAttribute('aria-pressed', 'false');
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toEqual([]);
});

test('withdrawing consent keeps a completed result available while advancing the consent revision', async ({ page }) => {
  const backend = await installBackend(page, { privatePilot: true }); backend.seedPrivateResult(fixedId); backend.state.visualization.consent.accepted = true;
  await openWardrobe(page); await button(page, 'Wizualizacje').click(); await button(page, 'Wycofaj zgodę na AI').click(); await button(page, 'Wycofaj zgodę na AI').last().click();
  await expect(page.getByText('Zgoda wycofana. Gotowe wyniki pozostają dostępne.', { exact: true })).toBeVisible();
  await button(page, 'Powiększ').scrollIntoViewIfNeeded(); await button(page, 'Powiększ').click();
  await expect(page.getByRole('img', { name: 'Pełny obraz', exact: true })).toBeVisible();
  expect(backend.state.visualization.consent).toMatchObject({ accepted: false, revision: 1 });
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toEqual([]); expect(backend.unexpected).toEqual([]);
});

test('history loads only nearby thumbnails, caps downloads at two, supports legacy PNG and clears full view on logout', async ({ page }) => {
  const backend = await installBackend(page, { privatePilot: 'off' });
  for (let i = 0; i < 10; i++) backend.seedPrivateResult(`99999999-9999-4999-8999-${String(i).padStart(12, '0')}`, i === 0);
  await openWardrobe(page); let release; backend.holdDownload = new Promise(done => { release = done; });
  await button(page, 'Wizualizacje').click(); await button(page, 'Powiększ').first().scrollIntoViewIfNeeded();
  await expect.poll(() => backend.photoRequests.filter(value => value.body.path.includes('/thumb.')).length).toBeGreaterThan(0);
  expect(backend.maxDownloads).toBeLessThanOrEqual(2);
  expect(new Set(backend.photoRequests.map(value => value.body.path)).size).toBeLessThan(10);
  backend.holdDownload = null; release(); await expect(page.getByRole('img', { name: 'Wynik wizualizacji', exact: true }).first()).toBeVisible();
  await button(page, 'Powiększ').first().click(); await expect(page.getByRole('img', { name: 'Pełny obraz', exact: true })).toBeVisible();
  await button(page, 'Zamknij podgląd').click(); await button(page, 'Konto').click(); await button(page, 'Wyloguj').click();
  await expect(button(page, 'Zaloguj przez Google')).toBeVisible(); await expect(page.locator('img[src^="blob:"]')).toHaveCount(0);
  expect(backend.maxDownloads).toBeLessThanOrEqual(2); expect(backend.logs.filter(value => value.action === 'requestVisualization')).toEqual([]);
});

test('C1 EN is readable at 320px and 390px with server OFF and no hidden paid action', async ({ page }, info) => {
  const backend = await installBackend(page, { privatePilot: 'off', locale: 'en' }); await openWardrobe(page, 'en');
  await button(page, 'Visualisations').click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole('heading', { name: 'Private visualisation pilot', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`c1-off-en-${width}.png`), fullPage: true, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await button(page, 'Outfits').click(); await button(page, 'Find outfits').click(); await button(page, 'Visualise on me').first().click();
  await button(page, 'Save outfit and check inputs').click();
  await expect(page.getByRole('dialog').getByRole('img', { name: 'Person photo', exact: true })).toBeVisible();
  const englishSend = button(page, 'Send these photos to OpenAI and generate'); await expect(englishSend).toBeDisabled();
  await englishSend.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('c1-consent-off-en-320.png'), animations: 'disabled' });
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toEqual([]); expect(backend.unexpected).toEqual([]);
});
