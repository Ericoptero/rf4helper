import { describe, it, expect } from 'vitest';
import {
  ItemSchema,
  RecipeSchema,
  CharacterSchema,
  MonsterSchema,
  SkillsDataSchema,
} from './schemas';

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
    it('parses a valid character with full profile and battle data', () => {
      const validChar = {
        id: 'char-forte',
        name: 'Forte',
        category: 'Bachelorettes',
        icon: {
          sm: '/characters/icons/sm/Forte.png',
          md: '/characters/icons/md/Forte.png',
        },
        portrait: '/characters/portrait/Forte.png',
        gender: 'Female',
        description: 'A steadfast knight of Selphia.',
        birthday: {
          season: 'Summer',
          day: 22,
        },
        battle: {
          description: 'A defensive frontline fighter with strong melee attacks.',
          stats: {
            level: 50,
            hp: 1200,
            atk: 300,
            def: 450,
            matk: 120,
            mdef: 280,
            str: 260,
            vit: 400,
            int: 100,
          },
          elementalResistances: {
            fire: 0,
            water: 10,
            earth: 20,
          },
          skills: ['Rush Attack', 'Shield Strike'],
          weapon: 'Steel Sword',
          weaponType: 'Long Sword',
        },
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

    it('parses a character with null birthday and battle data', () => {
      const validChar = {
        id: 'char-eliza',
        name: 'Eliza',
        category: 'Other Characters',
        icon: {
          sm: null,
          md: null,
        },
        portrait: null,
        gender: null,
        description: null,
        birthday: null,
        battle: null,
        gifts: {
          love: { items: [], categories: [] },
          like: { items: [], categories: [] },
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
        variantGroup: 'Orc',
        variantSuffix: null,
        image: '/images/monsters/orc',
        description: 'A brutish monster.',
        location: 'Selphia Plain',
        drops: [{ id: 'item-stick', name: 'Stick', dropRates: [70, 20] }],
        stats: {
          baseLevel: 3,
          hp: 100,
          atk: 10,
          def: 5,
          matk: 0,
          mdef: 0,
          str: 10,
          int: 0,
          vit: 5,
          exp: 10,
          bonus: 'HP 1',
        },
        nickname: ['Bonk'],
        resistances: {
          normal: 0,
          fire: 0,
          water: 0,
          earth: 0,
          wind: 0,
          light: 0,
          dark: 0,
          love: 0,
          poison: 0,
          seal: 0,
          paralysis: 0,
          sleep: 0,
          fatigue: 0,
          illness: 0,
          faint: 0,
          hpDrain: 0,
          dizAttack: 10,
          dizResist: 0,
          dizPool: 100,
          additionalStunTime: 0,
          flinchAmount: 100,
          knockDistance: 100,
          knockResist: 0,
          critAttack: 0.98,
          critResist: 4.98,
        },
        taming: {
          tameable: true,
          isRideable: false,
          befriend: 10,
          favorite: [{ id: 'item-stick', name: 'Stick', favorite: 5 }],
          produce: [{ id: null, name: 'Fur', level: 51 }],
          cycle: 'Daily',
        },
      };
      const result = MonsterSchema.safeParse(validMonster);
      expect(result.success).toBe(true);
    });

    it('parses placeholder-driven null values for migrated monster fields', () => {
      const validMonster = {
        id: 'monster-boss',
        name: 'Boss',
        variantGroup: 'Boss',
        variantSuffix: '2',
        image: '/images/monsters/unknown',
        description: null,
        location: null,
        drops: [{ id: null, name: 'Unknown Drop', dropRates: [] }],
        stats: {
          baseLevel: null,
          exp: null,
          hp: null,
          atk: null,
          def: null,
          matk: null,
          mdef: null,
          str: null,
          vit: null,
          int: null,
          bonus: null,
        },
        nickname: [],
        resistances: {
          normal: null,
          fire: null,
        },
        taming: {
          tameable: false,
          isRideable: null,
          befriend: null,
          favorite: [],
          produce: [],
          cycle: null,
        },
      };

      const result = MonsterSchema.safeParse(validMonster);
      expect(result.success).toBe(true);
    });

    it('parses CSV-backed resistances and friendliness with variant metadata', () => {
      const validMonster = {
        id: 'monster-octopirate-2',
        name: 'Octopirate 2',
        variantGroup: 'Octopirate',
        variantSuffix: '2',
        image: '/images/monsters/octopirate',
        description: null,
        location: 'Rune Prana F2 (Boss)',
        drops: [{ id: 'item-ammonite', name: 'Ammonite', dropRates: [70, 20] }],
        stats: {
          baseLevel: 249,
          exp: 36000,
          hp: 42000,
          atk: 1900,
          def: 700,
          matk: 1780,
          mdef: 980,
          str: 800,
          vit: 1080,
          int: 800,
          bonus: null,
        },
        resistances: {
          normal: 0,
          fire: 200,
          water: 200,
          earth: 0,
          wind: 0,
          light: 0,
          dark: 0,
          love: -25,
          poison: 100,
          seal: 100,
          paralysis: 100,
          sleep: 100,
          fatigue: 100,
          illness: 100,
          faint: 100,
          hpDrain: 50,
          dizAttack: 5,
          dizResist: 100,
          knockDistance: 100,
          additionalStunTime: 0,
          knockResist: 100,
          critAttack: 2.98,
          critResist: 89.99,
        },
        taming: {
          tameable: true,
          isRideable: true,
          befriend: 1,
          favorite: [],
          produce: [],
          cycle: null,
        },
      };

      const result = MonsterSchema.safeParse(validMonster);
      expect(result.success).toBe(true);
    });
  });

  describe('SkillsDataSchema', () => {
    it('parses grouped skills data with structured bonuses and unlocks', () => {
      const validSkills = {
        weapons: [
          {
            id: 'skill-short-sword',
            name: 'Short Sword',
            category: 'weapons',
            description: 'Short Swords are balanced for both attack and defense.',
            bonuses: [
              {
                kind: 'combat',
                description: 'Higher skill levels increase damage and cut RP used.',
                stats: [],
              },
              {
                kind: 'stat',
                description: 'Also raises maximum RP and STR.',
                stats: ['maxRp', 'str'],
              },
            ],
            unlocks: [
              { level: 5, effect: 'Dash Attack' },
              { level: 10, effect: 'Charge Attack' },
            ],
            sourceOrder: 1,
          },
        ],
        magic: [
          {
            id: 'skill-fire',
            name: 'Fire',
            category: 'magic',
            description: 'Skill needed to use fire.',
            bonuses: [
              {
                kind: 'stat',
                description: 'Also raises INT, FIRE M.ATK and M.DEF.',
                stats: ['int', 'matk', 'mdef'],
              },
            ],
            unlocks: [],
            sourceOrder: 1,
          },
        ],
        farming: [],
        recipe: [],
        life: [],
        defense: [],
        other: [],
      };

      const result = SkillsDataSchema.safeParse(validSkills);
      expect(result.success).toBe(true);
    });

    it('requires all skill categories to be present', () => {
      const invalidSkills = {
        weapons: [],
        magic: [],
      };

      const result = SkillsDataSchema.safeParse(invalidSkills);
      expect(result.success).toBe(false);
    });
  });
});
