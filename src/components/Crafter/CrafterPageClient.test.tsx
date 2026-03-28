import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CRAFTER_BUILD_STORAGE_KEY, CrafterPageClient } from './CrafterPageClient';
import { createDefaultCrafterBuild, deserializeCrafterBuild, serializeCrafterBuild } from '@/lib/crafter';
import type { CrafterData, Item } from '@/lib/schemas';

const replace = vi.fn();
let mockSavedBuild = 'next-build';

vi.mock('next/navigation', () => ({
  usePathname: () => '/crafter',
  useRouter: () => ({
    replace,
  }),
}));

vi.mock('@/components/Crafter/CrafterView', () => ({
  CrafterView: ({
    serializedBuild,
    onSerializedBuildChange,
  }: {
    serializedBuild?: string;
    onSerializedBuildChange: (build: string) => void;
  }) => (
    <div>
      <output data-testid="serialized-build">{serializedBuild ?? ''}</output>
      <button type="button" onClick={() => onSerializedBuildChange(mockSavedBuild)}>
        save build
      </button>
      <button type="button" onClick={() => onSerializedBuildChange('')}>
        clear build
      </button>
    </div>
  ),
}));

const items = {} as Record<string, Item>;
const crafterData = {
  schemaVersion: 2,
  slotConfigs: [
    {
      key: 'weapon',
      label: 'Weapon',
      stationType: 'Forging',
      stations: ['Short Sword'],
      supportsAppearance: false,
      supportsBaseSelection: true,
      recipeSlots: 6,
      inheritSlots: 3,
      upgradeSlots: 9,
      carrierId: null,
      levelBonusTargets: ['atk', 'matk'],
      rarityBonusTarget: 'weapon',
    },
    {
      key: 'armor',
      label: 'Armor',
      stationType: 'Crafting',
      stations: ['Armor'],
      supportsAppearance: false,
      supportsBaseSelection: true,
      recipeSlots: 6,
      inheritSlots: 3,
      upgradeSlots: 9,
      carrierId: 'item-shirt',
      levelBonusTargets: ['def', 'mdef'],
      rarityBonusTarget: 'def',
    },
    {
      key: 'headgear',
      label: 'Headgear',
      stationType: 'Crafting',
      stations: ['Headgear'],
      supportsAppearance: false,
      supportsBaseSelection: true,
      recipeSlots: 6,
      inheritSlots: 3,
      upgradeSlots: 9,
      carrierId: 'item-headband',
      levelBonusTargets: ['def', 'mdef'],
      rarityBonusTarget: 'def',
    },
    {
      key: 'shield',
      label: 'Shield',
      stationType: 'Crafting',
      stations: ['Shield'],
      supportsAppearance: false,
      supportsBaseSelection: true,
      recipeSlots: 6,
      inheritSlots: 3,
      upgradeSlots: 9,
      carrierId: 'item-cheap-shield',
      levelBonusTargets: ['def', 'mdef'],
      rarityBonusTarget: 'def',
    },
    {
      key: 'accessory',
      label: 'Accessory',
      stationType: 'Crafting',
      stations: ['Accessory'],
      supportsAppearance: false,
      supportsBaseSelection: true,
      recipeSlots: 6,
      inheritSlots: 3,
      upgradeSlots: 9,
      carrierId: 'item-cheap-bracelet',
      levelBonusTargets: ['def', 'mdef'],
      rarityBonusTarget: 'mdef',
    },
    {
      key: 'shoes',
      label: 'Shoes',
      stationType: 'Crafting',
      stations: ['Shoes'],
      supportsAppearance: false,
      supportsBaseSelection: true,
      recipeSlots: 6,
      inheritSlots: 3,
      upgradeSlots: 9,
      carrierId: 'item-leather-boots',
      levelBonusTargets: ['def', 'mdef'],
      rarityBonusTarget: 'def',
    },
  ],
  defaults: {
    weapon: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    armor: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    headgear: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    shield: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    accessory: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    shoes: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    food: { baseId: undefined, recipe: [] },
  },
  specialMaterialRules: [],
  weaponClassByStation: { 'Short Sword': 'Short Sword' },
  shieldCoverageByWeaponClass: { 'Short Sword': 'full' },
  starterWeaponByClass: { 'Short Sword': 'item-broadsword' },
  chargeAttackByWeaponClass: { 'Short Sword': 'Rush Slash' },
  staffChargeByCrystalId: {},
  levelBonusTiers: [],
  rarityBonusTiers: [],
  foodOverrides: {},
  recipes: {
    equipment: {
      weapon: {},
      armor: {},
      headgear: {},
      shield: {},
      accessory: {},
      shoes: {},
    },
    food: {},
  },
  stats: { weapon: {}, armor: {} },
  materials: { weapon: {}, armor: {}, food: {} },
  food: { baseStats: {} },
  bonusEffects: {},
  staff: { chargeAttacks: {}, bases: {} },
  fixtures: {},
} as CrafterData;

function createSerializedBuild(overrides?: { weaponAppearanceId?: string }) {
  const build = createDefaultCrafterBuild(crafterData);
  if (overrides?.weaponAppearanceId) {
    build.weapon.appearanceId = overrides.weaponAppearanceId;
  }
  return serializeCrafterBuild(build, crafterData);
}

describe('CrafterPageClient', () => {
  beforeEach(() => {
    replace.mockReset();
    window.localStorage.clear();
    mockSavedBuild = 'next-build';
  });

  it('restores the crafter build from localStorage when the URL is empty and syncs it back to the route', async () => {
    const storedBuild = createSerializedBuild({ weaponAppearanceId: 'item-broadsword' });
    window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, storedBuild);

    render(<CrafterPageClient items={items} crafterData={crafterData} search={{}} />);

    await waitFor(() => {
      expect(screen.getByTestId('serialized-build')).toHaveTextContent(storedBuild);
    });
    expect(replace).toHaveBeenCalledWith(`/crafter?build=${encodeURIComponent(storedBuild)}`, { scroll: false });
  });

  it('prefers the URL build over localStorage and persists new changes back to both places', async () => {
    const user = userEvent.setup();
    const storedBuild = createSerializedBuild();
    const urlBuild = createSerializedBuild({ weaponAppearanceId: 'item-broadsword' });
    mockSavedBuild = createSerializedBuild({ weaponAppearanceId: 'item-updated-broadsword' });
    window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, storedBuild);

    render(<CrafterPageClient items={items} crafterData={crafterData} search={{ build: urlBuild }} />);

    await waitFor(() => {
      expect(screen.getByTestId('serialized-build')).toHaveTextContent(urlBuild);
    });

    await user.click(screen.getByRole('button', { name: /save build/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem(CRAFTER_BUILD_STORAGE_KEY)).toBe(mockSavedBuild);
      expect(replace).toHaveBeenCalledWith(`/crafter?build=${encodeURIComponent(mockSavedBuild)}`, { scroll: false });
    });
  });

  it('removes the saved build when the crafter returns to the default empty state', async () => {
    const user = userEvent.setup();
    const storedBuild = createSerializedBuild({ weaponAppearanceId: 'item-broadsword' });
    window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, storedBuild);

    render(<CrafterPageClient items={items} crafterData={crafterData} search={{ build: storedBuild }} />);

    await waitFor(() => {
      expect(screen.getByTestId('serialized-build')).toHaveTextContent(storedBuild);
    });

    await user.click(screen.getByRole('button', { name: /clear build/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem(CRAFTER_BUILD_STORAGE_KEY)).toBeNull();
      expect(replace).toHaveBeenCalledWith('/crafter', { scroll: false });
    });
  });

  it('migrates a legacy raw JSON build with baseId-only slots into the current compact build format', async () => {
    const legacyBuild = JSON.stringify({
      weapon: {
        baseId: 'item-broadsword',
        recipe: [],
        inherits: [],
        upgrades: [],
      },
      armor: { baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      headgear: { baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      shield: { baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      accessory: { baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      shoes: { baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      food: { baseId: undefined, recipe: [] },
    });
    window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, legacyBuild);

    render(<CrafterPageClient items={items} crafterData={crafterData} search={{}} />);

    await waitFor(() => {
      const serialized = screen.getByTestId('serialized-build').textContent ?? '';
      expect(serialized).not.toBe(legacyBuild);
      expect(serialized).not.toBe('');
      expect(deserializeCrafterBuild(serialized, crafterData).weapon.appearanceId).toBe('item-broadsword');
    });

    const migrated = screen.getByTestId('serialized-build').textContent ?? '';
    expect(window.localStorage.getItem(CRAFTER_BUILD_STORAGE_KEY)).toBe(migrated);
    expect(replace).toHaveBeenCalledWith(`/crafter?build=${encodeURIComponent(migrated)}`, { scroll: false });
  });
});
