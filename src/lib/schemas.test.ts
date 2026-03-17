import { describe, it, expect } from 'vitest';
import { ItemSchema, RecipeSchema, CharacterSchema, MonsterSchema } from './schemas';

describe('Zod Schemas', () => {
  describe('ItemSchema', () => {
    it('parses a valid item', () => {
      const validItem = {
        id: 'item-iron',
        name: 'Iron',
        type: 'Mineral',
        buy: 200,
        sell: 20,
        usedInRecipes: ['recipe-1', 'recipe-2'],
      };
      
      const result = ItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('fails when id is missing', () => {
      const invalidItem = { name: 'Iron', type: 'Mineral' };
      const result = ItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('RecipeSchema', () => {
    it('parses a valid recipe', () => {
      const validRecipe = {
        id: 'recipe-1',
        name: 'Broadsword',
        stationType: 'Forging',
        station: 'Short Sword',
        level: 1,
        ingredients: ['item-iron'],
      };
      const result = RecipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
    });
  });

  describe('CharacterSchema', () => {
    it('parses a valid character with gifts', () => {
      const validChar = {
        id: 'char-forte',
        name: 'Forte',
        category: 'Bachelorettes',
        gifts: {
          love: { items: ['item-cake'], categories: [] },
          like: { items: [], categories: ['Flowers'] },
          neutral: { items: [], categories: [] },
          dislike: { items: [], categories: [] },
          hate: { items: [], categories: [] },
        },
      };
      const result = CharacterSchema.safeParse(validChar);
      expect(result.success).toBe(true);
    });
  });

  describe('MonsterSchema', () => {
    it('parses a valid monster with drops and stats', () => {
      const validMonster = {
        id: 'monster-orc',
        name: 'Orc',
        drops: [{ id: 'item-stick', name: 'Stick', dropRate: 50 }],
        stats: {
          hp: 100, atk: 10, def: 5, matk: 0, mdef: 0, str: 10, int: 0, vit: 5, spd: 5, exp: 10, gold: 5
        },
      };
      const result = MonsterSchema.safeParse(validMonster);
      expect(result.success).toBe(true);
    });
  });
});
