import { useCharacters } from '@/hooks/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/PageLayout';
import { SheetDescription } from '@/components/ui/sheet';
import { Shield, Smile, Swords } from 'lucide-react';
import type { Character } from '@/lib/schemas';
import { formatName, formatNumber } from '@/lib/formatters';
import { resolveCharacterImage } from '@/lib/characterImages';

function formatBirthday(character: Character) {
  if (!character.birthday?.season || character.birthday.day == null) {
    return 'Unknown';
  }

  return `${character.birthday.season} ${character.birthday.day}`;
}

function CharacterAvatar({
  src,
  alt,
  fallback,
  className,
}: {
  src: string | null;
  alt: string;
  fallback: string;
  className: string;
}) {
  const resolvedSrc = resolveCharacterImage(src);

  if (resolvedSrc) {
    return <img src={resolvedSrc} alt={alt} className={className} />;
  }

  return (
    <div className={`${className} bg-primary/10 flex items-center justify-center text-primary font-bold`}>
      {fallback}
    </div>
  );
}

function CharacterCard({ character, onClick }: { character: Character, onClick: () => void }) {
  // Mock friendship value for now
  const friendshipLevel = 0;
  
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <CharacterAvatar
              src={character.icon.md}
              alt={`${character.name} icon`}
              fallback={character.name.charAt(0)}
              className="w-12 h-12 rounded-full object-contain shrink-0"
            />
            <div>
              <CardTitle className="text-lg">{character.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">{character.category}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mt-4 text-muted-foreground bg-muted/30 p-2 rounded-md">
          <Smile className="w-5 h-5 text-green-500" />
          <span className="font-medium text-foreground">{friendshipLevel}</span>
          <span className="text-xs">/ 99</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CharacterDetails({ character }: { character: Character }) {
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

  const renderGifts = (title: string, data: { items: string[], categories: string[] }, colorClass: string) => {
    if (!data.items.length && !data.categories.length) return null;
    return (
      <div className="mb-4">
        <h4 className={`text-sm font-semibold mb-2 ${colorClass}`}>{title}</h4>
        <div className="flex flex-wrap gap-2">
          {data.categories.map(c => (
             <Badge key={c} variant="outline" className="bg-muted/50 border-primary/20">{c}</Badge>
          ))}
          {data.items.map(i => (
            <Badge key={i} variant="secondary">{formatName(i)}</Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <SheetDescription className="sr-only">
        Detailed profile, birthday, gifts, and battle information for {character.name}.
      </SheetDescription>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-muted/20 rounded-xl border">
         <div className="flex w-full justify-center sm:w-auto sm:justify-start">
           <CharacterAvatar
             src={character.portrait}
             alt={`${character.name} portrait`}
             fallback={character.name.charAt(0)}
             className="max-h-[22rem] w-auto max-w-[14rem] rounded-xl object-contain shadow-sm shrink-0"
           />
         </div>
         <div className="text-center sm:text-left flex-1">
            <h2 className="text-3xl font-bold mb-2">{character.name}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              <Badge>{character.category}</Badge>
              <Badge variant="outline">Birthday: {formatBirthday(character)}</Badge>
              <Badge variant="outline">Gender: {character.gender ?? 'Unknown'}</Badge>
            </div>
            <div className="inline-flex items-center justify-center sm:justify-start gap-2 text-muted-foreground bg-background rounded-lg p-2 border">
              <Smile className="w-6 h-6 text-green-500" />
              <span className="font-semibold text-foreground text-xl">0</span>
              <span>/ 999</span>
            </div>
         </div>
      </div>

      <div className="px-1">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Profile</h3>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gender</div>
            <div className="mt-1 text-sm font-medium">Gender: {character.gender ?? 'Unknown'}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Birthday</div>
            <div className="mt-1 text-sm font-medium">Birthday: {formatBirthday(character)}</div>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {character.description ?? 'Description unavailable.'}
        </p>
      </div>

      <div className="px-1">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Battle Info</h3>
        {character.battle ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <Swords className="h-4 w-4 text-primary" />
                Battle Summary
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {character.battle.description ?? 'Battle description unavailable.'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/20 p-4">
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

              <div className="rounded-xl border bg-muted/20 p-4">
                <h4 className="mb-3 font-semibold">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {character.battle.skills.length > 0 ? character.battle.skills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">No listed skills.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <h4 className="mb-3 font-semibold">Stats</h4>
              {battleStats.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {battleStats.map(([label, value]) => (
                    <div key={label} className="rounded-lg border bg-background/70 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                      <div className="mt-1 text-lg font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Stats unavailable.</p>
              )}
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <Shield className="h-4 w-4 text-primary" />
                Elemental Resistances
              </div>
              {resistances.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resistances.map(([element, value]) => (
                    <Badge key={element} variant="outline" className="h-auto py-1">
                      {element} {value == null ? '—' : `${value}%`}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Elemental resistance data unavailable.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Battle information unavailable.</p>
        )}
      </div>

      <div className="px-1">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Gift Preferences</h3>
        {renderGifts('Loves', character.gifts.love, 'text-pink-500')}
        {renderGifts('Likes', character.gifts.like, 'text-orange-500')}
        {renderGifts('Neutral', character.gifts.neutral, 'text-blue-500')}
        {renderGifts('Dislikes', character.gifts.dislike, 'text-purple-500')}
        {renderGifts('Hates', character.gifts.hate, 'text-red-500')}
      </div>
    </div>
  );
}

export function CharactersList() {
  const { data: characters, isLoading } = useCharacters();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading characters...</div>;
  }

  const charsList = Object.values(characters || {});
  
  // Create distinct categories for filter
  const categories = Array.from(new Set(charsList.map(c => c.category))).sort();
  const filterOptions = categories.map(c => ({
    label: c,
    value: c,
    filterFn: (char: Character) => char.category === c
  }));

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: Character, b: Character) => a.name.localeCompare(b.name) },
    { label: 'Name (Z-A)', value: 'name-desc', sortFn: (a: Character, b: Character) => b.name.localeCompare(a.name) },
    { label: 'Category', value: 'cat-asc', sortFn: (a: Character, b: Character) => a.category.localeCompare(b.category) },
  ];

  return (
    <PageLayout<Character>
      data={charsList}
      title="Characters"
      searchKey="name"
      sortOptions={sortOptions}
      filterOptions={filterOptions}
      renderCard={(char, onClick) => <CharacterCard character={char} onClick={onClick} />}
      renderDetails={(char) => <CharacterDetails character={char} />}
      detailsTitle={() => `Character Profile`}
    />
  );
}
