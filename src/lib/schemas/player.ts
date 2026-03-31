import { z } from 'zod';

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
  category: z.enum([
    'weapons',
    'magic',
    'farming',
    'recipe',
    'life',
    'defense',
    'other',
  ]),
  description: z.string(),
  bonuses: z.array(
    z.object({
      kind: z.enum([
        'stat',
        'combat',
        'resistance',
        'crafting',
        'farming',
        'monster',
        'party',
        'economy',
        'utility',
      ]),
      description: z.string(),
      stats: z.array(
        z.enum([
          'maxHp',
          'maxRp',
          'atk',
          'def',
          'matk',
          'mdef',
          'str',
          'vit',
          'int',
        ]),
      ).default([]),
    }),
  ).default([]),
  unlocks: z.array(
    z.object({
      level: z.number(),
      effect: z.string(),
    }),
  ).default([]),
  sourceOrder: z.number(),
});

export type Skill = z.infer<typeof SkillSchema>;

export const SkillsDataSchema = z.object({
  weapons: z.array(SkillSchema),
  magic: z.array(SkillSchema),
  farming: z.array(SkillSchema),
  recipe: z.array(SkillSchema),
  life: z.array(SkillSchema),
  defense: z.array(SkillSchema),
  other: z.array(SkillSchema),
});

export type SkillsData = z.infer<typeof SkillsDataSchema>;

export const TrophySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
});

export type Trophy = z.infer<typeof TrophySchema>;
