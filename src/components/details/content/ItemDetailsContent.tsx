import React from 'react';
import { Box, Coins, Hammer, Heart, MapPin, PawPrint, Sparkles, Sword, Wheat } from 'lucide-react';

import { LinkedEntityToken } from '@/components/details/LinkedEntityToken';
import { useDetailDrawer } from '@/components/details/DetailDrawerContext';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import { capitalize, formatNumber } from '@/lib/formatters';
import { getItemPresentation } from '@/lib/itemPresentation';
import { resolveMonsterImageUrl } from '@/lib/publicAssetUrls';
import type { Item } from '@/lib/schemas';
import type { DetailItemCropRelation, DetailMonsterDropSource } from '@/server/details';
import {
  Badge,
  CraftedFromRecipeGrid,
  DetailSection,
  formatCombatLabel,
  formatDropRates,
  formatEffectLabel,
  formatItemCategory,
  formatSignedPercent,
  getLinkedItemDisplay,
  ItemRecipeTooltipContent,
  itemStatLabels,
} from './shared';

const cropBucketLabels: Record<DetailItemCropRelation['bucket'], string> = {
  regularCrops: 'Regular Crop',
  giantCrops: 'Giant Crop',
  seeds: 'Seed Crop',
  otherCrops: 'Other Crop',
  flowers: 'Flower',
  giantFlowers: 'Giant Flower',
  wild: 'Wild Crop',
};

const cropSeasonLabels: Record<string, string> = {
  spring: 'Spring',
  spr: 'Spring',
  summer: 'Summer',
  sum: 'Summer',
  fall: 'Fall',
  autumn: 'Fall',
  winter: 'Winter',
  win: 'Winter',
  others: 'Others',
  none: 'None',
};

function formatCropSeasonValues(values?: string[]) {
  return (values ?? [])
    .map((value) => cropSeasonLabels[value.trim().toLowerCase()])
    .filter((value): value is string => Boolean(value));
}

function CropRelationCard({
  relation,
  items,
}: {
  relation: DetailItemCropRelation;
  items?: Record<string, Item>;
}) {
  const counterpartItem = relation.counterpartItemId ? getLinkedItemDisplay(items, relation.counterpartItemId) : null;
  const goodSeasons = formatCropSeasonValues(relation.crop.goodSeasons);
  const badSeasons = formatCropSeasonValues(relation.crop.badSeasons);

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <LinkedEntityToken
          reference={{ type: 'crop', id: relation.crop.id }}
          label={relation.crop.name}
          meta={cropBucketLabels[relation.bucket]}
          icon={<Wheat className="h-3.5 w-3.5" />}
        />
        {counterpartItem ? (
          <LinkedEntityToken
            reference={{ type: 'item', id: relation.counterpartItemId! }}
            label={counterpartItem.label}
            meta={relation.role === 'seed' ? 'Harvest Item' : 'Seed Item'}
            imageSrc={counterpartItem.imageSrc}
            icon={<Wheat className="h-3.5 w-3.5" />}
            tooltipContent={<ItemRecipeTooltipContent itemId={relation.counterpartItemId!} items={items} />}
          />
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {relation.crop.growTime != null ? (
          <div className="rounded-lg bg-background/70 px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Growth</div>
            <div className="mt-1 font-medium">{formatNumber(relation.crop.growTime)} Days</div>
          </div>
        ) : null}
        {relation.crop.harvested != null ? (
          <div className="rounded-lg bg-background/70 px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Yield</div>
            <div className="mt-1 font-medium">{formatNumber(relation.crop.harvested)}</div>
          </div>
        ) : null}
        {relation.crop.seedBuy != null ? (
          <div className="rounded-lg bg-background/70 px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Seed Cost</div>
            <div className="mt-1 font-medium">{formatNumber(relation.crop.seedBuy)}G</div>
          </div>
        ) : null}
        {relation.crop.cropSell != null ? (
          <div className="rounded-lg bg-background/70 px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Sell For</div>
            <div className="mt-1 font-medium">{formatNumber(relation.crop.cropSell)}G</div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={getSemanticBadgeClass('success')}>
          {relation.crop.regrows ? 'Regrows' : 'Single Harvest'}
        </Badge>
        <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
          Viewing from {relation.role === 'seed' ? 'Seed' : 'Harvest'}
        </Badge>
        {goodSeasons.map((season) => (
          <Badge key={`good-${relation.crop.id}-${season}`} variant="outline" className={getSemanticBadgeClass('calendar')}>
            Good: {season}
          </Badge>
        ))}
        {badSeasons.map((season) => (
          <Badge key={`bad-${relation.crop.id}-${season}`} variant="outline" className={getSemanticBadgeClass('danger')}>
            Bad: {season}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function DetailBadgeButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-md text-left transition-transform hover:-translate-y-0.5">
      {children}
    </button>
  );
}

export function ItemDetailsContent({
  item,
  items,
  dropSources,
  cropRelations,
  monsterReferenceId,
  mapReferenceId,
}: {
  item: Item;
  items?: Record<string, Item>;
  dropSources: DetailMonsterDropSource[];
  cropRelations: DetailItemCropRelation[];
  monsterReferenceId?: string;
  mapReferenceId?: string;
}) {
  const { openLinked } = useDetailDrawer();
  const { stats: displayStats, effects: displayEffects, food: displayFood, combat: displayCombat } = getItemPresentation(item);
  const stats = Object.entries(displayStats ?? {}).filter(([, value]) => value !== 0);
  const effects = displayEffects ?? [];
  const crafts = [...(item.craft ?? []), ...(item.craftedFrom ?? [])];
  const healingEntries = Object.entries(displayFood?.healing ?? {}).filter(([, value]) => value !== 0);
  const statMultiplierEntries = Object.entries(displayFood?.statMultipliers ?? {}).filter(([, value]) => value !== 0);
  const combatEntries = [
    ['Weapon Class', displayCombat?.weaponClass],
    ['Attack Type', displayCombat?.attackType],
    ['Element', displayCombat?.element],
    ['Damage Type', displayCombat?.damageType],
  ].filter(([, value]) => value);
  const geometryEntries = Object.entries(displayCombat?.geometry ?? {}).filter(([, value]) => value !== 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          {item.image ? (
            <img
              src={item.image}
              alt={`${item.name} image`}
              className="h-32 w-32 shrink-0 rounded-2xl border bg-background/80 object-contain p-3"
            />
          ) : (
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-5xl font-bold text-indigo-300">
              {item.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 space-y-4 text-center">
            <div className="min-w-0">
              <h2 className="break-words text-3xl font-bold">{item.name}</h2>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Badge className={getSemanticBadgeClass('item')}>{item.type}</Badge>
                {item.category ? (
                  <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                    {formatItemCategory(item.category)}
                  </Badge>
                ) : null}
                {item.region ? (
                  mapReferenceId ? (
                    <DetailBadgeButton onClick={() => openLinked({ type: 'map', id: mapReferenceId })}>
                      <Badge variant="outline" className={getSemanticBadgeClass('map')}>
                        <MapPin className="mr-1 h-3 w-3" />
                        {item.region}
                      </Badge>
                    </DetailBadgeButton>
                  ) : (
                    <Badge variant="outline" className={getSemanticBadgeClass('map')}>
                      <MapPin className="mr-1 h-3 w-3" />
                      {item.region}
                    </Badge>
                  )
                ) : null}
              </div>
            </div>
            {item.description ? <p className="break-words text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className={getSemanticBadgeClass('success')}>
                <Coins className="mr-1 h-3 w-3" />
                Buy: {formatNumber(item.buy)}
              </Badge>
              <Badge variant="outline" className={getSemanticBadgeClass('danger')}>
                <Coins className="mr-1 h-3 w-3" />
                Sell: {formatNumber(item.sell)}
              </Badge>
              {item.shippable ? <Badge variant="outline" className={getSemanticBadgeClass('warning')}>Shippable</Badge> : null}
              {item.rarityPoints ? <Badge variant="outline" className={getSemanticBadgeClass('warning')}>{formatNumber(item.rarityPoints)} RP</Badge> : null}
              {item.monster ? (
                monsterReferenceId ? (
                  <DetailBadgeButton onClick={() => openLinked({ type: 'monster', id: monsterReferenceId })}>
                    <Badge variant="outline" className={getSemanticBadgeClass('monster')}>
                      <PawPrint className="mr-1 h-3 w-3" />
                      {item.monster}
                    </Badge>
                  </DetailBadgeButton>
                ) : (
                  <Badge variant="outline" className={getSemanticBadgeClass('monster')}>
                    <PawPrint className="mr-1 h-3 w-3" />
                    {item.monster}
                  </Badge>
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {stats.length > 0 ? (
        <DetailSection title="Stats" icon={<Sparkles className="h-4 w-4 text-emerald-300" />}>
          <div className="space-y-1">
            {stats.map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                <span className="text-sm text-muted-foreground">{itemStatLabels[stat] ?? stat.toUpperCase()}</span>
                <span className="ml-auto text-sm font-semibold">{formatNumber(value)}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {effects.length > 0 ? (
        <DetailSection title="Additional Effects" icon={<Sparkles className="h-4 w-4 text-emerald-300" />}>
          <div className="flex flex-wrap gap-2">
            {effects.map((effect, index) => (
              <Badge key={`${effect.type}-${index}`} variant="outline" className={getSemanticBadgeClass('neutral')}>
                {formatEffectLabel(effect)}
              </Badge>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {healingEntries.length > 0 ? (
        <DetailSection title="Healing" icon={<Heart className="h-4 w-4 text-rose-300" />}>
          <div className="space-y-1">
            {healingEntries.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                <span className="text-sm text-muted-foreground">{key === 'hpPercent' ? 'HP%' : 'RP%'}</span>
                <span className="ml-auto text-sm font-semibold">{formatSignedPercent(value as number)}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {statMultiplierEntries.length > 0 ? (
        <DetailSection title="Stat Multipliers" icon={<Sparkles className="h-4 w-4 text-amber-300" />}>
          <div className="space-y-1">
            {statMultiplierEntries.map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                <span className="text-sm text-muted-foreground">{itemStatLabels[stat] ?? stat.toUpperCase()}</span>
                <span className="ml-auto text-sm font-semibold">{formatSignedPercent(value as number)}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {combatEntries.length > 0 || geometryEntries.length > 0 ? (
        <DetailSection title="Combat Profile" icon={<Sword className="h-4 w-4 text-amber-300" />}>
          <div className="space-y-4">
            {combatEntries.length > 0 ? (
              <div className="space-y-1">
                {combatEntries.map(([label, value]) => (
                  <div key={label} className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="ml-auto text-sm font-semibold">{formatCombatLabel(value as string)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {geometryEntries.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Geometry</h4>
                <div className="space-y-1">
                  {geometryEntries.map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                      <span className="text-sm text-muted-foreground">{capitalize(key)}</span>
                      <span className="ml-auto text-sm font-semibold">{formatNumber(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </DetailSection>
      ) : null}

      {dropSources.length > 0 ? (
        <DetailSection title="Drops" icon={<PawPrint className="h-4 w-4 text-orange-300" />}>
          <div className="flex flex-wrap gap-2">
            {dropSources.map((source, index) => (
              <LinkedEntityToken
                key={`${source.referenceId}-${index}`}
                reference={{ type: 'monster', id: source.referenceId }}
                label={source.label}
                meta={`Drop Rate: ${formatDropRates(source.dropRates)}`}
                imageSrc={resolveMonsterImageUrl(source.image)}
                icon={<PawPrint className="h-3.5 w-3.5" />}
              />
            ))}
          </div>
        </DetailSection>
      ) : null}

      {cropRelations.length > 0 ? (
        <DetailSection title="Crop" icon={<Wheat className="h-4 w-4 text-emerald-300" />}>
          <div className="space-y-3">
            {cropRelations.map((relation) => (
              <CropRelationCard key={`${relation.crop.id}-${relation.role}`} relation={relation} items={items} />
            ))}
          </div>
        </DetailSection>
      ) : null}

      {item.groupMembers && item.groupMembers.length > 0 ? (
        <DetailSection title="Group Members" icon={<Box className="h-4 w-4 text-indigo-300" />}>
          <div className="flex flex-wrap gap-2">
            {item.groupMembers.map((memberId, index) => {
              const linkedItem = getLinkedItemDisplay(items, memberId);
              return (
                <LinkedEntityToken
                  key={`${memberId}-${index}`}
                  reference={{ type: 'item', id: memberId }}
                  label={linkedItem.label}
                  imageSrc={linkedItem.imageSrc}
                  icon={<Box className="h-3.5 w-3.5" />}
                  tooltipContent={<ItemRecipeTooltipContent itemId={memberId} items={items} />}
                />
              );
            })}
          </div>
        </DetailSection>
      ) : null}

      {item.usedInRecipes && item.usedInRecipes.length > 0 ? (
        <DetailSection title="Used In Recipes" icon={<Hammer className="h-4 w-4 text-amber-300" />}>
          <div className="flex flex-wrap gap-2">
            {item.usedInRecipes.map((recipeId, index) => {
              const linkedItem = getLinkedItemDisplay(items, recipeId);
              return (
                <LinkedEntityToken
                  key={`${recipeId}-${index}`}
                  reference={{ type: 'item', id: recipeId }}
                  label={linkedItem.label}
                  imageSrc={linkedItem.imageSrc}
                  icon={<Hammer className="h-3.5 w-3.5" />}
                  tooltipContent={<ItemRecipeTooltipContent itemId={recipeId} items={items} />}
                />
              );
            })}
          </div>
        </DetailSection>
      ) : null}

      {crafts.length > 0 ? (
        <DetailSection title="Crafted From" icon={<Hammer className="h-4 w-4 text-blue-300" />}>
          <div className="space-y-3">
            {crafts.map((craft, index) => (
              <div key={`${craft.stationType}-${index}`} className="rounded-xl border bg-muted/30 p-4">
                <div className="grid gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b pb-2">
                      <span className="font-semibold">{craft.station ?? craft.stationType}</span>
                      <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                        Lv. {craft.level}
                      </Badge>
                    </div>
                  </div>
                  <CraftedFromRecipeGrid
                    ingredients={craft.ingredients}
                    items={items}
                    onIngredientClick={(ingredientId) => openLinked({ type: 'item', id: ingredientId })}
                  />
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}
