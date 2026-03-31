import { z } from 'zod';

export const FishSchema = z.object({
  id: z.string(),
  name: z.string(),
  itemId: z.string().optional(),
  image: z.string().optional(),
  sell: z.number().nullable().optional(),
  buy: z.number().nullable().optional(),
  shadow: z.string().nullable().optional(),
  locations: z.array(
    z.object({
      region: z.string(),
      spot: z.string(),
      seasons: z.array(z.string()).optional(),
      map: z.string().optional(),
      other: z.array(z.string()).optional(),
    }),
  ).optional(),
});

export type Fish = z.infer<typeof FishSchema>;
