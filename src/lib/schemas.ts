import { z } from 'zod';

const ItemEffectSchema = z.discriminatedUnion('type', [
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

const ItemStatsSchema = z.object({
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
      })
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
      })
    )
    .optional(),
  stats: ItemStatsSchema.optional(),
  effects: z.array(ItemEffectSchema).optional(),
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
    })
  ).optional(),
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

const NullableOptionalStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? undefined);

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

const CrafterResistanceSchema = z
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

const CrafterStatusAttackSchema = z
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

const CrafterGeometrySchema = z
  .object({
    depth: z.number().optional(),
    length: z.number().optional(),
    width: z.number().optional(),
  })
  .default({});
export type CrafterGeometry = z.infer<typeof CrafterGeometrySchema>;

const CrafterEquipmentPayloadSchema = z.object({
  itemName: NullableOptionalStringSchema,
  weaponClass: NullableOptionalStringSchema,
  stats: ItemStatsSchema.default({}),
  resistances: CrafterResistanceSchema.default({}),
  statusAttacks: CrafterStatusAttackSchema.default({}),
  geometry: CrafterGeometrySchema.default({}),
  attackType: NullableOptionalStringSchema,
  element: NullableOptionalStringSchema,
  damageType: NullableOptionalStringSchema,
  rarity: z.number().int().min(0).default(0),
  bonusType: NullableOptionalStringSchema,
  bonusType2: NullableOptionalStringSchema,
});
export type CrafterEquipmentPayload = z.infer<typeof CrafterEquipmentPayloadSchema>;

const CrafterFoodPayloadSchema = z.object({
  itemName: NullableOptionalStringSchema,
  additive: ItemStatsSchema.default({}),
  multipliers: ItemStatsSchema.default({}),
  resistances: CrafterResistanceSchema.default({}),
  statusAttacks: CrafterStatusAttackSchema.default({}),
  status: z.record(z.string(), z.number()).optional(),
  lightRes: z.number().optional(),
});
export type CrafterFoodPayload = z.infer<typeof CrafterFoodPayloadSchema>;

const CrafterRecipeDefinitionSchema = z.object({
  itemName: z.string(),
  station: z.string(),
  materials: z.array(z.string().nullable()).default([]),
  materialNames: z.array(z.string().nullable()).default([]),
  rarity: z.number().int().min(0).default(0),
});
export type CrafterRecipeDefinition = z.infer<typeof CrafterRecipeDefinitionSchema>;

const CrafterBonusEffectSchema = z.object({
  itemName: z.string(),
  kind: z.enum(['accessory', 'boots']),
});
export type CrafterBonusEffect = z.infer<typeof CrafterBonusEffectSchema>;

const CrafterStaffChargeAttackSchema = z.object({
  itemName: NullableOptionalStringSchema,
  lv1: NullableOptionalStringSchema,
  lv2: NullableOptionalStringSchema,
  lv3: NullableOptionalStringSchema,
  speed: z.number().optional(),
  rarity: z.number().int().min(0).default(0),
});
export type CrafterStaffChargeAttack = z.infer<typeof CrafterStaffChargeAttackSchema>;

const CrafterStaffBaseSchema = z.object({
  itemName: NullableOptionalStringSchema,
  itemLevel: z.number().int().min(0).default(0),
  maxCharge: z.number().int().min(0).default(0),
});
export type CrafterStaffBase = z.infer<typeof CrafterStaffBaseSchema>;

const CrafterFixtureSchema = z.object({
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
