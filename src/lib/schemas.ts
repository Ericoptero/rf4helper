import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  hexId: z.string().optional(),
  type: z.string(),
  region: z.string().nullable().optional(),
  tier: z.number().optional(),
  shippable: z.boolean().optional(),
  buy: z.number().optional(),
  sell: z.number().optional(),
  rarityPoints: z.number().optional(),
  rarityCategory: z.string().optional(),
  usedInRecipes: z.array(z.string()).optional(),
  craftedFrom: z
    .array(
      z.object({
        recipeId: z.string(),
        stationType: z.string(),
        station: z.string(),
        level: z.number(),
        ingredients: z.array(z.string()),
      })
    )
    .optional(),
});

export type Item = z.infer<typeof ItemSchema>;

export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  outputName: z.string().nullable().optional(),
  outputId: z.string().nullable().optional(),
  hexId: z.string().optional(),
  stationType: z.string(),
  station: z.string(),
  level: z.number(),
  tier: z.number().optional(),
  ingredients: z.array(z.string()),
});

export type Recipe = z.infer<typeof RecipeSchema>;

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  gifts: z.object({
    love: z.object({ items: z.array(z.string()), categories: z.array(z.string()) }),
    like: z.object({ items: z.array(z.string()), categories: z.array(z.string()) }),
    neutral: z.object({ items: z.array(z.string()), categories: z.array(z.string()) }),
    dislike: z.object({ items: z.array(z.string()), categories: z.array(z.string()) }),
    hate: z.object({ items: z.array(z.string()), categories: z.array(z.string()) }),
  }),
});

export type Character = z.infer<typeof CharacterSchema>;

export const MonsterSchema = z.object({
  id: z.string(),
  name: z.string(),
  drops: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      dropRate: z.number(),
    })
  ),
  stats: z.object({
    hp: z.number(),
    atk: z.number(),
    def: z.number(),
    matk: z.number(),
    mdef: z.number(),
    str: z.number(),
    int: z.number(),
    vit: z.number(),
    spd: z.number(),
    exp: z.number(),
    gold: z.number(),
  }),
  resistances: z.record(z.string(), z.number()).optional(),
  taming: z
    .object({
      tameable: z.boolean(),
      region: z.string().nullable().optional(),
      produceId: z.string().nullable().optional(),
      produceName: z.string().nullable().optional(),
      friendItem: z.string().nullable().optional(),
    })
    .optional(),
});

export type Monster = z.infer<typeof MonsterSchema>;
