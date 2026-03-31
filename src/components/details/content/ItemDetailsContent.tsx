import React from 'react';
import { Box, Coins, Hammer, MapPin, PawPrint, Sparkles, Sword, Heart } from 'lucide-react';

import { LinkedEntityToken } from '@/components/details/LinkedEntityToken';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import {
  getItemPresentation,
} from '@/lib/itemPresentation';
import type { Item } from '@/lib/schemas';
import {
  Badge,
  CraftedFromRecipeGrid,
  DetailSection,
  formatCombatLabel,
  formatEffectLabel,
  formatItemCategory,
  formatSignedPercent,
  getLinkedItemDisplay,
  itemStatLabels,
} from './shared';
import { capitalize, formatNumber } from '@/lib/formatters';

export function ItemDetailsContent({ item, items }: { item: Item; items?: Record<string, Item> }) {
  const { stats: displayStats, effects: displayEffects, food: displayFood, combat: displayCombat } = getItemPresentation(item);
  const stats = Object.entries(displayStats ?? {}).filter(([, value]) => value !== 0);
  const effects = displayEffects ?? [];
  const crafts = item.craft ?? item.craftedFrom ?? [];
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
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={getSemanticBadgeClass('item')}>{item.type}</Badge>
                {item.category ? (
                  <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                    {formatItemCategory(item.category)}
                  </Badge>
                ) : null}
                {item.region ? (
                  <Badge variant="outline" className={getSemanticBadgeClass('map')}>
                    <MapPin className="mr-1 h-3 w-3" />
                    {item.region}
                  </Badge>
                ) : null}
              </div>
            </div>
            {item.description ? <p className="break-words text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getSemanticBadgeClass('success')}>
                <Coins className="mr-1 h-3 w-3" />
                Buy: {formatNumber(item.buy)}
              </Badge>
              <Badge variant="outline" className={getSemanticBadgeClass('danger')}>
                <Coins className="mr-1 h-3 w-3" />
                Sell: {formatNumber(item.sell)}
              </Badge>
              {item.shippable ? <Badge variant="outline" className={getSemanticBadgeClass('warning')}>Shippable</Badge> : null}
              {item.rarityPoints ? <Badge variant="outline" className={getSemanticBadgeClass('warning')}>{item.rarityPoints} RP</Badge> : null}
              {item.monster ? (
                <Badge variant="outline" className={getSemanticBadgeClass('monster')}>
                  <PawPrint className="mr-1 h-3 w-3" />
                  {item.monster}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {stats.length > 0 ? (
        <DetailSection title="Stats" icon={<Sparkles className="h-4 w-4 text-emerald-300" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map(([stat, value]) => (
              <div key={stat} className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">{itemStatLabels[stat] ?? stat.toUpperCase()}</span>
                <span className="font-semibold">{formatNumber(value)}</span>
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
          <div className="grid gap-3 sm:grid-cols-2">
            {healingEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">{key === 'hpPercent' ? 'HP%' : 'RP%'}</span>
                <span className="font-semibold">{formatSignedPercent(value as number)}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {statMultiplierEntries.length > 0 ? (
        <DetailSection title="Stat Multipliers" icon={<Sparkles className="h-4 w-4 text-amber-300" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {statMultiplierEntries.map(([stat, value]) => (
              <div key={stat} className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">{itemStatLabels[stat] ?? stat.toUpperCase()}</span>
                <span className="font-semibold">{formatSignedPercent(value as number)}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {combatEntries.length > 0 || geometryEntries.length > 0 ? (
        <DetailSection title="Combat Profile" icon={<Sword className="h-4 w-4 text-amber-300" />}>
          <div className="space-y-4">
            {combatEntries.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {combatEntries.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="font-semibold">{formatCombatLabel(value as string)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {geometryEntries.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Geometry</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {geometryEntries.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                      <span className="text-sm text-muted-foreground">{capitalize(key)}</span>
                      <span className="font-semibold">{formatNumber(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
                  <CraftedFromRecipeGrid ingredients={craft.ingredients} items={items} />
                </div>
              </div>
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
                />
              );
            })}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}
