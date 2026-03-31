import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CrafterConfigSchema, type Item } from './schemas';

type NormalizedEffect =
  | { type: 'cure'; targets: string[] }
  | { type: 'resistance'; target: string; value: number }
  | { type: 'inflict'; target: string; trigger: 'attack' | 'consume'; chance?: number };

type NormalizedItem = Item & {
  groupMembers?: string[];
  effects?: NormalizedEffect[];
};

const items = JSON.parse(
  readFileSync(resolve(process.cwd(), 'data/items.json'), 'utf8')
) as Record<string, NormalizedItem>;
const crafterConfig = CrafterConfigSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), 'data/crafter.json'), 'utf8'))
);

function sortStrings(values: Iterable<string>) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function deriveUsedInRecipes(data: Record<string, Item>) {
  const derived = new Map<string, Set<string>>();

  for (const itemId of Object.keys(data)) {
    derived.set(itemId, new Set());
  }

  for (const [recipeId, item] of Object.entries(data)) {
    for (const craft of item.craft ?? []) {
      for (const ingredientId of craft.ingredients) {
        derived.get(ingredientId)?.add(recipeId);
      }
    }
  }

  return derived;
}

describe('items.json recipe normalization', () => {
  it('uses category item ids for FAQ-verified grouped ingredients', () => {
    const expectations: Record<string, string[]> = {
      'item-broadsword': ['item-minerals'],
      'item-claymore': ['item-minerals'],
      'item-shirt': ['item-cloths-and-skins'],
      'item-charm': ['item-cloths-and-skins', 'item-strings'],
      'item-work-gloves': ['item-cloths-and-skins'],
      'item-cheap-pole': ['item-sticks-and-stems', 'item-strings'],
      'item-headdress': [
        'item-cloths-and-skins',
        'item-cloths-and-skins',
        'item-cloths-and-skins',
        'item-strings',
      ],
      'item-rune-vest': [
        'item-golem-spirit-stone',
        'item-rune-crystal',
        'item-rune-crystal',
        'item-cloths-and-skins',
        'item-strings',
      ],
      'item-water-shoes': [
        'item-pretty-thread',
        'item-sticks-and-stems',
        'item-cloths-and-skins',
        'item-furs',
      ],
      'item-seafood-pizza': [
        'item-flour',
        'item-cheese',
        'item-ketchup',
        'item-shrimp',
        'item-squid-any',
      ],
    };

    for (const [recipeId, expectedIngredients] of Object.entries(expectations)) {
      expect(items[recipeId]?.craft?.[0]?.ingredients).toEqual(expectedIngredients);
    }
  });

  it('stores grouped recipe reverse links on category items instead of concrete members', () => {
    expect(items['item-minerals']?.usedInRecipes).toEqual(
      expect.arrayContaining(['item-broadsword', 'item-claymore'])
    );
    expect(items['item-cloths-and-skins']?.usedInRecipes).toEqual(
      expect.arrayContaining([
        'item-shirt',
        'item-charm',
        'item-work-gloves',
        'item-headdress',
        'item-rune-vest',
        'item-water-shoes',
      ])
    );
    expect(items['item-strings']?.usedInRecipes).toEqual(
      expect.arrayContaining(['item-charm', 'item-cheap-pole', 'item-headdress', 'item-rune-vest'])
    );
    expect(items['item-sticks-and-stems']?.usedInRecipes).toEqual(
      expect.arrayContaining(['item-cheap-pole', 'item-water-shoes'])
    );
    expect(items['item-furs']?.usedInRecipes).toEqual(expect.arrayContaining(['item-water-shoes']));
    expect(items['item-squid-any']?.usedInRecipes).toEqual(
      expect.arrayContaining([
        'item-grilled-squid',
        'item-seafood-doria',
        'item-seafood-gratin',
        'item-seafood-pizza',
      ])
    );

    expect(items['item-iron']?.usedInRecipes ?? []).not.toContain('item-broadsword');
    expect(items['item-insect-carapace']?.usedInRecipes ?? []).not.toContain('item-shirt');
    expect(items['item-old-bandage']?.usedInRecipes ?? []).not.toContain('item-cheap-pole');
    expect(items['item-insect-horn']?.usedInRecipes ?? []).not.toContain('item-water-shoes');
    expect(items['item-fur']?.usedInRecipes ?? []).not.toContain('item-water-shoes');
  });

  it('adds FAQ-backed groupMembers to grouped-material categories', () => {
    expect(items['item-minerals']?.groupMembers).toEqual([
      'item-iron',
      'item-bronze',
      'item-silver',
      'item-gold',
      'item-platinum',
      'item-orichalcum',
      'item-dragonic-stone',
    ]);

    expect(items['item-stones']?.groupMembers).toEqual(
      expect.arrayContaining([
        'item-rock',
        'item-material-stone',
        'item-tiny-golem-stone',
        'item-golem-stone',
        'item-spirit-golem-stone',
        'item-tablet-of-truth',
        'item-round-stone',
      ])
    );

    expect(items['item-disgusting-food']?.groupMembers).toBeUndefined();
  });

  it('keeps every groupMembers entry resolvable', () => {
    for (const [itemId, item] of Object.entries(items)) {
      for (const memberId of item.groupMembers ?? []) {
        expect(items[memberId], `${itemId} references missing group member ${memberId}`).toBeDefined();
      }
    }
  });

  it('splits merged FAQ output families into distinct records', () => {
    expect(items['item-steel-sword']?.name).toBe('Steel Sword');
    expect(items['item-steel-sword-plus']?.name).toBe('Steel Sword+');
    expect(items['item-steel-sword']?.craft?.[0]?.ingredients).toEqual([
      'item-minerals',
      'item-claws-and-fangs',
    ]);
    expect(items['item-steel-sword-plus']?.craft?.[0]?.ingredients).toEqual([
      'item-steel-sword',
      'item-minerals',
    ]);

    expect(items['item-greenifier']?.name).toBe('Greenifier');
    expect(items['item-greenifier-plus']?.name).toBe('Greenifier+');
    expect(items['item-no-rot-alpha']?.name).toBe('No Rot (Alpha)');
    expect(items['item-no-rot-beta']?.name).toBe('No Rot (Beta)');

    expect(items['item-weapon-bread']?.name).toBe('Weapon Bread');
    expect(items['item-weapon-bread-plus']?.name).toBe('Weapon Bread+');
    expect(items['item-medicine-bread']?.name).toBe('Medicine Bread');
    expect(items['item-medicine-bread-plus']?.name).toBe('Medicine Bread+');
  });

  it('removes self-referential upgrade recipes from split output ids', () => {
    for (const [itemId, item] of Object.entries(items)) {
      for (const craft of item.craft ?? []) {
        expect(craft.ingredients).not.toContain(itemId);
      }
    }
  });

  it('keeps craft ingredients resolvable and usedInRecipes derivable from craft data', () => {
    const derived = deriveUsedInRecipes(items);

    for (const [itemId, item] of Object.entries(items)) {
      for (const craft of item.craft ?? []) {
        for (const ingredientId of craft.ingredients) {
          expect(items[ingredientId], `${itemId} references missing ingredient ${ingredientId}`).toBeDefined();
        }
      }

      expect(sortStrings(item.usedInRecipes ?? [])).toEqual(sortStrings(derived.get(itemId) ?? []));
    }
  });

  it('uses at least one category item directly in craft ingredients', () => {
    const categoryIngredients = Object.values(items).flatMap((item) => item.craft ?? []).flatMap((craft) =>
      craft.ingredients.filter((ingredientId) => items[ingredientId]?.type === 'Category')
    );

    expect(categoryIngredients.length).toBeGreaterThan(0);
  });

  it('matches the full FAQ recipe entry count after normalization', () => {
    const craftRecipeCount = Object.values(items).reduce((total, item) => total + (item.craft?.length ?? 0), 0);

    expect(craftRecipeCount).toBe(631);
  });

  it('stores workbook-backed display payloads under crafter instead of duplicating them at the top level', () => {
    expect(items['item-broadsword']?.stats).toBeUndefined();
    expect(items['item-broadsword']?.combat).toBeUndefined();
    expect(items['item-broadsword']?.effects).toBeUndefined();
    expect(items['item-broadsword']?.crafter?.equipment?.weapon).toMatchObject({
      stats: {
        atk: 5,
        diz: 6,
      },
      weaponClass: 'Short Sword',
      attackType: 'Short Sword',
      damageType: 'Physical',
      element: 'None',
    });

    expect(items['item-magic-shield']?.stats).toBeUndefined();
    expect(items['item-magic-shield']?.effects).toBeUndefined();
    expect(items['item-magic-shield']?.crafter?.equipment?.armor).toMatchObject({
      stats: {
        def: 84,
        mdef: 78,
        int: 5,
      },
      resistances: {
        seal: 1,
      },
    });

    expect(items['item-roundoff']?.stats).toBeUndefined();
    expect(items['item-roundoff']?.effects).toBeUndefined();
    expect(items['item-roundoff']?.crafter?.material?.food).toMatchObject({
      additive: {
        hp: 300,
      },
      resistances: {
        seal: 0.5,
      },
      status: {
        status: 2,
        parHeal: 1,
      },
    });

    expect(items['item-poison-blade']?.crafter?.equipment?.weapon?.statusAttacks).toMatchObject({
      psn: 0.25,
    });
  });

  it('does not keep ambiguous legacy stats keys on normalized items', () => {
    const disallowedKeys = new Set(['res', 'aRK']);

    for (const [itemId, item] of Object.entries(items)) {
      for (const key of Object.keys(item.stats ?? {})) {
        expect(disallowedKeys.has(key), `${itemId} still uses legacy stats key ${key}`).toBe(false);
      }
    }
  });

  it('keeps food, special material, and staff data under crafter while preserving raw workbook food status', () => {
    expect(items['item-glitter-sashimi']?.healing).toBeUndefined();
    expect(items['item-glitter-sashimi']?.statMultipliers).toBeUndefined();
    expect(items['item-glitter-sashimi']?.crafter?.foodBase).toMatchObject({
      additive: {
        hp: 5000,
        rp: 1000,
        str: 150,
      },
      multipliers: {
        hp: 1.609863,
        str: 0.179932,
      },
      resistances: {
        light: 0.5,
      },
      lightRes: 0.5,
    });
    expect(items['item-broadsword']?.crafter?.material?.food?.status).toEqual({
      status: 4000,
      overwrite: 1,
    });
    expect(items['item-object-x']?.crafter?.specialMaterialRule?.behavior).toBe('invert');
    expect(items['item-fire-crystal']?.crafter?.staff?.chargeAttack?.lv1).toBe('Fire Spread Lv1');
  });

  it('keeps dual-role crafter overrides on items that have more than one equipment identity', () => {
    expect(items['item-gloves']?.stats).toBeUndefined();
    expect(items['item-gloves']?.crafter?.equipment?.armor?.stats?.atk).toBe(40);
    expect(items['item-gloves']?.crafter?.equipment?.armor?.stats?.def).toBe(42);
    expect(items['item-gloves']?.crafter?.equipment?.armor?.stats?.diz).toBe(2);
    expect(items['item-gloves']?.crafter?.equipment?.armor?.stats?.stun).toBeCloseTo(0.2998046875, 6);
    expect(items['item-gloves']?.crafter?.equipment?.weapon?.stats?.atk).toBe(172);
  });

  it('keeps rarityPoints as the only persisted rarity field', () => {
    // item-broadsword is an equipment base — rarityPoints is 0 by design (equipment bases do not contribute rarity)
    expect(items['item-broadsword']?.rarityPoints).toBe(0);
    expect(items['item-broadsword']?.crafter?.equipment?.weapon?.rarity).toBeUndefined();
    expect(items['item-fire-crystal']?.rarityPoints).toBe(7);
    expect(items['item-fire-crystal']?.crafter?.material?.weapon?.rarity).toBeUndefined();
    expect(items['item-fire-crystal']?.crafter?.staff?.chargeAttack?.rarity).toBeUndefined();
    expect(items['item-dark-crystal']?.rarityPoints).toBe(4);
    expect(items['item-plant-stem']?.rarityPoints).toBe(5);
    expect(items['item-lumber']?.rarityPoints).toBe(1);
    expect(items['item-material-stone']?.rarityPoints).toBe(1);
  });

  it('stores only global crafter config in crafter.json', () => {
    expect(crafterConfig.slotConfigs.length).toBeGreaterThan(0);
    expect(crafterConfig.defaults.weapon.recipe).toEqual([]);
    expect('recipes' in crafterConfig).toBe(false);
    expect('stats' in crafterConfig).toBe(false);
    expect('materials' in crafterConfig).toBe(false);
    expect('food' in crafterConfig).toBe(false);
    expect('bonusEffects' in crafterConfig).toBe(false);
    expect('staff' in crafterConfig).toBe(false);
    expect('specialMaterialRules' in crafterConfig).toBe(false);
  });
});
