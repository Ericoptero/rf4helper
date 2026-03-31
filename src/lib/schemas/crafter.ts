import { z } from 'zod';

import {
  CrafterGeometrySchema,
  CrafterResistanceSchema,
  CrafterStatusAttackSchema,
  ItemStatsSchema,
  NullableOptionalStringSchema,
} from './shared';

export const CrafterSlotKeySchema = z.enum([
  'weapon',
  'armor',
  'headgear',
  'shield',
  'accessory',
  'shoes',
]);

export type CrafterSlotKey = z.infer<typeof CrafterSlotKeySchema>;

export const CrafterMaterialSelectionSchema = z.object({
  itemId: z.string().optional(),
  level: z.number().int().min(1).max(10).default(1),
});

export type CrafterMaterialSelection = z.infer<typeof CrafterMaterialSelectionSchema>;

export const CrafterBuildEquipmentSlotSchema = z.object({
  appearanceId: NullableOptionalStringSchema,
  baseId: NullableOptionalStringSchema,
  recipe: z.array(CrafterMaterialSelectionSchema).default([]),
  inherits: z.array(CrafterMaterialSelectionSchema).default([]),
  upgrades: z.array(CrafterMaterialSelectionSchema).default([]),
});

export type CrafterBuildEquipmentSlot = z.infer<typeof CrafterBuildEquipmentSlotSchema>;

export const CrafterBuildFoodSchema = z.object({
  baseId: NullableOptionalStringSchema,
  recipe: z.array(CrafterMaterialSelectionSchema).default([]),
});

export type CrafterBuildFood = z.infer<typeof CrafterBuildFoodSchema>;

export const CrafterDefaultsSchema = z.object({
  weapon: CrafterBuildEquipmentSlotSchema,
  armor: CrafterBuildEquipmentSlotSchema,
  headgear: CrafterBuildEquipmentSlotSchema,
  shield: CrafterBuildEquipmentSlotSchema,
  accessory: CrafterBuildEquipmentSlotSchema,
  shoes: CrafterBuildEquipmentSlotSchema,
  food: CrafterBuildFoodSchema,
});

export type CrafterDefaults = z.infer<typeof CrafterDefaultsSchema>;

export const CrafterSlotConfigSchema = z.object({
  key: CrafterSlotKeySchema,
  label: z.string(),
  stationType: z.enum(['Forging', 'Crafting']),
  stations: z.array(z.string()).default([]),
  supportsAppearance: z.boolean().default(false),
  supportsBaseSelection: z.boolean().default(false),
  recipeSlots: z.number().int().min(0).default(0),
  inheritSlots: z.number().int().min(0).default(0),
  upgradeSlots: z.number().int().min(0).default(0),
  carrierId: z.string().nullable().optional(),
  levelBonusTargets: z.array(z.enum(['atk', 'matk', 'def', 'mdef'])).default([]),
  rarityBonusTarget: z.enum(['weapon', 'atk', 'matk', 'def', 'mdef']).default('def'),
});

export type CrafterSlotConfig = z.infer<typeof CrafterSlotConfigSchema>;

export const CrafterMaterialRuleSchema = z.object({
  itemId: z.string(),
  behavior: z.enum(['invert', 'doublePrevious', 'tenFoldPrevious', 'lightOre']),
});

export type CrafterMaterialRule = z.infer<typeof CrafterMaterialRuleSchema>;

export const CrafterTierSchema = z.object({
  threshold: z.number(),
  tier: z.number().int().min(0),
  label: z.string(),
  stats: ItemStatsSchema.default({}),
});

export type CrafterTier = z.infer<typeof CrafterTierSchema>;

export const CrafterBonusSummarySchema = z.object({
  value: z.number(),
  tier: z.number().int().min(0),
  overflow: z.number(),
  label: z.string(),
  stats: ItemStatsSchema.default({}),
  currentThreshold: z.number(),
  nextThreshold: z.number().optional(),
  remainingToNext: z.number().min(0),
  isMaxTier: z.boolean(),
  progressRatio: z.number().min(0).max(1),
});

export type CrafterBonusSummary = z.infer<typeof CrafterBonusSummarySchema>;

export const CrafterFoodOverrideSchema = z.object({
  additive: ItemStatsSchema.default({}),
  multipliers: ItemStatsSchema.default({}),
});

export type CrafterFoodOverride = z.infer<typeof CrafterFoodOverrideSchema>;

export const CrafterEquipmentPayloadSchema = z.object({
  itemName: NullableOptionalStringSchema,
  weaponClass: NullableOptionalStringSchema,
  stats: ItemStatsSchema.default({}),
  resistances: CrafterResistanceSchema.default({}),
  statusAttacks: CrafterStatusAttackSchema.default({}),
  geometry: CrafterGeometrySchema.default({}),
  attackType: NullableOptionalStringSchema,
  element: NullableOptionalStringSchema,
  damageType: NullableOptionalStringSchema,
  rarity: z.number().int().min(0).optional(),
  bonusType: NullableOptionalStringSchema,
  bonusType2: NullableOptionalStringSchema,
});

export type CrafterEquipmentPayload = z.infer<typeof CrafterEquipmentPayloadSchema>;

export const CrafterFoodPayloadSchema = z.object({
  itemName: NullableOptionalStringSchema,
  additive: ItemStatsSchema.default({}),
  multipliers: ItemStatsSchema.default({}),
  resistances: CrafterResistanceSchema.default({}),
  statusAttacks: CrafterStatusAttackSchema.default({}),
  status: z.record(z.string(), z.number()).optional(),
  lightRes: z.number().optional(),
});

export type CrafterFoodPayload = z.infer<typeof CrafterFoodPayloadSchema>;

export const CrafterRecipeDefinitionSchema = z.object({
  station: z.string(),
  materials: z.array(z.string()).default([]),
});

export type CrafterRecipeDefinition = z.infer<typeof CrafterRecipeDefinitionSchema>;

export const CrafterBonusEffectSchema = z.object({
  itemName: z.string(),
  kind: z.enum(['accessory', 'boots']),
});

export type CrafterBonusEffect = z.infer<typeof CrafterBonusEffectSchema>;

export const CrafterStaffChargeAttackSchema = z.object({
  itemName: NullableOptionalStringSchema,
  lv1: NullableOptionalStringSchema,
  lv2: NullableOptionalStringSchema,
  lv3: NullableOptionalStringSchema,
  speed: z.number().optional(),
  rarity: z.number().int().min(0).optional(),
});

export type CrafterStaffChargeAttack = z.infer<typeof CrafterStaffChargeAttackSchema>;

export const CrafterStaffBaseSchema = z.object({
  itemName: NullableOptionalStringSchema,
  itemLevel: z.number().int().min(0).default(0),
  maxCharge: z.number().int().min(0).default(0),
});

export type CrafterStaffBase = z.infer<typeof CrafterStaffBaseSchema>;

export const ItemCrafterDataSchema = z.object({
  equipment: z
    .object({
      weapon: CrafterEquipmentPayloadSchema.omit({ itemName: true }).optional(),
      armor: CrafterEquipmentPayloadSchema.omit({ itemName: true }).optional(),
    })
    .strict()
    .optional(),
  foodBase: CrafterFoodPayloadSchema.omit({ itemName: true }).optional(),
  material: z
    .object({
      weapon: CrafterEquipmentPayloadSchema.omit({ itemName: true }).optional(),
      armor: CrafterEquipmentPayloadSchema.omit({ itemName: true }).optional(),
      food: CrafterFoodPayloadSchema.omit({ itemName: true }).optional(),
    })
    .strict()
    .optional(),
  specialMaterialRule: CrafterMaterialRuleSchema.omit({ itemId: true }).optional(),
  bonusEffect: CrafterBonusEffectSchema.omit({ itemName: true }).optional(),
  staff: z
    .object({
      chargeAttack: CrafterStaffChargeAttackSchema.omit({ itemName: true }).optional(),
      base: CrafterStaffBaseSchema.omit({ itemName: true }).optional(),
    })
    .strict()
    .optional(),
}).strict();

export type ItemCrafterData = z.infer<typeof ItemCrafterDataSchema>;

export const CrafterFixtureSchema = z.object({
  build: CrafterDefaultsSchema,
  expected: z.object({
    finalStats: ItemStatsSchema.default({}),
    effectiveStats: ItemStatsSchema.default({}),
    resistances: CrafterResistanceSchema.default({}),
    shieldCoverage: z.enum(['full', 'partial', 'none']).optional(),
    attackType: z.string().optional(),
    element: z.string().optional(),
    damageType: z.string().optional(),
    effects: z.array(z.string()).default([]),
  }),
});

export type CrafterFixture = z.infer<typeof CrafterFixtureSchema>;

export const CrafterConfigSchema = z.object({
  schemaVersion: z.number().int().min(1).default(1),
  slotConfigs: z.array(CrafterSlotConfigSchema),
  defaults: CrafterDefaultsSchema,
  weaponClassByStation: z.record(z.string(), z.string()).default({}),
  shieldCoverageByWeaponClass: z.record(z.string(), z.enum(['full', 'partial', 'none'])).default({}),
  starterWeaponByClass: z.record(z.string(), z.string().nullable()).default({}),
  chargeAttackByWeaponClass: z.record(z.string(), z.string()).default({}),
  staffChargeByCrystalId: z.record(z.string(), z.string()).default({}),
  levelBonusTiers: z.array(CrafterTierSchema).default([]),
  rarityBonusTiers: z.array(CrafterTierSchema).default([]),
  foodOverrides: z.record(z.string(), CrafterFoodOverrideSchema).default({}),
  fixtures: z
    .object({
      workbookSample: CrafterFixtureSchema.optional(),
    })
    .default({}),
});

export type CrafterConfig = z.infer<typeof CrafterConfigSchema>;

export const CrafterDataSchema = z.object({
  schemaVersion: z.number().int().min(1).default(1),
  slotConfigs: z.array(CrafterSlotConfigSchema),
  defaults: CrafterDefaultsSchema,
  specialMaterialRules: z.array(CrafterMaterialRuleSchema).default([]),
  weaponClassByStation: z.record(z.string(), z.string()).default({}),
  shieldCoverageByWeaponClass: z.record(z.string(), z.enum(['full', 'partial', 'none'])).default({}),
  starterWeaponByClass: z.record(z.string(), z.string().nullable()).default({}),
  chargeAttackByWeaponClass: z.record(z.string(), z.string()).default({}),
  staffChargeByCrystalId: z.record(z.string(), z.string()).default({}),
  levelBonusTiers: z.array(CrafterTierSchema).default([]),
  rarityBonusTiers: z.array(CrafterTierSchema).default([]),
  foodOverrides: z.record(z.string(), CrafterFoodOverrideSchema).default({}),
  recipes: z
    .object({
      equipment: z.record(z.string(), z.record(z.string(), CrafterRecipeDefinitionSchema)).default({}),
      food: z.record(z.string(), CrafterRecipeDefinitionSchema).default({}),
    })
    .default({ equipment: {}, food: {} }),
  stats: z
    .object({
      weapon: z.record(z.string(), CrafterEquipmentPayloadSchema).default({}),
      armor: z.record(z.string(), CrafterEquipmentPayloadSchema).default({}),
    })
    .default({ weapon: {}, armor: {} }),
  materials: z
    .object({
      weapon: z.record(z.string(), CrafterEquipmentPayloadSchema).default({}),
      armor: z.record(z.string(), CrafterEquipmentPayloadSchema).default({}),
      food: z.record(z.string(), CrafterFoodPayloadSchema).default({}),
    })
    .default({ weapon: {}, armor: {}, food: {} }),
  food: z
    .object({
      baseStats: z.record(z.string(), CrafterFoodPayloadSchema).default({}),
    })
    .default({ baseStats: {} }),
  bonusEffects: z.record(z.string(), CrafterBonusEffectSchema).default({}),
  staff: z
    .object({
      chargeAttacks: z.record(z.string(), CrafterStaffChargeAttackSchema).default({}),
      bases: z.record(z.string(), CrafterStaffBaseSchema).default({}),
    })
    .default({ chargeAttacks: {}, bases: {} }),
  fixtures: z
    .object({
      workbookSample: CrafterFixtureSchema.optional(),
    })
    .default({}),
});

export type CrafterData = z.infer<typeof CrafterDataSchema>;

export const CrafterWarningSchema = z.object({
  code: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  slot: z.string().optional(),
  message: z.string(),
});

export type CrafterWarning = z.infer<typeof CrafterWarningSchema>;
