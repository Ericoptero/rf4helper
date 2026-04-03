import type { DetailEntityReference } from '@/components/details/detailTypes';
import type { MapRegionRecord } from '@/lib/mapFishingRelations';
import type { MonsterGroup } from '@/lib/monsterGroups';
import type {
  Character,
  Crop,
  Festival,
  Fish,
  Item,
} from '@/lib/schemas';

import {
  getCharactersData,
  getCropsById,
  getFestivalsById,
  getFishById,
  getItemCropRelationsByItemId,
  getItemDropSourcesByItemId,
  getItemsData,
  getMapRegionsById,
  getMonsterGroupsByDetailId,
  type ItemCropRelation,
  type MonsterDropSource,
} from './data/loaders';

export type DetailMonsterDropSource = MonsterDropSource;
export type DetailItemCropRelation = ItemCropRelation;

export type DetailPayload =
  | {
      type: 'item';
      item: Item;
      items: Record<string, Item>;
      dropSources: DetailMonsterDropSource[];
      cropRelations: DetailItemCropRelation[];
      monsterReferenceId?: string;
      mapReferenceId?: string;
    }
  | { type: 'character'; character: Character; items: Record<string, Item> }
  | { type: 'birthday'; character: Character; items: Record<string, Item> }
  | { type: 'monster'; group: MonsterGroup; items: Record<string, Item> }
  | { type: 'fish'; fish: Fish }
  | { type: 'map'; region: MapRegionRecord; items: Record<string, Item> }
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

function getPrimaryRecipeIngredientIds(item: Item | undefined) {
  return item?.craft?.[0]?.ingredients ?? item?.craftedFrom?.[0]?.ingredients ?? [];
}

function expandLinkedItemIds(items: Record<string, Item>, itemIds: Iterable<string>) {
  const expanded = new Set<string>();

  for (const itemId of itemIds) {
    if (!itemId || expanded.has(itemId)) {
      continue;
    }

    expanded.add(itemId);

    for (const ingredientId of getPrimaryRecipeIngredientIds(items[itemId])) {
      expanded.add(ingredientId);
    }
  }

  return expanded;
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

function getMonsterDetailItemIds(group: MonsterGroup) {
  return group.variants.flatMap((variant) => [
    ...variant.drops.flatMap((drop) => (drop.id ? [drop.id] : [])),
    ...(variant.taming?.favorite?.flatMap((favorite) => (favorite.id ? [favorite.id] : [])) ?? []),
    ...(variant.taming?.produce?.flatMap((produce) => (produce.id ? [produce.id] : [])) ?? []),
  ]);
}

function getMapDetailItemIds(region: MapRegionRecord) {
  return region.chests.flatMap((chest) => (chest.itemId ? [chest.itemId] : []));
}

export async function getDetailPayload(
  reference: DetailEntityReference,
): Promise<DetailPayload | null> {
  switch (reference.type) {
    case 'item': {
      const [
        items,
        dropSourcesByItemId,
        cropRelationsByItemId,
        groupsById,
        mapRegionsById,
      ] = await Promise.all([
        getItemsData(),
        getItemDropSourcesByItemId(),
        getItemCropRelationsByItemId(),
        getMonsterGroupsByDetailId(),
        getMapRegionsById(),
      ]);
      const item = items[reference.id];

      if (!item) {
        return null;
      }

      const cropRelations = cropRelationsByItemId.get(reference.id) ?? [];
      const linkedItemIds = [
        ...getItemDetailItemIds(item),
        ...cropRelations.flatMap((relation) => (relation.counterpartItemId ? [relation.counterpartItemId] : [])),
      ];

      return {
        type: 'item',
        item,
        items: pickItems(items, expandLinkedItemIds(items, linkedItemIds)),
        dropSources: dropSourcesByItemId.get(reference.id) ?? [],
        cropRelations,
        monsterReferenceId: item.monster && groupsById.has(item.monster) ? item.monster : undefined,
        mapReferenceId: item.region && mapRegionsById.has(item.region) ? item.region : undefined,
      };
    }
    case 'character':
    case 'birthday': {
      const [characters, items] = await Promise.all([getCharactersData(), getItemsData()]);
      const character = characters[reference.id];

      if (!character) {
        return null;
      }

      const linkedItems = pickItems(items, expandLinkedItemIds(items, getCharacterDetailItemIds(character)));

      return reference.type === 'character'
        ? { type: 'character', character, items: linkedItems }
        : { type: 'birthday', character, items: linkedItems };
    }
    case 'monster': {
      const [groupsById, items] = await Promise.all([getMonsterGroupsByDetailId(), getItemsData()]);
      const group = groupsById.get(reference.id);
      return group ? { type: 'monster', group, items: pickItems(items, expandLinkedItemIds(items, getMonsterDetailItemIds(group))) } : null;
    }
    case 'fish': {
      const fishEntry = (await getFishById()).get(reference.id);
      return fishEntry ? { type: 'fish', fish: fishEntry } : null;
    }
    case 'map': {
      const [mapRegionsById, items] = await Promise.all([getMapRegionsById(), getItemsData()]);
      const region = mapRegionsById.get(reference.id);
      return region ? { type: 'map', region, items: pickItems(items, expandLinkedItemIds(items, getMapDetailItemIds(region))) } : null;
    }
    case 'festival': {
      const festival = (await getFestivalsById()).get(reference.id);
      return festival ? { type: 'festival', festival } : null;
    }
    case 'crop': {
      const crop = (await getCropsById()).get(reference.id);
      return crop ? { type: 'crop', crop } : null;
    }
    default:
      return null;
  }
}
