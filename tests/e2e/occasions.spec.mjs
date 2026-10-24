import { test, expect } from '@playwright/test';

const key = 'ubranka:p2:v1';
const button = (page, name) => page.getByRole('button', { name, exact: true });
const cards = page => page.getByTestId(/^outfit-/);
const state = page => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
const option = (page, name, scope = 'round', english = false) => page.getByTestId(`occasion-${scope}`).getByRole('button', {
  name: `${scope === 'round' ? (english ? 'Occasion for this round' : 'Okazja na tę rundę') : scope === 'profile' ? (english ? 'Default occasion for this profile' : 'Domyślna okazja profilu') : 'Na jaką okazję?'}: ${name}`,
  exact: true,
});
const ids = page => cards(page).evaluateAll(nodes => nodes.map(node => node.dataset.testid));
async function open(page) {
  await page.goto('/');
  await button(page, 'Odkryj swój styl').click();
  await expect(cards(page)).toHaveCount(2);
}
test.beforeEach(async ({ page }) => { page.on('pageerror', error => { throw error; }); });

test('wedding round is separate from taste profile and survives mode, budget and language changes', async ({ page }, info) => {
  await open(page);
  await option(page, 'Wesele (gość)').click();
  await expect(cards(page)).toHaveCount(0);
  await button(page, 'Pokaż moje zestawy').click();
  expect((await ids(page)).sort()).toEqual(['outfit-w5', 'outfit-w6']);
  await button(page, 'Ekonomiczny / markowy').click();
  await expect(option(page, 'Wesele (gość)')).toHaveAttribute('aria-pressed', 'true');
  await button(page, 'Pokaż moje zestawy').click();
  await expect(cards(page).getByText('Ekonomiczny', { exact: true })).toHaveCount(1);
  await expect(cards(page).getByText('Markowy', { exact: true })).toHaveCount(1);
  await cards(page).first().getByRole('button', { name: 'Podoba mi się', exact: true }).click();
  await button(page, '500 zł').click();
  await page.getByRole('textbox', { name: 'Budżet zestawu · PLN', exact: true }).fill('350');
  await button(page, 'Zapisz profil').click();
  await expect(option(page, 'Wesele (gość)')).toHaveAttribute('aria-pressed', 'true');
  await button(page, 'Pokaż moje zestawy').click();
  expect(await ids(page)).toEqual(['outfit-w5']);
  await expect(cards(page).getByText('302 zł', { exact: true })).toBeVisible();
  await button(page, 'EN').click();
  await expect(option(page, 'Wedding guest', 'round', true)).toHaveAttribute('aria-pressed', 'true');
  expect(await ids(page)).toEqual(['outfit-w5']);
  const snapshot = await state(page);
  expect(snapshot.profiles.find(p => p.id === 'everyday')).toMatchObject({ name: 'Na co dzień', occasion: 'casual', budget: 350, defaultMode: 'value' });
  expect(snapshot.feedback).toHaveLength(1);
  await page.screenshot({ path: info.outputPath('wedding-mobile-en.png') });
  await page.reload();
  await expect(option(page, 'Everyday', 'round', true)).toHaveAttribute('aria-pressed', 'true');
  await expect(button(page, 'Show my outfits')).toBeVisible();
  expect((await state(page)).feedback).toEqual(snapshot.feedback);
});

test('men’s wedding onboarding, no unrelated fallback, and fresh session for another occasion', async ({ page }, info) => {
  await page.goto('/');
  await button(page, 'Męskie').click();
  await option(page, 'Wesele (gość)', 'onboarding').click();
  await button(page, 'Odkryj swój styl').click();
  expect((await ids(page)).sort()).toEqual(['outfit-m5', 'outfit-m6']);
  await expect(cards(page).getByText('434 zł', { exact: true })).toBeVisible();
  await expect(cards(page).getByText('490 zł', { exact: true })).toBeVisible();
  await expect(button(page, 'Na co dzień')).toBeVisible();
  await cards(page).first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('wedding-men-mobile-pl.png') });
  await button(page, 'Profil').click();
  await page.getByRole('switch', { name: 'Pytaj o powód odrzucenia', exact: true }).uncheck();
  await button(page, 'Zestawy').click();
  await cards(page).first().getByRole('button', { name: 'Nie dla mnie', exact: true }).click();
  await cards(page).last().getByRole('button', { name: 'Nie dla mnie', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'To wszystkie propozycje na teraz.', exact: true })).toBeVisible();
  await expect(cards(page)).toHaveCount(0);
  await option(page, 'Praca').click();
  await button(page, 'Pokaż moje zestawy').click();
  await expect(cards(page)).toHaveCount(2);
  expect((await ids(page)).every(id => ['outfit-m2', 'outfit-m4', 'outfit-m5', 'outfit-m6'].includes(id))).toBe(true);
  await expect(page.getByText('Runda 01', { exact: true })).toBeVisible();
  await expect(cards(page).first().getByRole('button', { name: 'Podoba mi się', exact: true })).toBeEnabled();
});

test('profile default occasion persists and switching profiles restores their defaults', async ({ page }) => {
  await open(page);
  await cards(page).first().getByRole('button', { name: 'Podoba mi się', exact: true }).click();
  await button(page, 'Profil').click();
  await button(page, 'Edytuj: Na co dzień').click();
  await option(page, 'Wesele (gość)', 'profile').click();
  await button(page, 'Zapisz profil').click();
  await button(page, 'Zestawy').click();
  await expect(option(page, 'Wesele (gość)')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(option(page, 'Wesele (gość)')).toHaveAttribute('aria-pressed', 'true');
  await button(page, 'Pokaż moje zestawy').click();
  expect((await ids(page)).sort()).toEqual(['outfit-w5', 'outfit-w6']);
  await button(page, 'Elegancko').click();
  await expect(option(page, 'Elegancko')).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(0);
  await button(page, 'Na co dzień').click();
  await expect(option(page, 'Wesele (gość)')).toHaveAttribute('aria-pressed', 'true');
  expect((await state(page)).feedback).toHaveLength(1);
});

test('a real P2 version 1 payload migrates in place without losing user choices', async ({ page }) => {
  // Frozen schema from P2; never derive a legacy fixture from the new model.
  const legacy = {
    version: 1, locale: 'en', onboarded: true, activeProfileId: 'custom-style', askReason: false,
    profiles: [
      { id: 'everyday', name: 'Weekend', audience: 'women', occasion: 'casual', budget: 350, priority: 'comfort', defaultMode: 'best' },
      { id: 'custom-style', name: 'My office style', audience: 'men', occasion: 'elegant', budget: 480.5, priority: 'quality', defaultMode: 'value' },
    ],
    ownedItemIds: ['w-knit', 'm-black-derby', 'w-sneakers'],
    feedback: [
      { profileId: 'everyday', outfitId: 'w3', vote: 'like' },
      { profileId: 'custom-style', outfitId: 'm4', vote: 'dislike', reason: 'color' },
    ],
  };
  await page.addInitScript(({ key, legacy }) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(legacy));
  }, { key, legacy });
  await page.goto('/');
  await expect(button(page, 'My office style')).toBeVisible();
  await expect(option(page, 'Smart', 'round', true)).toHaveAttribute('aria-pressed', 'true');
  await expect(button(page, 'Budget / premium')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => state(page)).toEqual({ ...legacy, version: 2 });
  await option(page, 'Wedding guest', 'round', true).click();
  await button(page, 'Show my outfits').click();
  expect(await ids(page)).toEqual(['outfit-m5']);
  await cards(page).first().getByRole('button', { name: 'I like this', exact: true }).click();
  const updated = await state(page);
  expect(updated.feedback).toHaveLength(3);
  expect(updated.feedback.slice(0, 2)).toEqual(legacy.feedback);
  await page.reload();
  await expect(option(page, 'Smart', 'round', true)).toHaveAttribute('aria-pressed', 'true');
  expect(await state(page)).toEqual(updated);
});

test('work, date and party constrain choices; changing occasions clears old votes and seen outfits', async ({ page }, info) => {
  await open(page);
  for (const [occasion, candidates] of [
    ['Praca', ['outfit-w2', 'outfit-w4']],
    ['Randka', ['outfit-w1', 'outfit-w2', 'outfit-w3', 'outfit-w4', 'outfit-w5', 'outfit-w6']],
    ['Impreza', ['outfit-w2', 'outfit-w3', 'outfit-w4', 'outfit-w5', 'outfit-w6']],
  ]) {
    await option(page, occasion).click();
    await expect(cards(page)).toHaveCount(0);
    await button(page, 'Pokaż moje zestawy').click();
    await expect(cards(page)).toHaveCount(2);
    expect((await ids(page)).every(id => candidates.includes(id))).toBe(true);
    await expect(page.getByText('Runda 01', { exact: true })).toBeVisible();
  }
  await option(page, 'Na co dzień').click();
  await button(page, 'Ekonomiczny / markowy').click();
  await button(page, 'Pokaż moje zestawy').click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).getByText('Ekonomiczny', { exact: true })).toHaveCount(1);
  await option(page, 'Wesele (gość)').click();
  await button(page, '500 zł').click();
  await page.getByRole('textbox', { name: 'Budżet zestawu · PLN', exact: true }).fill('301');
  await button(page, 'Zapisz profil').click();
  await button(page, 'Pokaż moje zestawy').click();
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Brak zestawów na tę okazję w tym budżecie.', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('wedding-budget-empty-pl.png') });
});
