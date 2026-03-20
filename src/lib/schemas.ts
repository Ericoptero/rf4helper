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
  icon: z.object({
    sm: z.string().nullable(),
    md: z.string().nullable(),
  }),
  portrait: z.string().nullable(),
  gender: z.string().nullable(),
  description: z.string().nullable(),
  birthday: z
    .object({
      season: z.string().nullable(),
      day: z.number().nullable(),
    })
    .nullable(),
  battle: z
    .object({
      description: z.string().nullable(),
      stats: z
        .object({
          level: z.number().nullable(),
          hp: z.number().nullable(),
          atk: z.number().nullable(),
          def: z.number().nullable(),
          matk: z.number().nullable(),
          mdef: z.number().nullable(),
          str: z.number().nullable(),
          vit: z.number().nullable(),
          int: z.number().nullable(),
        })
        .nullable(),
      elementalResistances: z.record(z.string(), z.number().nullable()).nullable(),
      skills: z.array(z.string()),
      weapon: z.string().nullable(),
      weaponType: z.string().nullable(),
    })
    .nullable(),
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
  variantGroup: z.string().nullable().optional(),
  variantSuffix: z.string().nullable().optional(),
  image: z.string().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  drops: z.array(
    z.object({
      id: z.string().nullable(),
      name: z.string(),
      dropRates: z.array(z.number()),
    })
  ),
  stats: z.object({
    baseLevel: z.number().nullable().optional(),
    hp: z.number().nullable(),
    atk: z.number().nullable(),
    def: z.number().nullable(),
    matk: z.number().nullable(),
    mdef: z.number().nullable(),
    str: z.number().nullable(),
    int: z.number().nullable(),
    vit: z.number().nullable(),
    exp: z.number().nullable(),
    bonus: z.string().nullable().optional(),
  }),
  nickname: z.array(z.string()).optional(),
  resistances: z.record(z.string(), z.number().nullable()).optional(),
  taming: z
    .object({
      tameable: z.boolean(),
      isRideable: z.boolean().nullable().optional(),
      befriend: z.number().nullable().optional(),
      favorite: z.array(
        z.object({
          id: z.string().nullable(),
          name: z.string(),
          favorite: z.number().nullable(),
        })
      ).optional(),
      produce: z.array(
        z.object({
          id: z.string().nullable(),
          name: z.string(),
          level: z.number().nullable(),
        })
      ).optional(),
      cycle: z.string().nullable().optional(),
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
  image: z.string().optional(),
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
