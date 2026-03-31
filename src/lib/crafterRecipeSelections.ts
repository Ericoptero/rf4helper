import type {
  CrafterData,
  CrafterMaterialSelection,
  CrafterSlotConfig,
  CrafterSlotKey,
} from './schemas';

function cloneSelection(selection?: CrafterMaterialSelection): CrafterMaterialSelection {
  return {
    itemId: selection?.itemId,
    level: selection?.level ?? (selection?.itemId ? 10 : 1),
  };
}

export function normalizeMaterialLevel(level?: number) {
  return Math.max(1, Math.min(10, level ?? 1));
}

export function getSlotConfigByKey(data: CrafterData): Record<CrafterSlotKey, CrafterSlotConfig> {
  return Object.fromEntries(data.slotConfigs.map((slot) => [slot.key, slot])) as Record<
    CrafterSlotKey,
    CrafterSlotConfig
  >;
}

export function padSelections(
  selections: CrafterMaterialSelection[] | undefined,
  count: number,
): CrafterMaterialSelection[] {
  return Array.from({ length: count }, (_, index) => cloneSelection(selections?.[index]));
}

function hasExplicitSelection(selection: CrafterMaterialSelection | undefined) {
  return selection?.itemId != null || (selection?.level ?? 1) !== 1;
}

export function getRecipeDefinition(
  slotKey: CrafterSlotKey,
  itemId: string | undefined,
  data: CrafterData,
) {
  if (!itemId) return undefined;
  return data.recipes.equipment[slotKey]?.[itemId];
}

export function getFoodRecipeDefinition(baseId: string | undefined, data: CrafterData) {
  if (!baseId) return undefined;
  return data.recipes.food[baseId];
}

export function applyDefaultRecipeSelections(
  current: CrafterMaterialSelection[] | undefined,
  defaults: string[] | undefined,
  slotCount: number,
): CrafterMaterialSelection[] {
  const padded = padSelections(current, slotCount);

  return padded.map((selection, index) => {
    const rawItemId = selection.itemId;
    const defaultItemId = defaults?.[index] ?? undefined;
    const hasExplicitOverride = hasExplicitSelection(selection);

    return {
      itemId: rawItemId === '' ? undefined : rawItemId ?? defaultItemId,
      level:
        rawItemId && rawItemId !== ''
          ? normalizeMaterialLevel(selection.level)
          : rawItemId === ''
            ? 1
            : defaultItemId
              ? hasExplicitOverride
                ? normalizeMaterialLevel(selection.level)
                : 10
              : normalizeMaterialLevel(selection.level),
    };
  });
}
