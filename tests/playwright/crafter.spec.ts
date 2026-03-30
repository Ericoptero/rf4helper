import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';
import LZString from 'lz-string';

import { calculateCrafterBuild } from '../../src/lib/crafter';
import { buildCrafterData } from '../../src/lib/crafterData';
import { itemMatchesCrafterSlot } from '../../src/lib/crafterData';
import { CrafterConfigSchema, type Item } from '../../src/lib/schemas';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(dirname, '../../data');
const CRAFTER_BUILD_STORAGE_KEY = 'rf4-helper:crafter-build:v2';
const PERCENT_STAT_KEYS = new Set(['crit', 'knock', 'stun']);
const STAT_LABELS: Record<string, string> = {
  atk: 'ATK',
  matk: 'M.ATK',
  def: 'DEF',
  mdef: 'M.DEF',
  str: 'STR',
  int: 'INT',
  vit: 'VIT',
  diz: 'Diz',
  crit: 'Crit',
  knock: 'Knock',
  stun: 'Stun',
};

const items = JSON.parse(readFileSync(path.join(dataDir, 'items.json'), 'utf8')) as Record<string, Item>;
const crafterConfig = CrafterConfigSchema.parse(JSON.parse(readFileSync(path.join(dataDir, 'crafter.json'), 'utf8')));
const crafterData = buildCrafterData(items, crafterConfig);
function requireDefined<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

const workbookSample = requireDefined(
  crafterData.fixtures.workbookSample,
  'Expected crafter workbookSample fixture to exist',
);
const workbookExpectedResult = calculateCrafterBuild(structuredClone(workbookSample.build), items, crafterData);

const workbookExpectedAttackType = requireDefined(
  workbookExpectedResult.attackSummary.attackType,
  'Expected workbook sample attackType result value to exist',
);
const workbookExpectedDamageType = requireDefined(
  workbookExpectedResult.attackSummary.damageType,
  'Expected workbook sample damageType result value to exist',
);
const workbookExpectedElement = requireDefined(
  workbookExpectedResult.attackSummary.element,
  'Expected workbook sample element result value to exist',
);
const workbookExpectedResistances = {
  fire: workbookExpectedResult.resistances.fire ?? 0,
  light: workbookExpectedResult.resistances.light ?? 0,
  dark: workbookExpectedResult.resistances.dark ?? 0,
  no: workbookExpectedResult.resistances.no ?? 0,
  seal: workbookExpectedResult.resistances.seal ?? 0,
  fnt: workbookExpectedResult.resistances.fnt ?? 0,
};

const weaponSlotConfig = crafterData.slotConfigs.find((slotConfig) => slotConfig.key === 'weapon');

if (!weaponSlotConfig) {
  throw new Error('Expected weapon slot config to exist');
}

const weaponBaseOptions = Object.values(items)
  .filter((item) => itemMatchesCrafterSlot(item, weaponSlotConfig))
  .sort((left, right) => left.name.localeCompare(right.name));
const baseOptionBeyondFirstBatch = weaponBaseOptions[24]?.name;

if (!baseOptionBeyondFirstBatch) {
  throw new Error('Expected at least 25 weapon base options for infinite scroll coverage');
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatFinalStatValue(key: string, value: number) {
  const formatted = PERCENT_STAT_KEYS.has(key) ? `${formatInteger(value * 100)}%` : formatInteger(value);
  return `${value > 0 ? '+' : ''}${formatted}`;
}

function formatResistanceValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatInteger(value * 100)}%`;
}

async function prepareCrafterPage(
  page: Page,
  {
    route = '/crafter',
    theme = 'light',
    storedBuild,
  }: {
    route?: string;
    theme?: 'light' | 'dark';
    storedBuild?: string;
  } = {},
) {
  await page.addInitScript(
    ([selectedTheme, build]) => {
      window.localStorage.setItem('rf4-theme', selectedTheme);
      if (build) {
        window.localStorage.setItem('rf4-helper:crafter-build:v2', build);
      } else {
        window.localStorage.removeItem('rf4-helper:crafter-build:v2');
      }
    },
    [theme, storedBuild] as const,
  );

  await page.goto(route);
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
  await expect(page.getByRole('heading', { name: /interactive crafter/i })).toBeVisible({ timeout: 30_000 });
}

async function waitForSerializedBuildInUrl(page: Page) {
  await expect
    .poll(() => new URL(page.url()).searchParams.get('build'), { timeout: 30_000 })
    .not.toBeNull();

  return new URL(page.url()).searchParams.get('build')!;
}

async function readStoredBuild(page: Page) {
  return page.evaluate((key) => window.localStorage.getItem(key), CRAFTER_BUILD_STORAGE_KEY);
}

function getWeaponUpgradeItemId(serializedBuild: string, index: number) {
  const decompressed = LZString.decompressFromEncodedURIComponent(serializedBuild);

  if (!decompressed) {
    try {
      const parsed = JSON.parse(serializedBuild) as {
        weapon?: { upgrades?: Array<{ itemId?: string }> };
      };
      return parsed.weapon?.upgrades?.[index]?.itemId;
    } catch {
      return undefined;
    }
  }

  try {
    const parsed = JSON.parse(decompressed) as {
      weapon?: { u?: Record<string, { i?: string }> };
    };
    return parsed.weapon?.u?.[String(index)]?.i;
  } catch {
    return undefined;
  }
}

function createWorkbookBuildMissingLastWeaponUpgrade() {
  const build = structuredClone(workbookSample.build);
  build.weapon.upgrades[8] = { itemId: undefined, level: 1 };
  return JSON.stringify(build);
}

async function chooseItemInOpenDialog(page: Page, query: string, itemName: string) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox', { name: /search items/i }).fill(query);
  const itemButton = dialog.getByRole('button', { name: new RegExp(escapeRegex(itemName), 'i') });
  await expect(itemButton).toBeVisible();
  await itemButton.click();
  await dialog.getByRole('button', { name: /^apply$/i }).click();
}

test.describe('crafter smoke regressions', () => {
  test('recipe slots preserve category/fixed behavior and free empty slots @smoke', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Crafter regression flow is covered on desktop only.');

    await prepareCrafterPage(page);

    await page.getByRole('tab', { name: /weapon/i }).click();
    await page.getByRole('button', { name: /^base$/i }).click();

    const baseDialog = page.getByRole('dialog', { name: /select base/i });
    await expect(baseDialog).toBeVisible({ timeout: 30_000 });

    const overflowBaseOption = baseDialog.getByRole('button', {
      name: new RegExp(escapeRegex(baseOptionBeyondFirstBatch), 'i'),
    });
    await expect(overflowBaseOption).toHaveCount(0);

    const baseSentinel = baseDialog.getByTestId('crafter-selector-infinite-scroll-sentinel');
    await expect(baseSentinel).toBeAttached();
    await baseSentinel.evaluate((element) => {
      const container = element.parentElement;
      if (container instanceof HTMLElement) {
        container.scrollTop = container.scrollHeight;
      }
    });
    await expect(overflowBaseOption).toBeVisible({ timeout: 10_000 });

    await chooseItemInOpenDialog(page, 'Broad', 'Broadsword');

    await page.getByRole('button', { name: /minerals/i }).click();
    const categoryDialog = page.getByRole('dialog', { name: /select recipe 1/i });
    await expect(categoryDialog.getByText(/choose material/i)).toBeVisible();
    await expect(categoryDialog.getByText(/this recipe slot accepts any item from the minerals group/i)).toBeVisible();
    await expect(categoryDialog.getByRole('button', { name: /iron/i })).toBeVisible();
    await expect(categoryDialog.getByRole('button', { name: /silver/i })).toBeVisible();
    await expect(categoryDialog.getByRole('button', { name: /firewyrm scale/i })).toHaveCount(0);
    await categoryDialog.getByRole('button', { name: /cancel/i }).click();

    await page.getByRole('button', { name: /recipe 6/i }).click();
    const freeDialog = page.getByRole('dialog', { name: /select recipe 6/i });
    await expect(freeDialog).toBeVisible();
    await expect(freeDialog.getByText(/choose material/i)).toHaveCount(0);
    await expect(freeDialog.getByText(/level only/i)).toHaveCount(0);
    await expect(freeDialog.getByRole('button', { name: /clear slot/i })).toBeVisible();
    await expect(freeDialog.getByRole('button', { name: /rarity \+15/i })).toBeVisible();

    await chooseItemInOpenDialog(page, 'Object X', 'Object X');

    await expect(page.getByRole('button', { name: /object x/i }).first()).toBeVisible();
    const resumeCard = page.locator('[data-slot="card"]').filter({ hasText: 'Resume' }).first();
    await expect(resumeCard.getByText(/^Object X$/i)).toBeVisible();
  });

  test('workbook sample reaches canonical final stats after final UI edit @smoke', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Crafter workbook regression is covered on desktop only.');

    await prepareCrafterPage(page, {
      storedBuild: createWorkbookBuildMissingLastWeaponUpgrade(),
    });

    const initialSerializedBuild = await waitForSerializedBuildInUrl(page);
    const initialStoredBuild = await readStoredBuild(page);

    expect(initialStoredBuild).toBe(initialSerializedBuild);
    expect(getWeaponUpgradeItemId(initialSerializedBuild, 8)).toBeUndefined();

    await page.getByRole('tab', { name: /weapon/i }).click();
    await page.getByRole('button', { name: /upgrade 9/i }).click();
    await chooseItemInOpenDialog(page, 'Holy', 'Holy Spore');

    await expect(page.getByRole('button', { name: /holy spore/i })).toBeVisible();
    const resumeCard = page.locator('[data-slot="card"]').filter({ hasText: 'Resume' }).first();
    await expect(resumeCard.getByText(/\+9: Holy Spore/i)).toBeVisible();

    await expect
      .poll(() => new URL(page.url()).searchParams.get('build'), { timeout: 30_000 })
      .not.toBe(initialSerializedBuild);

    const updatedBuildParam = new URL(page.url()).searchParams.get('build');
    const updatedStoredBuild = await readStoredBuild(page);

    expect(updatedBuildParam).toBeTruthy();
    expect(updatedStoredBuild).toBe(updatedBuildParam);
    expect(getWeaponUpgradeItemId(updatedBuildParam!, 8)).toBe('item-holy-spore');

    await page.getByRole('tab', { name: /dashboard/i }).click();

    const attackTypeCard = page.getByText(/^Attack Type$/i).locator('..');
    const damageTypeCard = page.getByText(/^Damage Type$/i).locator('..');
    const elementCard = page.getByText(/^Element$/i).locator('..');
    await expect(attackTypeCard).toContainText(workbookExpectedAttackType);
    await expect(damageTypeCard).toContainText(workbookExpectedDamageType);
    await expect(elementCard).toContainText(workbookExpectedElement);

    const finalStatsCard = page.locator('[data-slot="card"]').filter({ hasText: 'Final Stats' }).first();
    for (const [key, value] of Object.entries(workbookExpectedResult.totalStats).filter(([key]) => key in STAT_LABELS)) {
      if (value === 0) continue;
      const label = STAT_LABELS[key] ?? key;
      const row = finalStatsCard.getByText(new RegExp(`^${escapeRegex(label)}$`)).locator('..');
      await expect(row).toContainText(formatFinalStatValue(key, value));
    }

    await expect(
      finalStatsCard.getByText(new RegExp(`^Fire: ${escapeRegex(formatResistanceValue(workbookExpectedResistances.fire))}$`, 'i')),
    ).toBeVisible();
    await expect(
      finalStatsCard.getByText(new RegExp(`^Light: ${escapeRegex(formatResistanceValue(workbookExpectedResistances.light))}$`, 'i')),
    ).toBeVisible();
    await expect(
      finalStatsCard.getByText(new RegExp(`^Dark: ${escapeRegex(formatResistanceValue(workbookExpectedResistances.dark))}$`, 'i')),
    ).toBeVisible();
    await expect(
      finalStatsCard.getByText(new RegExp(`^No: ${escapeRegex(formatResistanceValue(workbookExpectedResistances.no))}$`, 'i')),
    ).toBeVisible();
    await expect(
      finalStatsCard.getByText(new RegExp(`^Seal: ${escapeRegex(formatResistanceValue(workbookExpectedResistances.seal))}$`, 'i')),
    ).toBeVisible();
    await expect(
      finalStatsCard.getByText(new RegExp(`^Faint: ${escapeRegex(formatResistanceValue(workbookExpectedResistances.fnt))}$`, 'i')),
    ).toBeVisible();

    for (const effectName of [...workbookExpectedResult.allEffects].sort()) {
      await expect(finalStatsCard.getByText(new RegExp(`^${escapeRegex(effectName)}$`))).toBeVisible();
    }
  });
});
