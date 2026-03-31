import { z } from 'zod';

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
    }),
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
        }),
      ).optional(),
      produce: z.array(
        z.object({
          id: z.string().nullable(),
          name: z.string(),
          level: z.number().nullable(),
        }),
      ).optional(),
      cycle: z.string().nullable().optional(),
    })
    .optional(),
});

export type Monster = z.infer<typeof MonsterSchema>;
