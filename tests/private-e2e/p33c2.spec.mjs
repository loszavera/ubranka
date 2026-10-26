import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { button, installBackend, openWardrobe } from './fixture.mjs';

const send = 'Wyślij te zdjęcia do OpenAI i wygeneruj';
const consent = 'Potwierdzam własne zdjęcie dorosłej osoby i zgadzam się na to jedno wysłanie pokazanych zdjęć do OpenAI';
const policy = 'Akceptuję zasady danych AI V1.2 i opisaną granicę ceny żądania';
async function prepare(page, locale = 'pl') {
  await button(page, locale === 'pl' ? 'Zestawy' : 'Outfits').click();
  await button(page, locale === 'pl' ? 'Dobierz zestawy' : 'Find outfits').click();
  await button(page, locale === 'pl' ? 'Zobacz na mnie' : 'Visualise on me').first().click();
  await button(page, locale === 'pl' ? 'Zapisz zestaw i sprawdź wejścia' : 'Save outfit and check inputs').click();
}

test('C2 previews the sealed JPEG copies and requires fresh policy plus individual send consent', async ({ page }, info) => {
  const backend = await installBackend(page, { privatePilot: true });
  backend.state.visualization.consent = { accepted: true, version: 'p33c-ai-v1.1', revision: 7 };
  await openWardrobe(page); await prepare(page);
  const image = page.getByRole('dialog').getByRole('img', { name: 'Zdjęcie osoby', exact: true });
  await expect(image).toBeVisible();
  const bytes = await image.evaluate(async element => Array.from(new Uint8Array(await (await fetch(element.src)).arrayBuffer())));
  expect(createHash('sha256').update(Buffer.from(bytes)).digest('hex')).toBe(createHash('sha256').update(backend.canonicalImage).digest('hex'));
  const intent = [...backend.intents.values()][0];
  expect(backend.photoRequests.filter(value => value.body.action === 'downloadCanonicalInput')).toHaveLength(intent.inputs.length);
  expect(backend.photoRequests.some(value => intent.inputs.some(input => input.path === value.body.path))).toBe(false);
  expect(backend.maxDownloads).toBeLessThanOrEqual(2);
  await expect(button(page, policy)).toHaveAttribute('aria-pressed', 'false');
  await expect(button(page, consent)).toHaveAttribute('aria-pressed', 'false');
  await button(page, policy).click(); await expect(button(page, send)).toBeDisabled();
  await button(page, 'Zasady danych AI V1.2').click();
  await expect(page.getByText(/nie jest to szyfrowanie end-to-end/)).toBeVisible();
  await button(page, consent).click(); await expect(button(page, send)).toBeEnabled();
  await page.screenshot({ path: info.outputPath('c2-consent-pl-390.png'), animations: 'disabled' });
  await button(page, send).click(); await expect(page.getByText('Zlecenie przyjęto. Wynik znajdziesz w Historii wizualizacji.', { exact: true })).toBeVisible();
  const sent = backend.logs.filter(value => value.action === 'requestVisualization'); expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ consentVersion: 'p33c-ai-v1.2', expectedConsentRevision: 7, expectedManifestHash: intent.manifestHash });
  expect(Object.keys(sent[0]).sort()).toEqual(['accepted', 'action', 'consentVersion', 'expectedConsentRevision', 'expectedManifestHash', 'intentId', 'operationId', 'trialId'].sort());
  expect(backend.unexpected).toEqual([]);
});

for (const problem of ['corruptCanonical', 'failCanonical']) test(`C2 blocks submission when canonical preview has ${problem}`, async ({ page }) => {
  const backend = await installBackend(page, { privatePilot: true }); backend[problem] = true;
  await openWardrobe(page); await prepare(page);
  await expect(page.getByText(/Nie udało się potwierdzić kopii zdjęcia do wysłania/).first()).toBeVisible();
  await button(page, policy).click(); await button(page, consent).click(); await expect(button(page, send)).toBeDisabled();
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.includes('trial-receipts')))).toEqual([]);
});

for (const [field, value] of [['sentCount', 60], ['accountSentCount', 30], ['dailySentCount', 5]]) test(`C2 respects server ${field} without a generation POST`, async ({ page }) => {
  const backend = await installBackend(page, { privatePilot: true }); backend.state.visualization.pilot[field] = value;
  await openWardrobe(page); await prepare(page);
  await expect(button(page, send)).toBeDisabled(); await expect(button(page, consent)).toBeDisabled();
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toEqual([]);
});

test('C2 English consent stays readable on phone and desktop with no hidden paid action', async ({ page }, info) => {
  const backend = await installBackend(page, { privatePilot: true, locale: 'en' }); await openWardrobe(page, 'en'); await prepare(page, 'en');
  await expect(page.getByRole('dialog').getByRole('img', { name: 'Person photo', exact: true })).toBeVisible();
  await button(page, 'AI data policy V1.2').click();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await button(page, 'Send these photos to OpenAI and generate').scrollIntoViewIfNeeded();
    await expect(button(page, 'Send these photos to OpenAI and generate')).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`c2-consent-en-${width}.png`), animations: 'disabled' });
  }
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toEqual([]); expect(backend.unexpected).toEqual([]);
});

test('C2 shows the global month ledger including B separately from the whole-pilot budget', async ({ page }) => {
  const backend = await installBackend(page, { privatePilot: true }); await openWardrobe(page); await button(page, 'Wizualizacje').click();
  await expect(page.getByText('Wspólny budżet miesiąca UTC', { exact: true })).toBeVisible();
  await expect(page.getByText('Koszt rozliczony: 1.49 PLN · Rezerwa: 0.00 PLN', { exact: true })).toBeVisible();
  await expect(page.getByText('Koszt rozliczony: 0.00 PLN · Rezerwa: 0.00 PLN', { exact: true })).toBeVisible();
  await expect(page.getByText(/Nowy miesiąc nie odnawia 25 PLN/)).toBeVisible();
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toEqual([]);
});
