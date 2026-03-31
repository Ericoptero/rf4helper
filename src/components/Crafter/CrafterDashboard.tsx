import { type CrafterBuild, type CrafterCalculation } from '@/lib/crafter';
import type { CrafterData, Item } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CrafterOverviewCard } from './CrafterItemSlot';
import { getCrafterDisplayItem, getNodeEffectiveRarity, getNodePreviewData } from './crafterNodeBehavior';
import type { CrafterTab } from './crafterTypes';
import { EQUIPMENT_SLOTS } from './crafterTypes';

type CrafterDashboardProps = {
  calculation: CrafterCalculation;
  items: Record<string, Item>;
  crafterData: CrafterData;
  build: CrafterBuild;
  onSelectTab: (tab: CrafterTab) => void;
};

function renderDashboardCards(
  calculation: CrafterCalculation,
  items: Record<string, Item>,
  crafterData: CrafterData,
  build: CrafterBuild,
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
          rarity: getNodeEffectiveRarity({ slot: slotKey, type: 'base' }, item, item?.id, crafterData),
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
        rarity: getNodeEffectiveRarity({ slot: 'food', type: 'foodBase' }, foodItem, foodItem?.id, crafterData),
        tier: 0,
        emptyLabel: 'Cooking',
        meta: 'Food bonuses and recipe ingredients',
      }}
      previewData={getNodePreviewData({ slot: 'food', type: 'foodBase' }, foodItem, foodItem?.id, crafterData)}
      onClick={() => onSelectTab('cooking')}
    />,
  ];
}

export function CrafterDashboard({
  calculation,
  items,
  crafterData,
  build,
  onSelectTab,
}: CrafterDashboardProps) {
  return (
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
          {renderDashboardCards(calculation, items, crafterData, build, onSelectTab)}
        </CardContent>
      </Card>
    </div>
  );
}
