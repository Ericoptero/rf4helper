import { expect, test, type Page } from '@playwright/test';

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
    await expect(page.getByRole('heading', { name: /items database/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible();

    await page.goto('/monsters');
    await expect(page.getByRole('heading', { name: /monster/i })).toBeVisible();

    await page.goto('/crafter');
    await expect(page.getByRole('heading', { name: /crafter/i })).toBeVisible();
  });
});

test.describe('app visual baselines', () => {
  test('dashboard desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');

    await preparePage(page, 'light');
    await expect(page).toHaveScreenshot('dashboard-desktop-light.png', { fullPage: true });
  });

  test('dashboard mobile dark @visual', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile baseline is generated only for mobile projects.');

    await preparePage(page, 'dark');
    await expect(page).toHaveScreenshot('dashboard-mobile-dark.png', { fullPage: true });
  });

  test('items detail drawer desktop @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');

    await preparePage(page, 'light');
    await page.goto('/items');
    await expect(page.getByRole('heading', { name: /items database/i })).toBeVisible();
    await page.getByText('Bread', { exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('items-detail-desktop.png', { fullPage: true });
  });

  test('crafter advanced desktop dark @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');

    await preparePage(page, 'dark');
    await page.goto('/crafter?view=advanced');
    await expect(page.getByRole('heading', { name: /crafter/i })).toBeVisible();
    await expect(page).toHaveScreenshot('crafter-advanced-dark.png', { fullPage: true });
  });

  test('characters loaded desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');

    await preparePage(page, 'light');
    await page.goto('/characters');
    await expect(page.getByRole('heading', { name: /^characters$/i })).toBeVisible();
    await expect(page).toHaveScreenshot('characters-loaded-desktop-light.png', { fullPage: true });
  });

  test('characters drawer desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');

    await preparePage(page, 'light');
    await page.goto('/characters');
    await expect(page.getByRole('heading', { name: /^characters$/i })).toBeVisible();
    await page.getByText('Forte', { exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('characters-drawer-desktop-light.png', { fullPage: true });
  });

  test('monsters loaded desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');

    await preparePage(page, 'light');
    await page.goto('/monsters');
    await expect(page.getByRole('heading', { name: /monsters compendium/i })).toBeVisible();
    await expect(page).toHaveScreenshot('monsters-loaded-desktop-light.png', { fullPage: true });
  });

  test('monsters drawer desktop light @visual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop baseline is generated only for desktop projects.');

    await preparePage(page, 'light');
    await page.goto('/monsters');
    await expect(page.getByRole('heading', { name: /monsters compendium/i })).toBeVisible();
    await page.getByText('Octopirate', { exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('monsters-drawer-desktop-light.png', { fullPage: true });
  });
});
