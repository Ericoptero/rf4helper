import { z } from 'zod';

export const ItemEffectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cure'),
    targets: z.array(z.string()),
  }),
  z.object({
    type: z.literal('resistance'),
    target: z.string(),
    value: z.number(),
  }),
  z.object({
    type: z.literal('inflict'),
    target: z.string(),
    trigger: z.enum(['attack', 'consume']),
    chance: z.number().optional(),
  }),
]);

export const ItemStatsSchema = z.object({
  hp: z.number().optional(),
  rp: z.number().optional(),
  hpMax: z.number().optional(),
  rpMax: z.number().optional(),
  atk: z.number().optional(),
  def: z.number().optional(),
  matk: z.number().optional(),
  mdef: z.number().optional(),
  str: z.number().optional(),
  vit: z.number().optional(),
  int: z.number().optional(),
  crit: z.number().optional(),
  diz: z.number().optional(),
  drain: z.number().optional(),
  stun: z.number().optional(),
  knock: z.number().optional(),
}).strict();

export const ItemHealingSchema = z.object({
  hpPercent: z.number().optional(),
  rpPercent: z.number().optional(),
}).strict();

export const ItemCombatSchema = z.object({
  weaponClass: z.string().nullable().optional(),
  attackType: z.string().nullable().optional(),
  element: z.string().nullable().optional(),
  damageType: z.string().nullable().optional(),
  geometry: z
    .object({
      depth: z.number().optional(),
      length: z.number().optional(),
      width: z.number().optional(),
    })
    .strict()
    .optional(),
}).strict();

export const NullableOptionalStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? undefined);

export const CrafterResistanceSchema = z
  .object({
    fire: z.number().optional(),
    water: z.number().optional(),
    earth: z.number().optional(),
    wind: z.number().optional(),
    light: z.number().optional(),
    dark: z.number().optional(),
    love: z.number().optional(),
    no: z.number().optional(),
    diz: z.number().optional(),
    crit: z.number().optional(),
    knock: z.number().optional(),
    psn: z.number().optional(),
    seal: z.number().optional(),
    par: z.number().optional(),
    slp: z.number().optional(),
    ftg: z.number().optional(),
    sick: z.number().optional(),
    fnt: z.number().optional(),
    drain: z.number().optional(),
  })
  .default({});

export type CrafterResistanceBlock = z.infer<typeof CrafterResistanceSchema>;

export const CrafterStatusAttackSchema = z
  .object({
    psn: z.number().optional(),
    seal: z.number().optional(),
    par: z.number().optional(),
    slp: z.number().optional(),
    ftg: z.number().optional(),
    sick: z.number().optional(),
    faint: z.number().optional(),
    drain: z.number().optional(),
  })
  .default({});

export type CrafterStatusAttackBlock = z.infer<typeof CrafterStatusAttackSchema>;

export const CrafterGeometrySchema = z
  .object({
    depth: z.number().optional(),
    length: z.number().optional(),
    width: z.number().optional(),
  })
  .default({});

export type CrafterGeometry = z.infer<typeof CrafterGeometrySchema>;
