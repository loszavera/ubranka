import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { ACCOUNT_A, ACCOUNT_B, authKey, button, installBackend, openWardrobe, session } from './fixture.mjs';

const consent = 'Zgadzam się wysłać pokazane fikcyjne zdjęcia do OpenAI w tej jednej próbie';
async function inputs(page) {
  await button(page, 'Wizualizacje').click(); await button(page, 'Sprawdź wejścia: B01').click();
  await expect(page.getByRole('img', { name: 'Fikcyjna dorosła osoba', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Osobne zdjęcie rzeczy 3', exact: true })).toBeVisible();
  await expect(button(page, 'Wyślij tę próbę raz')).toBeDisabled();
  await button(page, consent).click();
}

test('synthetic trial sends once with explicit inputs/consent, privately reads PNG, rates fidelity separately, exports and deletes', async ({ page }, info) => {
  const backend = await installBackend(page, { syntheticTrial: true });
  await openWardrobe(page); await inputs(page);
  await expect(page.getByText('Rezerwa tej próby: 10.00 PLN', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('p33b-inputs-pl-390.png'), fullPage: true, animations: 'disabled' });
  await button(page, 'Wyślij tę próbę raz').click();
  await button(page, 'Powiększ').scrollIntoViewIfNeeded();
  await expect(page.getByRole('img', { name: 'Wynik wizualizacji', exact: true })).toBeVisible();
  const calls = backend.logs.filter(value => value.action === 'requestVisualization'); expect(calls).toHaveLength(1);
  expect(calls[0]).toMatchObject({ caseId: 'B01', accepted: true, consentVersion: 'p33b-synthetic-v1' });
  expect(calls[0].operationId).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i);
  await expect(page.getByText('Wysłania całej próby: 1/6 · Budżet całej próby: 10.00 PLN', { exact: true })).toBeVisible();
  await expect(page.getByText(/Próby:.*40/)).toHaveCount(0);
  const pngReady = page.waitForEvent('download'); await button(page, 'Pobierz wynik').click();
  const png = await pngReady; expect(png.suggestedFilename()).toBe('ubranka-visualization.png');
  expect([...new Uint8Array(await readFile(await png.path())).slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  await button(page, 'Oceń wierność obrazu').click();
  await expect(button(page, 'Zapisz ocenę obrazu')).toBeDisabled();
  for (const label of ['Osoba', 'Ubrania', 'Kompletność', 'Anatomia i artefakty', 'Użyteczność']) await button(page, `${label}: 2`).click();
  await page.getByRole('textbox', { name: 'Uwagi do wierności (opcjonalnie)', exact: true }).fill('Ocena syntetycznej fixture.');
  await button(page, 'Zapisz ocenę obrazu').click();
  await expect(page.getByRole('heading', { name: 'Oceń wierność obrazu', exact: true })).toBeHidden();
  await expect(page.getByText('Ocena wierności: 10/10', { exact: true })).toBeVisible();
  expect(backend.state.styling.data.feedback).toEqual([]);
  await page.screenshot({ path: info.outputPath('p33b-result-pl-390.png'), fullPage: true });
  await button(page, 'Konto').click(); const zipReady = page.waitForEvent('download'); await button(page, 'Pobierz moje dane i zdjęcia').click();
  const zipFile = await zipReady; const files = unzipSync(new Uint8Array(await readFile(await zipFile.path())));
  expect(Object.keys(files).filter(name => name.startsWith('visualizations/') && name.endsWith('.png'))).toHaveLength(2);
  const manifest = JSON.parse(strFromU8(files['wardrobe.json'])); expect(manifest.visualization.jobs[0].review.scores.person).toBe(2);
  await button(page, 'Wizualizacje').click(); await button(page, 'Usuń wynik').click(); await button(page, 'Usuń wynik').last().click();
  await expect(page.getByRole('img', { name: 'Wynik wizualizacji', exact: true })).toHaveCount(0);
  await page.reload(); await button(page, 'Wizualizacje').click();
  await expect(button(page, 'Sprawdź wejścia: B01')).toHaveCount(0);
  expect(backend.state.visualization.trial.cases[0].jobId).toBe(calls[0].operationId);
  expect(backend.state.visualization.trial.sentCount).toBe(1); expect(backend.state.visualization.trial.spentPln).toBe(0.32);
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toHaveLength(1); expect(backend.unexpected).toEqual([]);
});

test('lost 202 is recovered by the existing job UUID after reload, never a second generation POST', async ({ page }) => {
  const backend = await installBackend(page, { syntheticTrial: true }); backend.loseVisualizationResponse = true;
  await openWardrobe(page); await inputs(page); await button(page, 'Wyślij tę próbę raz').click();
  await expect(page.getByText(/Nie potwierdzono przyjęcia próby/).last()).toBeVisible();
  await expect(button(page, 'Wyślij tę próbę raz')).toBeDisabled();
  const operationId = backend.state.visualization.trial.cases[0].jobId;
  backend.completeVisualization('B01');
  await page.reload(); await button(page, 'Wizualizacje').click();
  await button(page, 'Powiększ').scrollIntoViewIfNeeded();
  await expect(page.getByRole('img', { name: 'Wynik wizualizacji', exact: true })).toBeVisible();
  await button(page, 'Sprawdź stan próby: B01').click();
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toHaveLength(1);
  expect(backend.logs.find(value => value.action === 'getVisualization').jobId).toBe(operationId); expect(backend.unexpected).toEqual([]);
});

test('a durable receipt blocks repeat POST after reload and logout while no server job is visible; account deletion removes it', async ({ page }) => {
  const backend = await installBackend(page, { syntheticTrial: true }); backend.dropVisualizationBeforeReserve = true;
  const receiptKey = `ubranka:private:ubranka-test.supabase.co:trial-receipts:${ACCOUNT_A}`;
  await openWardrobe(page); await inputs(page); await button(page, 'Wyślij tę próbę raz').click();
  await expect(page.getByText(/Nie potwierdzono przyjęcia próby/).last()).toBeVisible();
  const requests = backend.logs.filter(value => value.action === 'requestVisualization'); expect(requests).toHaveLength(1);
  const operationId = requests[0].operationId;
  expect(JSON.parse(await page.evaluate(key => localStorage.getItem(key), receiptKey))).toEqual({ version: 1, receipts: [{ id: operationId, caseId: 'B01' }] });
  expect(backend.state.visualization.jobs).toEqual([]); expect(backend.state.visualization.trial.cases[0].jobId).toBeNull();
  await page.reload(); await button(page, 'Wizualizacje').click();
  await expect(page.getByText(/Nie potwierdzono przyjęcia próby/).last()).toBeVisible();
  await expect(button(page, 'Sprawdź wejścia: B01')).toHaveCount(0); await expect(button(page, 'Sprawdź wejścia: B03')).toBeDisabled();
  await button(page, 'Sprawdź stan próby').click();
  await expect.poll(() => backend.logs.filter(value => value.action === 'getVisualization').length).toBe(1);
  expect(backend.logs.find(value => value.action === 'getVisualization').jobId).toBe(operationId);
  await button(page, 'Konto').click(); await button(page, 'Wyloguj').click();
  await expect(button(page, 'Zaloguj przez Google')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), receiptKey)).not.toBeNull();
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: authKey, value: session() });
  await page.reload(); await button(page, 'Wizualizacje').click();
  await expect(page.getByText(/Nie potwierdzono przyjęcia próby/).last()).toBeVisible();
  await expect(button(page, 'Sprawdź wejścia: B03')).toBeDisabled();
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toHaveLength(1);
  await button(page, 'Konto').click(); await button(page, 'Usuń konto i dane').click(); await button(page, 'Potwierdzam usunięcie konta').click();
  await expect(button(page, 'Zaloguj przez Google')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), receiptKey)).toBeNull(); expect(backend.unexpected).toEqual([]);
});

test('unknown outcome and expired or exhausted trials preserve reserve and cannot submit another case', async ({ page }) => {
  const backend = await installBackend(page, { syntheticTrial: true }); backend.autoFinishVisualization = false;
  backend.state.visualization.trial.endsAt = null; backend.state.visualization.mode = 'off';
  await openWardrobe(page); await button(page, 'Wizualizacje').click();
  await expect(page.getByText('Koniec okna próby: Nie rozpoczęto', { exact: true })).toBeVisible();
  await expect(button(page, 'Sprawdź wejścia: B01')).toBeDisabled();
  await button(page, 'EN').click(); await expect(page.getByText('Trial window ends: Not started', { exact: true })).toBeVisible(); await button(page, 'PL').click();
  backend.state.visualization.trial.endsAt = '2099-01-01T00:00:00Z'; backend.state.visualization.mode = 'synthetic_trial';
  await button(page, 'Odśwież').click(); await inputs(page); await button(page, 'Wyślij tę próbę raz').click();
  await expect(page.getByText('Wysłano — oczekujemy na wynik', { exact: true })).toBeVisible();
  backend.completeVisualization('B01', true); await button(page, 'Odśwież').click();
  await expect(page.getByText('Nie udało się potwierdzić wyniku i kosztu', { exact: true })).toBeVisible();
  await expect(page.getByText('Koszt rozliczony: Niepotwierdzony · Rezerwa: 10.00 PLN', { exact: true })).toBeVisible();
  await expect(button(page, 'Sprawdź wejścia: B03')).toBeDisabled();
  await page.reload(); await button(page, 'Wizualizacje').click(); await button(page, 'Odśwież').click();
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toHaveLength(1);
  backend.state.visualization.mode = 'off'; backend.state.visualization.trial.endsAt = '2026-01-01T00:00:00Z';
  await button(page, 'Odśwież').click(); await expect(button(page, 'Sprawdź wejścia: B03')).toBeDisabled();
  await expect(page.getByText(/Wysłania całej próby: 1\/6/)).toBeVisible(); expect(backend.unexpected).toEqual([]);
});

test('server OFF cannot be enabled by client metadata, and switching account discards late trial response', async ({ page }) => {
  const backend = await installBackend(page, { syntheticTrial: true });
  let release; backend.holdVisualization = new Promise(resolve => { release = resolve; });
  await openWardrobe(page); await inputs(page); await button(page, 'Wyślij tę próbę raz').click();
  await expect.poll(() => backend.logs.filter(value => value.action === 'requestVisualization').length).toBe(1);
  const next = session(ACCOUNT_B); next.user.user_metadata = { synthetic_trial: true, trial: { budgetPln: 1000 } };
  await page.evaluate(({ key, next }) => { localStorage.setItem(key, JSON.stringify(next)); const channel = new BroadcastChannel(key); channel.postMessage({ event: 'SIGNED_IN', session: next }); channel.close(); }, { key: authKey, next });
  await expect(page.getByText('synthetic-b@example.test', { exact: true })).toBeVisible(); release();
  await button(page, 'Wizualizacje').click(); await expect(page.getByText('AI jest wyłączone', { exact: true })).toBeVisible();
  await expect(button(page, 'Sprawdź wejścia: B01')).toHaveCount(0); await expect(page.getByRole('img', { name: 'Wynik wizualizacji', exact: true })).toHaveCount(0);
  expect(backend.second.visualization.jobs).toEqual([]); expect(backend.unexpected).toEqual([]);
});

test('changed inputs invalidate pending consent and the trial fits 320px in Polish and English', async ({ page }, info) => {
  const backend = await installBackend(page, { syntheticTrial: true });
  await openWardrobe(page); await inputs(page);
  backend.state.visualization.trial.cases[0].reservePln = 9;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByText(/Wejścia lub rezerwa zmieniły się/)).toBeVisible(); await expect(button(page, 'Wyślij tę próbę raz')).toBeDisabled();
  await button(page, 'Anuluj').click();
  await expect(page.getByRole('heading', { name: 'Sprawdź wejścia', exact: true })).toBeHidden();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`p33b-trial-pl-${width}.png`), fullPage: true, animations: 'disabled' });
  }
  await button(page, 'EN').click(); await button(page, 'Review inputs: B01').click();
  await expect(button(page, 'Send this attempt once')).toBeDisabled();
  await expect(page.getByText('Reserve for this attempt: 9.00 PLN', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('p33b-inputs-en-390.png'), fullPage: true, animations: 'disabled' });
  expect(backend.logs.filter(value => value.action === 'requestVisualization')).toHaveLength(0); expect(backend.unexpected).toEqual([]);
});
