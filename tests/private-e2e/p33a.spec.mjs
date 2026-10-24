import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { ACCOUNT_B, authKey, button, demoKey, installBackend, openWardrobe, session, syntheticPhoto } from './fixture.mjs';

async function uploadBody(page) {
  const bytes = await syntheticPhoto(page);
  const chooser = page.waitForEvent('filechooser');
  await button(page, 'Wybierz zdjęcie').click();
  await (await chooser).setFiles({ name: 'synthetic-body.jpg', mimeType: 'image/jpeg', buffer: bytes });
  await expect(button(page, 'Zapisz zdjęcie sylwetki')).toBeDisabled();
  await button(page, 'Zgadzam się zapisać to zdjęcie sylwetki w prywatnej szafie').click();
  await expect(button(page, 'Zgadzam się zapisać to zdjęcie sylwetki w prywatnej szafie')).toHaveAttribute('aria-pressed', 'true');
  await button(page, 'Zapisz zdjęcie sylwetki').click();
  await expect(button(page, 'Usuń zdjęcie sylwetki')).toBeVisible();
}

test('body profile and consented photo persist privately, export and deletion preserve sizes and demo', async ({ page }, info) => {
  const backend = await installBackend(page);
  await openWardrobe(page);
  const originalDemo = await page.evaluate(key => localStorage.getItem(key), demoKey);
  await button(page, 'Moja sylwetka').click();
  await button(page, 'Edytuj rozmiary').click();
  await page.getByRole('textbox', { name: 'Wzrost · cm', exact: true }).fill('172,5');
  await page.getByRole('textbox', { name: 'Obwód talii · cm', exact: true }).fill('75');
  await page.getByRole('textbox', { name: 'Rozmiar góry', exact: true }).fill('M');
  await button(page, 'Zapisz').click();
  await expect.poll(() => backend.state.bodyFit.data.heightCm).toBe(172.5);
  await expect(page.getByRole('heading', { name: 'Edytuj rozmiary', exact: true })).toBeHidden();
  await uploadBody(page);
  expect(backend.logs.find(x => x.action === 'uploadBodyPhoto').storageConsentVersion).toBe('p33a-body-v1');
  expect(backend.state.bodyFit.photo.bytes).toBeLessThanOrEqual(1_000_000);
  await page.reload();
  await button(page, 'Moja sylwetka').click();
  await expect(page.getByText('Wzrost · cm: 172.5', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Zdjęcie sylwetki', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('p33a-body-pl.png'), fullPage: true });
  await button(page, 'Konto').click();
  const ready = page.waitForEvent('download');
  await button(page, 'Pobierz moje dane i zdjęcia').click();
  const download = await ready;
  const zip = unzipSync(new Uint8Array(await readFile(await download.path())));
  const manifest = JSON.parse(strFromU8(zip['wardrobe.json']));
  expect(manifest.bodyFit.data.heightCm).toBe(172.5);
  expect(Object.keys(zip).filter(x => x.endsWith('.jpg'))).toHaveLength(2);
  await button(page, 'Moja sylwetka').click();
  await button(page, 'Usuń zdjęcie sylwetki').click();
  await button(page, 'Usuń zdjęcie sylwetki').last().click();
  await expect.poll(() => backend.state.bodyFit.photo).toBeNull();
  await expect(page.getByRole('img', { name: 'Zdjęcie sylwetki', exact: true })).toHaveCount(0);
  expect(backend.state.bodyFit.data.topSize).toBe('M');
  expect(backend.objects.size).toBe(0);
  expect(await page.evaluate(key => localStorage.getItem(key), demoKey)).toBe(originalDemo);
  expect(backend.unexpected).toEqual([]);
});

test('body form keeps conflicting draft and requires comparison before saving', async ({ page }) => {
  const backend = await installBackend(page);
  await openWardrobe(page);
  await button(page, 'Moja sylwetka').click();
  await button(page, 'Edytuj rozmiary').click();
  await page.getByRole('textbox', { name: 'Wzrost · cm', exact: true }).fill('180');
  backend.state.bodyFit.data.heightCm = 175; backend.state.bodyFit.revision++;
  await button(page, 'Zapisz').click();
  await button(page, 'Wczytaj nowsze dane').last().click();
  await expect(page.getByRole('textbox', { name: 'Wzrost · cm', exact: true })).toHaveValue('180');
  await expect(button(page, 'Zapisz')).toBeDisabled();
  await expect(page.getByText(/Nowsze dane:.*175/)).toBeVisible();
  await button(page, 'Zastosuj mój formularz do nowszej wersji').click();
  await button(page, 'Zapisz').click();
  await expect.poll(() => backend.state.bodyFit.data.heightCm).toBe(180);
  expect(backend.unexpected).toEqual([]);
});

test('owned outfits respect occasion, save feedback and expose only disabled AI preparation', async ({ page }, info) => {
  const backend = await installBackend(page, { ownedOutfits: true });
  await openWardrobe(page);
  await button(page, 'Moja sylwetka').click();
  await uploadBody(page);
  await button(page, 'Zestawy').click();
  await button(page, 'Dobierz zestawy').click();
  await expect(button(page, 'Zapisz zestaw')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: /0 PLN nowych zakupów/ })).toHaveCount(2);
  await button(page, 'Podoba mi się').first().click();
  await expect.poll(() => backend.state.styling.data.feedback.length).toBe(1);
  await button(page, 'Zapisz zestaw').first().click();
  await expect.poll(() => backend.state.styling.data.outfits.length).toBe(1);
  await button(page, 'Wesele (gość)').click();
  await button(page, 'Dobierz zestawy').click();
  await expect(button(page, 'Zapisz zestaw')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Wesele (gość) · 0 PLN nowych zakupów', exact: true })).toHaveCount(1);
  await button(page, 'Zobacz na mnie').first().click();
  await expect(button(page, 'Wyślij zdjęcia i wygeneruj — niedostępne')).toBeDisabled();
  await expect(page.getByText('AI jest wyłączone', { exact: true })).toBeVisible();
  await expect(page.getByText(/Przykład działania — nie jest wizualizacją Twoich zdjęć/)).toBeVisible();
  await page.screenshot({ path: info.outputPath('p33a-visual-off-pl.png'), fullPage: true, animations: 'disabled' });
  expect(backend.logs.some(x => x.action === 'requestVisualization')).toBe(false);
  expect(backend.state.visualization.jobs).toEqual([]);
  expect(backend.state.visualization.limits.spentPln).toBe(0);
  await button(page, 'Anuluj').click();
  await button(page, 'EN').click();
  await button(page, 'Visualise on me').first().click();
  await expect(button(page, 'Send photos and generate — unavailable')).toBeDisabled();
  await expect(page.getByText('AI is switched off', { exact: true })).toBeVisible();
  expect(backend.unexpected).toEqual([]);
});

test('body photo and draft are discarded when the account changes', async ({ page }) => {
  const backend = await installBackend(page);
  await openWardrobe(page);
  await button(page, 'Moja sylwetka').click();
  await uploadBody(page);
  await button(page, 'Edytuj rozmiary').click();
  await page.getByRole('textbox', { name: 'Wzrost · cm', exact: true }).fill('182');
  await page.evaluate(({ key, next }) => {
    localStorage.setItem(key, JSON.stringify(next)); const channel = new BroadcastChannel(key);
    channel.postMessage({ event: 'SIGNED_IN', session: next }); channel.close();
  }, { key: authKey, next: session(ACCOUNT_B) });
  await expect(page.getByRole('textbox', { name: 'Wzrost · cm', exact: true })).toHaveCount(0);
  await button(page, 'Moja sylwetka').click();
  await expect(page.getByRole('img', { name: 'Zdjęcie sylwetki', exact: true })).toHaveCount(0);
  await expect(page.getByText('Wzrost · cm: Nie podano', { exact: true })).toBeVisible();
  expect(backend.second.bodyFit.photo).toBeNull();
  expect(backend.second.bodyFit.data.heightCm).toBeNull();
  expect(backend.unexpected).toEqual([]);
});

test('manual swap and optional rejection reason save only private outfit feedback', async ({ page }) => {
  const backend = await installBackend(page, { ownedOutfits: true });
  await openWardrobe(page);
  await button(page, 'Zestawy').click();
  await button(page, 'Dobierz zestawy').click();
  await button(page, 'Zamień rzecz: Własna koszula').click();
  await button(page, 'Druga koszula').click();
  await expect(button(page, 'Zapisz zestaw')).toHaveCount(1);
  await expect(button(page, 'Zamień rzecz: Własna koszula')).toHaveCount(0);
  await button(page, 'Nie dla mnie').click();
  await page.getByRole('textbox', { name: 'Powód odrzucenia (opcjonalnie)', exact: true }).fill('Chcę inny kolor');
  await button(page, 'Zapisz opinię').click();
  await expect.poll(() => backend.state.styling.data.feedback.length).toBe(1);
  expect(backend.state.styling.data.feedback[0]).toMatchObject({ profileId: 'everyday', vote: 'dislike', reason: 'Chcę inny kolor' });
  expect(backend.state.state.data.feedback).toEqual([]);
  await button(page, 'Kolejna para').click();
  expect(backend.logs.some(x => x.action === 'requestVisualization')).toBe(false);
  expect(backend.unexpected).toEqual([]);
});

test('incomplete owned wardrobe shows missing garments without inventing outfits', async ({ page }) => {
  const backend = await installBackend(page, { ownedOutfits: true });
  backend.state.items = backend.state.items.filter(x => x.category === 'top');
  await openWardrobe(page);
  await button(page, 'Zestawy').click();
  await button(page, 'Dobierz zestawy').click();
  await expect(button(page, 'Zapisz zestaw')).toHaveCount(0);
  await expect(page.getByText(/Do kompletu brakuje/).first()).toBeVisible();
  expect(backend.state.styling.data.outfits).toEqual([]);
  expect(backend.unexpected).toEqual([]);
});

test('unknown visualization outcome keeps reserve visible and refresh never resends', async ({ page }) => {
  const backend = await installBackend(page);
  backend.state.visualization.jobs = [{ id: '77777777-7777-4777-8777-777777777777', revision: 2,
    outfitId: '88888888-8888-4888-8888-888888888888', status: 'outcome_unknown', createdAt: '2026-10-25T00:00:00Z',
    completedAt: null, expiresAt: '2026-10-25T00:15:00Z', errorCode: 'OUTCOME_UNKNOWN', reservedPln: 1, spentPln: null, result: null }];
  backend.state.visualization.limits.reservedPln = 1;
  backend.state.visualization.limits.usedAttempts = 1;
  await openWardrobe(page);
  await button(page, 'Wizualizacje').click();
  await expect(page.getByText('Nie udało się potwierdzić wyniku i kosztu', { exact: true })).toBeVisible();
  await expect(page.getByText('Koszt rozliczony: Niepotwierdzony · Rezerwa: 1.00 PLN', { exact: true })).toBeVisible();
  await button(page, 'Odśwież').click();
  expect(backend.logs.some(x => x.action === 'requestVisualization')).toBe(false);
  expect(backend.state.visualization.jobs[0].reservedPln).toBe(1);
  expect(backend.unexpected).toEqual([]);
});

test('new private panels fit a small phone and English labels remain usable', async ({ page }, info) => {
  const backend = await installBackend(page, { ownedOutfits: true });
  await openWardrobe(page);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const tab of ['Moja sylwetka', 'Zestawy', 'Wizualizacje']) {
      await button(page, tab).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
  }
  await button(page, 'EN').click();
  await button(page, 'My fit').click();
  await expect(button(page, 'Edit sizes')).toBeVisible();
  await page.screenshot({ path: info.outputPath('p33a-fit-en-390.png'), fullPage: true });
  await button(page, 'Outfits').click();
  await button(page, 'Find outfits').click();
  await expect(button(page, 'Save outfit')).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('p33a-outfits-en-390.png'), fullPage: true });
  expect(backend.unexpected).toEqual([]);
});
