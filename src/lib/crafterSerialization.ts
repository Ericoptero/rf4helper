import LZString from 'lz-string';

import type { CrafterBuild } from './crafterMath';
import { FOOD_RECIPE_SLOTS, SLOT_KEYS } from './crafterMath';
import { getDerivedRecipeBase } from './crafterCommon';
import {
  applyDefaultRecipeSelections,
  getFoodRecipeDefinition,
  getRecipeDefinition,
  getSlotConfigByKey,
  normalizeMaterialLevel,
  padSelections,
} from './crafterRecipeSelections';
import type { CrafterData, CrafterMaterialSelection, Item } from './schemas';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = LZString;

const MAX_SERIALIZED_CRAFTER_BUILD_LENGTH = 2048;
const MAX_DECOMPRESSED_CRAFTER_BUILD_LENGTH = 10 * 1024;

type CompactSelection = {
  i?: string;
  l?: number;
};

type CompactEquipmentSlot = {
  a?: string;
  r?: Record<string, CompactSelection>;
  h?: Record<string, CompactSelection>;
  u?: Record<string, CompactSelection>;
};

type CompactFoodSlot = {
  b?: string;
  r?: Record<string, CompactSelection>;
};

type CompactCrafterBuild = {
  v: 2;
  weapon?: CompactEquipmentSlot;
  armor?: CompactEquipmentSlot;
  headgear?: CompactEquipmentSlot;
  shield?: CompactEquipmentSlot;
  accessory?: CompactEquipmentSlot;
  shoes?: CompactEquipmentSlot;
  food?: CompactFoodSlot;
};

function hasExplicitSelection(selection: CrafterMaterialSelection | undefined) {
  return selection?.itemId != null || (selection?.level ?? 1) !== 1;
}

function compactSelection(selection: CrafterMaterialSelection | undefined) {
  if (!selection || !hasExplicitSelection(selection)) return undefined;

  const entry: CompactSelection = {};
  if (selection.itemId !== undefined) {
    entry.i = selection.itemId;
  }

  const defaultLevel = selection.itemId ? 10 : 1;
  if (normalizeMaterialLevel(selection.level) !== defaultLevel) {
    entry.l = normalizeMaterialLevel(selection.level);
  }

  return entry;
}

function expandSelection(selection: CompactSelection | undefined) {
  if (!selection) return undefined;
  return {
    itemId: selection.i,
    level: normalizeMaterialLevel(selection.l ?? (selection.i ? 10 : 1)),
  } satisfies CrafterMaterialSelection;
}

function compactSelectionList(selections: CrafterMaterialSelection[] | undefined) {
  const entries = Object.fromEntries(
    (selections ?? [])
      .map((selection, index) => [String(index), compactSelection(selection)] as const)
      .filter(([, entry]) => Boolean(entry)),
  ) as Record<string, CompactSelection>;

  return Object.keys(entries).length > 0 ? entries : undefined;
}

function expandSelectionList(compactSelections: Record<string, CompactSelection> | undefined, count: number) {
  const next = padSelections(undefined, count);
  if (!compactSelections) return next;

  for (const [index, entry] of Object.entries(compactSelections)) {
    const parsedIndex = Number(index);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 0 || parsedIndex >= count) continue;
    next[parsedIndex] = expandSelection(entry) ?? next[parsedIndex];
  }

  return next;
}

function coerceLegacySelectionList(selections: unknown, count: number) {
  const next = padSelections(undefined, count);
  if (!Array.isArray(selections)) return next;

  for (let index = 0; index < Math.min(count, selections.length); index += 1) {
    const selection = selections[index];
    if (!selection || typeof selection !== 'object') continue;

    const itemId = typeof (selection as { itemId?: unknown }).itemId === 'string'
      ? (selection as { itemId?: string }).itemId
      : undefined;
    const level = typeof (selection as { level?: unknown }).level === 'number'
      ? normalizeMaterialLevel((selection as { level: number }).level)
      : itemId
        ? 10
        : 1;

    next[index] = { itemId, level };
  }

  return next;
}

function tryDeserializeLegacyCrafterBuild(serialized: string, data: CrafterData) {
  if (!serialized.trim().startsWith('{')) return undefined;

  const slotConfigByKey = getSlotConfigByKey(data);
  let parsed: Partial<CrafterBuild> | null;

  try {
    parsed = JSON.parse(serialized) as Partial<CrafterBuild> | null;
  } catch {
    return undefined;
  }

  if (!parsed || typeof parsed !== 'object') return undefined;

  const merged = createDefaultCrafterBuild(data);

  for (const slotKey of SLOT_KEYS) {
    const incoming = parsed[slotKey];
    if (!incoming || typeof incoming !== 'object') continue;

    const slotConfig = slotConfigByKey[slotKey];
    const legacySlot = incoming as Partial<CrafterBuild[typeof slotKey]>;

    merged[slotKey].appearanceId =
      typeof legacySlot.appearanceId === 'string'
        ? legacySlot.appearanceId
        : typeof legacySlot.baseId === 'string'
          ? legacySlot.baseId
          : undefined;
    merged[slotKey].baseId = undefined;
    merged[slotKey].recipe = coerceLegacySelectionList(legacySlot.recipe, slotConfig.recipeSlots);
    merged[slotKey].inherits = coerceLegacySelectionList(legacySlot.inherits, slotConfig.inheritSlots);
    merged[slotKey].upgrades = coerceLegacySelectionList(legacySlot.upgrades, slotConfig.upgradeSlots);
  }

  const legacyFood = parsed.food;
  if (legacyFood && typeof legacyFood === 'object') {
    merged.food.baseId = typeof legacyFood.baseId === 'string' ? legacyFood.baseId : undefined;
    merged.food.recipe = coerceLegacySelectionList(
      (legacyFood as Partial<CrafterBuild['food']>).recipe,
      FOOD_RECIPE_SLOTS,
    );
  }

  return merged;
}

export function createDefaultCrafterBuild(data: CrafterData): CrafterBuild {
  const build = structuredClone(data.defaults) as CrafterBuild;
  const slotConfigByKey = getSlotConfigByKey(data);

  for (const slotKey of SLOT_KEYS) {
    const slotConfig = slotConfigByKey[slotKey];
    build[slotKey].appearanceId = undefined;
    build[slotKey].baseId = undefined;
    build[slotKey].recipe = padSelections(build[slotKey].recipe, slotConfig.recipeSlots);
    build[slotKey].inherits = padSelections(build[slotKey].inherits, slotConfig.inheritSlots);
    build[slotKey].upgrades = padSelections(build[slotKey].upgrades, slotConfig.upgradeSlots);
  }

  build.food.baseId = undefined;
  build.food.recipe = padSelections(build.food.recipe, FOOD_RECIPE_SLOTS);
  return build;
}

export function deserializeCrafterBuild(
  serialized: string | undefined,
  data: CrafterData,
): CrafterBuild {
  const fallback = createDefaultCrafterBuild(data);
  if (!serialized) return fallback;
  if (serialized.length > MAX_SERIALIZED_CRAFTER_BUILD_LENGTH) return fallback;

  try {
    const slotConfigByKey = getSlotConfigByKey(data);
    const decompressed = decompressFromEncodedURIComponent(serialized);

    if (!decompressed) {
      return tryDeserializeLegacyCrafterBuild(serialized, data) ?? fallback;
    }

    if (decompressed.length > MAX_DECOMPRESSED_CRAFTER_BUILD_LENGTH) {
      return fallback;
    }

    const parsed = JSON.parse(decompressed) as CompactCrafterBuild;
    if (parsed.v !== 2) {
      return tryDeserializeLegacyCrafterBuild(serialized, data) ?? fallback;
    }

    const merged = fallback;

    for (const slotKey of SLOT_KEYS) {
      const slotConfig = slotConfigByKey[slotKey];
      const incoming = parsed[slotKey];
      if (!incoming) continue;

      merged[slotKey].appearanceId = incoming.a;
      merged[slotKey].baseId = undefined;
      merged[slotKey].recipe = expandSelectionList(incoming.r, slotConfig.recipeSlots);
      merged[slotKey].inherits = expandSelectionList(incoming.h, slotConfig.inheritSlots);
      merged[slotKey].upgrades = expandSelectionList(incoming.u, slotConfig.upgradeSlots);
    }

    if (parsed.food) {
      merged.food.baseId = parsed.food.b;
      merged.food.recipe = expandSelectionList(parsed.food.r, FOOD_RECIPE_SLOTS);
    }

    return merged;
  } catch {
    return tryDeserializeLegacyCrafterBuild(serialized, data) ?? fallback;
  }
}

export function serializeCrafterBuild(build: CrafterBuild, data: CrafterData): string {
  const slotConfigByKey = getSlotConfigByKey(data);
  const compact: CompactCrafterBuild = { v: 2 };

  for (const slotKey of SLOT_KEYS) {
    const slotConfig = slotConfigByKey[slotKey];
    const slot = build[slotKey];
    const compactSlot: CompactEquipmentSlot = {
      a: slot.appearanceId,
      r: compactSelectionList(slot.recipe?.slice(0, slotConfig.recipeSlots)),
      h: compactSelectionList(slot.inherits?.slice(0, slotConfig.inheritSlots)),
      u: compactSelectionList(slot.upgrades?.slice(0, slotConfig.upgradeSlots)),
    };

    if (compactSlot.a || compactSlot.r || compactSlot.h || compactSlot.u) {
      compact[slotKey] = compactSlot;
    }
  }

  const compactFood: CompactFoodSlot = {
    b: build.food.baseId,
    r: compactSelectionList(build.food.recipe?.slice(0, FOOD_RECIPE_SLOTS)),
  };

  if (compactFood.b || compactFood.r) {
    compact.food = compactFood;
  }

  if (Object.keys(compact).length === 1) {
    return '';
  }

  return compressToEncodedURIComponent(JSON.stringify(compact));
}

export function normalizeCrafterBuild(
  build: CrafterBuild,
  items: Record<string, Item>,
  data: CrafterData,
): CrafterBuild {
  const normalized = createDefaultCrafterBuild(data);
  const slotConfigByKey = getSlotConfigByKey(data);

  for (const slotKey of SLOT_KEYS) {
    const slotConfig = slotConfigByKey[slotKey];
    const incoming = build[slotKey];
    const appearanceId = incoming.appearanceId ?? incoming.baseId;
    const recipeSelections = applyDefaultRecipeSelections(
      incoming.recipe,
      getRecipeDefinition(slotKey, appearanceId, data)?.materials,
      slotConfig.recipeSlots,
    );

    normalized[slotKey].appearanceId = appearanceId;
    normalized[slotKey].recipe = recipeSelections;
    normalized[slotKey].inherits = padSelections(incoming.inherits, slotConfig.inheritSlots);
    normalized[slotKey].upgrades = padSelections(incoming.upgrades, slotConfig.upgradeSlots);
    normalized[slotKey].baseId = getDerivedRecipeBase(
      slotKey,
      appearanceId,
      recipeSelections,
      items,
      data,
      slotConfig,
    ).baseId;
  }

  normalized.food.baseId = build.food.baseId;
  normalized.food.recipe = applyDefaultRecipeSelections(
    build.food.recipe,
    getFoodRecipeDefinition(build.food.baseId, data)?.materials,
    FOOD_RECIPE_SLOTS,
  );

  return normalized;
}
