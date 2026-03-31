import { itemMatchesCrafterSlot } from './crafterData';
import {
  CRAFTER_RARITY_PLACEHOLDER_NAME,
  CRAFTER_RARITY_PLACEHOLDER_VALUE,
  isCrafterRarityPlaceholder,
} from './crafterRarity';
import type {
  CrafterData,
  CrafterEquipmentPayload,
  CrafterFoodPayload,
  CrafterMaterialSelection,
  CrafterSlotConfig,
  CrafterSlotKey,
  Item,
} from './schemas';

export type CrafterBootstrapItem = Pick<
  Item,
  'id' | 'name' | 'image' | 'type' | 'category' | 'stats' | 'craft' | 'crafter' | 'groupMembers' | 'rarityPoints' | 'effects'
>;

export function sanitizeCrafterBootstrapItems(
  items: Record<string, Item>,
): Record<string, CrafterBootstrapItem> {
  return Object.fromEntries(
    Object.entries(items).map(([itemId, item]) => [
      itemId,
      {
        id: item.id,
        name: item.name,
        image: item.image,
        type: item.type,
        category: item.category,
        stats: item.stats,
        craft: item.craft,
        crafter: item.crafter,
        groupMembers: item.groupMembers,
        rarityPoints: item.rarityPoints,
        effects: item.effects,
      } satisfies CrafterBootstrapItem,
    ]),
  );
}

export function getItemName(itemId: string | undefined, items: Record<string, CrafterBootstrapItem>, fallback?: string) {
  if (!itemId) return fallback;
  if (isCrafterRarityPlaceholder(itemId)) return CRAFTER_RARITY_PLACEHOLDER_NAME;
  return items[itemId]?.name ?? fallback ?? itemId;
}

export function getEquipmentPayload(
  slotKey: CrafterSlotKey,
  itemId: string | undefined,
  data: CrafterData,
): CrafterEquipmentPayload | undefined {
  if (!itemId) return undefined;
  return slotKey === 'weapon' ? data.stats.weapon[itemId] : data.stats.armor[itemId];
}

export function getMaterialPayload(
  slotKey: CrafterSlotKey,
  itemId: string | undefined,
  data: CrafterData,
): CrafterEquipmentPayload | undefined {
  if (!itemId) return undefined;

  if (isCrafterRarityPlaceholder(itemId)) {
    return {
      itemName: CRAFTER_RARITY_PLACEHOLDER_NAME,
      weaponClass: undefined,
      stats: {},
      resistances: {},
      statusAttacks: {},
      geometry: {},
      attackType: undefined,
      element: undefined,
      damageType: undefined,
      rarity: CRAFTER_RARITY_PLACEHOLDER_VALUE,
      bonusType: undefined,
      bonusType2: undefined,
    };
  }

  return slotKey === 'weapon' ? data.materials.weapon[itemId] : data.materials.armor[itemId];
}

export function getMaterialRarity(
  slotKey: CrafterSlotKey,
  itemId: string | undefined,
  data: CrafterData,
) {
  if (!itemId) return 0;
  if (isCrafterRarityPlaceholder(itemId)) return CRAFTER_RARITY_PLACEHOLDER_VALUE;
  return getMaterialPayload(slotKey, itemId, data)?.rarity ?? 0;
}

export function getFoodBasePayload(itemId: string | undefined, data: CrafterData): CrafterFoodPayload | undefined {
  if (!itemId) return undefined;
  return data.food.baseStats[itemId];
}

export function getFoodIngredientPayload(itemId: string | undefined, data: CrafterData): CrafterFoodPayload | undefined {
  if (!itemId) return undefined;
  return data.materials.food[itemId];
}

export function getWeaponClass(itemId: string | undefined, items: Record<string, CrafterBootstrapItem>, data: CrafterData) {
  if (!itemId) return 'Unknown';

  const payload = data.stats.weapon[itemId];
  if (payload?.weaponClass) return payload.weaponClass;

  const station = items[itemId]?.craft?.[0]?.station;
  if (!station) return 'Unknown';
  return data.weaponClassByStation[station] ?? station;
}

export function getDerivedRecipeBase(
  slotKey: CrafterSlotKey,
  appearanceId: string | undefined,
  recipeSelections: CrafterMaterialSelection[],
  items: Record<string, CrafterBootstrapItem>,
  data: CrafterData,
  slotConfig: CrafterSlotConfig,
) {
  const candidateIds = recipeSelections
    .map((selection) => selection.itemId)
    .filter((itemId): itemId is string => Boolean(itemId))
    .filter((itemId) => itemMatchesCrafterSlot(items[itemId], slotConfig));

  if (candidateIds.length === 0) {
    return {
      baseId: undefined,
      hasCraftCandidate: false,
    };
  }

  const lightOrePresent = recipeSelections.some((selection) => selection.itemId === 'item-light-ore');
  const appearanceWeaponClass = getWeaponClass(appearanceId, items, data);
  const validCandidates = candidateIds.filter((candidateId) => {
    if (slotKey !== 'weapon') return true;
    if (!appearanceId) return false;
    const candidateWeaponClass = getWeaponClass(candidateId, items, data);
    return lightOrePresent || candidateWeaponClass === appearanceWeaponClass;
  });

  return {
    baseId: validCandidates[0],
    hasCraftCandidate: true,
  };
}
