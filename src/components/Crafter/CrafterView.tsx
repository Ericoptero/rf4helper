import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  Beef,
  Eye,
  PencilLine,
  Shield,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { CatalogFilterCombobox } from '@/components/CatalogFilterCombobox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CrafterData, CrafterSlotConfig, CrafterSlotKey, Item } from '@/lib/schemas';
import {
  calculateCrafterBuild,
  createDefaultCrafterBuild,
  deserializeCrafterBuild,
  serializeCrafterBuild,
  type CrafterBuildState,
} from '@/lib/crafter';
import { cn } from '@/lib/utils';

type CrafterViewProps = {
  items: Record<string, Item>;
  crafterData: CrafterData;
  serializedBuild?: string;
  viewMode: 'simple' | 'advanced';
  onSerializedBuildChange: (serializedBuild: string) => void;
  onViewModeChange: (viewMode: 'simple' | 'advanced') => void;
};

type CrafterEditorSlot = CrafterSlotKey | 'food';

type CrafterNodeType =
  | 'base'
  | 'appearance'
  | 'inherit'
  | 'recipe'
  | 'upgrade'
  | 'foodBase'
  | 'foodIngredient';

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
  level?: number;
  readOnly?: boolean;
  emptyLabel?: string;
  itemName?: string;
  meta?: string;
};

type CrafterGridSection = {
  id: string;
  title: string;
  gridClassName: string;
  nodes: CrafterGridNode[];
};

function getSlotOptions(items: Record<string, Item>, slotConfig: CrafterSlotConfig) {
  return Object.values(items)
    .filter((item) =>
      item.craft?.some(
        (craft) =>
          craft.stationType === slotConfig.stationType &&
          (slotConfig.stations.length === 0 || slotConfig.stations.includes(craft.station ?? '')),
      ),
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getFoodOptions(items: Record<string, Item>) {
  return Object.values(items)
    .filter((item) => item.craft?.some((craft) => craft.stationType === 'Cooking'))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getMaterialOptions(items: Record<string, Item>) {
  return Object.values(items)
    .filter(
      (item) =>
        Boolean(item.stats) ||
        Boolean(item.effects?.length) ||
        item.rarityPoints != null ||
        ['Object X', 'Double Steel', '10-Fold Steel', 'Light Ore'].includes(item.name),
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

function formatStatLabel(stat: string) {
  return stat
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function formatStatValue(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
}

function renderStatList(stats: Partial<NonNullable<Item['stats']>>) {
  const entries = Object.entries(stats).filter((entry) => entry[1] != null && entry[1] !== 0);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No direct stat modifiers.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl border bg-background/70 px-3 py-2 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{formatStatLabel(key)}</div>
          <div className="font-semibold">{formatStatValue(Number(value))}</div>
        </div>
      ))}
    </div>
  );
}

function renderResistanceList(resistances: Record<string, number>) {
  const entries = Object.entries(resistances).filter((entry) => entry[1] !== 0);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No resistance changes.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl border bg-background/70 px-3 py-2 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{key}</div>
          <div className="font-semibold">{formatStatValue(value * 100)}%</div>
        </div>
      ))}
    </div>
  );
}

function ItemThumbnail({ item, fallbackLabel }: { item?: Item; fallbackLabel: string }) {
  if (item?.image) {
    return (
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border bg-background/80">
        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/60 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {fallbackLabel.slice(0, 2)}
    </div>
  );
}

function CrafterGridCard({
  node,
  isSelected,
  onClick,
}: {
  node: CrafterGridNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        'flex min-h-36 flex-col items-start gap-3 rounded-3xl border bg-card p-4 text-left shadow-sm transition-colors',
        node.readOnly ? 'hover:border-primary/30' : 'hover:border-primary/50 hover:bg-card/95',
        isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border/70',
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {node.label}
        </div>
        {node.readOnly ? (
          <Eye className="h-4 w-4 text-muted-foreground" />
        ) : (
          <PencilLine className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <ItemThumbnail item={node.item} fallbackLabel={node.label} />

      <div className="space-y-1">
        <div className="line-clamp-2 text-sm font-semibold leading-tight">
          {node.itemName ?? node.emptyLabel ?? 'Empty'}
        </div>
        <div className="text-xs text-muted-foreground">
          {node.meta ?? (node.level ? `Lv.${node.level}` : node.readOnly ? 'Recipe slot' : 'Click to edit')}
        </div>
      </div>
    </button>
  );
}

function getEditableSelection(
  build: CrafterBuildState,
  node: CrafterSelectedNode,
): { itemId?: string; level: number } | undefined {
  if (node.slot === 'food') {
    if (node.type === 'foodBase') return { itemId: build.food.baseId, level: 10 };
    if (node.type === 'foodIngredient' && node.index != null) return build.food.ingredients[node.index];
    return undefined;
  }

  const slot = build[node.slot];
  if (node.type === 'base') return { itemId: slot.baseId, level: 10 };
  if (node.type === 'appearance') return { itemId: slot.appearanceId, level: 10 };
  if (node.type === 'inherit' && node.index != null) return slot.inherits[node.index];
  if (node.type === 'upgrade' && node.index != null) return slot.upgrades[node.index];
  return undefined;
}

function getSelectedNodeOptions(
  node: CrafterSelectedNode,
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>,
  items: Record<string, Item>,
) {
  if (node.slot === 'food') {
    return node.type === 'foodBase' ? getFoodOptions(items) : getMaterialOptions(items);
  }

  if (node.type === 'base' || node.type === 'appearance') {
    return getSlotOptions(items, slotConfigByKey[node.slot]);
  }

  if (node.type === 'inherit' || node.type === 'upgrade') {
    return getMaterialOptions(items);
  }

  return [];
}

function createFixedRecipeNodes({
  slot,
  ingredientIds,
  items,
}: {
  slot: CrafterEditorSlot;
  ingredientIds: string[];
  items: Record<string, Item>;
}): CrafterGridNode[] {
  return Array.from({ length: 6 }, (_, index) => {
    const ingredientId = ingredientIds[index];
    const item = ingredientId ? items[ingredientId] : undefined;

    return {
      id: `${slot}-recipe-${index}`,
      slot,
      type: 'recipe',
      index,
      label: `Recipe ${index + 1}`,
      item,
      itemId: ingredientId,
      itemName: item?.name,
      readOnly: true,
      emptyLabel: 'Recipe slot',
      meta: ingredientId ? 'Auto from recipe' : 'No recipe item',
    };
  });
}

function buildGridSectionsForSlot({
  activeSlot,
  build,
  items,
  slotConfigByKey,
}: {
  activeSlot: CrafterEditorSlot;
  build: CrafterBuildState;
  items: Record<string, Item>;
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>;
}): CrafterGridSection[] {
  if (activeSlot === 'food') {
    const foodItem = build.food.baseId ? items[build.food.baseId] : undefined;
    const recipeNodes = createFixedRecipeNodes({
      slot: 'food',
      ingredientIds: foodItem?.craft?.[0]?.ingredients ?? [],
      items,
    });
    const ingredientNodes = Array.from({ length: 6 }, (_, index) => {
      const material = build.food.ingredients[index] ?? { level: 10 };
      const item = material.itemId ? items[material.itemId] : undefined;

      return {
        id: `food-ingredient-${index}`,
        slot: 'food' as const,
        type: 'foodIngredient' as const,
        index,
        label: `Ingredient ${index + 1}`,
        item,
        itemId: material.itemId,
        itemName: item?.name,
        level: material.level,
        emptyLabel: 'Empty',
      };
    });

    return [
      {
        id: 'food-base',
        title: 'Base Food',
        gridClassName: 'grid-cols-1 sm:grid-cols-2',
        nodes: [
          {
            id: 'food-base',
            slot: 'food',
            type: 'foodBase',
            label: 'Base Food',
            item: foodItem,
            itemId: foodItem?.id,
            itemName: foodItem?.name,
            emptyLabel: 'Select food',
            meta: foodItem?.craft?.[0] ? `${foodItem.craft[0].station} Lv.${foodItem.craft[0].level}` : undefined,
          },
        ],
      },
      {
        id: 'food-recipe',
        title: 'Recipe',
        gridClassName: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
        nodes: recipeNodes,
      },
      {
        id: 'food-ingredients',
        title: 'Ingredients',
        gridClassName: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
        nodes: ingredientNodes,
      },
    ];
  }

  const slot = build[activeSlot];
  const slotKey = activeSlot as CrafterSlotKey;
  const slotConfig = slotConfigByKey[slotKey];
  const displayItem = slot.appearanceId ? items[slot.appearanceId] : undefined;
  const baseItem = slot.baseId ? items[slot.baseId] : undefined;
  const recipeNodes = createFixedRecipeNodes({
    slot: slotKey,
    ingredientIds: (displayItem ?? baseItem)?.craft?.[0]?.ingredients ?? [],
    items,
  });
  const inheritNodes = Array.from({ length: slotConfig.inheritSlots }, (_, index) => {
    const material = slot.inherits[index] ?? { level: 10 };
    const item = material.itemId ? items[material.itemId] : undefined;

    return {
      id: `${activeSlot}-inherit-${index}`,
      slot: slotKey,
      type: 'inherit' as const,
      index,
      label: `Inherit ${index + 1}`,
      item,
      itemId: material.itemId,
      itemName: item?.name,
      level: material.level,
      emptyLabel: 'Empty',
    };
  });
  const upgradeNodes = Array.from({ length: 9 }, (_, index) => {
    const material = slot.upgrades[index] ?? { level: 10 };
    const item = material.itemId ? items[material.itemId] : undefined;

    return {
      id: `${activeSlot}-upgrade-${index}`,
      slot: slotKey,
      type: 'upgrade' as const,
      index,
      label: `Upgrade ${index + 1}`,
      item,
      itemId: material.itemId,
      itemName: item?.name,
      level: material.level,
      emptyLabel: 'Empty',
    };
  });

  return [
    {
      id: `${activeSlot}-primary`,
      title: 'Base & Appearance',
      gridClassName: 'grid-cols-1 sm:grid-cols-2',
      nodes: [
        {
          id: `${activeSlot}-base`,
          slot: slotKey,
          type: 'base',
          label: 'Base',
          item: baseItem,
          itemId: baseItem?.id,
          itemName: baseItem?.name,
          emptyLabel: 'Select base',
          meta: baseItem?.craft?.[0] ? `${baseItem.craft[0].station} Lv.${baseItem.craft[0].level}` : undefined,
        },
        {
          id: `${activeSlot}-appearance`,
          slot: slotKey,
          type: 'appearance',
          label: 'Appearance',
          item: displayItem ?? baseItem,
          itemId: displayItem?.id,
          itemName: slotConfig.supportsAppearance ? displayItem?.name : baseItem?.name,
          emptyLabel: slotConfig.supportsAppearance ? 'Select appearance' : 'Uses base appearance',
          meta: slotConfig.supportsAppearance
            ? displayItem?.craft?.[0]
              ? `${displayItem.craft[0].station} look`
              : undefined
            : 'Appearance is tied to the base item',
          readOnly: !slotConfig.supportsAppearance,
        },
      ],
    },
    {
      id: `${activeSlot}-recipe`,
      title: 'Recipe',
      gridClassName: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      nodes: recipeNodes,
    },
    {
      id: `${activeSlot}-inherit`,
      title: 'Inherit',
      gridClassName: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      nodes: inheritNodes,
    },
    {
      id: `${activeSlot}-upgrades`,
      title: 'Upgrades',
      gridClassName: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      nodes: upgradeNodes,
    },
  ];
}

function updateNodeInBuild(
  build: CrafterBuildState,
  node: CrafterSelectedNode,
  updates: { itemId?: string; level?: number },
) {
  const next = structuredClone(build);

  if (node.slot === 'food') {
    if (node.type === 'foodBase') {
      next.food.baseId = updates.itemId;
      return next;
    }

    if (node.type === 'foodIngredient' && node.index != null) {
      next.food.ingredients[node.index] = {
        ...next.food.ingredients[node.index],
        itemId: updates.itemId,
        level: updates.level ?? next.food.ingredients[node.index].level,
      };
    }

    return next;
  }

  const slot = next[node.slot];

  if (node.type === 'base') {
    slot.baseId = updates.itemId;
    return next;
  }

  if (node.type === 'appearance') {
    slot.appearanceId = updates.itemId;
    return next;
  }

  if (node.type === 'inherit' && node.index != null) {
    slot.inherits[node.index] = {
      ...slot.inherits[node.index],
      itemId: updates.itemId,
      level: updates.level ?? slot.inherits[node.index].level,
    };
    return next;
  }

  if (node.type === 'upgrade' && node.index != null) {
    slot.upgrades[node.index] = {
      ...slot.upgrades[node.index],
      itemId: updates.itemId,
      level: updates.level ?? slot.upgrades[node.index].level,
    };
  }

  return next;
}

function getNodeTitle(node: CrafterSelectedNode) {
  if (node.type === 'recipe' && node.index != null) return `Recipe ${node.index + 1}`;
  if (node.type === 'inherit' && node.index != null) return `Inherit ${node.index + 1}`;
  if (node.type === 'upgrade' && node.index != null) return `Upgrade ${node.index + 1}`;
  if (node.type === 'foodIngredient' && node.index != null) return `Ingredient ${node.index + 1}`;
  if (node.type === 'foodBase') return 'Base Food';
  if (node.type === 'appearance') return 'Appearance';
  return 'Base';
}

export function CrafterView({
  items,
  crafterData,
  serializedBuild,
  viewMode,
  onSerializedBuildChange,
  onViewModeChange,
}: CrafterViewProps) {
  const build = deserializeCrafterBuild(serializedBuild, crafterData);
  const calculation = calculateCrafterBuild(build, items, crafterData);
  const slotConfigByKey = React.useMemo(
    () =>
      Object.fromEntries(crafterData.slotConfigs.map((slotConfig) => [slotConfig.key, slotConfig])) as Record<
        CrafterSlotKey,
        CrafterSlotConfig
      >,
    [crafterData.slotConfigs],
  );

  const [activeSlot, setActiveSlot] = React.useState<CrafterEditorSlot>('weapon');
  const [selectedNode, setSelectedNode] = React.useState<CrafterSelectedNode | null>(null);

  React.useEffect(() => {
    setSelectedNode(null);
  }, [activeSlot]);

  const gridSections = buildGridSectionsForSlot({
    activeSlot,
    build,
    items,
    slotConfigByKey,
  });
  const gridNodes = gridSections.flatMap((section) => section.nodes);
  const selectedGridNode = selectedNode
    ? gridNodes.find(
        (node) =>
          node.slot === selectedNode.slot &&
          node.type === selectedNode.type &&
          node.index === selectedNode.index,
      )
    : undefined;

  const selectedEditableValue = selectedGridNode
    ? getEditableSelection(build, {
        slot: selectedGridNode.slot,
        type: selectedGridNode.type,
        index: selectedGridNode.index,
      })
    : undefined;

  const editorOptions =
    selectedGridNode && !selectedGridNode.readOnly
      ? getSelectedNodeOptions(
          {
            slot: selectedGridNode.slot,
            type: selectedGridNode.type,
            index: selectedGridNode.index,
          },
          slotConfigByKey,
          items,
        )
      : [];

  const updateBuild = (next: CrafterBuildState) => {
    onSerializedBuildChange(serializeCrafterBuild(next));
  };

  const resetBuild = () => {
    updateBuild(createDefaultCrafterBuild(crafterData));
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive Crafter
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Interactive Crafter</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Build a full RF4 loadout through a slot-by-slot grid, inspect totals live, and keep the build shareable through the URL.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={viewMode === 'simple' ? 'default' : 'outline'}
              onClick={() => onViewModeChange('simple')}
            >
              Simple
            </Button>
            <Button
              type="button"
              variant={viewMode === 'advanced' ? 'default' : 'outline'}
              onClick={() => onViewModeChange('advanced')}
            >
              Advanced
            </Button>
            <Button type="button" variant="outline" onClick={resetBuild}>
              Reset Build
            </Button>
          </div>
        </div>
      </section>

      {calculation.warnings.length > 0 && (
        <section className="space-y-3">
          {calculation.warnings.map((warning) => (
            <div
              key={warning.code}
              className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <div className="font-semibold">{warning.slot ? `${warning.slot} warning` : 'Build warning'}</div>
                <div className="text-muted-foreground">{warning.message}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5">
        <Tabs value={activeSlot} onValueChange={(value) => setActiveSlot(value as CrafterEditorSlot)} className="gap-4">
          <div className="overflow-x-auto">
            <TabsList variant="line" className="w-max min-w-full justify-start gap-2 rounded-2xl bg-muted/50 p-1">
              {crafterData.slotConfigs.map((slotConfig) => (
                <TabsTrigger
                  key={slotConfig.key}
                  value={slotConfig.key}
                  className="rounded-xl px-4 py-2 data-active:bg-background"
                >
                  {slotConfig.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="food" className="rounded-xl px-4 py-2 data-active:bg-background">
                Food
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_300px]">
        <div className="space-y-6">
          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {activeSlot === 'food'
                  ? 'Food Grid'
                  : `${slotConfigByKey[activeSlot as CrafterSlotKey]?.label ?? activeSlot} Grid`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {gridSections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {section.title}
                  </div>
                  <div className={cn('grid gap-4', section.gridClassName)}>
                    {section.nodes.map((node) => (
                      <CrafterGridCard
                        key={node.id}
                        node={node}
                        isSelected={
                          selectedGridNode?.slot === node.slot &&
                          selectedGridNode?.type === node.type &&
                          selectedGridNode?.index === node.index
                        }
                        onClick={() =>
                          setSelectedNode({
                            slot: node.slot,
                            type: node.type,
                            index: node.index,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {viewMode === 'advanced' && (
            <Card className="rounded-3xl bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Advanced Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border bg-background/60 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Combat Readout</div>
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <div className="font-semibold">Weapon Class</div>
                        <div className="text-muted-foreground">{calculation.attackSummary.weaponClass}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Charge Attack</div>
                        <div className="text-muted-foreground">{calculation.attackSummary.chargeAttack}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Shield Effect</div>
                        <div className="text-muted-foreground">
                          {calculation.shieldSummary.coverage} ({formatStatValue(calculation.shieldSummary.factor * 100)}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background/60 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Barrett Bonus Tracker</div>
                    <div className="mt-3 grid gap-3">
                      <div className="rounded-xl border bg-card px-3 py-3">
                        <div className="font-semibold">Level Bonus</div>
                        <div className="text-sm text-muted-foreground">
                          Tier {calculation.bonusSummary.level.tier}: {calculation.bonusSummary.level.label || 'No assessment yet.'}
                        </div>
                      </div>
                      <div className="rounded-xl border bg-card px-3 py-3">
                        <div className="font-semibold">Rarity Bonus</div>
                        <div className="text-sm text-muted-foreground">
                          Tier {calculation.bonusSummary.rarity.tier}: {calculation.bonusSummary.rarity.label || 'No assessment yet.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {Object.values(calculation.slotResults).map((slotResult) => (
                  <div key={slotResult.slot} className="rounded-2xl border bg-background/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{slotResult.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {slotResult.appearanceName ?? slotResult.baseName}
                          {slotResult.baseName && slotResult.appearanceName && slotResult.baseName !== slotResult.appearanceName
                            ? ` with ${slotResult.baseName} stats`
                            : ''}
                        </div>
                      </div>
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {slotResult.recipeIngredients.length > 0 ? `Recipe: ${slotResult.recipeIngredients.join(', ')}` : 'No recipe'}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {slotResult.materialContributions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No inherited or upgrade material contributions.</div>
                      ) : (
                        slotResult.materialContributions.map((contribution, index) => (
                          <div key={`${slotResult.slot}-${contribution.itemId}-${index}`} className="rounded-xl border bg-card px-3 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-medium">
                                {contribution.itemName}
                                {contribution.behavior ? ` (${contribution.behavior})` : ''}
                              </div>
                              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {contribution.source} Lv.{contribution.level}
                              </div>
                            </div>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              {renderStatList(contribution.stats)}
                              {renderResistanceList(contribution.resistances)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">How To Build</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 text-sm md:grid-cols-2">
                {calculation.craftSteps.map((step, index) => (
                  <li key={`${step}-${index}`} className="rounded-2xl border bg-background/60 px-3 py-3">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Beef className="h-5 w-5 text-primary" />
                Final Total
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">{renderStatList(calculation.totalStats)}</CardContent>
          </Card>

          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Resistances
              </CardTitle>
            </CardHeader>
            <CardContent>{renderResistanceList(calculation.resistances)}</CardContent>
          </Card>

          {viewMode === 'simple' && (
            <Card className="rounded-3xl bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <WandSparkles className="h-5 w-5 text-primary" />
                  Combat Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold">Weapon Class</div>
                  <div className="text-muted-foreground">{calculation.attackSummary.weaponClass}</div>
                </div>
                <div>
                  <div className="font-semibold">Charge Attack</div>
                  <div className="text-muted-foreground">{calculation.attackSummary.chargeAttack}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Sheet open={selectedGridNode != null} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-5xl rounded-t-3xl border-t bg-background/98"
          showCloseButton
        >
          {selectedGridNode ? (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{selectedGridNode.readOnly ? 'Slot Details' : `Edit Slot: ${getNodeTitle(selectedGridNode)}`}</SheetTitle>
                <SheetDescription>
                  {selectedGridNode.readOnly
                    ? 'Inspect the selected card and confirm how it contributes to the current build.'
                    : 'Update the selected item and level without leaving the current slot grid.'}
                </SheetDescription>
              </SheetHeader>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 pb-6">
                <div className="flex items-start gap-4 rounded-2xl border bg-background/60 p-4">
                  <ItemThumbnail item={selectedGridNode.item} fallbackLabel={selectedGridNode.label} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      {selectedGridNode.itemName ?? selectedGridNode.emptyLabel ?? 'Empty'}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {selectedGridNode.meta ??
                        (selectedGridNode.level ? `Level ${selectedGridNode.level}` : 'No item selected yet.')}
                    </div>
                  </div>
                </div>

                {selectedGridNode.readOnly ? (
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      This card is driven by recipe or slot rules and is shown here for planning reference.
                    </p>
                    {selectedGridNode.item?.description ? (
                      <p className="rounded-2xl border bg-background/60 p-4 text-muted-foreground">
                        {selectedGridNode.item.description}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px_auto]">
                    <CatalogFilterCombobox
                      label={`${getNodeTitle(selectedGridNode)} item`}
                      value={selectedEditableValue?.itemId}
                      options={editorOptions.map((option) => ({
                        label: option.name,
                        value: option.id,
                      }))}
                      allLabel="Empty"
                      onValueChange={(value) =>
                        updateBuild(
                          updateNodeInBuild(build, selectedGridNode, {
                            itemId: typeof value === 'string' ? value : undefined,
                          }),
                        )
                      }
                    />

                    {(selectedGridNode.type === 'inherit' ||
                      selectedGridNode.type === 'upgrade' ||
                      selectedGridNode.type === 'foodIngredient') && (
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Level</span>
                        <input
                          aria-label={`${getNodeTitle(selectedGridNode)} level`}
                          type="number"
                          min={1}
                          max={10}
                          className="h-11 w-full rounded-xl border bg-background/80 px-3"
                          value={selectedEditableValue?.level ?? 10}
                          onChange={(event) =>
                            updateBuild(
                              updateNodeInBuild(build, selectedGridNode, {
                                level: Math.max(1, Math.min(10, Number(event.target.value) || 10)),
                              }),
                            )
                          }
                        />
                      </label>
                    )}

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          updateBuild(
                            updateNodeInBuild(build, selectedGridNode, {
                              itemId: undefined,
                              level: 10,
                            }),
                          )
                        }
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                {selectedGridNode.item ? (
                  <div className="space-y-4 rounded-2xl border bg-background/60 p-4">
                    {selectedGridNode.item.description ? (
                      <p className="text-sm text-muted-foreground">{selectedGridNode.item.description}</p>
                    ) : null}
                    {renderStatList(selectedGridNode.item.stats ?? {})}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/items"
                        search={{ q: selectedGridNode.item.name }}
                        className="inline-flex items-center rounded-xl border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        Inspect in Items
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
