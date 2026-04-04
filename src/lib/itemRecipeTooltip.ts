import type { Item } from '@/lib/schemas';

export type ItemRecipeTooltipItem = Pick<Item, 'id' | 'name' | 'image' | 'craft' | 'craftedFrom'>;
export type ItemRecipeTooltipLookup = Record<string, ItemRecipeTooltipItem>;

export function buildItemRecipeTooltipLookup(
  items: Record<string, Item> | readonly Item[],
): ItemRecipeTooltipLookup {
  const entries = Array.isArray(items) ? items : Object.values(items);

  return Object.fromEntries(
    entries.map((item) => [
      item.id,
      {
        id: item.id,
        name: item.name,
        image: item.image,
        craft: item.craft,
        craftedFrom: item.craftedFrom,
      } satisfies ItemRecipeTooltipItem,
    ]),
  );
}
