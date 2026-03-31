import React from 'react';
import { Box } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { resolveCharacterImage } from '@/lib/characterImages';
import { capitalize, formatName, formatNumber } from '@/lib/formatters';
import type { DisplayEffect } from '@/lib/itemPresentation';
import type { Character, Item } from '@/lib/schemas';

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

export function formatItemCategory(category: string) {
  return category
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(capitalize)
    .join(' ')
    .replace(/\bAnd\b/g, '&');
}

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
    return `${formatEffectTarget(effect.target)} resistance ${effect.value > 0 ? '+' : ''}${effect.value}%`;
  }

  const chance = effect.chance !== undefined ? ` (${effect.chance}%)` : '';
  return `Inflicts ${formatEffectTarget(effect.target)} on ${effect.trigger}${chance}`;
}

export function formatDropRates(dropRates: number[]) {
  if (dropRates.length === 0) return '—';
  return dropRates.map((rate) => `${rate}%`).join(', ');
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

export function getLinkedItemDisplay(items: Record<string, Item> | undefined, itemId: string) {
  const linkedItem = items?.[itemId];

  return {
    label: linkedItem?.name ?? formatName(itemId),
    imageSrc: linkedItem?.image,
  };
}

export function CraftedFromRecipeGrid({
  ingredients,
  items,
}: {
  ingredients: string[];
  items?: Record<string, Item>;
}) {
  const slots = Array.from({ length: 6 }, (_, index) => ingredients[index] ?? null);

  return (
    <TooltipProvider delayDuration={120}>
      <div data-testid="crafted-from-grid" className="grid grid-cols-3 gap-3">
        {slots.map((ingredientId, index) => {
          const linkedItem = ingredientId ? getLinkedItemDisplay(items, ingredientId) : undefined;

          return (
            <Tooltip key={`${ingredientId ?? 'empty'}-${index}`}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  data-testid="crafted-from-slot"
                  className="flex aspect-square min-h-20 flex-col items-center justify-center rounded-2xl border bg-background/70 p-2 text-center transition-colors hover:border-primary/40"
                >
                  {linkedItem?.imageSrc ? (
                    <img src={linkedItem.imageSrc} alt={`${linkedItem.label} image`} className="h-9 w-9 object-contain" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Box className="h-4 w-4" />
                    </div>
                  )}
                  <span className="mt-2 line-clamp-2 text-[11px] font-medium leading-tight">
                    {linkedItem?.label ?? 'Empty slot'}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
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
