import { z } from 'zod';

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
