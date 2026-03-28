import * as React from 'react';
import {
  AlertTriangle,
  Anvil,
  Crown,
  Droplets,
  Flame,
  Footprints,
  Gem,
  Heart,
  Layers3,
  Lock,
  Moon,
  Mountain,
  Package,
  Plus,
  Shirt,
  Shield,
  Sparkles,
  Sun,
  Swords,
  Star,
  Wind,
} from 'lucide-react';
import {
  CrafterSelectorDialog,
  type CrafterItemPreviewData,
} from '@/components/Crafter/CrafterSelectorDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  calculateCrafterBuild,
  CRAFTER_RARITY_PLACEHOLDER_ID,
  CRAFTER_RARITY_PLACEHOLDER_NAME,
  createDefaultCrafterBuild,
  deserializeCrafterBuild,
  normalizeCrafterBuild,
  serializeCrafterBuild,
  type CrafterBuildState,
} from '@/lib/crafter';
import { itemMatchesCrafterSlot } from '@/lib/crafterData';
import { resolveItemImage } from '@/lib/itemImages';
import type { CrafterData, CrafterMaterialSelection, CrafterSlotConfig, CrafterSlotKey, Item } from '@/lib/schemas';
import { cn } from '@/lib/utils';

type CrafterViewProps = {
  items: Record<string, Item>;
  crafterData: CrafterData;
  serializedBuild?: string;
  onSerializedBuildChange: (serializedBuild: string) => void;
};

type CrafterTab = 'dashboard' | CrafterSlotKey | 'cooking';
type CrafterEditorSlot = CrafterSlotKey | 'food';
type CrafterNodeType = 'base' | 'recipe' | 'inherit' | 'upgrade' | 'foodBase';
type CrafterNodeInteractionMode = 'free' | 'fixed' | 'category';

type CrafterSelectedNode = {
  slot: CrafterEditorSlot;
  type: CrafterNodeType;
  index?: number;
};

type CrafterGridNode = {
  id: string;
  slot: CrafterEditorSlot;
  type: CrafterNodeType;
  index?: number;
  label: string;
  item?: Item;
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

type CrafterNodeBehavior = {
  mode: CrafterNodeInteractionMode;
  options: Item[];
  canEditItem: boolean;
  canEditLevel: boolean;
  canClear: boolean;
  helperLabel?: string;
  callout?: string;
  categoryLabel?: string;
};

type CrafterGridSection = {
  id: string;
  title: string;
  gridClassName: string;
  nodes: CrafterGridNode[];
};

type CrafterSlotSize = 'sm' | 'md' | 'lg';

const EQUIPMENT_SLOTS: CrafterSlotKey[] = ['weapon', 'armor', 'headgear', 'shield', 'accessory', 'shoes'];
const FOOD_RECIPE_SLOTS = 6;
const STAT_DISPLAY_ORDER = ['atk', 'matk', 'def', 'mdef', 'str', 'int', 'vit', 'diz', 'crit', 'knock', 'stun'] as const;
const PERCENT_STAT_DISPLAY_KEYS = ['crit', 'knock', 'stun'] as const;
const STATUS_ATTACK_DISPLAY_ORDER = ['psn', 'seal', 'par', 'slp', 'ftg', 'sick', 'faint', 'drain'] as const;
const GEOMETRY_DISPLAY_ORDER = ['depth', 'length', 'width'] as const;
const ELEMENT_RESISTANCE_ORDER = ['fire', 'water', 'earth', 'wind', 'light', 'dark', 'love', 'no'] as const;
const REACTION_RESISTANCE_ORDER = ['diz', 'crit', 'knock'] as const;
const STATUS_RESISTANCE_ORDER = ['psn', 'seal', 'par', 'slp', 'ftg', 'sick', 'fnt', 'drain'] as const;
const DISPLAY_LABELS: Record<string, string> = {
  atk: 'ATK',
  matk: 'M.ATK',
  def: 'DEF',
  mdef: 'M.DEF',
  str: 'STR',
  int: 'INT',
  vit: 'VIT',
  diz: 'Diz',
  crit: 'Crit',
  knock: 'Knock',
  stun: 'Stun',
  depth: 'Depth',
  length: 'Length',
  width: 'Width',
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  wind: 'Wind',
  light: 'Light',
  dark: 'Dark',
  love: 'Love',
  no: 'No',
  psn: 'Psn',
  seal: 'Seal',
  par: 'Par',
  slp: 'Slp',
  ftg: 'Ftg',
  sick: 'Sick',
  faint: 'Faint',
  fnt: 'Faint',
  drain: 'Drain',
};

const SLOT_SIZE_CLASSES: Record<CrafterSlotSize, string> = {
  sm: 'h-24 w-24',
  md: 'h-24 w-24',
  lg: 'h-24 w-24',
};
const SLOT_GROUP_GRID_CLASS = 'inline-grid w-fit min-w-fit grid-cols-3 gap-4';
const CRAFTER_RARITY_PLACEHOLDER_ITEM: Item = {
  id: CRAFTER_RARITY_PLACEHOLDER_ID,
  name: CRAFTER_RARITY_PLACEHOLDER_NAME,
  type: 'Special',
  category: 'crafter-placeholder',
  rarityPoints: 15,
};

type SelectionUpdate = {
  itemId?: string;
  level?: number;
};

function padSelections(selections: CrafterMaterialSelection[] | undefined, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    itemId: selections?.[index]?.itemId,
    level: Math.max(1, Math.min(10, selections?.[index]?.level ?? (selections?.[index]?.itemId ? 10 : 1))),
  }));
}

function getRecipeSelections(
  current: CrafterMaterialSelection[] | undefined,
  count: number,
  defaults?: string[],
) {
  const padded = padSelections(current, count);
  return padded.map((selection, index) => {
    const rawItemId = selection.itemId;
    const defaultItemId = defaults?.[index] ?? undefined;
    const hasExplicitOverride = selection.itemId != null || selection.level !== 1;
    const itemId = rawItemId === '' ? undefined : rawItemId ?? defaults?.[index] ?? undefined;
    return {
      itemId,
      level:
        rawItemId && rawItemId !== ''
          ? selection.level
          : rawItemId === ''
            ? 1
            : defaultItemId
              ? hasExplicitOverride
                ? selection.level
                : 10
              : selection.level,
    };
  });
}

function createEmptySelections(count: number) {
  return Array.from({ length: count }, () => ({ itemId: undefined, level: 1 }));
}

function getEquipmentRecipeDefaults(
  slotKey: CrafterSlotKey,
  appearanceId: string | undefined,
  crafterData: CrafterData,
) {
  if (!appearanceId) return undefined;
  return crafterData.recipes.equipment[slotKey]?.[appearanceId]?.materials;
}

function getFoodRecipeDefaults(baseId: string | undefined, crafterData: CrafterData) {
  if (!baseId) return undefined;
  return crafterData.recipes.food[baseId]?.materials;
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
    .filter((item) => Boolean(item.stats) || Boolean(item.effects?.length) || item.rarityPoints != null || Boolean(item.craft?.length))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getCrafterDisplayItem(itemId: string | undefined, items: Record<string, Item>) {
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

function formatStatLabel(stat: string) {
  return DISPLAY_LABELS[stat] ?? stat
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function formatStatValue(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function formatPercentValue(value: number) {
  const roundedPercent = Math.round(value * 1000) / 10;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(roundedPercent)}%`;
}

function formatFinalStatValue(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatFinalPercentValue(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value * 100)}%`;
}

function isPercentDisplayStatKey(stat: string): stat is (typeof PERCENT_STAT_DISPLAY_KEYS)[number] {
  return (PERCENT_STAT_DISPLAY_KEYS as readonly string[]).includes(stat);
}

function BonusProgressBar({
  label,
  summary,
  tiers,
}: {
  label: string;
  summary: ReturnType<typeof calculateCrafterBuild>['bonusSummary']['level'];
  tiers: CrafterData['levelBonusTiers'];
}) {
  const maxThreshold = tiers.at(-1)?.threshold ?? summary.value;
  const absoluteRatio = maxThreshold <= 0 ? 0 : Math.min(1, Math.max(0, summary.value / maxThreshold));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">
          Tier {summary.tier} · {summary.value}
        </div>
      </div>
      <div className="relative">
        <div aria-label={`${label} progress`} className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-linear-to-r from-emerald-500 via-primary/80 to-primary" style={{ width: `${absoluteRatio * 100}%` }} />
        </div>
        {maxThreshold > 0 ? (
          <div className="pointer-events-none absolute inset-0">
            {tiers
              .filter((tier) => tier.threshold > 0)
              .map((tier) => {
                const left = Math.min(100, Math.max(0, (tier.threshold / maxThreshold) * 100));
                const isNext = tier.threshold === summary.nextThreshold;
                return (
                  <span
                    key={`${label}-${tier.threshold}`}
                    className={cn(
                      'absolute top-1/2 h-3 w-px -translate-y-1/2 bg-border/80',
                      isNext && 'h-4 w-0.5 bg-primary',
                    )}
                    style={{ left: `${left}%` }}
                  />
                );
              })}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>{summary.currentThreshold}{summary.nextThreshold != null ? ` → ${summary.nextThreshold}` : ' → max'}</span>
        <span>{summary.isMaxTier ? 'Max tier' : `${summary.remainingToNext} to next`}</span>
      </div>
    </div>
  );
}

function getItemTypeIcon(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes('sword') || normalized.includes('staff') || normalized.includes('spear') || normalized.includes('forge')) {
    return 'swords';
  }
  if (normalized.includes('shield')) return 'shield';
  if (normalized.includes('armor') || normalized.includes('robe') || normalized.includes('craft')) return 'shirt';
  if (normalized.includes('crown') || normalized.includes('helm') || normalized.includes('hat')) return 'crown';
  if (normalized.includes('ring') || normalized.includes('belt') || normalized.includes('accessory')) return 'gem';
  if (normalized.includes('boot') || normalized.includes('shoe') || normalized.includes('greave')) return 'footprints';
  if (normalized.includes('dish') || normalized.includes('food') || normalized.includes('potion')) return 'sparkles';

  return 'package';
}

function getSlotIcon(node: CrafterGridNode) {
  if (node.item) {
    return getItemTypeIcon(node.item.type);
  }

  switch (node.type) {
    case 'base':
    case 'foodBase':
      return 'sparkles';
    case 'inherit':
      return 'gem';
    case 'upgrade':
      return 'package';
    default:
      return 'plus';
  }
}

function CrafterSlotIcon({ node, className }: { node: CrafterGridNode; className?: string }) {
  switch (getSlotIcon(node)) {
    case 'swords':
      return <Swords className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'shirt':
      return <Shirt className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'footprints':
      return <Footprints className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'package':
      return <Package className={className} />;
    default:
      return <Plus className={className} />;
  }
}

function getSlotChipClasses(nodeType: CrafterNodeType) {
  switch (nodeType) {
    case 'base':
    case 'foodBase':
      return 'bg-primary/10 text-primary';
    case 'inherit':
    case 'upgrade':
      return 'bg-secondary text-secondary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getRarityBadgeClasses(rarity: number) {
  if (rarity >= 9) return 'border-amber-500/50 bg-amber-500 text-amber-950';
  if (rarity >= 7) return 'border-violet-500/50 bg-violet-500 text-violet-950';
  if (rarity >= 5) return 'border-sky-500/50 bg-sky-500 text-sky-950';
  if (rarity >= 3) return 'border-emerald-500/50 bg-emerald-500 text-emerald-950';
  return 'border-border bg-muted text-muted-foreground';
}

function formatItemEffect(effect: NonNullable<Item['effects']>[number]) {
  switch (effect.type) {
    case 'cure':
      return `Cures ${effect.targets.join(', ')}`;
    case 'resistance':
      return `${formatStatLabel(effect.target)} resistance ${effect.value}`;
    case 'inflict':
      return `Inflicts ${effect.target} on ${effect.trigger}`;
  }
}

function getStatIcon(stat: string) {
  switch (stat) {
    case 'atk':
    case 'str':
      return Swords;
    case 'matk':
    case 'int':
      return Sparkles;
    case 'def':
    case 'mdef':
      return Shield;
    case 'vit':
      return Heart;
    case 'fire':
      return Flame;
    case 'water':
      return Droplets;
    case 'earth':
      return Mountain;
    case 'wind':
      return Wind;
    case 'light':
      return Sun;
    case 'dark':
      return Moon;
    default:
      return Sparkles;
  }
}

function formatSignedValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatStatValue(value)}`;
}

function formatSignedPercentValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatPercentValue(value)}`;
}

function formatSignedCrafterStatValue(stat: string, value: number) {
  return isPercentDisplayStatKey(stat) ? formatSignedPercentValue(value) : formatSignedValue(value);
}

function formatSignedFinalValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatFinalStatValue(value)}`;
}

function formatSignedFinalPercentValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatFinalPercentValue(value)}`;
}

function formatSignedFinalCrafterStatValue(stat: string, value: number) {
  return isPercentDisplayStatKey(stat) ? formatSignedFinalPercentValue(value) : formatSignedFinalValue(value);
}

function resolveCrafterItemImage(item?: Item) {
  if (!item) return undefined;
  return resolveItemImage(item.name, item.image) ?? item.image;
}

function getEquipmentPayloadForSlot(slotKey: CrafterSlotKey, itemId: string | undefined, crafterData: CrafterData) {
  if (!itemId) return undefined;
  return slotKey === 'weapon' ? crafterData.stats.weapon[itemId] : crafterData.stats.armor[itemId];
}

function getMaterialPayloadForSlot(slotKey: CrafterSlotKey, itemId: string | undefined, crafterData: CrafterData) {
  if (!itemId) return undefined;
  return slotKey === 'weapon' ? crafterData.materials.weapon[itemId] : crafterData.materials.armor[itemId];
}

function getNodePreviewData(
  node: CrafterSelectedNode | CrafterGridNode | undefined,
  item: Item | undefined,
  itemId: string | undefined,
  crafterData: CrafterData,
): CrafterItemPreviewData {
  const payload = (() => {
    if (!node || !itemId) return undefined;
    if (node.slot === 'food') {
      return node.type === 'foodBase'
        ? crafterData.food.baseStats[itemId]
        : crafterData.materials.food[itemId];
    }
    return node.type === 'base'
      ? getEquipmentPayloadForSlot(node.slot, itemId, crafterData)
      : getMaterialPayloadForSlot(node.slot, itemId, crafterData);
  })();
  const payloadStats =
    payload && 'additive' in payload
      ? payload.additive
      : payload?.stats;
  const payloadGeometry = payload && 'geometry' in payload ? payload.geometry : undefined;
  const payloadResistances = payload?.resistances;

  const stats = STAT_DISPLAY_ORDER
    .map((key) => [key, Number(payloadStats?.[key] ?? item?.stats?.[key] ?? 0)] as const)
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
    keys: readonly (typeof ELEMENT_RESISTANCE_ORDER[number] | typeof REACTION_RESISTANCE_ORDER[number] | typeof STATUS_RESISTANCE_ORDER[number])[],
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
  const effects = item?.effects?.map(formatItemEffect) ?? [];

  return {
    imageSrc: resolveCrafterItemImage(item),
    stats,
    statusAttacks,
    others,
    resistanceGroups,
    effects,
    rarity:
      (payload && 'rarity' in payload ? payload.rarity : undefined)
      ?? item?.rarityPoints
      ?? (itemId === CRAFTER_RARITY_PLACEHOLDER_ID ? 15 : 0),
  };
}

function CrafterItemSlot({
  node,
  onClick,
  caption,
  previewData,
  size = 'md',
}: {
  node: CrafterGridNode;
  onClick: () => void;
  caption: string;
  previewData: CrafterItemPreviewData;
  size?: CrafterSlotSize;
}) {
  const accessibleName = node.item ? (node.itemName ?? node.item.name ?? node.label) : node.label;
  const imageSrc = resolveCrafterItemImage(node.item);
  const isFixedSlot = node.interactionMode === 'fixed';
  const isCategorySlot = node.interactionMode === 'category';

  const slotButton = (
    <button
      type="button"
      aria-label={accessibleName}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center rounded-xl border-2 bg-card/80 px-2 pb-2 pt-3 transition-all',
        SLOT_SIZE_CLASSES[size],
        isCategorySlot && 'border-dashed border-primary/40 bg-primary/5 hover:border-primary',
        isFixedSlot && 'border-solid border-primary/25 bg-primary/5 hover:border-primary/50',
        node.item
          ? 'border-solid border-border hover:border-primary hover:shadow-md'
          : 'border-dashed border-muted-foreground/30 bg-muted/50 hover:border-primary hover:bg-muted',
      )}
    >
      {node.item ? (
        <>
          <Badge variant="secondary" className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center gap-1 rounded-md border px-1 text-[10px]">
            <Anvil className="h-3 w-3" />
            {node.level}
          </Badge>
          <Badge
            variant="secondary"
            className={cn('absolute -right-1 -top-1 flex h-5 min-w-5 items-center gap-1 rounded-md border px-1 text-[10px]', getRarityBadgeClasses(node.rarity))}
          >
            <Star className="h-3 w-3" />
            {node.rarity}
          </Badge>
        </>
      ) : null}

      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', getSlotChipClasses(node.type))}>
        {imageSrc ? (
          <img src={imageSrc} alt={`${node.itemName ?? node.item?.name ?? node.label} icon`} className="h-8 w-8 object-contain" />
        ) : (
          <CrafterSlotIcon node={node} className="h-4 w-4" />
        )}
      </div>

      {node.item ? (
        <span className="mt-1 max-w-full truncate px-1 text-[10px] font-medium text-foreground">
          {node.itemName ?? node.label}
        </span>
      ) : (
        <span className="mt-1 text-[10px] text-muted-foreground">{node.label}</span>
      )}

      {node.interactionLabel ? (
        <span
          className={cn(
            'mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
            isCategorySlot
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-background/80 text-muted-foreground',
          )}
        >
          {isCategorySlot ? <Layers3 className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
          {node.interactionLabel}
        </span>
      ) : null}
    </button>
  );

  const captionContent = <p className="text-[11px] font-medium leading-tight text-muted-foreground">{caption}</p>;

  if (!node.item) {
    return (
      <div className="mt-1 flex w-24 flex-none flex-col items-center gap-2 text-center">
        {slotButton}
        {captionContent}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <div className="mt-1 flex w-24 flex-none flex-col items-center gap-2 text-center">
          <TooltipTrigger asChild>{slotButton}</TooltipTrigger>
          {captionContent}
        </div>
        <TooltipContent
          side="right"
          sideOffset={6}
          arrowClassName="fill-popover"
          className="max-w-xs rounded-xl border border-border bg-popover px-3 py-3 text-popover-foreground shadow-lg"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold">{node.item.name}</span>
              <Badge variant="outline">Lv. {node.level}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{node.item.type}</p>
            {previewData.stats.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {previewData.stats.slice(0, 4).map((entry) => (
                  <Badge key={entry} variant="secondary" className="h-auto rounded-md px-2 py-1 text-[10px]">
                    {entry}
                  </Badge>
                ))}
              </div>
            ) : null}
            {previewData.statusAttacks.length > 0 ? (
              <div className="space-y-1">
                {previewData.statusAttacks.slice(0, 3).map((entry) => (
                  <p key={entry} className="text-xs text-muted-foreground">
                    {entry}
                  </p>
                ))}
              </div>
            ) : null}
            {previewData.effects.length > 0 ? (
              <div className="space-y-1">
                {previewData.effects.slice(0, 2).map((effect) => (
                  <p key={effect} className="text-xs text-primary">
                    {effect}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CrafterOverviewCard({
  node,
  onClick,
  previewData,
}: {
  node: CrafterGridNode;
  onClick: () => void;
  previewData: CrafterItemPreviewData;
}) {
  return (
    <Card className="rounded-2xl border bg-background/40 shadow-none transition-colors hover:border-primary/40">
      <CardContent className="flex items-center gap-3 p-3">
        <CrafterItemSlot node={node} onClick={onClick} caption={node.label} previewData={previewData} />
        <div className="min-w-0 space-y-1">
          <div className="font-medium">{node.label}</div>
          <div className="truncate text-sm text-muted-foreground">{node.itemName ?? node.meta ?? node.emptyLabel}</div>
          <div className="text-xs text-muted-foreground">
            Rarity {node.rarity} · Tier {node.tier}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CrafterStatsPanel({
  title,
  healing,
  stats,
  statMultipliers,
  statusAttacks,
  geometry,
  resistances,
  effects,
  emphasized = false,
}: {
  title: string;
  healing?: {
    hp: number;
    hpPercent: number;
    rp: number;
    rpPercent: number;
  };
  stats: Partial<NonNullable<Item['stats']>>;
  statMultipliers?: Partial<NonNullable<Item['stats']>>;
  statusAttacks?: Record<string, number>;
  geometry?: Record<string, number>;
  resistances: Record<string, number>;
  effects: string[];
  emphasized?: boolean;
}) {
  const healingEntries = [
    ['HP', healing?.hp ?? 0, false],
    ['HP%', healing?.hpPercent ?? 0, true],
    ['RP', healing?.rp ?? 0, false],
    ['RP%', healing?.rpPercent ?? 0, true],
  ].filter(([, value]) => Number(value) !== 0) as Array<[string, number, boolean]>;
  const statEntries = STAT_DISPLAY_ORDER
    .map((key) => [key, Number(stats[key] ?? 0)] as const)
    .filter(([, value]) => value !== 0);
  const multiplierEntries = STAT_DISPLAY_ORDER
    .map((key) => [key, Number(statMultipliers?.[key] ?? 0)] as const)
    .filter(([, value]) => value !== 0);
  const geometryEntries = GEOMETRY_DISPLAY_ORDER
    .map((key) => [key, Number(geometry?.[key] ?? 0)] as const)
    .filter(([, value]) => value !== 0);
  const statusAttackEntries = STATUS_ATTACK_DISPLAY_ORDER
    .map((key) => [key, Number(statusAttacks?.[key] ?? 0)] as const)
    .filter(([, value]) => value !== 0);
  const buildResistanceEntries = (keys: readonly string[]) =>
    keys
      .map((key) => [key, Number(resistances[key] ?? 0)] as const)
      .filter(([, value]) => value !== 0);
  const elementResistanceEntries = buildResistanceEntries(ELEMENT_RESISTANCE_ORDER);
  const reactionResistanceEntries = buildResistanceEntries(REACTION_RESISTANCE_ORDER);
  const statusResistanceEntries = buildResistanceEntries(STATUS_RESISTANCE_ORDER);
  const uniqueEffects = Array.from(new Set(effects.filter(Boolean)));

  return (
    <Card className={cn('rounded-2xl border shadow-sm', emphasized ? 'border-primary/30 bg-primary/5' : 'bg-card/90')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {healingEntries.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Healing</div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {healingEntries.map(([label, value, isPercent]) => (
                <div key={label} className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="ml-auto text-sm font-semibold">
                    {isPercent ? formatFinalPercentValue(value) : formatSignedFinalValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {healingEntries.length > 0 ? <div className="h-px bg-border" /> : null}
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Stats</div>
          {statEntries.length > 0 || multiplierEntries.length > 0 ? (
            <div className="space-y-3">
              {statEntries.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {statEntries.map(([key, value]) => {
                    const Icon = getStatIcon(key);

                    return (
                      <div key={key} className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{formatStatLabel(key)}</span>
                        <span className="ml-auto text-sm font-semibold">{formatSignedFinalCrafterStatValue(key, value)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {multiplierEntries.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {multiplierEntries.map(([key, value]) => (
                    <Badge key={`${key}-multiplier`} variant="outline" className="h-auto rounded-md px-2 py-1 text-[10px]">
                      {formatStatLabel(key)}% {value > 0 ? '+' : ''}{formatFinalPercentValue(value)}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No stats to display</p>
          )}
        </div>

        {geometryEntries.length > 0 ? (
          <>
            <div className="h-px bg-border" />
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Others</div>
              <div className="flex flex-wrap gap-1.5">
                {geometryEntries.map(([key, value]) => (
                  <Badge key={key} variant="outline" className="h-auto rounded-md px-2 py-1 text-[10px]">
                    {formatStatLabel(key)} {formatSignedValue(value)}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <div className="h-px bg-border" />
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status Attack</div>
          {statusAttackEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {statusAttackEntries.map(([key, value]) => (
                <Badge key={key} variant="outline" className="h-auto rounded-md px-2 py-1 text-[10px]">
                  {formatStatLabel(key)} {formatFinalPercentValue(value)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No status attacks to display</p>
          )}
        </div>

        <div className="h-px bg-border" />
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Elem Res</div>
          {elementResistanceEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {elementResistanceEntries.map(([key, value]) => (
                <Badge key={key} variant="outline" className="h-auto rounded-md px-2 py-1 text-[10px]">
                  {formatStatLabel(key)}: {value > 0 ? '+' : ''}{formatFinalPercentValue(value)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No elemental resistances to display</p>
          )}
        </div>

        <div className="h-px bg-border" />
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Reaction Res</div>
          {reactionResistanceEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {reactionResistanceEntries.map(([key, value]) => (
                <Badge key={key} variant="outline" className="h-auto rounded-md px-2 py-1 text-[10px]">
                  {formatStatLabel(key)}: {value > 0 ? '+' : ''}{formatFinalPercentValue(value)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reaction resistances to display</p>
          )}
        </div>

        <div className="h-px bg-border" />
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status Res</div>
          {statusResistanceEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {statusResistanceEntries.map(([key, value]) => (
                <Badge key={key} variant="outline" className="h-auto rounded-md px-2 py-1 text-[10px]">
                  {formatStatLabel(key)}: {value > 0 ? '+' : ''}{formatFinalPercentValue(value)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No status resistances to display</p>
          )}
        </div>

        <div className="h-px bg-border" />
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Bonus Effects</div>
          {uniqueEffects.length > 0 ? (
            <div className="space-y-1">
              {uniqueEffects.map((effect) => (
                <p key={effect} className="text-sm text-primary">
                  {effect}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No bonus effects to display</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getNodeTitle(node: CrafterSelectedNode) {
  if (node.type === 'recipe' && node.index != null) return `Recipe ${node.index + 1}`;
  if (node.type === 'inherit' && node.index != null) return `Inheritance ${node.index + 1}`;
  if (node.type === 'upgrade' && node.index != null) return `Upgrade ${node.index + 1}`;
  if (node.type === 'foodBase') return 'Base Food';
  return 'Base';
}

function isEquipmentTab(tab: CrafterTab): tab is CrafterSlotKey {
  return EQUIPMENT_SLOTS.includes(tab as CrafterSlotKey);
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

  return getEquipmentRecipeDefaults(node.slot, build[node.slot].appearanceId, crafterData)?.[node.index];
}

function resolveNodeBehavior(
  node: CrafterSelectedNode | CrafterGridNode,
  build: CrafterBuildState,
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>,
  items: Record<string, Item>,
  crafterData: CrafterData,
): CrafterNodeBehavior {
  if (node.type === 'recipe') {
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
      };
    }
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

function getEditableSelection(
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

function getSelectedNodeOptions(
  node: CrafterSelectedNode,
  build: CrafterBuildState,
  crafterData: CrafterData,
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>,
  items: Record<string, Item>,
) {
  return resolveNodeBehavior(node, build, slotConfigByKey, items, crafterData).options;
}

function updateNodeInBuild(
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

function buildGridSectionsForSlot({
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
  calculation: ReturnType<typeof calculateCrafterBuild>;
}): CrafterGridSection[] {
  if (activeSlot === 'food') {
    const baseItem = build.food.baseId ? items[build.food.baseId] : undefined;
    const recipeSelections = getRecipeSelections(
      build.food.recipe,
      FOOD_RECIPE_SLOTS,
      getFoodRecipeDefaults(build.food.baseId, crafterData),
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
          rarity: baseItem?.rarityPoints ?? 0,
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
            rarity: item?.rarityPoints ?? 0,
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
  const recipeSelections = getRecipeSelections(
    slot.recipe,
    slotConfig.recipeSlots,
    getEquipmentRecipeDefaults(activeSlot, slot.appearanceId, crafterData),
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
        rarity: appearanceItem?.rarityPoints ?? 0,
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
          getEquipmentRecipeDefaults(activeSlot, slot.appearanceId, crafterData)?.[index],
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
          rarity: item?.rarityPoints ?? 0,
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
          rarity: item?.rarityPoints ?? 0,
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
          rarity: item?.rarityPoints ?? 0,
          tier: 0,
          emptyLabel: `Upgrade ${index + 1}`,
          meta: 'Upgrade slot',
        };
      }),
    },
  ];

  return sections;
}

function renderDashboardCards(
  calculation: ReturnType<typeof calculateCrafterBuild>,
  items: Record<string, Item>,
  crafterData: CrafterData,
  build: CrafterBuildState,
  onSelectTab: (tab: CrafterTab) => void,
) {
  const equipmentCards = EQUIPMENT_SLOTS.map((slotKey) => {
    const slotResult = calculation.slotResults[slotKey];
    const item = getCrafterDisplayItem(build[slotKey].appearanceId, items);

    return (
      <CrafterOverviewCard
        key={slotKey}
        node={{
          id: `dashboard-${slotKey}`,
          slot: slotKey,
          type: 'base',
          label: slotResult.label,
          item,
          itemId: item?.id,
          itemName: slotResult.appearanceName ?? item?.name ?? slotResult.label,
          level: slotResult.itemLevel || 1,
          rarity: item?.rarityPoints ?? 0,
          tier: slotResult.tier,
          emptyLabel: slotResult.label,
          meta: slotResult.baseName ? `Actual Base: ${slotResult.baseName}` : item?.name ? 'Base item selected' : 'Empty slot',
        }}
        previewData={getNodePreviewData({ slot: slotKey, type: 'base' }, item, item?.id, crafterData)}
        onClick={() => onSelectTab(slotKey)}
      />
    );
  });

  const foodItem = build.food.baseId ? items[build.food.baseId] : undefined;

  return [
    ...equipmentCards,
    <CrafterOverviewCard
      key="dashboard-food"
      node={{
        id: 'dashboard-food',
        slot: 'food',
        type: 'foodBase',
        label: 'Cooking',
        item: foodItem,
        itemId: foodItem?.id,
        itemName: foodItem?.name ?? 'Cooking',
        level: calculation.foodSummary.finalLevel || 1,
        rarity: foodItem?.rarityPoints ?? 0,
        tier: 0,
        emptyLabel: 'Cooking',
        meta: 'Food bonuses and recipe ingredients',
      }}
      previewData={getNodePreviewData({ slot: 'food', type: 'foodBase' }, foodItem, foodItem?.id, crafterData)}
      onClick={() => onSelectTab('cooking')}
    />,
  ];
}

export function CrafterView({
  items,
  crafterData,
  serializedBuild,
  onSerializedBuildChange,
}: CrafterViewProps) {
  const deserializedBuild = deserializeCrafterBuild(serializedBuild, crafterData);
  const calculation = calculateCrafterBuild(deserializedBuild, items, crafterData);
  const build = deserializedBuild;
  const slotConfigByKey = React.useMemo(
    () =>
      Object.fromEntries(crafterData.slotConfigs.map((slotConfig) => [slotConfig.key, slotConfig])) as Record<
        CrafterSlotKey,
        CrafterSlotConfig
      >,
    [crafterData.slotConfigs],
  );
  const [activeTab, setActiveTab] = React.useState<CrafterTab>('dashboard');
  const [selectedNode, setSelectedNode] = React.useState<CrafterSelectedNode | null>(null);

  React.useEffect(() => {
    setSelectedNode(null);
  }, [activeTab]);

  const updateBuild = (next: CrafterBuildState) => {
    const normalized = normalizeCrafterBuild(next, items, crafterData);
    const serializedBuildState: CrafterBuildState = {
      ...normalized,
      food: {
        ...normalized.food,
        recipe: next.food.recipe,
      },
      weapon: {
        ...normalized.weapon,
        recipe: next.weapon.recipe,
        inherits: next.weapon.inherits,
        upgrades: next.weapon.upgrades,
      },
      armor: {
        ...normalized.armor,
        recipe: next.armor.recipe,
        inherits: next.armor.inherits,
        upgrades: next.armor.upgrades,
      },
      headgear: {
        ...normalized.headgear,
        recipe: next.headgear.recipe,
        inherits: next.headgear.inherits,
        upgrades: next.headgear.upgrades,
      },
      shield: {
        ...normalized.shield,
        recipe: next.shield.recipe,
        inherits: next.shield.inherits,
        upgrades: next.shield.upgrades,
      },
      accessory: {
        ...normalized.accessory,
        recipe: next.accessory.recipe,
        inherits: next.accessory.inherits,
        upgrades: next.accessory.upgrades,
      },
      shoes: {
        ...normalized.shoes,
        recipe: next.shoes.recipe,
        inherits: next.shoes.inherits,
        upgrades: next.shoes.upgrades,
      },
    };
    onSerializedBuildChange(serializeCrafterBuild(serializedBuildState, crafterData));
  };

  const resetBuild = () => {
    updateBuild(createDefaultCrafterBuild(crafterData));
    setSelectedNode(null);
  };

  const activeEditorSlot: CrafterEditorSlot | null = activeTab === 'cooking' ? 'food' : isEquipmentTab(activeTab) ? activeTab : null;

  const gridSections = activeEditorSlot
    ? buildGridSectionsForSlot({
        activeSlot: activeEditorSlot,
        build,
        items,
        crafterData,
        slotConfigByKey,
        calculation,
      })
    : [];

  const gridNodes = gridSections.flatMap((section) => section.nodes);
  const selectedGridNode = selectedNode
    ? gridNodes.find((node) => node.slot === selectedNode.slot && node.type === selectedNode.type && node.index === selectedNode.index)
    : undefined;
  const selectedNodeBehavior = selectedNode
    ? resolveNodeBehavior(selectedNode, build, slotConfigByKey, items, crafterData)
    : undefined;
  const editorOptions = selectedNode ? getSelectedNodeOptions(selectedNode, build, crafterData, slotConfigByKey, items) : [];
  const selectedEditableValue = selectedNode ? getEditableSelection(build, selectedNode, crafterData) : undefined;
  const canEditLevel = selectedNodeBehavior?.canEditLevel ?? false;

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
  const activeBonusSummaries =
    isEquipmentTab(activeTab)
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
    if (activeEditorSlot === 'food') {
      return getCrafterDisplayItem(build.food.baseId, items);
    }
    if (activeEditorSlot) {
      const activeBuild = build[activeEditorSlot];
      return getCrafterDisplayItem(activeBuild.appearanceId, items);
    }
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

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border bg-card/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive Crafter
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight">Interactive Crafter</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Detailed planner for slot-by-slot crafting, cooking, and final build review.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={resetBuild}>
              Reset Build
            </Button>
          </div>
        </div>
      </section>

      {calculation.warnings.length > 0 ? (
        <section className="space-y-3">
          {calculation.warnings.map((warning) => (
            <div
              key={`${warning.code}-${warning.slot ?? 'global'}`}
              className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <div className="font-semibold">{warning.slot ? `${warning.slot} warning` : 'Build warning'}</div>
                <div className="text-muted-foreground">{warning.message}</div>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="rounded-2xl border bg-card/90 p-4 shadow-sm">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CrafterTab)} className="gap-4">
          <div className="overflow-x-auto">
            <TabsList variant="line" className="w-max min-w-full justify-start gap-2 rounded-xl bg-muted/40 p-1">
              <TabsTrigger value="dashboard" className="rounded-lg px-4 py-2 data-active:bg-background">
                Dashboard
              </TabsTrigger>
              {crafterData.slotConfigs.map((slotConfig) => (
                <TabsTrigger key={slotConfig.key} value={slotConfig.key} className="rounded-lg px-4 py-2 data-active:bg-background">
                  {slotConfig.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="cooking" className="rounded-lg px-4 py-2 data-active:bg-background">
                Cooking
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </section>

      {activeTab === 'dashboard' ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card className="rounded-2xl bg-card/90 shadow-sm">
              <CardHeader className="pb-2">
                <h2 className="text-base leading-snug font-medium">Final Build</h2>
                <CardDescription>Complete build summary driven by the current crafter state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border bg-background/70 p-4 text-center">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Attack Type</div>
                    <div className="mt-2 text-lg font-semibold">{calculation.attackSummary.attackType}</div>
                  </div>
                  <div className="rounded-lg border bg-background/70 p-4 text-center">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Damage Type</div>
                    <div className="mt-2 text-lg font-semibold">{calculation.attackSummary.damageType}</div>
                  </div>
                  <div className="rounded-lg border bg-background/70 p-4 text-center">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Element</div>
                    <div className="mt-2 text-lg font-semibold">{calculation.attackSummary.element}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Set Overview</CardTitle>
                <CardDescription>Jump into any slot or review the combined build totals.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {renderDashboardCards(calculation, items, crafterData, build, setActiveTab)}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <CrafterStatsPanel
              title="Final Stats"
              stats={summaryStats}
              statusAttacks={summaryStatusAttacks}
              geometry={summaryGeometry}
              resistances={summaryResistances}
              effects={summaryEffects}
              emphasized
            />
          </div>
        </section>
      ) : null}

      {activeEditorSlot ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {activeEditorSlot !== 'food' ? (
              <>
                <Card className="rounded-2xl bg-card/90 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Base</CardTitle>
                    <CardDescription>
                      Set the crafted base item and supporting recipe slots for this equipment piece.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="overflow-x-auto pb-1">
                      <div className="flex w-fit min-w-fit items-center gap-4">
                      {activeBaseNode ? (
                        <CrafterItemSlot
                          node={activeBaseNode}
                          size="lg"
                          caption="Base Item"
                          previewData={getNodePreviewData(activeBaseNode, activeBaseNode.item, activeBaseNode.itemId, crafterData)}
                          onClick={() => setSelectedNode({ slot: activeBaseNode.slot, type: activeBaseNode.type, index: activeBaseNode.index })}
                        />
                      ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl bg-card/90 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">Recipe Slots</CardTitle>
                      <Badge variant="secondary">{activeRecipeNodes.filter((node) => node.itemId).length}/{activeRecipeNodes.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto pb-1">
                      <div className={SLOT_GROUP_GRID_CLASS}>
                      {activeRecipeNodes.map((node) => (
                        <CrafterItemSlot
                          key={node.id}
                          node={node}
                          size="md"
                          caption={`Recipe ${Number(node.index ?? 0) + 1}`}
                          previewData={getNodePreviewData(node, node.item, node.itemId, crafterData)}
                          onClick={() => setSelectedNode({ slot: node.slot, type: node.type, index: node.index })}
                        />
                      ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl bg-card/90 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">Inherit Slots</CardTitle>
                      <Badge variant="secondary">{activeInheritNodes.filter((node) => node.itemId).length}/{activeInheritNodes.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto pb-1">
                      <div className={SLOT_GROUP_GRID_CLASS}>
                      {activeInheritNodes.map((node) => (
                        <CrafterItemSlot
                          key={node.id}
                          node={node}
                          size="md"
                          caption={`Inherit ${Number(node.index ?? 0) + 1}`}
                          previewData={getNodePreviewData(node, node.item, node.itemId, crafterData)}
                          onClick={() => setSelectedNode({ slot: node.slot, type: node.type, index: node.index })}
                        />
                      ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl bg-card/90 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">Upgrade Slots</CardTitle>
                      <Badge variant="secondary">{activeUpgradeNodes.filter((node) => node.itemId).length}/{activeUpgradeNodes.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto pb-1">
                      <div className={SLOT_GROUP_GRID_CLASS}>
                      {activeUpgradeNodes.map((node) => (
                        <CrafterItemSlot
                          key={node.id}
                          node={node}
                          size="sm"
                          caption={`+${Number(node.index ?? 0) + 1}`}
                          previewData={getNodePreviewData(node, node.item, node.itemId, crafterData)}
                          onClick={() => setSelectedNode({ slot: node.slot, type: node.type, index: node.index })}
                        />
                      ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="rounded-2xl bg-card/90 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dish Selection</CardTitle>
                  <CardDescription>
                    Select the base dish and refine its ingredient slots with the same compact planning flow used for equipment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {cookingBaseNode ? (
                    <div className="overflow-x-auto pb-1">
                      <div className="flex w-fit min-w-fit items-center gap-4">
                        <CrafterItemSlot
                          node={cookingBaseNode}
                          size="lg"
                          caption="Base Food"
                          previewData={getNodePreviewData(cookingBaseNode, cookingBaseNode.item, cookingBaseNode.itemId, crafterData)}
                          onClick={() => setSelectedNode({ slot: cookingBaseNode.slot, type: cookingBaseNode.type, index: cookingBaseNode.index })}
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">Ingredients</div>
                      <Badge variant="secondary">{activeRecipeNodes.filter((node) => node.itemId).length}/{activeRecipeNodes.length}</Badge>
                    </div>
                    <div className="overflow-x-auto pb-1">
                      <div className={SLOT_GROUP_GRID_CLASS}>
                        {activeRecipeNodes.map((node) => (
                          <CrafterItemSlot
                            key={node.id}
                            node={node}
                            size="md"
                            caption={`Recipe ${Number(node.index ?? 0) + 1}`}
                            previewData={getNodePreviewData(node, node.item, node.itemId, crafterData)}
                            onClick={() => setSelectedNode({ slot: node.slot, type: node.type, index: node.index })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          <div className="space-y-4">
            <Card className="rounded-2xl border-primary/30 bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{activeTab === 'cooking' ? 'Dish Preview' : 'Result Preview'}</CardTitle>
              </CardHeader>
              <CardContent>
                {activePreviewItem || activeSlotResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        {activePreviewItem ? (
                          <img src={resolveCrafterItemImage(activePreviewItem)} alt={`${activePrimaryPreviewName} icon`} className="h-9 w-9 object-contain" />
                        ) : (
                          <Sparkles className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{activePrimaryPreviewName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeTab === 'cooking' ? 'Cooking dish preview' : `Lv. ${activeSlotResult?.itemLevel ?? 1}`}
                        </p>
                      </div>
                    </div>
                    {activeEditorSlot !== 'food' && activeSlotResult ? (
                      <>
                        <div className="h-px bg-border" />
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Base: {activeSlotResult.appearanceName ?? 'No base selected'}</p>
                          <p>Actual Base: {activeSlotResult.baseName ?? 'No actual base selected'}</p>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select an item to preview the current result.</p>
                )}
              </CardContent>
            </Card>

            {activeBonusSummaries ? (
              <Card className="rounded-2xl bg-card/90 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Craft Bonuses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BonusProgressBar
                    label="Level Bonus"
                    summary={activeBonusSummaries.level}
                    tiers={crafterData.levelBonusTiers}
                  />
                  <BonusProgressBar
                    label="Rarity Bonus"
                    summary={activeBonusSummaries.rarity}
                    tiers={crafterData.rarityBonusTiers}
                  />
                </CardContent>
              </Card>
            ) : null}

            <CrafterStatsPanel
              title={activeTab === 'cooking' ? 'Dish Stats' : 'Final Stats'}
              healing={summaryHealing}
              stats={summaryStats}
              statMultipliers={summaryStatMultipliers}
              statusAttacks={summaryStatusAttacks}
              geometry={summaryGeometry}
              resistances={summaryResistances}
              effects={summaryEffects}
            />

            <Card className="rounded-2xl bg-card/90 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeEditorSlot !== 'food' ? (
                  <>
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Base</div>
                      <p className="text-sm">{activeSlotResult?.appearanceName ?? 'No base selected'}</p>
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Actual Base</div>
                      <p className="text-sm text-muted-foreground">{activeSlotResult?.baseName ?? 'No actual base selected'}</p>
                    </div>

                    <div className="h-px bg-border" />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Recipe</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {activeRecipeSummary.length > 0 ? (
                          activeRecipeSummary.map((itemName, index) => (
                            <Badge key={`${itemName}-${index}`} variant="outline" className="h-auto rounded-md px-2 py-1 text-[10px]">
                              {itemName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No recipe data</span>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border" />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Inherits</div>
                      <div className="mt-2 space-y-1">
                        {activeInheritSummary.length > 0 ? (
                          activeInheritSummary.map((itemName, index) => (
                            <p key={`${itemName}-${index}`} className="text-sm">
                              {index + 1}. {itemName}
                            </p>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No inherits added</span>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border" />
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Upgrade Order</div>
                      <div className="mt-2 space-y-1">
                        {activeUpgradeSummary.length > 0 ? (
                          activeUpgradeSummary.map((itemName, index) => (
                            <p key={`${itemName}-${index}`} className="text-sm">
                              +{index + 1}: {itemName}
                            </p>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No upgrades added</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Recipe</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeRecipeSummary.length > 0 ? (
                        activeRecipeSummary.map((itemName, index) => (
                          <Badge key={`${itemName}-${index}`} variant="outline" className="h-auto rounded-md px-2 py-1 text-[10px]">
                            {itemName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No recipe data</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <CrafterSelectorDialog
        open={selectedNode != null}
        title={selectedNode ? `Select ${getNodeTitle(selectedNode)}` : 'Select Item'}
        description="Choose an item, adjust the level when applicable, and apply the selection to the current build."
        selectedItem={selectedGridNode?.item}
        selectedItemId={selectedEditableValue?.itemId}
        selectedLevel={selectedEditableValue?.level ?? 1}
        canEditLevel={canEditLevel}
        canClear={selectedNodeBehavior?.canClear ?? true}
        options={editorOptions}
        getItemPreviewData={(item) => getNodePreviewData(selectedNode ?? selectedGridNode, item, item?.id, crafterData)}
        interactionMode={selectedNodeBehavior?.mode}
        interactionLabel={selectedNodeBehavior?.helperLabel}
        interactionCallout={selectedNodeBehavior?.callout}
        categoryLabel={selectedNodeBehavior?.categoryLabel}
        onOpenChange={(open) => !open && setSelectedNode(null)}
        onClear={() => {
          if (!selectedNode) return;
          updateBuild(
            updateNodeInBuild(
              build,
              selectedNode,
              { itemId: undefined, level: 1 },
              crafterData,
              slotConfigByKey,
              items,
            ),
          );
          setSelectedNode(null);
        }}
        onApply={(updates) => {
          if (!selectedNode) return;
          updateBuild(
            updateNodeInBuild(
              build,
              selectedNode,
              updates,
              crafterData,
              slotConfigByKey,
              items,
            ),
          );
          setSelectedNode(null);
        }}
      />
    </div>
  );
}
