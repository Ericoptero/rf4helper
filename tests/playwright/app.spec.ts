import { expect, test, type Locator, type Page } from '@playwright/test';

async function preparePage(page: Page, theme: 'light' | 'dark' = 'light') {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem('rf4-theme', selectedTheme);
  }, theme);

  await page.goto('/');
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

async function waitForLoadedImages(locator: Locator, minimumLoadedImages: number) {
  await expect
    .poll(
      async () =>
        locator.locator('img').evaluateAll((images) =>
          images.filter((image) => image instanceof HTMLImageElement && image.complete).length,
        ),
      { timeout: 10_000 },
    )
    .toBeGreaterThanOrEqual(minimumLoadedImages);
}

test.describe('app smoke', () => {
  test('loads the dashboard and entry points @smoke', async ({ page }) => {
    await preparePage(page);

    await expect(page.getByRole('heading', { name: /rune factory 4 helper/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^items$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^monsters$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^characters$/i })).toBeVisible();
  });

  test('loads catalog and crafter routes @smoke', async ({ page }) => {
    await preparePage(page);

    await page.goto('/items');
    await expect(page.getByRole('heading', { name: /items database/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible();

    await page.goto('/monsters');
    await expect(page.getByRole('heading', { name: /monster/i })).toBeVisible();

    await page.goto('/crafter');
    await expect(page.getByRole('heading', { name: /interactive crafter/i })).toBeVisible({ timeout: 30_000 });
  });

  test('keeps the items toolbar controls aligned on desktop @smoke', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Alignment check is desktop-specific.');

    await preparePage(page);
    await page.goto('/items');
    await expect(page.getByRole('heading', { name: /items database/i })).toBeVisible({ timeout: 30_000 });

    const search = page.getByRole('textbox', { name: /search/i });
    const sort = page.getByRole('combobox', { name: /sort/i });
    const moreFilters = page.getByRole('button', { name: /more filters/i });

    const [searchBox, sortBox, moreFiltersBox] = await Promise.all([
      search.boundingBox(),
      sort.boundingBox(),
      moreFilters.boundingBox(),
    ]);

    expect(searchBox).not.toBeNull();
    expect(sortBox).not.toBeNull();
    expect(moreFiltersBox).not.toBeNull();
    expect(Math.abs((searchBox?.height ?? 0) - (sortBox?.height ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((sortBox?.height ?? 0) - (moreFiltersBox?.height ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((sortBox?.y ?? 0) - (moreFiltersBox?.y ?? 0))).toBeLessThanOrEqual(1);
  });

  test('reveals more filtered item results while scrolling the catalog @smoke', async ({ page }) => {
    await preparePage(page);
    await page.goto('/items');
    await expect(page.getByRole('heading', { name: /items database/i })).toBeVisible({ timeout: 30_000 });

    const search = page.getByRole('textbox', { name: /search/i });
    await search.fill('a');

    await expect(page.getByText('Apple Tree Seeds', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Aquamarine Rod', { exact: true })).not.toBeVisible();

    const sentinel = page.getByTestId('catalog-infinite-scroll-sentinel');
    await expect(sentinel).toBeAttached({ timeout: 30_000 });
    await sentinel.scrollIntoViewIfNeeded();

    await expect(page.getByText('Aquamarine Rod', { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test('keeps crafter selector item images on the public images path @smoke', async ({ page }) => {
    await preparePage(page);
    await page.goto('/crafter?view=advanced');
    await expect(page.getByRole('heading', { name: /interactive crafter/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('tab', { name: /weapon/i }).click();
    await page.getByRole('button', { name: /^base$/i }).click();
    const dialog = page.getByRole('dialog', { name: /select base/i });
    await expect(dialog).toBeVisible({ timeout: 30_000 });

    await dialog.getByRole('searchbox', { name: /search items/i }).fill('Broad');
    await expect(dialog.getByAltText(/broadsword icon/i).first()).toHaveAttribute('src', '/images/items/broadsword.png');
  });
});

test.describe('app visual baselines', () => {
  test('dashboard desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'light');
    await expect(page).toHaveScreenshot('dashboard-desktop-light.png', { fullPage: true, timeout: 30_000 });
  });

  test('dashboard mobile dark @visual', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile baseline is generated only for mobile projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'dark');
    await expect(page).toHaveScreenshot('dashboard-mobile-dark.png', { fullPage: true, timeout: 30_000 });
  });

  test('items detail drawer desktop @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'light');
    await page.goto('/items');
    await expect(page.getByRole('heading', { name: /items database/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Bread', { exact: true }).first()).toBeVisible({ timeout: 60_000 });
    await page.getByText('Bread', { exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('items-detail-desktop.png', { fullPage: true, timeout: 60_000 });
  });

  test('crafter advanced desktop dark @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'dark');
    await page.goto('/crafter?view=advanced');
    await expect(page.getByRole('heading', { name: /interactive crafter/i })).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveScreenshot('crafter-advanced-dark.png', { fullPage: true, timeout: 30_000 });
  });

  test('crafter selector footer desktop dark @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'dark');
    await page.goto('/crafter?view=advanced');
    await expect(page.getByRole('heading', { name: /interactive crafter/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('tab', { name: /weapon/i }).click();
    await page.getByRole('button', { name: /^base$/i }).click();
    const dialog = page.getByRole('dialog', { name: /select base/i });
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await dialog.getByRole('searchbox', { name: /search items/i }).fill('Heav');
    await dialog.getByRole('button', { name: /heaven asunder/i }).click();

    const applyButton = dialog.getByRole('button', { name: /^apply$/i });
    await expect(applyButton).toBeVisible({ timeout: 30_000 });
    const applyBox = await applyButton.boundingBox();
    expect(applyBox).not.toBeNull();
    expect((applyBox?.y ?? 0) + (applyBox?.height ?? 0)).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);

    await expect(dialog).toHaveScreenshot('crafter-selector-footer-dark.png', { timeout: 30_000 });
  });

  test('crafter selector sort and rarity placeholder desktop dark @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'dark');
    await page.goto('/crafter?view=advanced');
    await expect(page.getByRole('heading', { name: /interactive crafter/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('tab', { name: /weapon/i }).click();
    await page.getByRole('button', { name: /^base$/i }).click();
    await expect(page.getByRole('dialog', { name: /select base/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('searchbox', { name: /search items/i }).fill('Broad');
    await page.getByRole('button', { name: /broadsword/i }).click();
    await page.getByRole('button', { name: /^apply$/i }).click();

    await page.getByRole('button', { name: /recipe 6/i }).click();
    const dialog = page.getByRole('dialog', { name: /select recipe 6/i });
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByRole('combobox', { name: /sort items/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /rarity \+15/i })).toBeVisible();
    await expect(dialog.getByTestId('crafter-selector-infinite-scroll-sentinel')).toBeAttached();
    await waitForLoadedImages(dialog, 6);

    await expect(dialog).toHaveScreenshot('crafter-selector-sort-dark.png', { timeout: 30_000 });
  });

  test('crafter slot tooltip desktop dark @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'dark');
    await page.goto('/crafter?view=advanced');
    await expect(page.getByRole('heading', { name: /interactive crafter/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('tab', { name: /weapon/i }).click();
    await page.getByRole('button', { name: /^base$/i }).click();
    await expect(page.getByRole('dialog', { name: /select base/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('searchbox', { name: /search items/i }).fill('Broad');
    await page.getByRole('button', { name: /broadsword/i }).click();
    await page.getByRole('button', { name: /^apply$/i }).click();

    const slotButton = page.getByRole('button', { name: /broadsword/i }).first();
    await slotButton.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible({ timeout: 30_000 });

    await expect(tooltip).toHaveScreenshot('crafter-slot-tooltip-dark.png', { timeout: 30_000 });
  });

  test('crafter weapon filled desktop dark @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'dark');
    await page.goto('/crafter?view=advanced');
    await expect(page.getByRole('heading', { name: /interactive crafter/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('tab', { name: /weapon/i }).click();
    await page.getByRole('button', { name: /^base$/i }).click();
    await expect(page.getByRole('dialog', { name: /select base/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('searchbox', { name: /search items/i }).fill('Broad');
    await page.getByRole('button', { name: /broadsword/i }).click();
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByRole('button', { name: /broadsword/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /upgrade 1/i }).click();
    await expect(page.getByRole('dialog', { name: /select upgrade 1/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('searchbox', { name: /search items/i }).fill('Object');
    await page.getByRole('button', { name: /object x/i }).click();
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByRole('button', { name: /object x/i })).toBeVisible({ timeout: 30_000 });

    await expect(page).toHaveScreenshot('crafter-weapon-filled-dark.png', { fullPage: true, timeout: 30_000 });
  });

  test('characters loaded desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'light');
    await page.goto('/characters');
    await expect(page.getByRole('heading', { name: /^characters$/i })).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveScreenshot('characters-loaded-desktop-light.png', {
      fullPage: true,
      timeout: 30_000,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('characters drawer desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'light');
    await page.goto('/characters');
    await expect(page.getByRole('heading', { name: /^characters$/i })).toBeVisible({ timeout: 30_000 });
    await page.getByText('Forte', { exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('characters-drawer-desktop-light.png', {
      fullPage: true,
      timeout: 30_000,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('monsters loaded desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'light');
    await page.goto('/monsters');
    await expect(page.getByRole('heading', { name: /monsters compendium/i })).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveScreenshot('monsters-loaded-desktop-light.png', { fullPage: true, timeout: 30_000 });
  });

  test('monsters drawer desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');
    test.setTimeout(90_000);

    await preparePage(page, 'light');
    await page.goto('/monsters');
    await expect(page.getByRole('heading', { name: /monsters compendium/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('textbox', { name: /search/i }).fill('Octo');
    await page.getByText('Octopirate', { exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('monsters-drawer-desktop-light.png', { fullPage: true, timeout: 30_000 });
  });
});
