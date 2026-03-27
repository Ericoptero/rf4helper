import React from 'react';
import {
  Box,
  Calendar as CalendarIcon,
  Coins,
  Gift,
  Ghost,
  Hammer,
  Heart,
  MapPin,
  PawPrint,
  Search,
  Shield,
  Sparkles,
  Sword,
  Wheat,
} from 'lucide-react';
import { useCharacters, useChests, useCrops, useFestivals, useFish, useItems, useMonsters } from '@/hooks/queries';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveCharacterImage } from '@/lib/characterImages';
import { resolveFishImage } from '@/lib/fishImages';
import { buildMapRegions } from '@/lib/mapFishingRelations';
import { buildMonsterGroups, isMonsterActuallyTameable } from '@/lib/monsterGroups';
import { capitalize, formatName, formatNumber } from '@/lib/formatters';
import type { Character, Crop, Festival, Fish, Item } from '@/lib/schemas';
import { useDetailDrawer } from './DetailDrawerContext';
import { CatalogDetailsDrawerShell } from './CatalogDetailsDrawerShell';
import { LinkedEntityToken } from './LinkedEntityToken';
import { getSemanticBadgeClass } from './semanticBadges';

const monsterImages = import.meta.glob('@/assets/images/monsters/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const itemStatLabels: Record<string, string> = {
  hp: 'HP',
  hpMax: 'Max HP',
  rp: 'RP',
  rpMax: 'Max RP',
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

const resistanceLabels: Record<string, string> = {
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

function resolveMonsterImage(image?: string) {
  if (!image) return undefined;
  return monsterImages[`/src/assets${image}.png`];
}

function DetailSection({
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

function formatBirthday(character: Character) {
  if (!character.birthday?.season || character.birthday.day == null) {
    return 'Unknown';
  }

  return `${character.birthday.season} ${character.birthday.day}`;
}

function formatItemCategory(category: string) {
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

function formatEffectLabel(effect: NonNullable<Item['effects']>[number]) {
  if (effect.type === 'cure') {
    return `Cures ${effect.targets.map(formatEffectTarget).join(', ')}`;
  }

  if (effect.type === 'resistance') {
    return `${formatEffectTarget(effect.target)} resistance ${effect.value > 0 ? '+' : ''}${effect.value}%`;
  }

  const chance = effect.chance !== undefined ? ` (${effect.chance}%)` : '';
  return `Inflicts ${formatEffectTarget(effect.target)} on ${effect.trigger}${chance}`;
}

function formatDropRates(dropRates: number[]) {
  if (dropRates.length === 0) return '—';
  return dropRates.map((rate) => `${rate}%`).join(', ');
}

function getLinkedItemDisplay(items: Record<string, Item> | undefined, itemId: string) {
  const linkedItem = items?.[itemId];

  return {
    label: linkedItem?.name ?? formatName(itemId),
    imageSrc: linkedItem?.image,
  };
}

function ItemDetailsContent({ item, items }: { item: Item; items?: Record<string, Item> }) {
  const stats = Object.entries(item.stats ?? {}).filter(([, value]) => value !== 0);
  const effects = item.effects ?? [];
  const crafts = item.craft ?? item.craftedFrom ?? [];

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

      {crafts.length > 0 ? (
        <DetailSection title="Crafted From" icon={<Hammer className="h-4 w-4 text-blue-300" />}>
          <div className="space-y-3">
            {crafts.map((craft, index) => (
              <div key={`${craft.stationType}-${index}`} className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2">
                  <span className="font-semibold">{craft.station ?? craft.stationType}</span>
                  <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                    Lv. {craft.level}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {craft.ingredients.map((ingredient, ingredientIndex) => {
                    const linkedItem = getLinkedItemDisplay(items, ingredient);
                    return (
                    <LinkedEntityToken
                      key={`${ingredient}-${ingredientIndex}`}
                      reference={{ type: 'item', id: ingredient }}
                      label={linkedItem.label}
                      imageSrc={linkedItem.imageSrc}
                      icon={<Hammer className="h-3.5 w-3.5" />}
                    />
                    );
                  })}
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

function CharacterAvatar({ character, portrait = false }: { character: Character; portrait?: boolean }) {
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

function CharacterDetailsContent({
  character,
  items: itemsById,
}: {
  character: Character;
  items?: Record<string, Item>;
}) {
  const battleStats = character.battle?.stats
    ? [
        ['Level', formatNumber(character.battle.stats.level)],
        ['HP', formatNumber(character.battle.stats.hp)],
        ['ATK', formatNumber(character.battle.stats.atk)],
        ['DEF', formatNumber(character.battle.stats.def)],
        ['MATK', formatNumber(character.battle.stats.matk)],
        ['MDEF', formatNumber(character.battle.stats.mdef)],
        ['STR', formatNumber(character.battle.stats.str)],
        ['VIT', formatNumber(character.battle.stats.vit)],
        ['INT', formatNumber(character.battle.stats.int)],
      ]
    : [];
  const resistances = Object.entries(character.battle?.elementalResistances ?? {});

  const renderGiftGroup = (title: string, itemIds: string[], categories: string[], badgeVariant: string) => {
    if (!itemIds.length && !categories.length) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category} variant="outline" className={badgeVariant}>
              {category}
            </Badge>
          ))}
          {itemIds.map((itemId) => {
            const linkedItem = getLinkedItemDisplay(itemsById, itemId);
            return (
            <LinkedEntityToken
              key={itemId}
              reference={{ type: 'item', id: itemId }}
              label={linkedItem.label}
              imageSrc={linkedItem.imageSrc}
              icon={<Gift className="h-3.5 w-3.5" />}
            />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-muted/20 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex w-full justify-center">
            <CharacterAvatar character={character} portrait />
          </div>
          <div className="min-w-0 space-y-4 text-center">
            <div className="min-w-0">
              <h2 className="break-words text-3xl font-bold">{character.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={getSemanticBadgeClass('character')}>{character.category}</Badge>
                <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                  Birthday: {formatBirthday(character)}
                </Badge>
                <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                  Gender: {character.gender ?? 'Unknown'}
                </Badge>
              </div>
            </div>
            <p className="break-words text-sm leading-6 text-muted-foreground">
              {character.description ?? 'Description unavailable.'}
            </p>
          </div>
        </div>
      </div>

      <DetailSection title="Profile" icon={<CalendarIcon className="h-4 w-4 text-pink-300" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Gender</div>
            <div className="mt-1 font-medium">Gender: {character.gender ?? 'Unknown'}</div>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Birthday</div>
            <div className="mt-1 font-medium">Birthday: {formatBirthday(character)}</div>
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Battle Info" icon={<Sword className="h-4 w-4 text-amber-300" />}>
        {character.battle ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {character.battle.description ?? 'Battle description unavailable.'}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <h4 className="mb-3 font-semibold">Equipment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Weapon</span>
                    <span>{character.battle.weapon ?? 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Weapon Type</span>
                    <span>{character.battle.weaponType ?? 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <h4 className="mb-3 font-semibold">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {character.battle.skills.length > 0 ? character.battle.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className={getSemanticBadgeClass('neutral')}>
                      {skill}
                    </Badge>
                  )) : <span className="text-sm text-muted-foreground">No listed skills.</span>}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {battleStats.map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                  <div className="mt-1 text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {resistances.length > 0 ? resistances.map(([element, value]) => (
                <Badge key={element} variant="outline" className={getSemanticBadgeClass('neutral')}>
                  {element} {value == null ? '—' : `${value}%`}
                </Badge>
              )) : <span className="text-sm text-muted-foreground">Elemental resistance data unavailable.</span>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Battle information unavailable.</p>
        )}
      </DetailSection>

      <DetailSection title="Gift Preferences" icon={<Gift className="h-4 w-4 text-pink-300" />}>
        <div className="space-y-4">
          {renderGiftGroup('Loves', character.gifts.love.items, character.gifts.love.categories, getSemanticBadgeClass('character'))}
          {renderGiftGroup('Likes', character.gifts.like.items, character.gifts.like.categories, getSemanticBadgeClass('success'))}
          {renderGiftGroup('Neutral', character.gifts.neutral.items, character.gifts.neutral.categories, getSemanticBadgeClass('info'))}
          {renderGiftGroup('Dislikes', character.gifts.dislike.items, character.gifts.dislike.categories, getSemanticBadgeClass('calendar'))}
          {renderGiftGroup('Hates', character.gifts.hate.items, character.gifts.hate.categories, getSemanticBadgeClass('danger'))}
        </div>
      </DetailSection>
    </div>
  );
}

function BirthdayDetailsContent({ character }: { character: Character }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-pink-400/20 bg-pink-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-300">
            <CharacterAvatar character={character} />
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{character.name}'s Birthday</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getSemanticBadgeClass('character')}>
                <Gift className="mr-1 h-3 w-3" />
                {formatBirthday(character)}
              </Badge>
              <Badge className={getSemanticBadgeClass('character')}>{character.category}</Badge>
            </div>
          </div>
        </div>
      </div>
      <DetailSection title="Gift Preferences" icon={<Gift className="h-4 w-4 text-pink-300" />}>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Loves</h4>
            <div className="text-sm text-muted-foreground">
              {character.gifts?.love?.items?.length ? character.gifts.love.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Likes</h4>
            <div className="text-sm text-muted-foreground">
              {character.gifts?.like?.items?.length ? character.gifts.like.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Dislikes</h4>
            <div className="text-sm text-muted-foreground">
              {character.gifts?.dislike?.items?.length ? character.gifts.dislike.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Hates</h4>
            <div className="text-sm text-muted-foreground">
              {character.gifts?.hate?.items?.length ? character.gifts.hate.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
        </div>
      </DetailSection>
    </div>
  );
}

function MonsterDetailsContent({
  group,
  items,
}: {
  group: ReturnType<typeof buildMonsterGroups>[number];
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

function FishDetailsContent({ fish }: { fish: Fish }) {
  const locationsByRegion = (fish.locations ?? []).reduce<Record<string, NonNullable<Fish['locations']>>>((acc, location) => {
    const existingLocations = acc[location.region] ?? [];
    existingLocations.push(location);
    acc[location.region] = existingLocations;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-200">
            {resolveFishImage(fish.image) ? (
              <img src={resolveFishImage(fish.image)} alt={fish.name} className="h-24 w-24 object-contain" />
            ) : (
              <Search className="h-16 w-16" />
            )}
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{fish.name}</h2>
            <div className="flex flex-wrap gap-2">
              {fish.shadow ? <Badge className={getSemanticBadgeClass('fish')}>{fish.shadow} Shadow</Badge> : null}
              <Badge variant="outline" className={getSemanticBadgeClass('success')}>Buy: {fish.buy ?? '-'}</Badge>
              <Badge variant="outline" className={getSemanticBadgeClass('danger')}>Sell: {fish.sell ?? '-'}</Badge>
            </div>
          </div>
        </div>
      </div>

      <DetailSection title="Locations by Region" icon={<MapPin className="h-4 w-4 text-cyan-300" />}>
        {Object.keys(locationsByRegion).length > 0 ? (
          <div className="space-y-5">
            {Object.keys(locationsByRegion).sort().map((region) => (
              <section key={region} className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{region}</h4>
                <div className="grid gap-3">
                  {locationsByRegion[region]?.map((location) => (
                    <div key={`${location.region}-${location.spot}`} className="rounded-xl border bg-muted/30 p-3">
                      <div className="text-sm font-semibold">{location.spot}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {location.seasons?.length ? (
                          <Badge variant="outline" className={getSemanticBadgeClass('calendar')}>
                            Seasons: {location.seasons.join(', ')}
                          </Badge>
                        ) : null}
                        {location.map ? (
                          <Badge variant="outline" className={getSemanticBadgeClass('map')}>
                            Map: {location.map}
                          </Badge>
                        ) : null}
                        {location.other?.length ? (
                          <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                            Other: {location.other.join(', ')}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            No known locations for this fish.
          </div>
        )}
      </DetailSection>
    </div>
  );
}

function MapDetailsContent({ region }: { region: ReturnType<typeof buildMapRegions>[number] }) {
  const rooms = Object.entries(
    region.chests.reduce((acc, chest) => {
      const room = chest.roomCode || 'Unknown';
      if (!acc[room]) {
        acc[room] = [];
      }
      acc[room].push(chest);
      return acc;
    }, {} as Record<string, typeof region.chests>),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-400/20 bg-blue-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
            <MapPin className="h-12 w-12" />
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{region.name}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getSemanticBadgeClass('warning')}>
                {region.chests.length} Total Chests
              </Badge>
              <Badge variant="outline" className={getSemanticBadgeClass('fish')}>
                {region.fishingLocations.length} Fishing Locations
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {region.fishingLocations.length > 0 ? (
        <DetailSection title="Fishing Locations" icon={<Search className="h-4 w-4 text-cyan-300" />}>
          <div className="flex flex-wrap gap-2">
            {region.fishingLocations.map((location, index) => (
              <LinkedEntityToken
                key={`${location.fishId}-${location.spot}-${index}`}
                reference={{ type: 'fish', id: location.fishId }}
                label={location.fishName}
                meta={`${location.sourceRegion} · ${location.spot}`}
                icon={<Search className="h-3.5 w-3.5" />}
              />
            ))}
          </div>
        </DetailSection>
      ) : null}

      <DetailSection title="Chests by Room" icon={<Box className="h-4 w-4 text-amber-300" />}>
        <div className="space-y-4">
          {rooms.map(([roomCode, chests]) => (
            <div key={roomCode} className="overflow-hidden rounded-xl border">
              <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3 font-semibold">
                Room: {roomCode}
                <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                  {chests.length} chest{chests.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-3 p-4">
                {chests.map((chest) => (
                  <div key={chest.id} className="flex items-start gap-3">
                    <Checkbox id={chest.id} className="mt-1" />
                    <label htmlFor={chest.id} className="cursor-pointer text-sm leading-none">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-amber-300" />
                        <span>{chest.itemName || 'Unknown Item'}</span>
                      </div>
                      {chest.notes ? <p className="ml-6 mt-1 text-sm text-muted-foreground italic">{`(${chest.notes})`}</p> : null}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DetailSection>
    </div>
  );
}

function FestivalDetailsContent({ festival }: { festival: Festival }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <Sparkles className="h-12 w-12" />
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{festival.name}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge className={getSemanticBadgeClass('calendar')}>
                {festival.season ? `${festival.season} ${festival.day}` : 'Multi-Season'}
              </Badge>
              {festival.orderable ? <Badge variant="outline" className={getSemanticBadgeClass('success')}>Orderable</Badge> : null}
            </div>
          </div>
        </div>
      </div>
      <DetailSection title="Description" icon={<CalendarIcon className="h-4 w-4 text-violet-300" />}>
        <p className="break-words rounded-xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          {festival.description || 'No description available for this festival.'}
        </p>
      </DetailSection>
    </div>
  );
}

function CropDetailsContent({ crop }: { crop: Crop }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
            <Wheat className="h-12 w-12" />
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{crop.name}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge className={getSemanticBadgeClass('success')}>Crop</Badge>
              {crop.regrows ? <Badge variant="outline" className={getSemanticBadgeClass('info')}>Regrows</Badge> : null}
            </div>
          </div>
        </div>
      </div>
      <DetailSection title="Growth" icon={<Wheat className="h-4 w-4 text-emerald-300" />}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {crop.growTime ? <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Growth</div><div className="mt-1 text-lg font-semibold">{crop.growTime} Days</div></div> : null}
          {crop.harvested !== undefined ? <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Yield</div><div className="mt-1 text-lg font-semibold">{crop.harvested}</div></div> : null}
          {crop.seedBuy != null ? <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Seed Cost</div><div className="mt-1 text-lg font-semibold">{crop.seedBuy}G</div></div> : null}
          {crop.cropSell != null ? <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Sell For</div><div className="mt-1 text-lg font-semibold">{crop.cropSell}G</div></div> : null}
        </div>
      </DetailSection>
    </div>
  );
}

export function UniversalDetailsDrawer() {
  const { current } = useDetailDrawer();
  const { data: items } = useItems();
  const { data: characters } = useCharacters();
  const { data: monsters } = useMonsters();
  const { data: fish } = useFish();
  const { data: chests } = useChests();
  const { data: festivals } = useFestivals();
  const { data: crops } = useCrops();

  const monsterGroups = React.useMemo(() => buildMonsterGroups(Object.values(monsters ?? {})), [monsters]);
  const mapRegions = React.useMemo(() => buildMapRegions(chests ?? [], fish ?? []), [chests, fish]);

  const resolved = React.useMemo(() => {
    if (!current) {
      return null;
    }

    switch (current.type) {
      case 'item': {
        const item = items?.[current.id];
        return item ? { title: item.name, content: <ItemDetailsContent item={item} items={items} /> } : null;
      }
      case 'character': {
        const character = characters?.[current.id];
        return character ? { title: character.name, content: <CharacterDetailsContent character={character} items={items} /> } : null;
      }
      case 'birthday': {
        const character = characters?.[current.id];
        return character ? { title: `${character.name}'s Birthday`, content: <BirthdayDetailsContent character={character} /> } : null;
      }
      case 'monster': {
        const group = monsterGroups.find((entry) => entry.key === current.id || entry.representative.id === current.id);
        return group ? { title: group.displayName, content: <MonsterDetailsContent group={group} items={items} /> } : null;
      }
      case 'fish': {
        const fishEntry = (fish ?? []).find((entry) => entry.id === current.id);
        return fishEntry ? { title: fishEntry.name, content: <FishDetailsContent fish={fishEntry} /> } : null;
      }
      case 'map': {
        const region = mapRegions.find((entry) => entry.id === current.id);
        return region ? { title: region.name, content: <MapDetailsContent region={region} /> } : null;
      }
      case 'festival': {
        const festival = (festivals ?? []).find((entry) => entry.id === current.id);
        return festival ? { title: festival.name, content: <FestivalDetailsContent festival={festival} /> } : null;
      }
      case 'crop': {
        const crop = crops?.regularCrops?.find((entry) => entry.id === current.id);
        return crop ? { title: crop.name, content: <CropDetailsContent crop={crop} /> } : null;
      }
      default:
        return null;
    }
  }, [characters, crops, current, festivals, fish, items, mapRegions, monsterGroups]);

  return <CatalogDetailsDrawerShell resolved={resolved} />;
}
