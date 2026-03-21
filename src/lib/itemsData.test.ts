import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Item } from './schemas';

type NormalizedEffect =
  | { type: 'cure'; targets: string[] }
  | { type: 'resistance'; target: string; value: number }
  | { type: 'inflict'; target: string; trigger: 'attack' | 'consume'; chance?: number };

type NormalizedItem = Item & {
  groupMembers?: string[];
  effects?: NormalizedEffect[];
};

const items = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/data/items.json'), 'utf8')
) as Record<string, NormalizedItem>;

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

  it('normalizes source-backed numeric stats and non-flat effects into one structure', () => {
    expect(items['item-broadsword']?.stats).toEqual({
      atk: 5,
      diz: 6,
    });

    expect(items['item-magic-shield']?.stats).toEqual({
      def: 84,
      mdef: 78,
      int: 5,
    });
    expect(items['item-magic-shield']?.effects).toEqual([
      { type: 'resistance', target: 'seal', value: 100 },
    ]);

    expect(items['item-roundoff']?.stats).toEqual({
      hp: 300,
    });
    expect(items['item-roundoff']?.effects).toEqual([
      { type: 'cure', targets: ['seal'] },
    ]);

    expect(items['item-poison-blade']?.effects).toEqual(
      expect.arrayContaining([{ type: 'inflict', target: 'poison', trigger: 'attack', chance: 25 }])
    );
  });

  it('does not keep ambiguous legacy stats keys on normalized items', () => {
    const disallowedKeys = new Set(['res', 'aRK']);

    for (const [itemId, item] of Object.entries(items)) {
      for (const key of Object.keys(item.stats ?? {})) {
        expect(disallowedKeys.has(key), `${itemId} still uses legacy stats key ${key}`).toBe(false);
      }
    }
  });
});
