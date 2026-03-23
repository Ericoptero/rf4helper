import { Link } from '@tanstack/react-router';
import { AlertTriangle, Beef, ChefHat, Shield, Sparkles, Swords, WandSparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CrafterData, CrafterDefaults, CrafterSlotConfig, Item } from '@/lib/schemas';
import {
  calculateCrafterBuild,
  createDefaultCrafterBuild,
  deserializeCrafterBuild,
  serializeCrafterBuild,
  type CrafterBuildState,
} from '@/lib/crafter';

type CrafterViewProps = {
  items: Record<string, Item>;
  crafterData: CrafterData;
  serializedBuild?: string;
  viewMode: 'simple' | 'advanced';
  onSerializedBuildChange: (serializedBuild: string) => void;
  onViewModeChange: (viewMode: 'simple' | 'advanced') => void;
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
        item.stats ||
        item.effects?.length ||
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

function MaterialEditor({
  label,
  materials,
  options,
  onChange,
}: {
  label: string;
  materials: CrafterDefaults['weapon']['inherits'];
  options: Item[];
  onChange: (next: CrafterDefaults['weapon']['inherits']) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="space-y-2">
        {materials.map((material, index) => (
          <div key={`${label}-${index}`} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_84px]">
            <select
              aria-label={`${label} ${index + 1}`}
              className="h-9 rounded-xl border bg-background/80 px-3 text-sm"
              value={material.itemId ?? ''}
              onChange={(event) => {
                const next = materials.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, itemId: event.target.value || undefined } : current,
                );
                onChange(next);
              }}
            >
              <option value="">Empty</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <input
              aria-label={`${label} ${index + 1} level`}
              type="number"
              min={1}
              max={10}
              className="h-9 rounded-xl border bg-background/80 px-3 text-sm"
              value={material.level}
              onChange={(event) => {
                const next = materials.map((current, currentIndex) =>
                  currentIndex === index
                    ? { ...current, level: Math.max(1, Math.min(10, Number(event.target.value) || 10)) }
                    : current,
                );
                onChange(next);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function EquipmentCard({
  slotConfig,
  selection,
  items,
  materialOptions,
  onChange,
}: {
  slotConfig: CrafterSlotConfig;
  selection: CrafterDefaults['weapon'];
  items: Item[];
  materialOptions: Item[];
  onChange: (next: CrafterDefaults['weapon']) => void;
}) {
  const currentItem = selection.appearanceId || selection.baseId;
  const selectedItem = items.find((item) => item.id === currentItem);
  const recipe = selectedItem?.craft?.[0];

  return (
    <Card className="rounded-3xl bg-card/90 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Swords className="h-5 w-5 text-primary" />
          {slotConfig.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {slotConfig.supportsAppearance && (
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">{slotConfig.label} appearance</span>
            <select
              aria-label={`${slotConfig.label} appearance`}
              className="h-10 w-full rounded-xl border bg-background/80 px-3"
              value={selection.appearanceId ?? ''}
              onChange={(event) => onChange({ ...selection, appearanceId: event.target.value || undefined })}
            >
              <option value="">None</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-1.5 text-sm">
          <span className="font-medium">{slotConfig.label} base</span>
          <select
            aria-label={`${slotConfig.label} base`}
            className="h-10 w-full rounded-xl border bg-background/80 px-3"
            value={selection.baseId ?? ''}
            onChange={(event) => onChange({ ...selection, baseId: event.target.value || undefined })}
          >
            <option value="">None</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border bg-background/60 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recipe</div>
          <div className="mt-2 text-sm">
            {recipe ? (
              <div className="space-y-1">
                <div>{recipe.station} Lv.{recipe.level}</div>
                <div className="text-muted-foreground">
                  {(recipe.ingredients ?? []).map((ingredient) => ingredient.replace(/^item-/, '').replace(/-/g, ' ')).join(', ')}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No recipe found for the current selection.</div>
            )}
          </div>
        </div>

        <MaterialEditor
          label={`${slotConfig.label} inherit`}
          materials={selection.inherits}
          options={materialOptions}
          onChange={(inherits) => onChange({ ...selection, inherits })}
        />

        <MaterialEditor
          label={`${slotConfig.label} upgrade`}
          materials={selection.upgrades}
          options={materialOptions}
          onChange={(upgrades) => onChange({ ...selection, upgrades })}
        />
      </CardContent>
    </Card>
  );
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
  const materialOptions = getMaterialOptions(items);
  const calculation = calculateCrafterBuild(build, items, crafterData);

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
                Build a full RF4 loadout, compare inherited stats and upgrades, and keep the final plan shareable through the URL.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={viewMode === 'simple' ? 'default' : 'outline'}
              onClick={() => onViewModeChange('simple')}
            >
              Simple View
            </Button>
            <Button
              type="button"
              variant={viewMode === 'advanced' ? 'default' : 'outline'}
              onClick={() => onViewModeChange('advanced')}
            >
              Advanced Breakdown
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          {crafterData.slotConfigs.map((slotConfig) => (
            <EquipmentCard
              key={slotConfig.key}
              slotConfig={slotConfig}
              selection={build[slotConfig.key]}
              items={getSlotOptions(items, slotConfig)}
              materialOptions={materialOptions}
              onChange={(nextSelection) => {
                updateBuild({
                  ...build,
                  [slotConfig.key]: nextSelection,
                });
              }}
            />
          ))}

          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ChefHat className="h-5 w-5 text-primary" />
                Food
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium">Food base</span>
                <select
                  aria-label="Food base"
                  className="h-10 w-full rounded-xl border bg-background/80 px-3"
                  value={build.food.baseId ?? ''}
                  onChange={(event) =>
                    updateBuild({
                      ...build,
                      food: {
                        ...build.food,
                        baseId: event.target.value || undefined,
                      },
                    })
                  }
                >
                  <option value="">None</option>
                  {getFoodOptions(items).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <MaterialEditor
                label="Food ingredient"
                materials={build.food.ingredients}
                options={materialOptions}
                onChange={(ingredients) =>
                  updateBuild({
                    ...build,
                    food: { ...build.food, ingredients },
                  })
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Beef className="h-5 w-5 text-primary" />
                Final Totals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderStatList(calculation.totalStats)}
            </CardContent>
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

          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <WandSparkles className="h-5 w-5 text-primary" />
                Combat Readout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border bg-background/60 p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Weapon Class</div>
                <div className="mt-1 font-semibold">{calculation.attackSummary.weaponClass}</div>
              </div>
              <div className="rounded-2xl border bg-background/60 p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Charge Attack</div>
                <div className="mt-1 font-semibold">{calculation.attackSummary.chargeAttack}</div>
              </div>
              <div className="rounded-2xl border bg-background/60 p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Shield Effect</div>
                <div className="mt-1 font-semibold">
                  {calculation.shieldSummary.coverage} ({formatStatValue(calculation.shieldSummary.factor * 100)}%)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Barrett Bonus Tracker</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border bg-background/60 p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Level Bonus</div>
                <div className="mt-1 font-semibold">Tier {calculation.bonusSummary.level.tier}</div>
                <div className="text-sm text-muted-foreground">{calculation.bonusSummary.level.label || 'No assessment yet.'}</div>
              </div>
              <div className="rounded-2xl border bg-background/60 p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Rarity Bonus</div>
                <div className="mt-1 font-semibold">Tier {calculation.bonusSummary.rarity.tier}</div>
                <div className="text-sm text-muted-foreground">{calculation.bonusSummary.rarity.label || 'No assessment yet.'}</div>
              </div>
            </CardContent>
          </Card>

          {viewMode === 'advanced' && (
            <Card className="rounded-3xl bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Advanced Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
        </div>

        <div className="space-y-4">
          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">How To Build</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
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

          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Linked Item Lookups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                build.weapon.baseId,
                build.armor.baseId,
                build.headgear.baseId,
                build.shield.baseId,
                build.accessory.baseId,
                build.shoes.baseId,
                build.food.baseId,
              ]
                .filter(Boolean)
                .map((itemId) => items[itemId as string])
                .filter(Boolean)
                .map((item) => (
                  <Link
                    key={item.id}
                    to="/items"
                    search={{ q: item.name }}
                    className="flex items-center justify-between rounded-2xl border bg-background/60 px-3 py-2 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <span>{item.name}</span>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Inspect</span>
                  </Link>
                ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
