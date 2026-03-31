import {
  type CrafterBuildState,
} from '@/lib/crafter';
import {
  getFoodRecipeDefinition,
  getRecipeDefinition,
} from '@/lib/crafterRecipeSelections';
import {
  CRAFTER_RARITY_PLACEHOLDER_ID,
  CRAFTER_RARITY_PLACEHOLDER_NAME,
  CRAFTER_RARITY_PLACEHOLDER_VALUE,
  getCrafterSelectableRarity,
  getEffectiveCrafterNodeRarity,
} from '@/lib/crafterRarity';
import { itemMatchesCrafterSlot } from '@/lib/crafterData';
import type { CrafterOptionLists } from '@/lib/crafterOptions';
import { getDisplayEffects, getDisplayStats } from '@/lib/itemPresentation';
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
  CrafterGridNode,
  CrafterNodeBehavior,
  CrafterSelectedNode,
  CrafterTab,
} from './crafterTypes';

type SelectionUpdate = {
  itemId?: string;
  level?: number;
};

type EditableSelection = {
  itemId?: string;
  level: number;
};

const CRAFTER_RARITY_PLACEHOLDER_ITEM: Item = {
  id: CRAFTER_RARITY_PLACEHOLDER_ID,
  name: CRAFTER_RARITY_PLACEHOLDER_NAME,
  type: 'Special',
  category: 'crafter-placeholder',
  rarityPoints: 15,
};

export function getEquipmentRecipeDefaults(
  slotKey: CrafterSlotKey,
  appearanceId: string | undefined,
  crafterData: CrafterData,
) {
  return getRecipeDefinition(slotKey, appearanceId, crafterData)?.materials;
}

export function getFoodRecipeDefaults(baseId: string | undefined, crafterData: CrafterData) {
  return getFoodRecipeDefinition(baseId, crafterData)?.materials;
}

export function getEquipmentRecipeSourceItemId(
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

function resolveOptionItems(
  itemIds: string[],
  items: Record<string, Item>,
  includeRarityPlaceholder = false,
) {
  const resolvedItems = itemIds
    .map((itemId) => items[itemId])
    .filter((item): item is Item => Boolean(item));

  return includeRarityPlaceholder
    ? [CRAFTER_RARITY_PLACEHOLDER_ITEM, ...resolvedItems]
    : resolvedItems;
}

export function getCrafterDisplayItem(itemId: string | undefined, items: Record<string, Item>) {
  if (!itemId) return undefined;
  if (itemId === CRAFTER_RARITY_PLACEHOLDER_ID) return CRAFTER_RARITY_PLACEHOLDER_ITEM;
  return items[itemId];
}

export function matchesSlotCraftCandidate(
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

export function resolveEffectiveSelection(
  rawSelection: CrafterMaterialSelection | undefined,
  defaultItemId: string | null | undefined,
) {
  const rawItemId = rawSelection?.itemId;
  const hasExplicitOverride = rawSelection?.itemId != null || (rawSelection?.level ?? 1) !== 1;
  const isCleared = rawItemId === '';
  const hasDefault = Boolean(defaultItemId);
  const isCustomSelection = Boolean(rawItemId && rawItemId !== '');

  const itemId = isCleared ? undefined : rawItemId ?? defaultItemId ?? undefined;

  let level = 1;
  if (isCustomSelection) {
    level = rawSelection!.level;
  } else if (!isCleared && hasDefault) {
    level = hasExplicitOverride ? (rawSelection?.level ?? 10) : 10;
  } else {
    level = rawSelection?.level ?? 1;
  }

  return { itemId, level };
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

export function applySelectionUpdate({
  current,
  updates,
  behavior,
  defaultItemId,
}: {
  current: EditableSelection;
  updates: SelectionUpdate;
  behavior?: Pick<CrafterNodeBehavior, 'canEditItem' | 'mode' | 'options'>;
  defaultItemId?: string;
}) {
  const hasItemIdUpdate = Object.prototype.hasOwnProperty.call(updates, 'itemId');
  const hasLevelUpdate = Object.prototype.hasOwnProperty.call(updates, 'level');
  const canEditItem = behavior?.canEditItem ?? true;
  const nextItemId = (() => {
    if (!hasItemIdUpdate) return current.itemId;
    if (!canEditItem) return current.itemId ?? defaultItemId;
    if (behavior?.mode === 'category') {
      return behavior.options.some((option) => option.id === updates.itemId) ? updates.itemId : current.itemId;
    }
    return updates.itemId ?? (defaultItemId ? '' : undefined);
  })();

  return {
    itemId: nextItemId,
    level: hasLevelUpdate
      ? Math.max(1, Math.min(10, updates.level ?? current.level))
      : hasItemIdUpdate
        ? nextItemId
          ? nextItemId === current.itemId
            ? current.level
            : 10
          : 1
        : current.level,
  } satisfies CrafterMaterialSelection;
}

export function resolveNodeBehavior(
  node: CrafterSelectedNode | CrafterGridNode,
  build: CrafterBuildState,
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>,
  items: Record<string, Item>,
  crafterData: CrafterData,
  optionLists: CrafterOptionLists,
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
        options: node.slot === 'food'
          ? resolveOptionItems(optionLists.materialItemIds, items, true)
          : resolveOptionItems(optionLists.anyItemIds, items, true),
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
      options: node.type === 'foodBase'
        ? resolveOptionItems(optionLists.foodItemIds, items)
        : resolveOptionItems(optionLists.materialItemIds, items),
      canEditItem: true,
      canEditLevel: node.type !== 'foodBase',
      canClear: true,
    };
  }

  if (node.type === 'base') {
    return {
      mode: 'free',
      options: resolveOptionItems(optionLists.slotItemIds[node.slot], items),
      canEditItem: true,
      canEditLevel: false,
      canClear: true,
    };
  }

  return {
    mode: 'free',
    options: resolveOptionItems(optionLists.materialItemIds, items, true),
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
  optionLists: CrafterOptionLists,
) {
  return resolveNodeBehavior(node, build, slotConfigByKey, items, crafterData, optionLists).options;
}

// Extracted updateNodeInBuild and buildGridSectionsForSlot to separate modules.
