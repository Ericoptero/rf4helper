import * as React from 'react';
import { Heart } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Item } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import {
  ELEMENT_RESISTANCE_ORDER,
  GEOMETRY_DISPLAY_ORDER,
  getStatIcon,
  formatFinalPercentValue,
  formatSignedFinalCrafterStatValue,
  formatSignedFinalValue,
  formatSignedValue,
  formatStatLabel,
  REACTION_RESISTANCE_ORDER,
  STAT_DISPLAY_ORDER,
  STATUS_ATTACK_DISPLAY_ORDER,
  STATUS_RESISTANCE_ORDER,
} from './crafterFormatters';

export function CrafterStatsPanel({
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
