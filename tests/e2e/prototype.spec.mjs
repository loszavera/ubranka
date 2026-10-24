import { test, expect } from '@playwright/test';

const storageKey = 'ubranka:p2:v1';
const button = (page, name) => page.getByRole('button', { name, exact: true });
const cards = page => page.getByTestId(/^outfit-/);
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
async function start(page, budget = '500', occasion) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Budżet zestawu · PLN', exact: true }).fill(budget);
  if (occasion) await page.getByTestId('occasion-onboarding').getByRole('button', { name: `Na jaką okazję?: ${occasion}`, exact: true }).click();
  await button(page, 'Odkryj swój styl').click();
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
});

test('onboarding, two choices, likes, PL/EN and preferences survive reload', async ({ page }, info) => {
  await start(page, '-1');
  await expect(page.getByRole('alert')).toContainText('Podaj kwotę');
  await page.getByRole('textbox', { name: 'Budżet zestawu · PLN' }).fill('500');
  await button(page, 'Odkryj swój styl').click();
  await expect(cards(page)).toHaveCount(2);
  const ownedBefore = (await saved(page)).ownedItemIds;
  await cards(page).first().getByRole('button', { name: 'Podoba mi się', exact: true }).click();
  await expect.poll(async () => (await saved(page)).feedback.length).toBe(1);
  expect((await saved(page)).ownedItemIds).toEqual(ownedBefore);
  await button(page, 'EN').click();
  await expect(page.getByRole('heading', { name: 'Two outfits, just for you' })).toBeVisible();
  await noOverflow(page);
  await cards(page).first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('outfits-mobile-en.png') });
  await page.reload();
  await expect(button(page, 'Show my outfits')).toBeVisible();
  await button(page, 'Profile').click();
  await expect(page.getByText('Feedback saved in this profile: 1', { exact: true })).toBeVisible();
  expect((await saved(page)).locale).toBe('en');
});

test('passing both advances, reasons are optional and can be disabled', async ({ page }) => {
  await start(page, '500', 'Elegancko');
  const firstPair = await cards(page).evaluateAll(nodes => nodes.map(n => n.dataset.testid));
  await cards(page).first().getByRole('button', { name: 'Nie dla mnie', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Co Ci nie pasuje?' })).toBeVisible();
  await button(page, 'Pomiń').last().click();
  await cards(page).last().getByRole('button', { name: 'Nie dla mnie', exact: true }).click();
  await button(page, 'To nie mój styl').click();
  await expect(page.getByText('Runda 02', { exact: true })).toBeVisible();
  const nextPair = await cards(page).evaluateAll(nodes => nodes.map(n => n.dataset.testid));
  expect(nextPair.some(id => firstPair.includes(id))).toBe(false);
  await button(page, 'Profil').click();
  await page.getByRole('switch', { name: 'Pytaj o powód odrzucenia' }).uncheck();
  await button(page, 'Zestawy').click();
  await cards(page).first().getByRole('button', { name: 'Nie dla mnie', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Co Ci nie pasuje?' })).toHaveCount(0);
  await cards(page).last().getByRole('button', { name: 'Nie dla mnie', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'To wszystkie propozycje na teraz.' })).toBeVisible();
  await expect(cards(page)).toHaveCount(0);
  await expect.poll(async () => (await saved(page)).feedback.length).toBe(4);
  expect((await saved(page)).feedback.filter(f => f.reason === 'style')).toHaveLength(1);
});

test('create and edit a men’s profile, persist comparison mode, isolate feedback', async ({ page }) => {
  await start(page);
  await cards(page).first().getByRole('button', { name: 'Podoba mi się', exact: true }).click();
  await button(page, 'Profil').click();
  await button(page, 'Nowy profil').click();
  await page.getByRole('textbox', { name: 'Nazwa profilu', exact: true }).fill('Do pracy');
  await button(page, 'Męskie').click();
  await page.getByTestId('occasion-profile').getByRole('button', { name: 'Domyślna okazja profilu: Praca', exact: true }).click();
  await button(page, 'Ekonomiczny / markowy').click();
  await button(page, 'Zapisz profil').click();
  await expect(page.getByText('Zapisane opinie w tym profilu: 0', { exact: true })).toBeVisible();
  await button(page, 'Edytuj: Do pracy').click();
  await page.getByRole('textbox', { name: 'Nazwa profilu' }).fill('Aleksy – praca');
  await button(page, 'Zapisz profil').click();
  await button(page, 'Zestawy').click();
  await button(page, 'Pokaż moje zestawy').click();
  await expect(cards(page)).toHaveCount(2);
  expect(await cards(page).evaluateAll(nodes => nodes.every(n => n.dataset.testid.startsWith('outfit-m')))).toBe(true);
  await expect(cards(page).getByText('Ekonomiczny', { exact: true })).toHaveCount(1);
  await expect(cards(page).getByText('Markowy', { exact: true })).toHaveCount(1);
  await page.reload();
  await expect(button(page, 'Aleksy – praca')).toBeVisible();
  await expect(button(page, 'Ekonomiczny / markowy')).toHaveAttribute('aria-pressed', 'true');
  await button(page, 'Na co dzień').click();
  await button(page, 'Pokaż moje zestawy').click();
  expect(await cards(page).evaluateAll(nodes => nodes.every(n => n.dataset.testid.startsWith('outfit-w')))).toBe(true);
});

test('owned wardrobe pieces cost zero and hard budget gives an honest empty state', async ({ page }) => {
  await start(page, '0');
  await expect(page.getByRole('heading', { name: 'Brak zestawów na tę okazję w tym budżecie.' })).toBeVisible();
  await button(page, 'Szafa').click();
  for (const id of ['w-knit', 'w-wide-trousers']) {
    await page.getByTestId(`wardrobe-${id}`).getByRole('button', { name: 'Mam tę rzecz', exact: true }).click();
  }
  await button(page, 'Posiadane').click();
  await expect(page.getByTestId(/^wardrobe-/)).toHaveCount(3);
  await button(page, 'Zestawy').click();
  await button(page, 'Pokaż moje zestawy').click();
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByTestId('outfit-w1').getByText('0 zł', { exact: true })).toHaveCount(1);
  await button(page, 'Zobacz elementy').click();
  await expect(page.getByTestId('outfit-w1').getByText('0 zł', { exact: true })).toHaveCount(5);
  await button(page, 'Szafa').click();
  await page.getByTestId('wardrobe-w-knit').getByRole('button', { name: 'Usuń z posiadanych', exact: true }).click();
  await button(page, 'Zestawy').click();
  await button(page, 'Pokaż moje zestawy').click();
  await expect(cards(page)).toHaveCount(0);
});

test('corrupt storage is protected until a confirmed reset', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), storageKey);
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('nieczytelne');
  await expect(button(page, 'Odkryj swój styl')).toHaveCount(0);
  await button(page, 'Wyczyść dane demonstracyjne').click();
  await expect(page.getByRole('heading', { name: 'Usunąć zapisane ustawienia i opinie?' })).toBeVisible();
  await button(page, 'Tak, wyczyść').click();
  await expect(button(page, 'Odkryj swój styl')).toBeVisible();
});

test('read failure cannot overwrite edits; retry restores the saved profile', async ({ page }) => {
  await start(page);
  await button(page, 'EN').click();
  await expect.poll(async () => (await saved(page)).locale).toBe('en');
  await page.addInitScript(key => {
    const get = Storage.prototype.getItem;
    window.failRead = true;
    Storage.prototype.getItem = function (k) {
      if (k === key && window.failRead) throw new Error('Read denied for test');
      return get.call(this, k);
    };
  }, storageKey);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Nie udało się odczytać');
  await expect(button(page, 'Odkryj swój styl')).toHaveCount(0);
  await page.evaluate(() => { window.failRead = false; });
  await button(page, 'Spróbuj ponownie').click();
  await expect(button(page, 'Show my outfits')).toBeVisible();
  expect((await saved(page)).locale).toBe('en');
});

test('write failure is visible, retry preserves current work, offline keeps loaded UI usable', async ({ page, context }) => {
  await start(page);
  await page.evaluate(key => {
    const set = Storage.prototype.setItem;
    window.failWrite = true;
    Storage.prototype.setItem = function (k, value) {
      if (k === key && window.failWrite) throw new Error('Quota exceeded for test');
      return set.call(this, k, value);
    };
  }, storageKey);
  await cards(page).first().getByRole('button', { name: 'Podoba mi się', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Nie udało się zapisać');
  await page.evaluate(() => { window.failWrite = false; });
  await button(page, 'Spróbuj ponownie').click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect.poll(async () => (await saved(page)).feedback.length).toBe(1);
  await context.setOffline(true);
  await expect(page.getByText('Brak połączenia. Załadowana szafa i ustawienia nadal są dostępne.', { exact: true })).toBeVisible();
  await button(page, 'Profil').click();
  await expect(page.getByText('Zapisane opinie w tym profilu: 1', { exact: true })).toBeVisible();
  await context.setOffline(false);
});

test('responsive PL/EN layout and keyboard access', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');
  await expect(button(page, 'Polski')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(button(page, 'Polski')).toBeFocused();
  await page.screenshot({ path: info.outputPath('welcome-desktop-pl.png') });
  await button(page, 'Odkryj swój styl').click();
  await expect(cards(page)).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('outfits-desktop-pl.png') });
  for (const width of [320, 360, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page);
    const boxes = await cards(page).evaluateAll(nodes => nodes.map(n => ({ x: n.getBoundingClientRect().x, width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height })));
    expect(boxes.every(b => b.x >= 0 && b.x + b.width <= width && b.height > 350)).toBe(true);
    if (width === 320) {
      await cards(page).first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath('outfits-small-pl.png') });
    }
    await button(page, width >= 800 ? 'English' : 'EN').click();
    await noOverflow(page);
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  await button(page, 'Wardrobe').click();
  await page.screenshot({ path: info.outputPath('wardrobe-mobile-en.png') });
});
