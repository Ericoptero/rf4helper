import { z } from 'zod';

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
