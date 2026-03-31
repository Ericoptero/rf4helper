import {
  CrafterDataSchema,
  type CrafterConfig,
  type CrafterData,
  type CrafterEquipmentPayload,
  type CrafterSlotConfig,
  type Item,
  type CrafterFoodPayload,
  type CrafterStaffChargeAttack,
} from './schemas';
import type { CrafterBootstrapItem } from './crafterCommon';
import { resolveCrafterRuntimeRarity } from './crafterRarity';

function resolveCrafterRarity(item: Item, payload?: { rarity?: number }) {
  return resolveCrafterRuntimeRarity(item, payload);
}

function addItemNameWithRarity(
  item: Item,
  payload: Omit<CrafterEquipmentPayload, 'itemName'> | undefined,
): CrafterEquipmentPayload | undefined {
  if (!payload) return undefined;
  return {
    ...payload,
    itemName: item.name,
    rarity: resolveCrafterRarity(item, payload),
  };
}

function addItemNameToFood(
  itemName: string,
  payload: Omit<CrafterFoodPayload, 'itemName'> | undefined,
): CrafterFoodPayload | undefined {
  if (!payload) return undefined;
  return {
    ...payload,
    itemName,
  };
}

function addItemNameToStaffCharge(
  item: Item,
  payload: Omit<CrafterStaffChargeAttack, 'itemName'> | undefined,
): CrafterStaffChargeAttack | undefined {
  if (!payload) return undefined;
  return {
    ...payload,
    itemName: item.name,
    rarity: resolveCrafterRarity(item, payload),
  };
}

function hasWeaponRole(item: Item, slotConfig: CrafterSlotConfig | undefined) {
  return slotConfig ? itemMatchesCrafterSlot(item, slotConfig) : false;
}

function hasArmorRole(item: Item, slotConfigs: CrafterSlotConfig[]) {
  return slotConfigs.some((slotConfig) => itemMatchesCrafterSlot(item, slotConfig));
}

function hasFoodRole(item: Item) {
  return Boolean(item.craft?.some((craft) => craft.stationType === 'Cooking') || item.crafter?.foodBase);
}

export function normalizeCrafterStation(station: string | null | undefined) {
  switch (station ?? undefined) {
    case 'Axe':
    case 'Hammer':
      return 'Axe/Hammer';
    case 'Pole':
      return 'Spear';
    case 'Hoe':
    case 'Sickle':
    case 'Waterpot':
      return 'Farm';
    case 'No Tool':
      return 'Handmade';
    case 'Steamed':
      return 'Steamer';
    default:
      return station ?? undefined;
  }
}

export function craftMatchesCrafterSlot(
  craft: NonNullable<Item['craft']>[number],
  slotConfig: CrafterSlotConfig,
) {
  if (craft.stationType !== slotConfig.stationType) return false;
  if (slotConfig.stations.length === 0) return true;

  const station = normalizeCrafterStation(craft.station) ?? '';
  return slotConfig.stations.some((candidate) => normalizeCrafterStation(candidate) === station);
}

export function itemMatchesCrafterSlot(item: CrafterBootstrapItem | Item | undefined, slotConfig: CrafterSlotConfig) {
  return Boolean(item?.craft?.some((craft) => craftMatchesCrafterSlot(craft, slotConfig)));
}

function buildRecipeDefinition(craft: NonNullable<Item['craft']>[number] | undefined) {
  if (!craft) return undefined;
  return {
    station: normalizeCrafterStation(craft.station) ?? craft.station ?? craft.stationType,
    materials: [...craft.ingredients],
  };
}

function buildEquipmentRecipes(items: Record<string, Item>, slotConfigs: CrafterConfig['slotConfigs']) {
  const recipes: CrafterData['recipes']['equipment'] = {
    weapon: {},
    armor: {},
    headgear: {},
    shield: {},
    accessory: {},
    shoes: {},
  };

  for (const slotConfig of slotConfigs) {
    for (const [itemId, item] of Object.entries(items)) {
      const craft = item.craft?.find((candidate) => craftMatchesCrafterSlot(candidate, slotConfig));
      const recipe = buildRecipeDefinition(craft);
      if (!recipe) continue;
      recipes[slotConfig.key][itemId] = recipe;
    }
  }

  return recipes;
}

function buildFoodRecipes(items: Record<string, Item>) {
  const recipes: CrafterData['recipes']['food'] = {};

  for (const [itemId, item] of Object.entries(items)) {
    const craft = item.craft?.find((candidate) => candidate.stationType === 'Cooking');
    const recipe = buildRecipeDefinition(craft);
    if (!recipe) continue;
    recipes[itemId] = recipe;
  }

  return recipes;
}

export function buildCrafterData(items: Record<string, Item>, crafterConfig: CrafterConfig): CrafterData {
  const stats: CrafterData['stats'] = { weapon: {}, armor: {} };
  const materials: CrafterData['materials'] = { weapon: {}, armor: {}, food: {} };
  const food: CrafterData['food'] = { baseStats: {} };
  const bonusEffects: CrafterData['bonusEffects'] = {};
  const staff: CrafterData['staff'] = { chargeAttacks: {}, bases: {} };
  const specialMaterialRules: CrafterData['specialMaterialRules'] = [];
  const weaponSlotConfig = crafterConfig.slotConfigs.find((entry) => entry.key === 'weapon');
  const armorSlotConfigs = crafterConfig.slotConfigs.filter((entry) => entry.key !== 'weapon');

  for (const [itemId, item] of Object.entries(items)) {
    const hasWeaponEquipmentRole = hasWeaponRole(item, weaponSlotConfig);
    const hasArmorEquipmentRole = hasArmorRole(item, armorSlotConfigs);

    if (hasWeaponEquipmentRole) {
      const payload = addItemNameWithRarity(item, item.crafter?.equipment?.weapon);

      if (payload) {
        stats.weapon[itemId] = payload;
      }
    }

    if (hasArmorEquipmentRole) {
      const payload = addItemNameWithRarity(item, item.crafter?.equipment?.armor);

      if (payload) {
        stats.armor[itemId] = payload;
      }
    }

    const resolvedFoodBasePayload = hasFoodRole(item) ? addItemNameToFood(item.name, item.crafter?.foodBase) : undefined;
    if (resolvedFoodBasePayload) {
      food.baseStats[itemId] = resolvedFoodBasePayload;
    }

    const materialWeaponPayload = addItemNameWithRarity(item, item.crafter?.material?.weapon);
    if (materialWeaponPayload) {
      materials.weapon[itemId] = materialWeaponPayload;
    }

    const materialArmorPayload = addItemNameWithRarity(item, item.crafter?.material?.armor);
    if (materialArmorPayload) {
      materials.armor[itemId] = materialArmorPayload;
    }

    const materialFoodPayload = addItemNameToFood(item.name, item.crafter?.material?.food);
    if (materialFoodPayload) {
      materials.food[itemId] = materialFoodPayload;
    }

    if (item.crafter?.specialMaterialRule) {
      specialMaterialRules.push({
        itemId,
        behavior: item.crafter.specialMaterialRule.behavior,
      });
    }

    if (item.crafter?.bonusEffect) {
      bonusEffects[itemId] = {
        itemName: item.name,
        kind: item.crafter.bonusEffect.kind,
      };
    }

    if (item.crafter?.staff?.chargeAttack) {
      const payload = addItemNameToStaffCharge(item, item.crafter.staff.chargeAttack);
      if (payload) {
        staff.chargeAttacks[itemId] = payload;
      }
    }

    if (item.crafter?.staff?.base) {
      staff.bases[itemId] = {
        itemName: item.name,
        ...item.crafter.staff.base,
      };
    }
  }

  const crafterData = {
    schemaVersion: crafterConfig.schemaVersion,
    slotConfigs: crafterConfig.slotConfigs,
    defaults: crafterConfig.defaults,
    specialMaterialRules,
    weaponClassByStation: crafterConfig.weaponClassByStation,
    shieldCoverageByWeaponClass: crafterConfig.shieldCoverageByWeaponClass,
    starterWeaponByClass: crafterConfig.starterWeaponByClass,
    chargeAttackByWeaponClass: crafterConfig.chargeAttackByWeaponClass,
    staffChargeByCrystalId: crafterConfig.staffChargeByCrystalId,
    levelBonusTiers: [...crafterConfig.levelBonusTiers].sort((left, right) => left.threshold - right.threshold),
    rarityBonusTiers: [...crafterConfig.rarityBonusTiers].sort((left, right) => left.threshold - right.threshold),
    foodOverrides: crafterConfig.foodOverrides,
    recipes: {
      equipment: buildEquipmentRecipes(items, crafterConfig.slotConfigs),
      food: buildFoodRecipes(items),
    },
    stats,
    materials,
    food,
    bonusEffects,
    staff,
    fixtures: crafterConfig.fixtures,
  } satisfies CrafterData;

  return CrafterDataSchema.parse(crafterData);
}
