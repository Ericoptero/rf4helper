import * as React from 'react';
import { AlertTriangle, Sparkles, Star } from 'lucide-react';

import { CrafterSelectorDialog } from '@/components/Crafter/CrafterSelectorDialog';
import { CrafterDashboard } from '@/components/Crafter/CrafterDashboard';
import { CrafterEquipmentTab } from '@/components/Crafter/CrafterEquipmentTab';
import { CrafterFoodTab } from '@/components/Crafter/CrafterFoodTab';
import { CrafterStatsPanel } from '@/components/Crafter/CrafterStatsPanel';
import { useDetailDrawer } from '@/components/details/DetailDrawerContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateCrafterBuild,
  createDefaultCrafterBuild,
  deserializeCrafterBuild,
  serializeCrafterBuild,
  type CrafterBuild,
} from '@/lib/crafter';
import { buildCrafterOptionLists } from '@/lib/crafterOptions';
import { CRAFTER_RARITY_PLACEHOLDER_ID } from '@/lib/crafterRarity';
import { getSlotConfigByKey } from '@/lib/crafterRecipeSelections';
import type { CrafterBootstrapItem } from '@/lib/crafterCommon';
import type { CrafterData } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { resolveCrafterItemImage } from './crafterFormatters';
import { getEditableSelection, getNodePreviewData, getNodeTitle, getSelectedNodeOptions, isEquipmentTab, resolveNodeBehavior } from './crafterNodeBehavior';
import { updateNodeInBuild } from './crafterBuildMutations';
import { buildGridSectionsForSlot } from './crafterGridBuilder';
import { useCrafterTabSummary } from './useCrafterTabSummary';
import type { CrafterEditorSlot, CrafterSelectedNode, CrafterTab } from './crafterTypes';

type CrafterViewProps = {
  items: Record<string, CrafterBootstrapItem>;
  crafterData: CrafterData;
  serializedBuild?: string;
  onSerializedBuildChange: (serializedBuild: string) => void;
};

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

export function CrafterView({
  items,
  crafterData,
  serializedBuild,
  onSerializedBuildChange,
}: CrafterViewProps) {
  const { openRoot } = useDetailDrawer();
  const previousCalculationRef = React.useRef<ReturnType<typeof calculateCrafterBuild> | undefined>(undefined);
  const build = React.useMemo(
    () => deserializeCrafterBuild(serializedBuild, crafterData),
    [crafterData, serializedBuild],
  );
  const calculation = React.useMemo(
    () => calculateCrafterBuild(build, items, crafterData, previousCalculationRef.current),
    [build, crafterData, items],
  );
  React.useEffect(() => {
    previousCalculationRef.current = calculation;
  }, [calculation]);
  const optionLists = React.useMemo(
    () => buildCrafterOptionLists(items, crafterData),
    [crafterData, items],
  );
  const slotConfigByKey = React.useMemo(() => getSlotConfigByKey(crafterData), [crafterData]);
  const [activeTab, setActiveTab] = React.useState<CrafterTab>('dashboard');
  const [selectedNode, setSelectedNode] = React.useState<CrafterSelectedNode | null>(null);

  React.useEffect(() => {
    setSelectedNode(null);
  }, [activeTab]);

  const updateBuild = (next: CrafterBuild) => {
    // Rely exclusively on shallow clone mutators instead of massive clone overlays. 
    onSerializedBuildChange(serializeCrafterBuild(next, crafterData));
  };

  const resetBuild = () => {
    updateBuild(createDefaultCrafterBuild(crafterData));
    setSelectedNode(null);
  };

  const activeEditorSlot: CrafterEditorSlot | null = activeTab === 'cooking'
    ? 'food'
    : isEquipmentTab(activeTab)
      ? activeTab
      : null;

  const gridSections = React.useMemo(
    () =>
      activeEditorSlot
        ? buildGridSectionsForSlot({
            activeSlot: activeEditorSlot,
            build,
            items,
            crafterData,
            slotConfigByKey,
            calculation,
          })
        : [],
    [activeEditorSlot, build, calculation, crafterData, items, slotConfigByKey],
  );
  const gridNodes = gridSections.flatMap((section) => section.nodes);
  const selectedGridNode = selectedNode
    ? gridNodes.find((node) => node.slot === selectedNode.slot && node.type === selectedNode.type && node.index === selectedNode.index)
    : undefined;
  const selectedNodeBehavior = selectedNode
    ? resolveNodeBehavior(selectedNode, build, slotConfigByKey, items, crafterData, optionLists)
    : undefined;
  const editorOptions = selectedNode
    ? getSelectedNodeOptions(selectedNode, build, crafterData, slotConfigByKey, items, optionLists)
    : [];
  const selectedEditableValue = selectedNode ? getEditableSelection(build, selectedNode, crafterData) : undefined;
  const canEditLevel = selectedNodeBehavior?.canEditLevel ?? false;

  const {
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
  } = useCrafterTabSummary({ activeTab, activeEditorSlot, calculation, build, items, gridSections });

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
            </TabsList>
          </div>
        </Tabs>
      </section>

      {activeTab === 'dashboard' ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <CrafterDashboard
            calculation={calculation}
            items={items}
            crafterData={crafterData}
            build={build}
            onSelectTab={setActiveTab}
          />

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
              <CrafterEquipmentTab
                activeBaseNode={activeBaseNode}
                activeRecipeNodes={activeRecipeNodes}
                activeInheritNodes={activeInheritNodes}
                activeUpgradeNodes={activeUpgradeNodes}
                crafterData={crafterData}
                onSelectNode={(node) => setSelectedNode({ slot: node.slot, type: node.type, index: node.index })}
              />
            ) : (
              <CrafterFoodTab
                cookingBaseNode={cookingBaseNode}
                activeRecipeNodes={activeRecipeNodes}
                crafterData={crafterData}
                onSelectNode={(node) => setSelectedNode({ slot: node.slot, type: node.type, index: node.index })}
              />
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
                        {activePreviewItem && resolveCrafterItemImage(activePreviewItem) ? (
                          <img
                            src={resolveCrafterItemImage(activePreviewItem)}
                            alt={`${activePrimaryPreviewName} icon`}
                            className="h-9 w-9 object-contain"
                          />
                        ) : activePreviewItem?.id === CRAFTER_RARITY_PLACEHOLDER_ID ? (
                          <Star className="h-6 w-6 fill-current text-amber-600 dark:text-amber-300" />
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
        emptyStateTitle={selectedNodeBehavior?.emptyStateTitle}
        emptyStateDescription={selectedNodeBehavior?.emptyStateDescription}
        onOpenItemDetails={(itemId) => openRoot({ type: 'item', id: itemId })}
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
              optionLists,
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
              optionLists,
            ),
          );
          setSelectedNode(null);
        }}
      />
    </div>
  );
}
