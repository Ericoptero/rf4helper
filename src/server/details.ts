import { buildMapRegions } from '@/lib/mapFishingRelations';
import { buildMonsterGroups } from '@/lib/monsterGroups';
import type {
  Character,
  Crop,
  Festival,
  Fish,
  Item,
} from '@/lib/schemas';
import type { DetailEntityReference } from '@/components/details/detailTypes';

import {
  getCharactersData,
  getChestsData,
  getCropsData,
  getFestivalsData,
  getFishData,
  getItemsData,
  getMonstersData,
} from './data/loaders';

export type DetailPayload =
  | { type: 'item'; item: Item; items: Record<string, Item> }
  | { type: 'character'; character: Character; items: Record<string, Item> }
  | { type: 'birthday'; character: Character }
  | { type: 'monster'; group: ReturnType<typeof buildMonsterGroups>[number]; items: Record<string, Item> }
  | { type: 'fish'; fish: Fish }
  | { type: 'map'; region: ReturnType<typeof buildMapRegions>[number] }
  | { type: 'festival'; festival: Festival }
  | { type: 'crop'; crop: Crop };

function pickItems(items: Record<string, Item>, itemIds: Iterable<string>) {
  const subset: Record<string, Item> = {};

  for (const itemId of new Set(itemIds)) {
    const item = items[itemId];

    if (item) {
      subset[itemId] = item;
    }
  }

  return subset;
}

function getItemDetailItemIds(item: Item) {
  return [
    ...(item.groupMembers ?? []),
    ...(item.usedInRecipes ?? []),
    ...(item.craft ?? []).flatMap((craft) => craft.ingredients),
    ...(item.craftedFrom ?? []).flatMap((craft) => craft.ingredients),
  ];
}

function getCharacterDetailItemIds(character: Character) {
  return [
    ...character.gifts.love.items,
    ...character.gifts.like.items,
    ...character.gifts.neutral.items,
    ...character.gifts.dislike.items,
    ...character.gifts.hate.items,
  ];
}

function getMonsterDetailItemIds(group: ReturnType<typeof buildMonsterGroups>[number]) {
  return group.variants.flatMap((variant) => [
    ...variant.drops.flatMap((drop) => (drop.id ? [drop.id] : [])),
    ...(variant.taming?.favorite?.flatMap((favorite) => (favorite.id ? [favorite.id] : [])) ?? []),
  ]);
}

export async function getDetailPayload(
  reference: DetailEntityReference,
): Promise<DetailPayload | null> {
  switch (reference.type) {
    case 'item': {
      const items = await getItemsData();
      const item = items[reference.id];
      return item ? { type: 'item', item, items: pickItems(items, getItemDetailItemIds(item)) } : null;
    }
    case 'character':
    case 'birthday': {
      const [characters, items] = await Promise.all([getCharactersData(), getItemsData()]);
      const character = characters[reference.id];

      if (!character) {
        return null;
      }

      return reference.type === 'character'
        ? { type: 'character', character, items: pickItems(items, getCharacterDetailItemIds(character)) }
        : { type: 'birthday', character };
    }
    case 'monster': {
      const [monsters, items] = await Promise.all([getMonstersData(), getItemsData()]);
      const groups = buildMonsterGroups(Object.values(monsters));
      const group = groups.find((entry) => entry.key === reference.id || entry.representative.id === reference.id);
      return group ? { type: 'monster', group, items: pickItems(items, getMonsterDetailItemIds(group)) } : null;
    }
    case 'fish': {
      const fish = await getFishData();
      const fishEntry = fish.find((entry) => entry.id === reference.id);
      return fishEntry ? { type: 'fish', fish: fishEntry } : null;
    }
    case 'map': {
      const [chests, fish] = await Promise.all([getChestsData(), getFishData()]);
      const regions = buildMapRegions(chests, fish);
      const region = regions.find((entry) => entry.id === reference.id);
      return region ? { type: 'map', region } : null;
    }
    case 'festival': {
      const festivals = await getFestivalsData();
      const festival = festivals.find((entry) => entry.id === reference.id);
      return festival ? { type: 'festival', festival } : null;
    }
    case 'crop': {
      const crops = await getCropsData();
      const crop = crops.regularCrops.find((entry) => entry.id === reference.id);
      return crop ? { type: 'crop', crop } : null;
    }
    default:
      return null;
  }
}
