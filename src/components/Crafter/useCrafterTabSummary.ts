import * as React from 'react';
import type { CrafterBuild, CrafterCalculation } from '@/lib/crafter';
import type { Item } from '@/lib/schemas';
import { getCrafterDisplayItem, isEquipmentTab } from './crafterNodeBehavior';
import type { CrafterEditorSlot, CrafterGridSection, CrafterTab } from './crafterTypes';

export function useCrafterTabSummary({
  activeTab,
  activeEditorSlot,
  calculation,
  build,
  items,
  gridSections,
}: {
  activeTab: CrafterTab;
  activeEditorSlot: CrafterEditorSlot | null;
  calculation: CrafterCalculation;
  build: CrafterBuild;
  items: Record<string, Item>;
  gridSections: CrafterGridSection[];
}) {
  return React.useMemo(() => {
    const summaryStats = activeTab === 'dashboard'
      ? calculation.totalStats
      : activeTab === 'cooking'
        ? calculation.foodSummary.stats.additive
        : isEquipmentTab(activeTab)
          ? calculation.slotResults[activeTab].stats
          : {};
    const summaryStatMultipliers = activeTab === 'cooking'
      ? calculation.foodSummary.stats.multipliers
      : undefined;
    const summaryHealing = activeTab === 'cooking'
      ? calculation.foodSummary.healing
      : undefined;
    const summaryStatusAttacks = activeTab === 'dashboard'
      ? calculation.statusAttacks
      : activeTab === 'cooking'
        ? calculation.foodSummary.statusAttacks
        : isEquipmentTab(activeTab)
          ? calculation.slotResults[activeTab].statusAttacks
          : {};
    const summaryGeometry = activeTab === 'dashboard'
      ? calculation.geometry
      : isEquipmentTab(activeTab)
        ? calculation.slotResults[activeTab].geometry
        : {};
    const summaryResistances = activeTab === 'dashboard'
      ? calculation.resistances
      : activeTab === 'cooking'
        ? calculation.foodSummary.resistances
        : isEquipmentTab(activeTab)
          ? calculation.slotResults[activeTab].resistances
          : {};
    const summaryEffects = activeTab === 'dashboard'
      ? calculation.allEffects
      : activeTab === 'cooking'
        ? []
        : isEquipmentTab(activeTab)
          ? calculation.slotResults[activeTab].effects
          : [];
    const activeBonusSummaries = isEquipmentTab(activeTab)
      ? {
          level: calculation.slotResults[activeTab].levelBonusSummary,
          rarity: calculation.slotResults[activeTab].rarityBonusSummary,
        }
      : undefined;

    const activeBaseNode = activeEditorSlot && activeEditorSlot !== 'food'
      ? gridSections.find((section) => section.id === `${activeEditorSlot}-base`)?.nodes[0]
      : undefined;
    const activeRecipeNodes = activeEditorSlot
      ? gridSections.find((section) => section.id === `${activeEditorSlot}-recipe`)?.nodes ?? []
      : [];
    const activeInheritNodes = activeEditorSlot && activeEditorSlot !== 'food'
      ? gridSections.find((section) => section.id === `${activeEditorSlot}-inheritance`)?.nodes ?? []
      : [];
    const activeUpgradeNodes = activeEditorSlot && activeEditorSlot !== 'food'
      ? gridSections.find((section) => section.id === `${activeEditorSlot}-upgrades`)?.nodes ?? []
      : [];
    
    const activeSlotResult = activeEditorSlot && activeEditorSlot !== 'food'
      ? calculation.slotResults[activeEditorSlot]
      : undefined;

    const activePreviewItem = (() => {
      if (activeEditorSlot === 'food') return getCrafterDisplayItem(build.food.baseId, items);
      if (activeEditorSlot) return getCrafterDisplayItem(build[activeEditorSlot].appearanceId, items);
      return undefined;
    })();

    const activeRecipeSummary = (() => {
      if (!activeEditorSlot) return [];
      const explicitSelections = activeEditorSlot === 'food' ? build.food.recipe : build[activeEditorSlot].recipe;
      return explicitSelections
        .filter((selection) => Boolean(selection.itemId))
        .map((selection) => getCrafterDisplayItem(selection.itemId, items)?.name ?? selection.itemId!);
    })();
    const activeInheritSummary = activeInheritNodes.filter((node) => node.itemName).map((node) => node.itemName!);
    const activeUpgradeSummary = activeUpgradeNodes.filter((node) => node.itemName).map((node) => node.itemName!);
    
    const cookingBaseNode = activeEditorSlot === 'food'
      ? gridSections.find((section) => section.id === 'food-base')?.nodes[0]
      : undefined;

    const activePrimaryPreviewName = activePreviewItem?.name
      ?? activeSlotResult?.appearanceName
      ?? (activeEditorSlot === 'food' ? 'No dish selected' : 'No item selected');

    return {
      summaryStats,
      summaryStatMultipliers,
      summaryHealing,
      summaryStatusAttacks,
      summaryGeometry,
      summaryResistances,
      summaryEffects,
      activeBonusSummaries,
      activeBaseNode,
      activeRecipeNodes,
      activeInheritNodes,
      activeUpgradeNodes,
      activeSlotResult,
      activePreviewItem,
      activeRecipeSummary,
      activeInheritSummary,
      activeUpgradeSummary,
      cookingBaseNode,
      activePrimaryPreviewName,
    };
  }, [activeEditorSlot, activeTab, build, calculation, gridSections, items]);
}
