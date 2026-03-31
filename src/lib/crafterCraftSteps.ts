import type { CrafterSlotResult } from './crafter';
import { getItemName } from './crafterCommon';
import type { CrafterData, CrafterSlotConfig, Item } from './schemas';

export function buildCraftStepsForSlot(
  slotResult: CrafterSlotResult,
  slotConfig: CrafterSlotConfig,
  data: CrafterData,
  items: Record<string, Item>,
  weaponClass: string,
) {
  if (!slotResult.baseName) return [];

  const carrierId =
    slotConfig.key === 'weapon'
      ? data.starterWeaponByClass[weaponClass]
      : slotConfig.carrierId ?? undefined;
  const carrierName = getItemName(carrierId ?? undefined, items, slotResult.carrierName);
  const inheritNames = slotResult.materialContributions
    .filter((contribution) => contribution.source === 'inherit')
    .map((contribution) => contribution.itemName);
  const upgradeNames = slotResult.materialContributions
    .filter((contribution) => contribution.source === 'upgrade')
    .map((contribution) => contribution.itemName);
  const recipeLabels = slotResult.recipeIngredients.map((name) => `Lv.10 ${name}`);

  const steps: string[] = [];

  if (carrierName && inheritNames.length > 0) {
    steps.push(`Craft ${carrierName} using ${inheritNames.join(', ')}.`);
    steps.push(`Upgrade ${carrierName} with any materials to reach Lv.10.`);
  }

  if (recipeLabels.length > 0) {
    steps.push(`Craft ${slotResult.baseName} using ${recipeLabels.join(', ')}.`);
  } else {
    steps.push(`Craft ${slotResult.baseName}.`);
  }

  if (inheritNames.length > 0) {
    steps.push(`Talk to Barrett and verify ${inheritNames.join(', ')} were used in creating ${slotResult.baseName}.`);
  }

  if (upgradeNames.length > 0) {
    const firstBatch = upgradeNames.slice(0, 5);
    const secondBatch = upgradeNames.slice(5);
    steps.push(`Upgrade ${slotResult.baseName} using ${firstBatch.map((name) => `Lv.10 ${name}`).join(', ')}.`);

    if (secondBatch.length > 0) {
      steps.push(`Continue upgrading ${slotResult.baseName} using ${secondBatch.map((name) => `Lv.10 ${name}`).join(', ')}.`);
    }
  }

  return steps;
}
