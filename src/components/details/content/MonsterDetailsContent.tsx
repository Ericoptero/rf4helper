import React from 'react';
import { Box, Ghost, Heart, MapPin, Shield, Sword } from 'lucide-react';

import { LinkedEntityToken } from '@/components/details/LinkedEntityToken';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveMonsterImageUrl } from '@/lib/publicAssetUrls';
import { isMonsterActuallyTameable, type MonsterGroup } from '@/lib/monsterGroups';
import type { Item } from '@/lib/schemas';
import { DetailSection, formatDropRates, getLinkedItemDisplay, resistanceLabels } from './shared';

function resolveMonsterImage(image?: string) {
  return resolveMonsterImageUrl(image);
}

export function MonsterDetailsContent({
  group,
  items,
}: {
  group: MonsterGroup;
  items?: Record<string, Item>;
}) {
  const [selectedVariantName, setSelectedVariantName] = React.useState(group.representative.name);

  React.useEffect(() => {
    setSelectedVariantName(group.representative.name);
  }, [group]);

  const monster = group.variants.find((variant) => variant.name === selectedVariantName) ?? group.representative;
  const imageSrc = resolveMonsterImage(monster.image);

  const statNodes = [
    ['LV', monster.stats.baseLevel],
    ['EXP', monster.stats.exp],
    ['HP', monster.stats.hp],
    ['ATK', monster.stats.atk],
    ['DEF', monster.stats.def],
    ['M.ATK', monster.stats.matk],
    ['M.DEF', monster.stats.mdef],
    ['STR', monster.stats.str],
    ['INT', monster.stats.int],
    ['VIT', monster.stats.vit],
    ['BONUS', monster.stats.bonus],
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-orange-400/20 bg-orange-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">
            {imageSrc ? <img src={imageSrc} alt={monster.name} className="h-20 w-20 object-contain" /> : <Ghost className="h-12 w-12" />}
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <div className="min-w-0">
              <h2 className="break-words text-3xl font-bold">{group.displayName}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {isMonsterActuallyTameable(monster) ? (
                <Badge className={getSemanticBadgeClass('success')}>Tameable</Badge>
              ) : (
                <Badge className={getSemanticBadgeClass('danger')}>Not Tameable</Badge>
              )}
              {monster.location ? (
                <Badge variant="outline" className={getSemanticBadgeClass('map')}>
                  <MapPin className="mr-1 h-3 w-3" />
                  {monster.location}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {group.variants.length > 1 ? (
        <DetailSection title="Other Version" icon={<Ghost className="h-4 w-4 text-orange-300" />}>
          <Tabs value={monster.name} onValueChange={setSelectedVariantName}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2">
              {group.variants.map((variant) => (
                <TabsTrigger key={variant.name} value={variant.name}>
                  {variant.location ?? variant.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </DetailSection>
      ) : null}

      {monster.description ? (
        <DetailSection title="Description" icon={<Ghost className="h-4 w-4 text-orange-300" />}>
          <p className="break-words text-sm leading-6 text-muted-foreground">{monster.description}</p>
        </DetailSection>
      ) : null}

      {monster.nickname && monster.nickname.length > 0 ? (
        <DetailSection title="Nicknames" icon={<Ghost className="h-4 w-4 text-orange-300" />}>
          <div className="flex flex-wrap gap-2">
            {monster.nickname.map((nickname) => (
              <Badge key={nickname} variant="outline" className={getSemanticBadgeClass('neutral')}>
                {nickname}
              </Badge>
            ))}
          </div>
        </DetailSection>
      ) : null}

      <DetailSection title="Stats" icon={<Sword className="h-4 w-4 text-orange-300" />}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statNodes.map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-muted/30 p-3 text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-1 text-lg font-semibold">{value ?? '—'}</div>
            </div>
          ))}
        </div>
      </DetailSection>

      {monster.drops.length > 0 ? (
        <DetailSection title="Drops" icon={<Box className="h-4 w-4 text-amber-300" />}>
          <div className="space-y-2">
            {monster.drops.map((drop) => (
              <div key={`${monster.id}-${drop.name}`} className="rounded-xl border bg-muted/30 p-3">
                {drop.id ? (
                  <LinkedEntityToken
                    reference={{ type: 'item', id: drop.id }}
                    label={getLinkedItemDisplay(items, drop.id).label}
                    imageSrc={getLinkedItemDisplay(items, drop.id).imageSrc}
                    meta={`Rate: ${formatDropRates(drop.dropRates)}`}
                    icon={<Box className="h-3.5 w-3.5" />}
                  />
                ) : (
                  <div className="text-sm">
                    <div className="font-medium">{drop.name}</div>
                    <div className="text-muted-foreground">Rate: {formatDropRates(drop.dropRates)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      {monster.taming && isMonsterActuallyTameable(monster) ? (
        <DetailSection title="Taming Info" icon={<Heart className="h-4 w-4 text-emerald-300" />}>
          <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
            <div className="text-sm">
              <span className="font-semibold">Rideable:</span> {monster.taming.isRideable ? 'Yes' : 'No'}
            </div>
            {monster.taming.favorite && monster.taming.favorite.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Favorites</div>
                <div className="flex flex-wrap gap-2">
                  {monster.taming.favorite.map((favorite) =>
                    favorite.id ? (
                      <LinkedEntityToken
                        key={favorite.id}
                        reference={{ type: 'item', id: favorite.id }}
                        label={getLinkedItemDisplay(items, favorite.id).label}
                        imageSrc={getLinkedItemDisplay(items, favorite.id).imageSrc}
                        meta={`Affinity: ${favorite.favorite ?? '—'}`}
                        icon={<Heart className="h-3.5 w-3.5" />}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </DetailSection>
      ) : null}

      {monster.resistances && Object.keys(monster.resistances).length > 0 ? (
        <DetailSection title="Resistances" icon={<Shield className="h-4 w-4 text-blue-300" />}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(monster.resistances).map(([key, value]) => (
              <Badge key={key} variant="outline" className={getSemanticBadgeClass('neutral')}>
                {resistanceLabels[key] ?? key} {value == null ? '—' : `${value}%`}
              </Badge>
            ))}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}
