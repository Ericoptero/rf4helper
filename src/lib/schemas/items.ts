import { z } from 'zod';

import {
  ItemCombatSchema,
  ItemEffectSchema,
  ItemHealingSchema,
  ItemStatsSchema,
} from './shared';
import { ItemCrafterDataSchema } from './crafter';

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  hexId: z.string().optional(),
  image: z.string().optional(),
  type: z.string(),
  region: z.string().nullable().optional(),
  shippable: z.boolean().optional(),
  buy: z.number().optional(),
  sell: z.number().optional(),
  category: z.string().optional(),
  description: z.string().nullable().optional(),
  monster: z.string().optional(),
  rarityPoints: z.number().optional(),
  rarityCategory: z.string().optional(),
  groupMembers: z.array(z.string()).optional(),
  usedInRecipes: z.array(z.string()).optional(),
  craft: z
    .array(
      z.object({
        recipeId: z.string().optional(),
        stationType: z.string(),
        station: z.string().optional(),
        level: z.number(),
        ingredients: z.array(z.string()),
      }),
    )
    .optional(),
  craftedFrom: z
    .array(
      z.object({
        recipeId: z.string(),
        stationType: z.string(),
        station: z.string(),
        level: z.number(),
        ingredients: z.array(z.string()),
      }),
    )
    .optional(),
  stats: ItemStatsSchema.optional(),
  healing: ItemHealingSchema.optional(),
  statMultipliers: ItemStatsSchema.optional(),
  combat: ItemCombatSchema.optional(),
  effects: z.array(ItemEffectSchema).optional(),
  crafter: z.lazy(() => ItemCrafterDataSchema).optional(),
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
