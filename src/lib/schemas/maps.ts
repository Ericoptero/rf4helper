import { z } from 'zod';

export const ChestSchema = z.object({
  id: z.string(),
  itemId: z.string().nullable().optional(),
  itemName: z.string().nullable().optional(),
  region: z.string(),
  roomCode: z.string(),
  locationName: z.string().nullable().optional(),
  tier: z.number().optional(),
  notes: z.string().nullable().optional(),
  recipe: z.string().nullable().optional(),
});

export type Chest = z.infer<typeof ChestSchema>;
