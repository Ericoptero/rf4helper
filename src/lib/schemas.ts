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

export const ChestSchema = z.object({
  id: z.string(),
  itemId: z.string().nullable().optional(),
  itemName: z.string().nullable().optional(),
  region: z.string(),
  roomCode: z.string(),
  locationName: z.string().nullable().optional(),
  tier: z.number().optional(),
  notes: z.string().nullable().optional(),
  recipe: z.string().nullable().optional()
});

export type Chest = z.infer<typeof ChestSchema>;

export const FestivalSchema = z.object({
  id: z.string(),
  name: z.string(),
  season: z.string().nullable().optional(),
  day: z.number().nullable().optional(),
  orderable: z.boolean().optional(),
  description: z.string().nullable().optional(),
});

export type Festival = z.infer<typeof FestivalSchema>;

export const CropSchema = z.object({
  id: z.string(),
  name: z.string(),
  itemId: z.string().optional(),
  goodSeasons: z.array(z.string()).optional(),
  badSeasons: z.array(z.string()).optional(),
  growTime: z.number().optional(),
  seedBuy: z.number().nullable().optional(),
  harvested: z.number().optional(),
  regrows: z.boolean().optional(),
  cropSell: z.number().nullable().optional(),
});

export type Crop = z.infer<typeof CropSchema>;

export const CropsDataSchema = z.record(z.string(), z.array(CropSchema));
export type CropsData = z.infer<typeof CropsDataSchema>;

export const FishSchema = z.object({
  id: z.string(),
  name: z.string(),
  itemId: z.string().optional(),
  sell: z.number().nullable().optional(),
  buy: z.number().nullable().optional(),
  shadow: z.string().nullable().optional(),
  locations: z.array(z.string()).optional(),
});

export type Fish = z.infer<typeof FishSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  orderName: z.string(),
  category: z.string(),
  requirement: z.string().nullable().optional(),
  rpCost: z.number().nullable().optional(),
});
export type Order = z.infer<typeof OrderSchema>;

export const RequestSchema = z.object({
  id: z.string(),
  request: z.string(),
  unlockConditions: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  howToComplete: z.string().nullable().optional(),
  reward: z.string().nullable().optional(),
});
export type RequestItem = z.infer<typeof RequestSchema>;

export const RuneAbilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  weaponType: z.string(),
  sell: z.number().nullable().optional(),
  buy: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type RuneAbility = z.infer<typeof RuneAbilitySchema>;

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  unlocks: z.record(z.string(), z.string()).optional(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const TrophySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
});
export type Trophy = z.infer<typeof TrophySchema>;

