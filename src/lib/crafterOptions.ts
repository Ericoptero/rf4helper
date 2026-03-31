import { getDisplayStats, hasDisplayEffects } from './itemPresentation';
import { itemMatchesCrafterSlot } from './crafterData';
import type { CrafterData, CrafterSlotKey, Item } from './schemas';

export type CrafterOptionLists = {
  anyItemIds: string[];
  foodItemIds: string[];
  materialItemIds: string[];
  slotItemIds: Record<CrafterSlotKey, string[]>;
};

export function buildCrafterOptionLists(
  items: Record<string, Item>,
  crafterData: CrafterData,
): CrafterOptionLists {
  const sortedItems = Object.values(items).sort((left, right) => left.name.localeCompare(right.name));

  return {
    anyItemIds: sortedItems.map((item) => item.id),
    foodItemIds: sortedItems
      .filter((item) => item.craft?.some((craft) => craft.stationType === 'Cooking'))
      .map((item) => item.id),
    materialItemIds: sortedItems
      .filter((item) =>
        Boolean(item.crafter?.material?.weapon)
        || Boolean(item.crafter?.material?.armor)
        || Boolean(item.crafter?.material?.food)
        || hasDisplayEffects(item)
        || Boolean(getDisplayStats(item))
        || item.rarityPoints != null
        || Boolean(item.craft?.length),
      )
      .map((item) => item.id),
    slotItemIds: Object.fromEntries(
      crafterData.slotConfigs.map((slotConfig) => [
        slotConfig.key,
        sortedItems
          .filter((item) => itemMatchesCrafterSlot(item, slotConfig))
          .map((item) => item.id),
      ]),
    ) as Record<CrafterSlotKey, string[]>,
  };
}
