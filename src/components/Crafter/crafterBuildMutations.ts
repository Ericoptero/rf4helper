import type { CrafterBuild } from '@/lib/crafter';
import type { CrafterOptionLists } from '@/lib/crafterOptions';
import type { CrafterData, CrafterSlotConfig, CrafterSlotKey, Item } from '@/lib/schemas';
import type { CrafterSelectedNode } from './crafterTypes';
import {
  applySelectionUpdate,
  getEquipmentRecipeDefaults,
  getFoodRecipeDefaults,
  matchesSlotCraftCandidate,
  resolveEffectiveSelection,
  resolveNodeBehavior,
} from './crafterNodeBehavior';

type SelectionUpdate = {
  itemId?: string;
  level?: number;
};

const FOOD_RECIPE_SLOTS = 6;

function createEmptySelections(count: number) {
  return Array.from({ length: count }, () => ({ itemId: undefined, level: 1 }));
}

export function updateNodeInBuild(
  build: CrafterBuild,
  node: CrafterSelectedNode,
  updates: SelectionUpdate,
  crafterData: CrafterData,
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>,
  items: Record<string, Item>,
  optionLists: CrafterOptionLists,
): CrafterBuild {
  if (node.slot === 'food') {
    const nextFood = { ...build.food };

    if (node.type === 'foodBase') {
      nextFood.baseId = updates.itemId;
      nextFood.recipe = createEmptySelections(FOOD_RECIPE_SLOTS);
      return { ...build, food: nextFood };
    }

    if (node.type === 'recipe' && node.index != null) {
      nextFood.recipe = [...nextFood.recipe];
      const defaultItemId = getFoodRecipeDefaults(nextFood.baseId, crafterData)?.[node.index];
      const currentSelection = resolveEffectiveSelection(
        nextFood.recipe[node.index],
        defaultItemId,
      );
      const behavior = resolveNodeBehavior(node, build, slotConfigByKey, items, crafterData, optionLists);
      nextFood.recipe[node.index] = {
        ...nextFood.recipe[node.index],
        ...applySelectionUpdate({
          current: currentSelection,
          updates,
          behavior,
          defaultItemId,
        }),
      };
    }

    return { ...build, food: nextFood };
  }

  const slotConfig = slotConfigByKey[node.slot];
  const nextSlot = { ...build[node.slot] };

  if (node.type === 'base') {
    nextSlot.appearanceId = updates.itemId;
    nextSlot.recipe = createEmptySelections(slotConfig.recipeSlots);
    return { ...build, [node.slot]: nextSlot };
  }

  if (node.type === 'recipe' && node.index != null) {
    nextSlot.recipe = [...nextSlot.recipe];
    const defaultItemId = getEquipmentRecipeDefaults(node.slot, nextSlot.appearanceId, crafterData)?.[node.index];
    const currentSelection = resolveEffectiveSelection(
      nextSlot.recipe[node.index],
      defaultItemId,
    );
    const behavior = resolveNodeBehavior(node, build, slotConfigByKey, items, crafterData, optionLists);
    const nextSelection = applySelectionUpdate({
      current: currentSelection,
      updates,
      behavior,
      defaultItemId,
    });
    nextSlot.recipe[node.index] = {
      ...nextSlot.recipe[node.index],
      ...nextSelection,
    };
    if (Object.prototype.hasOwnProperty.call(updates, 'itemId') && matchesSlotCraftCandidate(nextSelection.itemId, items, slotConfig)) {
      nextSlot.recipe = nextSlot.recipe.map((selection, index) => {
        if (index === node.index) return selection;
        return matchesSlotCraftCandidate(selection.itemId, items, slotConfig)
          ? { itemId: undefined, level: 1 }
          : selection;
      });
    }
    return { ...build, [node.slot]: nextSlot };
  }

  if (node.type === 'inherit' && node.index != null) {
    nextSlot.inherits = [...nextSlot.inherits];
    const currentSelection = nextSlot.inherits[node.index];
    nextSlot.inherits[node.index] = {
      ...currentSelection,
      ...applySelectionUpdate({
        current: currentSelection,
        updates,
      }),
    };
    return { ...build, [node.slot]: nextSlot };
  }

  if (node.type === 'upgrade' && node.index != null) {
    nextSlot.upgrades = [...nextSlot.upgrades];
    const currentSelection = nextSlot.upgrades[node.index];
    nextSlot.upgrades[node.index] = {
      ...currentSelection,
      ...applySelectionUpdate({
        current: currentSelection,
        updates,
      }),
    };
    return { ...build, [node.slot]: nextSlot };
  }

  return build;
}
