import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { ACCOUNT_A, ACCOUNT_B, ITEM_ID, authKey, button, choosePhoto, demoKey, installBackend, openWardrobe, session } from './fixture.mjs';

const photoUri = locator => locator.evaluate(element => {
  const source = element.getAttribute('src') ?? element.querySelector('img')?.src ?? getComputedStyle(element).backgroundImage;
  return source?.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
});

const switchAccount = page => page.evaluate(({ key, next }) => {
  localStorage.setItem(key, JSON.stringify(next));
  const channel = new BroadcastChannel(key);
  channel.postMessage({ event: 'SIGNED_IN', session: next }); channel.close();
}, { key: authKey, next: session(ACCOUNT_B) });

test('photo CRUD, busy lock, ZIP export, confirmed deletion and logout use the real UI', async ({ page }, info) => {
  const backend = await installBackend(page);
  await openWardrobe(page);
  await button(page, 'Dodaj ubranie').click();
  await page.getByRole('textbox', { name: 'Nazwa ubrania', exact: true }).fill('Koszula z aparatu');
  await page.getByRole('textbox', { name: 'Kolor', exact: true }).fill('śliwkowy');
  await choosePhoto(page);
  let finishUpload;
  backend.holdPhoto = new Promise(resolve => { finishUpload = resolve; });
  await button(page, 'Zapisz').click();
  await expect.poll(() => backend.logs.filter(value => value.action === 'uploadPhoto').length).toBe(1);
  const nameInput = page.locator('input[aria-label="Nazwa ubrania"]');
  await nameInput.evaluate(element => element.focus());
  await page.keyboard.type(' NIE ZAPISUJ TEGO');
  await expect(nameInput).toHaveValue('Koszula z aparatu');
  finishUpload();
  await expect(button(page, 'Edytuj: Koszula z aparatu')).toBeVisible();
  expect(backend.state.items).toHaveLength(1);
  const uploaded = backend.logs.find(value => value.action === 'uploadPhoto');
  expect(uploaded.mimeType).toBe('image/jpeg');
  expect(backend.state.items[0].photo.bytes).toBeLessThanOrEqual(1_000_000);
  expect(backend.state.items[0].photo.thumbBytes).toBeLessThanOrEqual(100_000);
  await expect(page.getByRole('heading', { name: 'Dodaj ubranie', exact: true })).toBeHidden();
  await expect(page.getByRole('img', { name: 'Zdjęcie ubrania', exact: true })).toBeVisible();
  expect(backend.photoRequests.some(request => request.body.path === backend.state.items[0].photo.thumbPath)).toBe(true);
  await page.screenshot({ path: info.outputPath('private-wardrobe-pl.png') });
  await button(page, 'Edytuj: Koszula z aparatu').click();
  await page.getByRole('textbox', { name: 'Nazwa ubrania', exact: true }).fill('Koszula na wesele');
  await button(page, 'Wesele (gość)').click();
  await button(page, 'Zapisz').click();
  await expect(button(page, 'Edytuj: Koszula na wesele')).toBeVisible();
  expect(backend.state.items[0].occasions).toContain('wedding');
  await button(page, 'Konto').click();
  const beforeExport = backend.logs.length;
  const downloadReady = page.waitForEvent('download');
  await button(page, 'Pobierz moje dane i zdjęcia').click();
  const download = await downloadReady;
  const zip = unzipSync(new Uint8Array(await readFile(await download.path())));
  const manifest = JSON.parse(strFromU8(zip['wardrobe.json']));
  expect(manifest.items[0].name).toBe('Koszula na wesele');
  expect(Object.keys(zip).filter(name => name.endsWith('.jpg'))).toHaveLength(2);
  expect(backend.logs.slice(beforeExport).filter(value => value.action === 'downloadPhoto').map(value => value.path)).toEqual([
    backend.state.items[0].photo.mainPath, backend.state.items[0].photo.thumbPath,
  ]);
  for (const request of backend.photoRequests) {
    expect(request).toMatchObject({ url: 'https://ubranka-test.supabase.co/functions/v1/wardrobe', method: 'POST', contentType: 'application/json',
      apikey: 'sb_publishable_ubranka_private_e2e_only', accountId: ACCOUNT_A });
    expect(Object.keys(request.body).sort()).toEqual(['action', 'path']);
    expect(request.body.action).toBe('downloadPhoto');
  }
  await button(page, 'Moje rzeczy').click();
  await button(page, 'Usuń: Koszula na wesele').click();
  await button(page, 'Usuń rzecz i zdjęcie').click();
  await expect(button(page, 'Edytuj: Koszula na wesele')).toHaveCount(0);
  expect(backend.objects.size).toBe(0);
  await button(page, 'Konto').click();
  await button(page, 'Wyloguj').click();
  await expect(button(page, 'Zaloguj przez Google')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), authKey)).toBeNull();
  expect(backend.unexpected).toEqual([]);
});

test('selected P2 profiles and opinions import once, EN and a profile conflict preserve the draft', async ({ page }, info) => {
  const backend = await installBackend(page);
  await openWardrobe(page);
  await button(page, 'Profile stylu').click();
  await button(page, 'Przenieś wybrane profile z demo').click();
  await button(page, 'Mój codzienny').click();
  await button(page, 'Importuj wybrane profile').click();
  await expect(button(page, 'Edytuj: Mój codzienny')).toBeVisible();
  expect(backend.state.state.data.profiles.map(profile => profile.id)).toEqual(['p2:everyday']);
  expect(backend.state.state.data.feedback).toHaveLength(1);
  expect(backend.state.items).toEqual([]);
  const local = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), demoKey);
  expect(local.profiles).toHaveLength(2);
  expect(local.ownedItemIds).toEqual(['w-sneakers']);
  await button(page, 'Przenieś wybrane profile z demo').click();
  await button(page, 'Mój codzienny').click();
  await button(page, 'Importuj wybrane profile').click();
  await expect(button(page, 'Edytuj: Mój codzienny')).toBeVisible();
  expect(backend.state.state.data.profiles).toHaveLength(1);
  expect(backend.state.state.data.feedback).toHaveLength(1);
  await button(page, 'Edytuj: Mój codzienny').click();
  await page.getByRole('textbox', { name: 'Nazwa profilu', exact: true }).fill('Mój zachowany formularz');
  backend.state.state.data.profiles[0].name = 'Zmiana na drugim urządzeniu';
  backend.state.state.revision++;
  await button(page, 'Zapisz profil').click();
  await expect(button(page, 'Wczytaj nowsze dane').last()).toBeVisible();
  await button(page, 'Wczytaj nowsze dane').last().click();
  await expect(page.locator('input[aria-label="Nazwa profilu"]')).toHaveValue('Mój zachowany formularz');
  await expect(page.getByText(/Nowsza wersja: Zmiana na drugim urządzeniu/)).toBeVisible();
  await button(page, 'Zastosuj mój formularz do tej wersji').click();
  await button(page, 'Zapisz profil').click();
  await expect(button(page, 'Edytuj: Mój zachowany formularz')).toBeVisible();
  await button(page, 'EN').click();
  await expect(button(page, 'Style profiles')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your private wardrobe' })).toBeVisible();
  expect(backend.state.state.data.locale).toBe('en');
  await page.screenshot({ path: info.outputPath('private-wardrobe-en.png') });
  expect(backend.unexpected).toEqual([]);
});

test('item conflict keeps form and requires explicit comparison before overwrite', async ({ page }) => {
  const backend = await installBackend(page, { existingItem: true });
  await openWardrobe(page);
  await button(page, 'Edytuj: Koszula testowa').click();
  await page.getByRole('textbox', { name: 'Kolor', exact: true }).fill('mój nowy kolor');
  backend.state.items[0].color = 'kolor drugiego urządzenia'; backend.state.items[0].revision++;
  await button(page, 'Zapisz').click();
  await button(page, 'Wczytaj nowsze dane').last().click();
  await expect(page.getByRole('textbox', { name: 'Kolor', exact: true })).toHaveValue('mój nowy kolor');
  await expect(page.getByText(/Nowsza wersja:.*kolor drugiego urządzenia/)).toBeVisible();
  await expect(button(page, 'Zapisz')).toBeDisabled();
  await button(page, 'Zastosuj mój formularz do tej wersji').click();
  await button(page, 'Zapisz').click();
  await expect(button(page, 'Edytuj: Koszula testowa')).toBeVisible();
  expect(backend.state.items[0].color).toBe('mój nowy kolor');
  expect(backend.unexpected).toEqual([]);
});

test('failed photo upload resumes a staged save and preserves edits made before retry', async ({ page }) => {
  const backend = await installBackend(page, { existingItem: true });
  backend.failPhoto = 1;
  await openWardrobe(page);
  await button(page, 'Edytuj: Koszula testowa').click();
  await page.getByRole('textbox', { name: 'Kolor', exact: true }).fill('pierwszy kolor');
  await choosePhoto(page);
  await button(page, 'Zapisz').click();
  await expect.poll(() => backend.logs.filter(value => value.action === 'uploadPhoto').length).toBe(1);
  await expect(button(page, 'Zapisz')).toBeEnabled();
  await expect(button(page, 'Zastosuj mój formularz do tej wersji')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Kolor', exact: true }).fill('kolor po błędzie');
  await button(page, 'Zapisz').click();
  await expect(button(page, 'Edytuj: Koszula testowa')).toBeVisible();
  expect(backend.state.items).toHaveLength(1);
  expect(backend.state.items[0].color).toBe('kolor po błędzie');
  expect(backend.logs.filter(value => value.action === 'uploadPhoto')).toHaveLength(2);
  expect(backend.unexpected).toEqual([]);
});

test('pending item cleanup survives refresh/reload without a card, then clears; account deletion still stays pending', async ({ page }, info) => {
  const backend = await installBackend(page, { existingItem: true });
  backend.pendingDelete = true; backend.pendingAccountDelete = true;
  await openWardrobe(page);
  await button(page, 'Usuń: Koszula testowa').click();
  await button(page, 'Usuń rzecz i zdjęcie').click();
  await expect(page.getByText('Usunięto z szafy', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Rzeczy oczekujące na usunięcie plików: 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Usuwanie w toku', { exact: true })).toHaveCount(0);
  await expect(button(page, 'Edytuj: Koszula testowa')).toHaveCount(0);
  await expect(page.getByText('Koszula testowa', { exact: true })).toHaveCount(0);
  await expect(page.getByText('0/100 rzeczy', { exact: true })).toBeVisible();
  expect(backend.state.items[0].status).toBe('deleting');
  expect(backend.objects.size).toBe(2);
  await button(page, 'Odśwież').click();
  await page.reload();
  await expect(page.getByText('Rzeczy oczekujące na usunięcie plików: 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Koszula testowa', { exact: true })).toHaveCount(0);
  await expect(page.getByText('0/100 rzeczy', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('private-cleanup-pending-pl.png') });
  backend.state.items = []; backend.objects.clear(); // The worker completed its storage/database checks.
  await button(page, 'Odśwież').click();
  await expect(page.getByText('Usunięto z szafy', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Usuwanie w toku', { exact: true })).toHaveCount(0);
  await button(page, 'Konto').click();
  await button(page, 'Usuń konto i dane').click();
  await button(page, 'Potwierdzam usunięcie konta').click();
  await expect(button(page, 'Zaloguj przez Google')).toBeVisible();
  await expect(page.getByText('Usuwanie w toku', { exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), authKey)).toBeNull();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).ownedItemIds, demoKey)).toEqual(['w-sneakers']);
  expect(backend.unexpected).toEqual([]);
});

test('all 100 pending items still reserve the quota without appearing as active clothes', async ({ page }, info) => {
  const backend = await installBackend(page, { existingItem: true, locale: 'en' });
  const base = backend.state.items[0];
  backend.state.items = Array.from({ length: 100 }, (_, index) => ({ ...base, id: `33333333-3333-4333-8333-${String(index).padStart(12, '0')}`, status: 'deleting', photo: null }));
  await openWardrobe(page);
  await expect(page.getByText('0/100 items', { exact: true })).toBeVisible();
  await expect(page.getByText('Items awaiting file deletion: 100', { exact: true })).toBeVisible();
  await expect(page.getByText('Removed from your wardrobe', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Koszula testowa', { exact: true })).toHaveCount(0);
  await expect(button(page, 'Add clothing')).toBeDisabled();
  await page.reload();
  await expect(button(page, 'Add clothing')).toBeDisabled();
  await page.screenshot({ path: info.outputPath('private-cleanup-quota-en.png') });
  backend.state.items.pop();
  await button(page, 'Refresh').click();
  await expect(page.getByText('Items awaiting file deletion: 99', { exact: true })).toBeVisible();
  await expect(button(page, 'Add clothing')).toBeEnabled();
  expect(backend.photoRequests).toHaveLength(0);
  expect(backend.unexpected).toEqual([]);
});

test('a rejected delete keeps the item and photo without a false success message', async ({ page }) => {
  const backend = await installBackend(page, { existingItem: true }); backend.failDelete = true;
  await openWardrobe(page);
  await button(page, 'Usuń: Koszula testowa').click();
  await button(page, 'Usuń rzecz i zdjęcie').click();
  await expect(page.getByText('Operacja nie została potwierdzona. Sprawdź połączenie i spróbuj ponownie.').last()).toBeVisible();
  await expect(button(page, 'Usuń rzecz i zdjęcie')).toBeEnabled();
  await button(page, 'Anuluj').click();
  await expect(button(page, 'Edytuj: Koszula testowa')).toBeVisible();
  await expect(page.getByText('1/100 rzeczy', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Zdjęcie ubrania', exact: true })).toBeVisible();
  await expect(page.getByText('Usunięto z szafy', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Usunięto z szafy.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Usuwanie w toku', { exact: true })).toHaveCount(0);
  expect(backend.state.items[0].status).toBe('active');
  expect(backend.objects.size).toBe(2);
  expect(backend.unexpected).toEqual([]);
});

test('external account change closes the editor and releases the previous account photo', async ({ page }) => {
  const backend = await installBackend(page, { existingItem: true });
  await openWardrobe(page);
  const downloadedPhoto = page.getByRole('img', { name: 'Zdjęcie ubrania', exact: true });
  await expect(downloadedPhoto).toBeVisible();
  const downloadedUri = await photoUri(downloadedPhoto);
  expect(downloadedUri).toMatch(/^blob:/);
  await button(page, 'Edytuj: Koszula testowa').click();
  await choosePhoto(page);
  const previewUri = await photoUri(page.getByRole('img', { name: 'Zdjęcie ubrania', exact: true }).last());
  expect(previewUri).toMatch(/^blob:/);
  await switchAccount(page);
  await expect(page.getByText('synthetic-b@example.test', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nazwa ubrania', exact: true })).toHaveCount(0);
  await expect(button(page, 'Edytuj: Koszula testowa')).toHaveCount(0);
  expect(await page.evaluate(url => fetch(url).then(() => false, () => true), previewUri)).toBe(true);
  expect(await page.evaluate(url => fetch(url).then(() => false, () => true), downloadedUri)).toBe(true);
  expect(backend.logs.filter(value => value.action === 'uploadPhoto')).toHaveLength(0);
  expect(backend.state.items[0].id).toBe(ITEM_ID);
  expect(backend.state.accountId).toBe(ACCOUNT_A);
  expect(backend.unexpected).toEqual([]);
});

test('account change aborts an in-flight Edge photo POST and ignores its delayed bytes', async ({ page }) => {
  const backend = await installBackend(page, { existingItem: true });
  let finishDownload;
  backend.holdDownload = new Promise(resolve => { finishDownload = resolve; });
  await openWardrobe(page);
  await expect.poll(() => backend.photoRequests.length).toBe(1);
  const failedRequest = page.waitForEvent('requestfailed', request => request.url().endsWith('/functions/v1/wardrobe') && request.postDataJSON()?.action === 'downloadPhoto');
  await switchAccount(page);
  const aborted = await failedRequest;
  expect(aborted.failure()?.errorText).toBeTruthy();
  await expect(page.getByText('synthetic-b@example.test', { exact: true })).toBeVisible();
  finishDownload();
  await expect.poll(() => backend.completedDownloads).toBe(1);
  await expect(page.getByRole('img', { name: 'Zdjęcie ubrania', exact: true })).toHaveCount(0);
  await expect(button(page, 'Edytuj: Koszula testowa')).toHaveCount(0);
  expect(backend.photoRequests.map(request => request.accountId)).toEqual([ACCOUNT_A]);
  expect(backend.unexpected).toEqual([]);
});

test('denied accounts receive a useful error without private items', async ({ page }) => {
  const backend = await installBackend(page, { existingItem: true }); backend.deny = true;
  await openWardrobe(page);
  await expect(page.getByText('To konto nie ma dostępu do pilotażu. Wybierz zaproszone konto Google.', { exact: true })).toBeVisible();
  await expect(button(page, 'Edytuj: Koszula testowa')).toHaveCount(0);
  expect(backend.unexpected).toEqual([]);
});
