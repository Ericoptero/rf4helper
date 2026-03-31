import type { CrafterBuildState, CrafterCalculation } from '@/lib/crafter';
import { applyDefaultRecipeSelections, padSelections } from '@/lib/crafterRecipeSelections';
import type { CrafterData, CrafterSlotConfig, CrafterSlotKey, Item } from '@/lib/schemas';
import type { CrafterEditorSlot, CrafterGridSection, CrafterNodeType } from './crafterTypes';
import {
  getCrafterDisplayItem,
  getEquipmentRecipeDefaults,
  getEquipmentRecipeSourceItemId,
  getFoodRecipeDefaults,
  getNodeEffectiveRarity,
} from './crafterNodeBehavior';

const FOOD_RECIPE_SLOTS = 6;

export function buildGridSectionsForSlot({
  activeSlot,
  build,
  items,
  crafterData,
  slotConfigByKey,
  calculation,
}: {
  activeSlot: CrafterEditorSlot;
  build: CrafterBuildState;
  items: Record<string, Item>;
  crafterData: CrafterData;
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>;
  calculation: CrafterCalculation;
}): CrafterGridSection[] {
  const resolveGridNodeRarity = (
    slot: CrafterEditorSlot,
    type: CrafterNodeType,
    item: Item | undefined,
    itemId: string | undefined,
  ) => getNodeEffectiveRarity({ slot, type }, item, itemId, crafterData);

  if (activeSlot === 'food') {
    const baseItem = build.food.baseId ? items[build.food.baseId] : undefined;
    const recipeSelections = applyDefaultRecipeSelections(
      build.food.recipe,
      getFoodRecipeDefaults(build.food.baseId, crafterData),
      FOOD_RECIPE_SLOTS,
    );

    return [
      {
        id: 'food-base',
        title: 'Base Food',
        gridClassName: 'grid-cols-1',
        nodes: [{
          id: 'food-base',
          slot: 'food',
          type: 'foodBase',
          label: 'Base Food',
          item: baseItem,
          itemId: baseItem?.id,
          itemName: baseItem?.name,
          level: 1,
          rarity: resolveGridNodeRarity('food', 'foodBase', baseItem, baseItem?.id),
          tier: 0,
          emptyLabel: 'Base Food',
          meta: 'Select a food recipe',
        }],
      },
      {
        id: 'food-recipe',
        title: 'Recipe',
        gridClassName: 'grid-cols-3 justify-start',
        nodes: recipeSelections.map((selection, index) => {
          const item = selection.itemId ? items[selection.itemId] : undefined;
          const defaultItem = getCrafterDisplayItem(getFoodRecipeDefaults(build.food.baseId, crafterData)?.[index], items);
          const isCategorySlot = defaultItem?.type === 'Category' && Boolean(defaultItem.groupMembers?.length);
          return {
            id: `food-recipe-${index}`,
            slot: 'food' as const,
            type: 'recipe' as const,
            index,
            label: `Recipe ${index + 1}`,
            item,
            itemId: selection.itemId,
            itemName: item?.name,
            level: selection.level,
            rarity: resolveGridNodeRarity('food', 'recipe', item, selection.itemId),
            tier: 0,
            emptyLabel: `Recipe ${index + 1}`,
            meta: 'Recipe slot',
            interactionMode: isCategorySlot ? 'category' : defaultItem ? 'fixed' : 'free',
            interactionLabel: isCategorySlot ? 'Choose material' : defaultItem ? 'Level only' : undefined,
            categoryLabel: isCategorySlot ? defaultItem?.name : undefined,
          };
        }),
      },
    ];
  }

  const slotConfig = slotConfigByKey[activeSlot];
  const slot = build[activeSlot];
  const appearanceItem = getCrafterDisplayItem(slot.appearanceId, items);
  const recipeSourceItemId = getEquipmentRecipeSourceItemId(activeSlot, build, crafterData);
  const recipeSelections = applyDefaultRecipeSelections(
    slot.recipe,
    getEquipmentRecipeDefaults(activeSlot, recipeSourceItemId, crafterData),
    slotConfig.recipeSlots,
  );
  const actualBaseItem = getCrafterDisplayItem(slot.baseId, items);
  const slotResult = calculation.slotResults[activeSlot];
  const sections: CrafterGridSection[] = [
    {
      id: `${activeSlot}-base`,
      title: 'Base',
      gridClassName: 'grid-cols-1',
      nodes: [{
        id: `${activeSlot}-base`,
        slot: activeSlot,
        type: 'base',
        label: 'Base',
        item: appearanceItem,
        itemId: appearanceItem?.id,
        itemName: appearanceItem?.name,
        level: slotResult.itemLevel || 1,
        rarity: resolveGridNodeRarity(activeSlot, 'base', appearanceItem, appearanceItem?.id),
        tier: slotResult.tier,
        emptyLabel: 'Base',
        meta: actualBaseItem?.name ? `Actual Base: ${actualBaseItem.name}` : 'Select the crafted appearance item',
      }],
    },
    {
      id: `${activeSlot}-recipe`,
      title: 'Recipe',
      gridClassName: 'grid-cols-3 justify-start',
      nodes: recipeSelections.map((selection, index) => {
        const item = getCrafterDisplayItem(selection.itemId, items);
        const defaultItem = getCrafterDisplayItem(
          getEquipmentRecipeDefaults(activeSlot, recipeSourceItemId, crafterData)?.[index],
          items,
        );
        const isCategorySlot = defaultItem?.type === 'Category' && Boolean(defaultItem.groupMembers?.length);
        return {
          id: `${activeSlot}-recipe-${index}`,
          slot: activeSlot,
          type: 'recipe' as const,
          index,
          label: `Recipe ${index + 1}`,
          item,
          itemId: selection.itemId,
          itemName: item?.name,
          level: selection.level,
          rarity: resolveGridNodeRarity(activeSlot, 'recipe', item, selection.itemId),
          tier: 0,
          emptyLabel: `Recipe ${index + 1}`,
          meta: 'Recipe slot',
          interactionMode: isCategorySlot ? 'category' : defaultItem ? 'fixed' : 'free',
          interactionLabel: isCategorySlot ? 'Choose material' : defaultItem ? 'Level only' : undefined,
          categoryLabel: isCategorySlot ? defaultItem?.name : undefined,
        };
      }),
    },
    {
      id: `${activeSlot}-inheritance`,
      title: 'Inheritance',
      gridClassName: 'grid-cols-3 justify-start',
      nodes: padSelections(slot.inherits, slotConfig.inheritSlots).map((selection, index) => {
        const item = getCrafterDisplayItem(selection.itemId, items);
        return {
          id: `${activeSlot}-inherit-${index}`,
          slot: activeSlot,
          type: 'inherit' as const,
          index,
          label: `Inheritance ${index + 1}`,
          item,
          itemId: selection.itemId,
          itemName: item?.name,
          level: selection.level,
          rarity: resolveGridNodeRarity(activeSlot, 'inherit', item, selection.itemId),
          tier: 0,
          emptyLabel: `Inheritance ${index + 1}`,
          meta: 'Inheritance slot',
        };
      }),
    },
    {
      id: `${activeSlot}-upgrades`,
      title: 'Upgrades',
      gridClassName: 'grid-cols-3 justify-start',
      nodes: padSelections(slot.upgrades, slotConfig.upgradeSlots).map((selection, index) => {
        const item = getCrafterDisplayItem(selection.itemId, items);
        return {
          id: `${activeSlot}-upgrade-${index}`,
          slot: activeSlot,
          type: 'upgrade' as const,
          index,
          label: `Upgrade ${index + 1}`,
          item,
          itemId: selection.itemId,
          itemName: item?.name,
          level: selection.level,
          rarity: resolveGridNodeRarity(activeSlot, 'upgrade', item, selection.itemId),
          tier: 0,
          emptyLabel: `Upgrade ${index + 1}`,
          meta: 'Upgrade slot',
        };
      }),
    },
  ];

  return sections;
}
