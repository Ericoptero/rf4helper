import { describe, expect, it } from 'vitest';

import type { Item } from './schemas';
import {
  getDisplayCombat,
  getDisplayEffects,
  getDisplayFoodSummary,
  getDisplayRarity,
  getDisplayStats,
  hasDisplayEffects,
} from './itemPresentation';

function item(overrides: Partial<Item>): Item {
  return {
    id: 'item-test',
    name: 'Test Item',
    type: 'Material',
    ...overrides,
  };
}

function equipmentPayload(
  overrides: Partial<NonNullable<NonNullable<Item['crafter']>['equipment']>['weapon']> = {},
) {
  return {
    stats: {},
    weaponClass: undefined,
    attackType: undefined,
    element: undefined,
    damageType: undefined,
    resistances: {},
    statusAttacks: {},
    geometry: {},
    bonusType: undefined,
    bonusType2: undefined,
    ...overrides,
  };
}

function foodPayload(overrides: Partial<NonNullable<NonNullable<Item['crafter']>['foodBase']>> = {}) {
  return {
    additive: {},
    multipliers: {},
    resistances: {},
    statusAttacks: {},
    status: undefined,
    lightRes: undefined,
    ...overrides,
  };
}

describe('itemPresentation', () => {
  it('derives display stats and combat from crafter equipment payloads', () => {
    const broadsword = item({
      id: 'item-broadsword',
      name: 'Broadsword',
      type: 'Forge',
      rarityPoints: 15,
      craft: [{ recipeId: 'broadsword#1', stationType: 'Forging', station: 'Short Sword', level: 1, ingredients: [] }],
      crafter: {
        equipment: {
          weapon: equipmentPayload({
            stats: { atk: 5, diz: 6 },
            weaponClass: 'Short Sword',
            attackType: 'Short Sword',
            element: 'None',
            damageType: 'Physical',
            geometry: { depth: 2, length: 1, width: 1 },
          }),
        },
      },
    });

    expect(getDisplayStats(broadsword)).toEqual({ atk: 5, diz: 6 });
    expect(getDisplayCombat(broadsword)).toEqual({
      weaponClass: 'Short Sword',
      attackType: 'Short Sword',
      element: 'None',
      damageType: 'Physical',
      geometry: { depth: 2, length: 1, width: 1 },
    });
    expect(getDisplayRarity(broadsword)).toBe(15);
  });

  it('derives resistances from crafter equipment effects', () => {
    const magicShield = item({
      id: 'item-magic-shield',
      name: 'Magic Shield',
      type: 'Craft',
      category: 'shield',
      craft: [{ recipeId: 'magic-shield#1', stationType: 'Crafting', station: 'Shield', level: 1, ingredients: [] }],
      crafter: {
        equipment: {
          armor: equipmentPayload({
            stats: { def: 84, mdef: 78, int: 5 },
            resistances: { seal: 1 },
          }),
        },
      },
    });

    expect(getDisplayStats(magicShield)).toEqual({ def: 84, mdef: 78, int: 5 });
    expect(getDisplayEffects(magicShield)).toEqual([{ type: 'resistance', target: 'seal', value: 100 }]);
    expect(hasDisplayEffects(magicShield)).toBe(true);
  });

  it('treats bare armor equipment payloads as armor even without craft metadata', () => {
    const armorOnly = item({
      id: 'item-armor-only',
      name: 'Armor Only',
      type: 'Equipment',
      crafter: {
        equipment: {
          armor: equipmentPayload({
            stats: { def: 12 },
            resistances: { water: 0.25 },
          }),
        },
      },
    });

    expect(getDisplayStats(armorOnly)).toEqual({ def: 12 });
    expect(getDisplayEffects(armorOnly)).toEqual([{ type: 'resistance', target: 'water', value: 25 }]);
  });

  it('derives food summaries from crafter foodBase payloads', () => {
    const glitterSashimi = item({
      id: 'item-glitter-sashimi',
      name: 'Glitter Sashimi',
      type: 'Dish',
      craft: [{ recipeId: 'food#1', stationType: 'Cooking', station: 'Knife', level: 92, ingredients: [] }],
      crafter: {
        foodBase: foodPayload({
          additive: { hp: 5000, rp: 1000, str: 150 },
          multipliers: { hp: 1.609863, str: 0.179932 },
          resistances: { light: 0.5 },
          lightRes: 0.5,
        }),
      },
    });

    expect(getDisplayStats(glitterSashimi)).toEqual({ hp: 5000, rp: 1000, str: 150 });
    expect(getDisplayFoodSummary(glitterSashimi)).toEqual({
      healing: { hpPercent: 160.9863 },
      statMultipliers: { str: 17.9932 },
    });
    expect(getDisplayEffects(glitterSashimi)).toEqual([{ type: 'resistance', target: 'light', value: 50 }]);
  });

  it('derives cure and resistance effects from crafter food materials', () => {
    const roundoff = item({
      id: 'item-roundoff',
      name: 'Roundoff',
      type: 'Medicine',
      crafter: {
        material: {
          food: foodPayload({
            additive: { hp: 300 },
            resistances: { seal: 0.5 },
            status: { status: 2, parHeal: 1 },
          }),
        },
      },
    });

    expect(getDisplayStats(roundoff)).toEqual({ hp: 300 });
    expect(getDisplayEffects(roundoff)).toEqual([
      { type: 'resistance', target: 'seal', value: 50 },
      { type: 'cure', targets: ['paralysis'] },
    ]);
    expect(hasDisplayEffects(roundoff)).toBe(true);
  });

  it('surfaces special crafter labels as display effects', () => {
    const objectX = item({
      id: 'item-object-x',
      name: 'Object X',
      type: 'Special',
      crafter: {
        specialMaterialRule: {
          behavior: 'invert',
        },
      },
    });

    expect(getDisplayEffects(objectX)).toEqual([{ type: 'label', label: 'Inverts following upgrade effects' }]);
    expect(hasDisplayEffects(objectX)).toBe(true);
  });

  it('falls back to legacy food summary data when no crafter food payload exists', () => {
    const legacyDish = item({
      id: 'item-legacy-dish',
      name: 'Legacy Dish',
      type: 'Dish',
      healing: { hpPercent: 75 },
      statMultipliers: { str: 25 },
    });

    expect(getDisplayFoodSummary(legacyDish)).toEqual({
      healing: { hpPercent: 75 },
      statMultipliers: { str: 25 },
    });
  });

  it('returns no food summary when the crafter payload has no non-zero multipliers', () => {
    const emptyBuffDish = item({
      id: 'item-empty-buff-dish',
      name: 'Empty Buff Dish',
      type: 'Dish',
      crafter: {
        foodBase: foodPayload({
          multipliers: { hp: 0, str: 0 },
        }),
      },
    });

    expect(getDisplayFoodSummary(emptyBuffDish)).toBeUndefined();
  });

  it('merges material-only effects and stats when the item has no derived display role', () => {
    const mixedMaterial = item({
      id: 'item-mixed-material',
      name: 'Mixed Material',
      type: 'Material',
      crafter: {
        material: {
          armor: equipmentPayload({
            stats: { def: 5 },
            resistances: { water: 0.5 },
          }),
          weapon: equipmentPayload({
            stats: { crit: 0.098 },
            statusAttacks: { seal: 0.5 },
          }),
          food: foodPayload({
            additive: { hp: 1000 },
            resistances: { fire: 0.25 },
            statusAttacks: { psn: 0.3 },
            status: { sealHeal: 1 },
          }),
        },
      },
    });

    expect(getDisplayStats(mixedMaterial)).toEqual({ hp: 1000 });
    expect(getDisplayEffects(mixedMaterial)).toEqual([
      { type: 'resistance', target: 'fire', value: 25 },
      { type: 'inflict', target: 'poison', trigger: 'consume', chance: 30 },
      { type: 'cure', targets: ['seal'] },
      { type: 'resistance', target: 'water', value: 50 },
      { type: 'inflict', target: 'seal', trigger: 'attack', chance: 50 },
    ]);
  });

  it('falls back to legacy item effects when no crafter-derived effects are present', () => {
    const legacyEffectItem = item({
      id: 'item-legacy-effect',
      name: 'Legacy Effect Item',
      type: 'Material',
      effects: [{ type: 'resistance', target: 'fire', value: 10 }],
    });

    expect(getDisplayEffects(legacyEffectItem)).toEqual([{ type: 'resistance', target: 'fire', value: 10 }]);
    expect(hasDisplayEffects(legacyEffectItem)).toBe(true);
  });

  it('falls back to normalized station and legacy combat fields for partial weapon payloads', () => {
    const trainingSword = item({
      id: 'item-training-sword',
      name: 'Training Sword',
      type: 'Forge',
      craft: [{ recipeId: 'training-sword#1', stationType: 'Forging', station: 'Short Sword', level: 1, ingredients: [] }],
      combat: {
        element: 'Wind',
        damageType: 'Physical',
        geometry: { depth: 4, length: 2, width: 1 },
      },
      crafter: {
        equipment: {
          weapon: equipmentPayload({
            stats: { atk: 2 },
            geometry: {},
          }),
        },
      },
    });

    expect(getDisplayCombat(trainingSword)).toEqual({
      weaponClass: 'Short Sword',
      attackType: 'Short Sword',
      element: 'Wind',
      damageType: 'Physical',
      geometry: { depth: 4, length: 2, width: 1 },
    });
  });

  it('surfaces bonus effect items as labels and preserves non-weapon combat data', () => {
    const talisman = item({
      id: 'item-talisman',
      name: 'Talisman',
      type: 'Accessory',
      combat: {
        attackType: 'Magic',
        damageType: 'Physical',
        element: 'Light',
      },
      crafter: {
        bonusEffect: {
          kind: 'accessory',
        },
      },
    });

    expect(getDisplayEffects(talisman)).toEqual([{ type: 'label', label: 'Talisman' }]);
    expect(getDisplayCombat(talisman)).toEqual({
      attackType: 'Magic',
      damageType: 'Physical',
      element: 'Light',
    });
  });

  it('falls back to the item name for unknown special material rule labels', () => {
    const oddMaterial = item({
      id: 'item-odd-material',
      name: 'Odd Material',
      type: 'Material',
      crafter: {
        specialMaterialRule: {
          behavior: 'mystery-rule' as never,
        },
      },
    });

    expect(getDisplayEffects(oddMaterial)).toEqual([{ type: 'label', label: 'Odd Material' }]);
  });
});
