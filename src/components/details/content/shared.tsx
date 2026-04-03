import React from 'react';
import { Box } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { resolveCharacterImage } from '@/lib/characterImages';
import { capitalize, formatName, formatNumber } from '@/lib/formatters';
import type { DisplayEffect } from '@/lib/itemPresentation';
import type { Character, Item } from '@/lib/schemas';
import { cn } from '@/lib/utils';

export const itemStatLabels: Record<string, string> = {
  hp: 'HP',
  hpMax: 'HP MAX',
  rp: 'RP',
  rpMax: 'RP MAX',
  atk: 'ATK',
  def: 'DEF',
  matk: 'M.ATK',
  mdef: 'M.DEF',
  str: 'STR',
  vit: 'VIT',
  int: 'INT',
  crit: 'Crit',
  diz: 'Dizzy',
  drain: 'Drain',
  stun: 'Stun',
  knock: 'Knock',
};

export const resistanceLabels: Record<string, string> = {
  normal: 'Physical',
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  wind: 'Wind',
  light: 'Light',
  dark: 'Dark',
  love: 'Love',
  poison: 'Poison',
  seal: 'Seal',
  paralysis: 'Paralysis',
  sleep: 'Sleep',
  fatigue: 'Fatigue',
  illness: 'Illness',
  faint: 'Faint',
  hpDrain: 'HP Drain',
  dizAttack: 'Diz Attack',
  dizResist: 'Diz Resist',
  knockDistance: 'Knock Distance',
  additionalStunTime: 'Stun Attack',
  knockResist: 'Knock Resist',
  critAttack: 'Crit Attack',
  critResist: 'Crit Resist',
};

export function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b pb-2">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function formatBirthday(character: Character) {
  if (!character.birthday?.season || character.birthday.day == null) {
    return 'Unknown';
  }

  return `${character.birthday.season} ${character.birthday.day}`;
}

export { formatItemCategory } from '@/lib/formatters';

function formatEffectTarget(target: string) {
  return target
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(capitalize)
    .join(' ');
}

export function formatEffectLabel(effect: DisplayEffect) {
  if (effect.type === 'label') {
    return effect.label;
  }

  if (effect.type === 'cure') {
    return `Cures ${effect.targets.map(formatEffectTarget).join(', ')}`;
  }

  if (effect.type === 'resistance') {
    return `${formatEffectTarget(effect.target)} resistance ${effect.value > 0 ? '+' : ''}${formatNumber(effect.value)}%`;
  }

  const chance = effect.chance !== undefined ? ` (${formatNumber(effect.chance)}%)` : '';
  return `Inflicts ${formatEffectTarget(effect.target)} on ${effect.trigger}${chance}`;
}

export function formatDropRates(dropRates: number[]) {
  if (dropRates.length === 0) return '—';
  return dropRates.map((rate) => `${formatNumber(rate)}%`).join(', ');
}

export function formatSignedPercent(value: number) {
  return `${value > 0 ? '+' : ''}${formatNumber(value)}%`;
}

export function formatCombatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(capitalize)
    .join(' ');
}

function getPrimaryRecipe(item: Item | undefined) {
  return item?.craft?.[0] ?? item?.craftedFrom?.[0] ?? null;
}

function getRecipeCount(item: Item | undefined) {
  return (item?.craft?.length ?? 0) + (item?.craftedFrom?.length ?? 0);
}

export function getLinkedItemDisplay(items: Record<string, Item> | undefined, itemId: string) {
  const linkedItem = items?.[itemId];

  return {
    label: linkedItem?.name ?? formatName(itemId),
    imageSrc: linkedItem?.image,
  };
}

type RecipeGridProps = {
  ingredients: string[];
  items?: Record<string, Item>;
  compact?: boolean;
  onIngredientClick?: (itemId: string) => void;
  showIngredientTooltip?: boolean;
};

function RecipeGrid({
  ingredients,
  items,
  compact = false,
  onIngredientClick,
  showIngredientTooltip = false,
}: RecipeGridProps) {
  const slots = Array.from({ length: 6 }, (_, index) => ingredients[index] ?? null);

  return (
    <TooltipProvider delayDuration={120}>
      <div
        data-testid={compact ? 'recipe-preview-grid' : 'crafted-from-grid'}
        className={cn('grid grid-cols-3 gap-3', compact && 'gap-1.5')}
      >
        {slots.map((ingredientId, index) => {
          const linkedItem = ingredientId ? getLinkedItemDisplay(items, ingredientId) : undefined;
          const isInteractive = Boolean(ingredientId && onIngredientClick);
          const slotContent = (
            <>
              {linkedItem?.imageSrc ? (
                <img
                  src={linkedItem.imageSrc}
                  alt={`${linkedItem.label} image`}
                  className={cn('object-contain', compact ? 'h-6 w-6' : 'h-9 w-9')}
                />
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-center rounded-xl bg-muted text-muted-foreground',
                    compact ? 'h-6 w-6 rounded-lg' : 'h-9 w-9',
                  )}
                >
                  <Box className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
                </div>
              )}
              <span
                className={cn(
                  'font-medium leading-tight',
                  compact ? 'mt-1 line-clamp-1 text-[10px]' : 'mt-2 line-clamp-2 text-[11px]',
                )}
              >
                {linkedItem?.label ?? 'Empty slot'}
              </span>
            </>
          );

          const slot = isInteractive ? (
            <button
              type="button"
              data-testid="crafted-from-slot"
              onClick={() => onIngredientClick?.(ingredientId!)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center text-center transition-colors hover:border-primary/40',
                compact
                  ? 'min-h-14 rounded-xl border bg-background/80 p-1.5'
                  : 'min-h-20 rounded-2xl border bg-background/70 p-2',
              )}
            >
              {slotContent}
            </button>
          ) : (
            <div
              data-testid={!compact ? 'crafted-from-slot' : undefined}
              className={cn(
                'flex aspect-square flex-col items-center justify-center text-center',
                compact
                  ? 'min-h-14 rounded-xl border bg-background/80 p-1.5'
                  : 'min-h-20 rounded-2xl border bg-background/70 p-2',
              )}
            >
              {slotContent}
            </div>
          );

          if (!showIngredientTooltip) {
            return <React.Fragment key={`${ingredientId ?? 'empty'}-${index}`}>{slot}</React.Fragment>;
          }

          return (
            <Tooltip key={`${ingredientId ?? 'empty'}-${index}`}>
              <TooltipTrigger asChild>{slot}</TooltipTrigger>
              <TooltipContent
                side="top"
                collisionPadding={16}
                arrowClassName="fill-popover"
                className="max-w-xs rounded-xl border border-border bg-popover px-3 py-3 text-popover-foreground shadow-lg"
              >
                {linkedItem ? (
                  <div className="space-y-1">
                    <div className="font-semibold">{linkedItem.label}</div>
                    <div className="text-xs text-muted-foreground">{formatName(ingredientId!)}</div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Empty slot</div>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export function CraftedFromRecipeGrid({
  ingredients,
  items,
  onIngredientClick,
}: {
  ingredients: string[];
  items?: Record<string, Item>;
  onIngredientClick?: (itemId: string) => void;
}) {
  return (
    <RecipeGrid
      ingredients={ingredients}
      items={items}
      onIngredientClick={onIngredientClick}
      showIngredientTooltip
    />
  );
}

export function ItemRecipeTooltipContent({
  itemId,
  items,
}: {
  itemId: string;
  items?: Record<string, Item>;
}) {
  const item = items?.[itemId];
  const recipe = getPrimaryRecipe(item);
  const recipeCount = getRecipeCount(item);

  return (
    <div className="max-w-[15rem] space-y-3 rounded-xl border border-border bg-popover px-3 py-3 text-popover-foreground shadow-lg">
      <div className="space-y-1">
        <div className="font-semibold">{item?.name ?? formatName(itemId)}</div>
        {recipe ? (
          <div className="text-[11px] text-muted-foreground">
            {(recipe.station ?? recipe.stationType)} · Lv. {recipe.level}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">No craft recipe available.</div>
        )}
      </div>
      {recipe ? <RecipeGrid ingredients={recipe.ingredients} items={items} compact /> : null}
      {recipeCount > 1 ? (
        <div className="text-[11px] text-muted-foreground">
          +{recipeCount - 1} more recipe{recipeCount - 1 === 1 ? '' : 's'}
        </div>
      ) : null}
    </div>
  );
}

export function CharacterAvatar({ character, portrait = false }: { character: Character; portrait?: boolean }) {
  const resolved = resolveCharacterImage(portrait ? character.portrait : character.icon.md ?? character.icon.sm);
  const className = portrait
    ? 'max-h-[22rem] w-auto max-w-[14rem] rounded-xl object-contain shadow-sm shrink-0'
    : 'h-12 w-12 rounded-full object-contain shrink-0';

  if (resolved) {
    return <img src={resolved} alt={`${character.name} ${portrait ? 'portrait' : 'icon'}`} className={className} />;
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
      {character.name.charAt(0)}
    </div>
  );
}

export { Badge };
