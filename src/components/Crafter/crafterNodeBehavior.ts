import {
  CRAFTER_RARITY_PLACEHOLDER_ID,
  CRAFTER_RARITY_PLACEHOLDER_NAME,
  type CrafterBuildState,
  type CrafterCalculation,
} from '@/lib/crafter';
import {
  applyDefaultRecipeSelections,
  getFoodRecipeDefinition,
  getRecipeDefinition,
  padSelections,
} from '@/lib/crafterRecipeSelections';
import {
  CRAFTER_RARITY_PLACEHOLDER_VALUE,
  getCrafterSelectableRarity,
  getEffectiveCrafterNodeRarity,
} from '@/lib/crafterRarity';
import { itemMatchesCrafterSlot } from '@/lib/crafterData';
import { getDisplayEffects, getDisplayStats, hasDisplayEffects } from '@/lib/itemPresentation';
import type { CrafterData, CrafterMaterialSelection, CrafterSlotConfig, CrafterSlotKey, Item } from '@/lib/schemas';
import type { CrafterItemPreviewData } from './CrafterSelectorDialog';
import {
  ELEMENT_RESISTANCE_ORDER,
  formatItemEffect,
  formatPercentValue,
  formatSignedCrafterStatValue,
  formatSignedValue,
  formatStatLabel,
  GEOMETRY_DISPLAY_ORDER,
  isPercentDisplayStatKey,
  REACTION_RESISTANCE_ORDER,
  resolveCrafterItemImage,
  STAT_DISPLAY_ORDER,
  STATUS_ATTACK_DISPLAY_ORDER,
  STATUS_RESISTANCE_ORDER,
} from './crafterFormatters';
import type {
  CrafterEditorSlot,
  CrafterGridNode,
  CrafterGridSection,
  CrafterNodeBehavior,
  CrafterNodeType,
  CrafterSelectedNode,
  CrafterTab,
} from './crafterTypes';

type SelectionUpdate = {
  itemId?: string;
  level?: number;
};

const FOOD_RECIPE_SLOTS = 6;
const CRAFTER_RARITY_PLACEHOLDER_ITEM: Item = {
  id: CRAFTER_RARITY_PLACEHOLDER_ID,
  name: CRAFTER_RARITY_PLACEHOLDER_NAME,
  type: 'Special',
  category: 'crafter-placeholder',
  rarityPoints: 15,
};

function createEmptySelections(count: number) {
  return Array.from({ length: count }, () => ({ itemId: undefined, level: 1 }));
}

function getEquipmentRecipeDefaults(
  slotKey: CrafterSlotKey,
  appearanceId: string | undefined,
  crafterData: CrafterData,
) {
  return getRecipeDefinition(slotKey, appearanceId, crafterData)?.materials;
}

function getFoodRecipeDefaults(baseId: string | undefined, crafterData: CrafterData) {
  return getFoodRecipeDefinition(baseId, crafterData)?.materials;
}

function getEquipmentRecipeSourceItemId(
  slotKey: CrafterSlotKey,
  build: CrafterBuildState,
  crafterData: CrafterData,
) {
  const slot = build[slotKey];
  const candidates = [slot.appearanceId, slot.baseId].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (getEquipmentRecipeDefaults(slotKey, candidate, crafterData)?.length) {
      return candidate;
    }
  }

  return candidates[0];
}

function getSlotOptions(items: Record<string, Item>, slotConfig: CrafterSlotConfig) {
  return Object.values(items)
    .filter((item) => itemMatchesCrafterSlot(item, slotConfig))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getFoodOptions(items: Record<string, Item>) {
  return Object.values(items)
    .filter((item) => item.craft?.some((craft) => craft.stationType === 'Cooking'))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getMaterialOptions(items: Record<string, Item>) {
  return Object.values(items)
    .filter((item) =>
      Boolean(item.crafter?.material?.weapon)
      || Boolean(item.crafter?.material?.armor)
      || Boolean(item.crafter?.material?.food)
      || hasDisplayEffects(item)
      || Boolean(getDisplayStats(item))
      || item.rarityPoints != null
      || Boolean(item.craft?.length),
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getAnyItemOptions(items: Record<string, Item>) {
  const uniqueItems = new Map<string, Item>();

  uniqueItems.set(CRAFTER_RARITY_PLACEHOLDER_ITEM.id, CRAFTER_RARITY_PLACEHOLDER_ITEM);
  Object.values(items)
    .sort((left, right) => left.name.localeCompare(right.name))
    .forEach((item) => {
      if (!uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, item);
      }
    });

  return [...uniqueItems.values()];
}

export function getCrafterDisplayItem(itemId: string | undefined, items: Record<string, Item>) {
  if (!itemId) return undefined;
  if (itemId === CRAFTER_RARITY_PLACEHOLDER_ID) return CRAFTER_RARITY_PLACEHOLDER_ITEM;
  return items[itemId];
}

function matchesSlotCraftCandidate(
  itemId: string | undefined,
  items: Record<string, Item>,
  slotConfig: CrafterSlotConfig,
) {
  if (!itemId || itemId === CRAFTER_RARITY_PLACEHOLDER_ID) return false;
  return itemMatchesCrafterSlot(items[itemId], slotConfig);
}

function normalizeLegacyPreviewStats(stats: Item['stats'] | undefined) {
  if (!stats) return undefined;

  const normalizedEntries = Object.entries(stats)
    .filter(([, value]) => value != null && value !== 0)
    .map(([key, value]) => [key, isPercentDisplayStatKey(key) ? (value as number) / 100 : value]);

  return normalizedEntries.length > 0 ? Object.fromEntries(normalizedEntries) : undefined;
}

function resolvePreviewStats(
  payloadStats: Partial<NonNullable<Item['stats']>> | undefined,
  item: Item | undefined,
) {
  if (payloadStats && Object.keys(payloadStats).length > 0) {
    return payloadStats;
  }

  const legacyStats = normalizeLegacyPreviewStats(item?.stats);
  if (legacyStats) {
    return legacyStats;
  }

  return normalizeLegacyPreviewStats(item ? getDisplayStats(item) : undefined);
}

function getEquipmentPayloadForSlot(slotKey: CrafterSlotKey, itemId: string | undefined, crafterData: CrafterData) {
  if (!itemId) return undefined;
  return slotKey === 'weapon' ? crafterData.stats.weapon[itemId] : crafterData.stats.armor[itemId];
}

function getMaterialPayloadForSlot(slotKey: CrafterSlotKey, itemId: string | undefined, crafterData: CrafterData) {
  if (!itemId) return undefined;
  return slotKey === 'weapon' ? crafterData.materials.weapon[itemId] : crafterData.materials.armor[itemId];
}

function getNodePayload(
  node: CrafterSelectedNode | CrafterGridNode | undefined,
  itemId: string | undefined,
  crafterData: CrafterData,
) {
  if (!node || !itemId) return undefined;
  if (node.slot === 'food') {
    return node.type === 'foodBase'
      ? crafterData.food.baseStats[itemId]
      : crafterData.materials.food[itemId];
  }
  return node.type === 'base'
    ? getEquipmentPayloadForSlot(node.slot, itemId, crafterData)
    : getMaterialPayloadForSlot(node.slot, itemId, crafterData);
}

export function getNodeEffectiveRarity(
  node: CrafterSelectedNode | CrafterGridNode | undefined,
  item: Item | undefined,
  itemId: string | undefined,
  crafterData: CrafterData,
) {
  const payload = getNodePayload(node, itemId, crafterData);
  const payloadRarity = payload && 'rarity' in payload ? payload.rarity : undefined;

  if (!node) {
    return getCrafterSelectableRarity({
      slot: 'food',
      type: 'foodBase',
      item,
      itemId,
      rarity: payloadRarity,
    });
  }

  if (node.type === 'recipe' && node.slot !== 'food') {
    const slotConfig = crafterData.slotConfigs.find((slotConfig) => slotConfig.key === node.slot);
    if (slotConfig && itemMatchesCrafterSlot(item, slotConfig)) {
      return 0;
    }
  }

  return getEffectiveCrafterNodeRarity({
    slot: node.slot,
    type: node.type,
    item,
    itemId,
    rarity: payloadRarity,
  });
}

export function getNodePreviewData(
  node: CrafterSelectedNode | CrafterGridNode | undefined,
  item: Item | undefined,
  itemId: string | undefined,
  crafterData: CrafterData,
): CrafterItemPreviewData {
  const payload = getNodePayload(node, itemId, crafterData);
  const payloadStats =
    payload && 'additive' in payload
      ? payload.additive
      : payload?.stats;
  const payloadGeometry = payload && 'geometry' in payload ? payload.geometry : undefined;
  const payloadResistances = payload?.resistances;
  const previewStats = resolvePreviewStats(payloadStats, item);

  const stats = STAT_DISPLAY_ORDER
    .map((key) => [key, Number(previewStats?.[key] ?? 0)] as const)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${formatStatLabel(key)} ${formatSignedCrafterStatValue(key, value)}`);
  const statusAttacks = STATUS_ATTACK_DISPLAY_ORDER
    .map((key) => [key, Number(payload?.statusAttacks?.[key] ?? 0)] as const)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${formatStatLabel(key)} ${formatPercentValue(value)}`);
  const others = GEOMETRY_DISPLAY_ORDER
    .map((key) => [key, Number(payloadGeometry?.[key] ?? 0)] as const)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${formatStatLabel(key)} ${formatSignedValue(value)}`);
  const buildResistanceGroup = (
    title: string,
    keys: readonly (
      | (typeof ELEMENT_RESISTANCE_ORDER)[number]
      | (typeof REACTION_RESISTANCE_ORDER)[number]
      | (typeof STATUS_RESISTANCE_ORDER)[number]
    )[],
  ) => ({
    title,
    values: keys
      .map((key) => [key, Number(payloadResistances?.[key] ?? 0)] as const)
      .filter(([, value]) => value !== 0)
      .map(([key, value]) => `${formatStatLabel(key)} ${formatPercentValue(value)}`),
  });
  const resistanceGroups = [
    buildResistanceGroup('Elem Res', ELEMENT_RESISTANCE_ORDER),
    buildResistanceGroup('Reaction Res', REACTION_RESISTANCE_ORDER),
    buildResistanceGroup('Status Res', STATUS_RESISTANCE_ORDER),
  ].filter((group) => group.values.length > 0);
  const effects = item ? getDisplayEffects(item).map(formatItemEffect) : [];
  const placeholderStats = itemId === CRAFTER_RARITY_PLACEHOLDER_ID ? [`Rarity +${CRAFTER_RARITY_PLACEHOLDER_VALUE}`] : [];

  return {
    imageSrc: resolveCrafterItemImage(item),
    stats: [...placeholderStats, ...stats],
    statusAttacks,
    others,
    resistanceGroups,
    effects,
    rarity: getNodeEffectiveRarity(node, item, itemId, crafterData),
  };
}

export function getNodeTitle(node: CrafterSelectedNode) {
  if (node.type === 'recipe' && node.index != null) return `Recipe ${node.index + 1}`;
  if (node.type === 'inherit' && node.index != null) return `Inheritance ${node.index + 1}`;
  if (node.type === 'upgrade' && node.index != null) return `Upgrade ${node.index + 1}`;
  if (node.type === 'foodBase') return 'Base Food';
  return 'Base';
}

export function isEquipmentTab(tab: CrafterTab): tab is CrafterSlotKey {
  return tab !== 'dashboard' && tab !== 'cooking';
}

function resolveEffectiveSelection(
  rawSelection: CrafterMaterialSelection | undefined,
  defaultItemId: string | null | undefined,
) {
  const rawItemId = rawSelection?.itemId;
  const hasExplicitOverride = rawSelection?.itemId != null || (rawSelection?.level ?? 1) !== 1;
  const itemId = rawItemId === '' ? undefined : rawItemId ?? defaultItemId ?? undefined;
  return {
    itemId,
    level:
      rawItemId && rawItemId !== ''
        ? rawSelection!.level
        : rawItemId === ''
          ? 1
          : defaultItemId
            ? hasExplicitOverride
              ? rawSelection?.level ?? 10
              : 10
            : rawSelection?.level ?? 1,
  };
}

function getRecipeDefaultItemIdForNode(
  node: CrafterSelectedNode | CrafterGridNode,
  build: CrafterBuildState,
  crafterData: CrafterData,
) {
  if (node.type !== 'recipe' || node.index == null) return undefined;
  if (node.slot === 'food') {
    return getFoodRecipeDefaults(build.food.baseId, crafterData)?.[node.index];
  }

  return getEquipmentRecipeDefaults(
    node.slot,
    getEquipmentRecipeSourceItemId(node.slot, build, crafterData),
    crafterData,
  )?.[node.index];
}

export function resolveNodeBehavior(
  node: CrafterSelectedNode | CrafterGridNode,
  build: CrafterBuildState,
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>,
  items: Record<string, Item>,
  crafterData: CrafterData,
): CrafterNodeBehavior {
  if (node.type === 'recipe') {
    const recipeSourceItemId = node.slot === 'food'
      ? build.food.baseId
      : getEquipmentRecipeSourceItemId(node.slot, build, crafterData);
    const defaultItemId = getRecipeDefaultItemIdForNode(node, build, crafterData);
    const defaultItem = getCrafterDisplayItem(defaultItemId, items);

    if (defaultItem?.type === 'Category' && defaultItem.groupMembers && defaultItem.groupMembers.length > 0) {
      return {
        mode: 'category',
        options: defaultItem.groupMembers
          .map((itemId) => items[itemId])
          .filter((item): item is Item => Boolean(item))
          .sort((left, right) => left.name.localeCompare(right.name)),
        canEditItem: true,
        canEditLevel: true,
        canClear: false,
        helperLabel: 'Choose material',
        callout: `This recipe slot accepts any item from the ${defaultItem.name} group.`,
        categoryLabel: defaultItem.name,
        emptyStateTitle: 'No items found.',
      };
    }

    if (defaultItem) {
      return {
        mode: 'fixed',
        options: [defaultItem],
        canEditItem: false,
        canEditLevel: true,
        canClear: false,
        helperLabel: 'Level only',
        callout: 'This recipe ingredient is fixed. You can only adjust its level.',
        emptyStateTitle: 'No items found.',
      };
    }

    if (defaultItemId) {
      return {
        mode: 'fixed',
        options: [],
        canEditItem: false,
        canEditLevel: false,
        canClear: false,
        helperLabel: 'Recipe unavailable',
        callout: 'This recipe could not be resolved for the selected base.',
        emptyStateTitle: 'Recipe unavailable',
        emptyStateDescription: 'This recipe could not be resolved for the selected base.',
      };
    }

    if (recipeSourceItemId) {
      return {
        mode: 'free',
        options: node.slot === 'food' ? [CRAFTER_RARITY_PLACEHOLDER_ITEM, ...getMaterialOptions(items)] : getAnyItemOptions(items),
        canEditItem: true,
        canEditLevel: true,
        canClear: true,
      };
    }

    return {
      mode: 'fixed',
      options: [],
      canEditItem: false,
      canEditLevel: false,
      canClear: false,
      helperLabel: 'Recipe locked',
      callout: 'Select a base item first to unlock this recipe slot.',
      emptyStateTitle: 'Recipe locked',
      emptyStateDescription: 'Select a base item first to unlock this recipe slot.',
    };
  }

  if (node.slot === 'food') {
    return {
      mode: 'free',
      options: node.type === 'foodBase' ? getFoodOptions(items) : getMaterialOptions(items),
      canEditItem: true,
      canEditLevel: node.type !== 'foodBase',
      canClear: true,
    };
  }

  if (node.type === 'base') {
    return {
      mode: 'free',
      options: getSlotOptions(items, slotConfigByKey[node.slot]),
      canEditItem: true,
      canEditLevel: false,
      canClear: true,
    };
  }

  return {
    mode: 'free',
    options: [CRAFTER_RARITY_PLACEHOLDER_ITEM, ...getMaterialOptions(items)],
    canEditItem: true,
    canEditLevel: true,
    canClear: true,
  };
}

export function getEditableSelection(
  build: CrafterBuildState,
  node: CrafterSelectedNode,
  crafterData: CrafterData,
) {
  if (node.slot === 'food') {
    if (node.type === 'foodBase') return { itemId: build.food.baseId, level: 1 };
    if (node.type === 'recipe' && node.index != null) {
      return resolveEffectiveSelection(
        build.food.recipe[node.index],
        getFoodRecipeDefaults(build.food.baseId, crafterData)?.[node.index],
      );
    }
    return undefined;
  }

  const slot = build[node.slot];
  if (node.type === 'base') return { itemId: slot.appearanceId, level: 1 };
  if (node.type === 'recipe' && node.index != null) {
    return resolveEffectiveSelection(
      slot.recipe[node.index],
      getEquipmentRecipeDefaults(node.slot, slot.appearanceId, crafterData)?.[node.index],
    );
  }
  if (node.type === 'inherit' && node.index != null) return slot.inherits[node.index];
  if (node.type === 'upgrade' && node.index != null) return slot.upgrades[node.index];
  return undefined;
}

export function getSelectedNodeOptions(
  node: CrafterSelectedNode,
  build: CrafterBuildState,
  crafterData: CrafterData,
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>,
  items: Record<string, Item>,
) {
  return resolveNodeBehavior(node, build, slotConfigByKey, items, crafterData).options;
}

export function updateNodeInBuild(
  build: CrafterBuildState,
  node: CrafterSelectedNode,
  updates: SelectionUpdate,
  crafterData: CrafterData,
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>,
  items: Record<string, Item>,
) {
  const next = structuredClone(build);
  const hasItemIdUpdate = Object.prototype.hasOwnProperty.call(updates, 'itemId');
  const hasLevelUpdate = Object.prototype.hasOwnProperty.call(updates, 'level');

  if (node.slot === 'food') {
    if (node.type === 'foodBase') {
      next.food.baseId = updates.itemId;
      next.food.recipe = createEmptySelections(FOOD_RECIPE_SLOTS);
      return next;
    }

    if (node.type === 'recipe' && node.index != null) {
      const defaultItemId = getFoodRecipeDefaults(next.food.baseId, crafterData)?.[node.index];
      const currentSelection = resolveEffectiveSelection(
        next.food.recipe[node.index],
        defaultItemId,
      );
      const behavior = resolveNodeBehavior(node, next, slotConfigByKey, items, crafterData);
      const nextItemId = (() => {
        if (!hasItemIdUpdate) return currentSelection.itemId;
        if (!behavior.canEditItem) return currentSelection.itemId ?? defaultItemId;
        if (behavior.mode === 'category') {
          return behavior.options.some((option) => option.id === updates.itemId) ? updates.itemId : currentSelection.itemId;
        }
        return updates.itemId ?? (defaultItemId ? '' : undefined);
      })();
      next.food.recipe[node.index] = {
        ...next.food.recipe[node.index],
        itemId: nextItemId,
        level: hasLevelUpdate
          ? Math.max(1, Math.min(10, updates.level ?? currentSelection.level))
          : hasItemIdUpdate
            ? nextItemId
              ? nextItemId === currentSelection.itemId
                ? currentSelection.level
                : 10
              : 1
            : currentSelection.level,
      };
    }

    return next;
  }

  const slot = next[node.slot];
  const slotConfig = slotConfigByKey[node.slot];
  if (node.type === 'base') {
    slot.appearanceId = updates.itemId;
    slot.recipe = createEmptySelections(slotConfig.recipeSlots);
    return next;
  }

  if (node.type === 'recipe' && node.index != null) {
    const defaultItemId = getEquipmentRecipeDefaults(node.slot, slot.appearanceId, crafterData)?.[node.index];
    const currentSelection = resolveEffectiveSelection(
      slot.recipe[node.index],
      defaultItemId,
    );
    const behavior = resolveNodeBehavior(node, next, slotConfigByKey, items, crafterData);
    const nextItemId = (() => {
      if (!hasItemIdUpdate) return currentSelection.itemId;
      if (!behavior.canEditItem) return currentSelection.itemId ?? defaultItemId;
      if (behavior.mode === 'category') {
        return behavior.options.some((option) => option.id === updates.itemId) ? updates.itemId : currentSelection.itemId;
      }
      return updates.itemId ?? (defaultItemId ? '' : undefined);
    })();
    slot.recipe[node.index] = {
      ...slot.recipe[node.index],
      itemId: nextItemId,
      level: hasLevelUpdate
        ? Math.max(1, Math.min(10, updates.level ?? currentSelection.level))
        : hasItemIdUpdate
          ? nextItemId
            ? nextItemId === currentSelection.itemId
              ? currentSelection.level
              : 10
            : 1
          : currentSelection.level,
    };
    if (hasItemIdUpdate && matchesSlotCraftCandidate(nextItemId, items, slotConfig)) {
      slot.recipe = slot.recipe.map((selection, index) => {
        if (index === node.index) return selection;
        return matchesSlotCraftCandidate(selection.itemId, items, slotConfig)
          ? { itemId: undefined, level: 1 }
          : selection;
      });
    }
    return next;
  }

  if (node.type === 'inherit' && node.index != null) {
    const currentSelection = slot.inherits[node.index];
    const nextItemId = hasItemIdUpdate ? updates.itemId : currentSelection.itemId;
    slot.inherits[node.index] = {
      ...currentSelection,
      itemId: nextItemId,
      level: hasLevelUpdate
        ? Math.max(1, Math.min(10, updates.level ?? currentSelection.level))
        : hasItemIdUpdate
          ? nextItemId
            ? nextItemId === currentSelection.itemId
              ? currentSelection.level
              : 10
            : 1
          : currentSelection.level,
    };
    return next;
  }

  if (node.type === 'upgrade' && node.index != null) {
    const currentSelection = slot.upgrades[node.index];
    const nextItemId = hasItemIdUpdate ? updates.itemId : currentSelection.itemId;
    slot.upgrades[node.index] = {
      ...currentSelection,
      itemId: nextItemId,
      level: hasLevelUpdate
        ? Math.max(1, Math.min(10, updates.level ?? currentSelection.level))
        : hasItemIdUpdate
          ? nextItemId
            ? nextItemId === currentSelection.itemId
              ? currentSelection.level
              : 10
            : 1
          : currentSelection.level,
    };
  }

  return next;
}

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
