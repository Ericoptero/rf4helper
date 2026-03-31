import type { CrafterBootstrapItem } from '@/lib/crafterCommon';
import type { CrafterSlotKey } from '@/lib/schemas';

export type CrafterTab = 'dashboard' | CrafterSlotKey | 'cooking';
export type CrafterEditorSlot = CrafterSlotKey | 'food';
export type CrafterNodeType = 'base' | 'recipe' | 'inherit' | 'upgrade' | 'foodBase';
export type CrafterNodeInteractionMode = 'free' | 'fixed' | 'category';

export type CrafterSelectedNode = {
  slot: CrafterEditorSlot;
  type: CrafterNodeType;
  index?: number;
};

export type CrafterGridNode = {
  id: string;
  slot: CrafterEditorSlot;
  type: CrafterNodeType;
  index?: number;
  label: string;
  item?: CrafterBootstrapItem;
  itemId?: string;
  itemName?: string;
  level: number;
  rarity: number;
  tier: number;
  emptyLabel: string;
  meta?: string;
  interactionMode?: CrafterNodeInteractionMode;
  interactionLabel?: string;
  categoryLabel?: string;
};

export type CrafterNodeBehavior = {
  mode: CrafterNodeInteractionMode;
  options: CrafterBootstrapItem[];
  canEditItem: boolean;
  canEditLevel: boolean;
  canClear: boolean;
  helperLabel?: string;
  callout?: string;
  categoryLabel?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

export type CrafterGridSection = {
  id: string;
  title: string;
  gridClassName: string;
  nodes: CrafterGridNode[];
};

export const EQUIPMENT_SLOTS: CrafterSlotKey[] = ['weapon', 'armor', 'headgear', 'shield', 'accessory', 'shoes'];
export const FOOD_RECIPE_SLOTS = 6;
export const SLOT_GROUP_GRID_CLASS = 'inline-grid w-fit min-w-fit grid-cols-3 gap-4';
