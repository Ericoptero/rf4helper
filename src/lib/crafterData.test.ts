import { describe, expect, it } from 'vitest';

import { buildCrafterData } from './crafterData';
import type { CrafterConfig, Item } from './schemas';

function materialPayload(overrides: Partial<NonNullable<NonNullable<Item['crafter']>['material']>['weapon']> = {}) {
  return {
    stats: {},
    weaponClass: undefined,
    attackType: undefined,
    element: undefined,
    damageType: undefined,
    resistances: {},
    statusAttacks: {},
    geometry: {},
    rarity: 0,
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

const crafterConfig: CrafterConfig = {
  schemaVersion: 2,
  slotConfigs: [
    {
      key: 'weapon',
      label: 'Weapon',
      stationType: 'Forging',
      stations: ['Short Sword', 'Long Sword', 'Spear', 'Axe/Hammer', 'Staff', 'Dual Blade', 'Fist', 'Farm'],
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
  weaponClassByStation: {
    'Axe/Hammer': 'Axe/Hammer',
    Farm: 'Farm',
    Fist: 'Fist',
    'Short Sword': 'Short Sword',
  },
  shieldCoverageByWeaponClass: {
    'Axe/Hammer': 'none',
    Farm: 'none',
    Fist: 'none',
    'Short Sword': 'full',
  },
  starterWeaponByClass: {
    'Axe/Hammer': 'item-training-hammer',
    Farm: 'item-cheap-hoe',
    Fist: 'item-gloves',
    'Short Sword': 'item-training-sword',
  },
  chargeAttackByWeaponClass: {},
  staffChargeByCrystalId: {},
  levelBonusTiers: [],
  rarityBonusTiers: [],
  foodOverrides: {},
  fixtures: {},
};

const items: Record<string, Item> = {
  'item-minerals': {
    id: 'item-minerals',
    name: 'Minerals',
    type: 'Category',
    groupMembers: ['item-iron', 'item-silver'],
    usedInRecipes: ['item-training-sword'],
  },
  'item-iron': {
    id: 'item-iron',
    name: 'Iron',
    type: 'Mineral',
    rarityPoints: 1,
    crafter: {
      material: {
        weapon: materialPayload({ rarity: 1 }),
        armor: materialPayload({ rarity: 1 }),
      },
    },
  },
  'item-silver': {
    id: 'item-silver',
    name: 'Silver',
    type: 'Mineral',
    rarityPoints: 2,
    crafter: {
      material: {
        weapon: materialPayload({ rarity: 2 }),
        armor: materialPayload({ rarity: 2 }),
      },
    },
  },
  'item-training-sword': {
    id: 'item-training-sword',
    name: 'Training Sword',
    type: 'Forge',
    buy: 100,
    sell: 10,
    craft: [
      {
        recipeId: 'item-training-sword#1',
        stationType: 'Forging',
        station: 'Short Sword',
        level: 1,
        ingredients: ['item-minerals'],
      },
    ],
    stats: {
      atk: 8,
    },
    combat: {
      weaponClass: 'Short Sword',
      attackType: 'Short Sword',
      element: 'None',
      damageType: 'Physical',
      geometry: {
        depth: 1,
        length: 1.5,
        width: 0.8,
      },
    },
  },
  'item-training-hammer': {
    id: 'item-training-hammer',
    name: 'Training Hammer',
    type: 'Forge',
    buy: 100,
    sell: 10,
    craft: [
      {
        recipeId: 'item-training-hammer#1',
        stationType: 'Forging',
        station: 'Hammer',
        level: 1,
        ingredients: ['item-iron'],
      },
    ],
    stats: {
      atk: 20,
      crit: 10,
    },
    effects: [
      { type: 'resistance', target: 'fire', value: 25 },
      { type: 'inflict', target: 'poison', trigger: 'attack', chance: 30 },
    ],
    combat: {
      weaponClass: 'Axe/Hammer',
      attackType: 'Hammer',
      element: 'None',
      damageType: 'Physical',
      geometry: {
        depth: 1.5,
        length: 2.5,
        width: 1,
      },
    },
  },
  'item-pickled-turnip': {
    id: 'item-pickled-turnip',
    name: 'Pickled Turnip',
    type: 'Dish',
    buy: 100,
    sell: 10,
    craft: [
      {
        recipeId: 'item-pickled-turnip#1',
        stationType: 'Cooking',
        station: 'No Tool',
        level: 4,
        ingredients: ['item-turnip'],
      },
      {
        recipeId: 'item-pickled-turnip#2',
        stationType: 'Cooking',
        station: 'No Tool',
        level: 12,
        ingredients: ['item-pink-turnip'],
      },
    ],
    stats: {
      hp: 250,
      rp: 100,
      str: 5,
      vit: 3,
      int: 5,
    },
  },
  'item-glitter-sashimi': {
    id: 'item-glitter-sashimi',
    name: 'Glitter Sashimi',
    type: 'Dish',
    buy: 100,
    sell: 10,
    craft: [
      {
        recipeId: 'item-glitter-sashimi#1',
        stationType: 'Cooking',
        station: 'Knife',
        level: 92,
        ingredients: ['item-glitter-snapper'],
      },
    ],
    stats: {
      hp: 5000,
      rp: 1000,
      str: 150,
    },
    healing: {
      hpPercent: 160.9863,
    },
    statMultipliers: {
      str: 17.9932,
    },
    effects: [
      { type: 'resistance', target: 'light', value: 50 },
    ],
  },
  'item-fire-crystal': {
    id: 'item-fire-crystal',
    name: 'Fire Crystal',
    type: 'Material',
    buy: 100,
    sell: 10,
    stats: {
      atk: 5,
    },
    crafter: {
      material: {
        weapon: materialPayload({ rarity: 7 }),
        armor: materialPayload({ rarity: 7 }),
        food: foodPayload({
          status: {
            overwrite: 1,
          },
        }),
      },
      staff: {
        chargeAttack: {
          lv1: 'Fire Spread Lv1',
          lv2: 'Fire Spread Lv2',
          lv3: 'Fire Spread Lv3',
          speed: 1,
          rarity: 7,
        },
      },
    },
  },
  'item-object-x': {
    id: 'item-object-x',
    name: 'Object X',
    type: 'Potion',
    buy: 100,
    sell: 10,
    effects: [
      { type: 'inflict', target: 'poison', trigger: 'consume' },
    ],
    crafter: {
      specialMaterialRule: {
        behavior: 'invert',
      },
    },
  },
  'item-happy-ring': {
    id: 'item-happy-ring',
    name: 'Happy Ring',
    type: 'Accessory',
    buy: 100,
    sell: 10,
    craft: [
      {
        recipeId: 'item-happy-ring#1',
        stationType: 'Crafting',
        station: 'Accessory',
        level: 20,
        ingredients: ['item-silver'],
      },
    ],
    crafter: {
      bonusEffect: {
        kind: 'accessory',
      },
    },
  },
  'item-gloves': {
    id: 'item-gloves',
    name: 'Gloves',
    type: 'Forge',
    buy: 100,
    sell: 10,
    craft: [
      {
        recipeId: 'item-gloves#1',
        stationType: 'Crafting',
        station: 'Accessory',
        level: 18,
        ingredients: ['item-giants-gloves'],
      },
      {
        recipeId: 'item-gloves#2',
        stationType: 'Forging',
        station: 'Fist',
        level: 20,
        ingredients: ['item-quality-cloth'],
      },
    ],
    stats: {
      atk: 40,
      def: 42,
      diz: 2,
      stun: 30,
    },
    crafter: {
      equipment: {
        weapon: materialPayload({
          stats: {
            atk: 172,
            vit: 20,
            diz: 5,
            crit: 0.019775390625,
          },
          attackType: 'Fist',
          damageType: 'Physical',
          element: 'None',
          geometry: {
            depth: 1.8999,
            length: 0.95,
            width: 1,
          },
        }),
      },
    },
  },
};

describe('buildCrafterData', () => {
  it('builds runtime recipes from item craft data using normalized stations and the first valid recipe', () => {
    const result = buildCrafterData(items, crafterConfig);

    expect(result.recipes.equipment.weapon['item-training-sword']).toEqual({
      station: 'Short Sword',
      materials: ['item-minerals'],
    });
    expect(result.recipes.equipment.weapon['item-training-hammer']).toEqual({
      station: 'Axe/Hammer',
      materials: ['item-iron'],
    });
    expect(result.recipes.equipment.weapon['item-gloves']).toEqual({
      station: 'Fist',
      materials: ['item-quality-cloth'],
    });
    expect(result.recipes.food['item-pickled-turnip']).toEqual({
      station: 'Handmade',
      materials: ['item-turnip'],
    });
  });

  it('converts canonical item fields back into crafter runtime payloads', () => {
    const result = buildCrafterData(items, crafterConfig);

    expect(result.stats.weapon['item-training-hammer']?.stats.atk).toBe(20);
    expect(result.stats.weapon['item-training-hammer']?.stats.crit).toBeCloseTo(0.1, 6);
    expect(result.stats.weapon['item-training-hammer']?.resistances.fire).toBeCloseTo(0.25, 6);
    expect(result.stats.weapon['item-training-hammer']?.statusAttacks.psn).toBeCloseTo(0.3, 6);
    expect(result.stats.weapon['item-training-hammer']?.attackType).toBe('Hammer');
    expect(result.stats.weapon['item-training-hammer']?.geometry.length).toBeCloseTo(2.5, 6);

    expect(result.food.baseStats['item-glitter-sashimi']?.additive).toEqual({
      hp: 5000,
      rp: 1000,
      str: 150,
    });
    expect(result.food.baseStats['item-glitter-sashimi']?.multipliers.hp).toBeCloseTo(1.609863, 6);
    expect(result.food.baseStats['item-glitter-sashimi']?.multipliers.str).toBeCloseTo(0.179932, 6);
    expect(result.food.baseStats['item-glitter-sashimi']?.resistances.light).toBeCloseTo(0.5, 6);
  });

  it('preserves crafter-specific item payloads and special rules inside the resolved runtime data', () => {
    const result = buildCrafterData(items, crafterConfig);

    expect(result.materials.weapon['item-fire-crystal']?.rarity).toBe(7);
    expect(result.staff.chargeAttacks['item-fire-crystal']?.lv1).toBe('Fire Spread Lv1');
    expect(result.specialMaterialRules).toEqual([{ itemId: 'item-object-x', behavior: 'invert' }]);
    expect(result.bonusEffects['item-happy-ring']).toEqual({ itemName: 'Happy Ring', kind: 'accessory' });
  });

  it('uses crafter equipment overrides when an item has more than one equipment identity', () => {
    const result = buildCrafterData(items, crafterConfig);

    expect(result.stats.armor['item-gloves']?.stats).toEqual({
      atk: 40,
      def: 42,
      diz: 2,
      stun: 0.3,
    });
    expect(result.stats.weapon['item-gloves']?.stats.atk).toBe(172);
    expect(result.stats.weapon['item-gloves']?.stats.crit).toBeCloseTo(0.019775390625, 6);
  });
});
