import type { CrafterBonusSummary, CrafterSlotKey, CrafterWarning } from './schemas';
import type {
  CrafterBuild,
  CrafterStatBlock,
  GeometryMap,
  ResistanceMap,
  StatusAttackMap,
} from './crafterMath';

export type { CrafterBuild, CrafterStatBlock, GeometryMap, ResistanceMap, StatusAttackMap };

export type CrafterContribution = {
  itemId: string;
  itemName: string;
  source: 'base' | 'recipe' | 'inherit' | 'upgrade' | 'food' | 'foodIngredient' | 'bonus';
  behavior?: string;
  label?: string;
  level: number;
  rarity: number;
  stats: CrafterStatBlock;
  resistances: ResistanceMap;
  statusAttacks: StatusAttackMap;
  geometry: GeometryMap;
};

export type CrafterSlotResult = {
  slot: CrafterSlotKey;
  label: string;
  appearanceName?: string;
  baseName?: string;
  carrierName?: string;
  recipeIngredients: string[];
  itemLevel: number;
  level: number;
  rarity: number;
  tier: number;
  levelTier: number;
  rarityTier: number;
  levelBonusSummary: CrafterBonusSummary;
  rarityBonusSummary: CrafterBonusSummary;
  stats: CrafterStatBlock;
  resistances: ResistanceMap;
  statusAttacks: StatusAttackMap;
  geometry: GeometryMap;
  effects: string[];
  attackType?: string;
  element?: string;
  damageType?: string;
  materialContributions: CrafterContribution[];
  craftSteps: string[];
};

export type CrafterCalculation = {
  build: CrafterBuild;
  slotResults: Record<CrafterSlotKey, CrafterSlotResult>;
  equipmentStats: CrafterStatBlock;
  equipmentGeometry: GeometryMap;
  equipmentEffectiveStats: CrafterStatBlock;
  effectiveStats: CrafterStatBlock;
  geometry: GeometryMap;
  foodSummary: {
    healing: {
      hp: number;
      hpPercent: number;
      rp: number;
      rpPercent: number;
    };
    stats: {
      additive: CrafterStatBlock;
      multipliers: CrafterStatBlock;
    };
    additive: CrafterStatBlock;
    multipliers: CrafterStatBlock;
    resistances: ResistanceMap;
    statusAttacks: StatusAttackMap;
    totalLevel: number;
    finalLevel: number;
  };
  totalStats: CrafterStatBlock;
  resistances: ResistanceMap;
  equipmentResistances: ResistanceMap;
  statusAttacks: StatusAttackMap;
  warnings: CrafterWarning[];
  bonusSummary: {
    level: CrafterBonusSummary;
    rarity: CrafterBonusSummary;
  };
  shieldSummary: {
    coverage: 'full' | 'partial' | 'none';
    factor: number;
  };
  attackSummary: {
    weaponClass: string;
    attackType: string;
    element: string;
    damageType: string;
    chargeAttack: string;
    staffCharges?: {
      lv1?: string;
      lv2?: string;
      lv3?: string;
      maxCharge?: number;
      speed?: number;
    };
  };
  allEffects: string[];
  craftSteps: string[];
};

export {
  createDefaultCrafterBuild,
  deserializeCrafterBuild,
  normalizeCrafterBuild,
  serializeCrafterBuild,
} from './crafterSerialization';
export { calculateCrafterBuild, calculateCrafterSlotResult } from './crafterCalculation';
