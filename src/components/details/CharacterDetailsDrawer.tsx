import React from 'react';
import { Calendar as CalendarIcon, Gift, Sword } from 'lucide-react';
import { useCharacters, useItems } from '@/hooks/queries';
import { Badge } from '@/components/ui/badge';
import { resolveCharacterImage } from '@/lib/characterImages';
import { capitalize, formatName, formatNumber } from '@/lib/formatters';
import type { Character, Item } from '@/lib/schemas';
import { useDetailDrawer } from './DetailDrawerContext';
import { LinkedEntityToken } from './LinkedEntityToken';
import { CatalogDetailsDrawerShell, type ResolvedDetailContent } from './CatalogDetailsDrawerShell';
import { getSemanticBadgeClass } from './semanticBadges';

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

function getLinkedItemDisplay(items: Record<string, Item> | undefined, itemId: string) {
  const linkedItem = items?.[itemId];

  return {
    label: linkedItem?.name ?? formatName(itemId),
    imageSrc: linkedItem?.image,
  };
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
  const resistances = Object.entries(character.battle?.elementalResistances ?? {}).map(([element, value]) => [
    capitalize(element),
    value,
  ]);

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

export function CharacterDetailsDrawer() {
  const { current } = useDetailDrawer();
  const { data: items } = useItems();
  const { data: characters } = useCharacters();

  const resolved = React.useMemo<ResolvedDetailContent>(() => {
    if (!current) {
      return null;
    }

    if (current.type === 'character') {
      const character = characters?.[current.id];
      return character ? { title: character.name, content: <CharacterDetailsContent character={character} items={items} /> } : null;
    }

    if (current.type === 'birthday') {
      const character = characters?.[current.id];
      return character ? { title: `${character.name}'s Birthday`, content: <BirthdayDetailsContent character={character} /> } : null;
    }

    return null;
  }, [characters, current, items]);

  return <CatalogDetailsDrawerShell resolved={resolved} />;
}
