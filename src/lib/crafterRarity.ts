import type { CrafterSlotKey, Item } from './schemas';

export type CrafterRarityNodeType = 'base' | 'recipe' | 'inherit' | 'upgrade' | 'foodBase';
export type CrafterRarityContextSlot = CrafterSlotKey | 'food';
export type CrafterRarityContributionSource =
  | 'base'
  | 'recipe'
  | 'inherit'
  | 'upgrade'
  | 'food'
  | 'foodIngredient'
  | 'bonus';

export const CRAFTER_RARITY_PLACEHOLDER_ID = 'crafter-rarity-placeholder-15';
export const CRAFTER_RARITY_PLACEHOLDER_NAME = 'Rarity +15';
export const CRAFTER_RARITY_PLACEHOLDER_VALUE = 15;

export function isCrafterRarityPlaceholder(itemId: string | undefined) {
  return itemId === CRAFTER_RARITY_PLACEHOLDER_ID;
}

export function resolveCrafterRuntimeRarity(
  item: Pick<Item, 'rarityPoints'>,
  payload?: {
    rarity?: number;
  },
) {
  return item.rarityPoints ?? payload?.rarity ?? 0;
}

function resolveCrafterStoredRarity({
  item,
  itemId,
  rarity,
}: {
  item?: Pick<Item, 'rarityPoints'>;
  itemId?: string;
  rarity?: number;
}) {
  if (isCrafterRarityPlaceholder(itemId)) return CRAFTER_RARITY_PLACEHOLDER_VALUE;
  return rarity ?? item?.rarityPoints ?? 0;
}

export function shouldCountForRarityBonus(source: CrafterRarityContributionSource) {
  return source === 'recipe' || source === 'upgrade';
}

export function getEffectiveCrafterNodeRarity({
  slot,
  type,
  item,
  itemId,
  rarity,
}: {
  slot: CrafterRarityContextSlot;
  type: CrafterRarityNodeType;
  item?: Pick<Item, 'rarityPoints'>;
  itemId?: string;
  rarity?: number;
}) {
  if (type === 'base' && slot !== 'food') return 0;
  return resolveCrafterStoredRarity({ item, itemId, rarity });
}

export function getCrafterSelectableRarity({
  slot,
  type,
  item,
  itemId,
  rarity,
}: {
  slot: CrafterRarityContextSlot;
  type: CrafterRarityNodeType;
  item?: Pick<Item, 'rarityPoints'>;
  itemId?: string;
  rarity?: number;
}) {
  return getEffectiveCrafterNodeRarity({ slot, type, item, itemId, rarity });
}
