import React from 'react';
import { useItems } from '@/hooks/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';
import { Box, Coins, Star, Hammer, MapPin, ScrollText, Sparkles, Tags, PawPrint, Shield } from 'lucide-react';
import type { Item } from '@/lib/schemas';
import { capitalize, formatName, formatNumber } from '@/lib/formatters';

const itemStatLabels: Record<string, string> = {
  hp: 'HP',
  hpMax: 'Max HP',
  rp: 'RP',
  rpMax: 'Max RP',
  atk: 'ATK',
  def: 'DEF',
  str: 'STR',
  vit: 'VIT',
  int: 'INT',
  crit: 'Crit',
  res: 'Resist',
  diz: 'Dizzy',
  drain: 'Drain',
  stun: 'Stun',
  knock: 'Knock',
  aRK: 'ARK',
};

function formatItemCategory(category: string) {
  return category
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(capitalize)
    .join(' ')
    .replace(/\bAnd\b/g, '&');
}

function formatItemStatLabel(stat: string) {
  return itemStatLabels[stat] ?? stat.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
}

function getItemCrafts(item: Item) {
  return item.craft ?? item.craftedFrom ?? [];
}

function getItemStats(item: Item) {
  return Object.entries(item.stats ?? {}).filter(([, value]) => value !== 0);
}

const alphabetFilters = ['all', ...'abcdefghijklmnopqrstuvwxyz'.split(''), '#'] as const;
export type ItemLetterFilter = typeof alphabetFilters[number];

function getItemLetterBucket(name: string) {
  const firstCharacter = name.trim().charAt(0).toLowerCase();
  return /^[a-z]$/.test(firstCharacter) ? firstCharacter : '#';
}

function filterItemsByLetter(items: Item[], letter: ItemLetterFilter) {
  if (letter === 'all') {
    return items;
  }

  return items.filter((item) => getItemLetterBucket(item.name) === letter);
}

function AlphabetFilter({
  value,
  onValueChange,
}: {
  value: ItemLetterFilter;
  onValueChange: (value: ItemLetterFilter) => void;
}) {
  return (
    <div className="flex w-full flex-wrap gap-2 lg:w-auto">
      {alphabetFilters.map((letter) => {
        const isActive = value === letter;
        const label = letter === 'all' ? 'All' : letter.toUpperCase();

        return (
          <Button
            key={letter}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            aria-pressed={isActive}
            onClick={() => onValueChange(letter)}
            className={
              isActive
                ? 'border-primary/40 bg-primary text-primary-foreground shadow-sm'
                : 'border-primary/15 bg-card/70 text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground'
            }
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function ItemCard({ item, onClick }: { item: Item, onClick: () => void }) {
  const isCrafted = getItemCrafts(item).length > 0;
  
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            {item.image ? (
              <img
                src={item.image}
                alt={`${item.name} image`}
                className="w-12 h-12 rounded-lg border bg-background/70 object-contain p-1 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-lg shrink-0">
                {item.name.charAt(0)}
              </div>
            )}
            <div>
              <CardTitle className="text-lg leading-tight line-clamp-2">{item.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">{item.type}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 text-green-600 border-green-500/20">
            <Coins className="w-3 h-3" /> Buy: {item.buy ?? '-'}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 bg-red-500/10 text-red-600 border-red-500/20">
            <Coins className="w-3 h-3" /> Sell: {item.sell ?? '-'}
          </Badge>
          {item.shippable && (
            <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
              <Box className="w-3 h-3" /> Shippable
            </Badge>
          )}
          {item.rarityPoints !== undefined && item.rarityPoints > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              <Star className="w-3 h-3" /> {item.rarityPoints}
            </Badge>
          )}
          {isCrafted && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              <Hammer className="w-3 h-3" /> Crafted
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ItemDetails({ item }: { item: Item }) {
  const crafts = getItemCrafts(item);
  const stats = getItemStats(item);
  const hasDescription = !!item.description;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
        {item.image ? (
          <img
            src={item.image}
            alt={`${item.name} image`}
            className="w-32 h-32 rounded-xl border bg-background/80 object-contain p-3 shadow-sm shrink-0"
          />
        ) : (
          <div className="w-32 h-32 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-6xl shadow-sm shrink-0">
            {item.name.charAt(0)}
          </div>
        )}
         <div className="text-center sm:text-left flex-1">
            <h2 className="text-3xl font-bold mb-2">{item.name}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              <Badge>{item.type}</Badge>
              {item.region && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {item.region}
                </Badge>
              )}
              {item.rarityCategory && (
                <Badge variant="secondary">{item.rarityCategory}</Badge>
              )}
              {item.category && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Tags className="w-3 h-3" /> {formatItemCategory(item.category)}
                </Badge>
              )}
            </div>

            {hasDescription && (
              <p className="text-sm leading-6 text-muted-foreground max-w-2xl">{item.description}</p>
            )}
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 rounded-lg px-3 py-1.5 border border-green-500/20">
                <Coins className="w-4 h-4" />
                <span className="font-semibold">Buy: {formatNumber(item.buy)}</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-700 rounded-lg px-3 py-1.5 border border-red-500/20">
                <Coins className="w-4 h-4" />
                <span className="font-semibold">Sell: {formatNumber(item.sell)}</span>
              </div>
              {item.shippable && (
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 rounded-lg px-3 py-1.5 border border-amber-500/20">
                  <Box className="w-4 h-4" />
                  <span className="font-semibold">Shippable</span>
                </div>
              )}
              {item.rarityPoints !== undefined && item.rarityPoints > 0 && (
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-700 rounded-lg px-3 py-1.5 border border-yellow-500/20">
                  <Star className="w-4 h-4" />
                  <span className="font-semibold">{item.rarityPoints} RP</span>
                </div>
              )}
              {item.monster && (
                <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-700 rounded-lg px-3 py-1.5 border border-violet-500/20">
                  <PawPrint className="w-4 h-4" />
                  <span className="font-semibold">{item.monster}</span>
                </div>
              )}
            </div>
         </div>
      </div>

      <div className="px-1 space-y-6">
        {stats.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" /> Effects & Stats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.map(([stat, value]) => (
                <div key={stat} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">{formatItemStatLabel(stat)}</span>
                  <span className="text-base font-semibold tabular-nums">{formatNumber(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {crafts.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2 flex items-center gap-2">
              <Hammer className="w-5 h-5 text-blue-500" /> Crafted From
            </h3>
            <div className="space-y-3">
              {crafts.map((craft, idx) => (
                <div key={idx} className="bg-muted p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b">
                    <span className="font-semibold">{craft.station ?? craft.stationType}</span>
                    <Badge variant="outline">Lv. {craft.level}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {craft.ingredients.map((ing, i) => (
                      <Badge key={i} variant="secondary">{formatName(ing)}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(item.hexId || item.category) && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-500" /> Metadata
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.category && (
                <div className="rounded-lg border bg-muted/30 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Category</div>
                  <div className="font-semibold">{formatItemCategory(item.category)}</div>
                </div>
              )}
              {item.hexId && (
                <div className="rounded-lg border bg-muted/30 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Hex ID</div>
                  <div className="font-semibold">{item.hexId}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {item.usedInRecipes && item.usedInRecipes.length > 0 && (
          <div>
             <h3 className="text-xl font-bold mb-3 border-b pb-2 flex items-center gap-2 text-muted-foreground">
               <ScrollText className="w-5 h-5" /> Used In Recipes
             </h3>
             <div className="flex flex-wrap gap-2">
               {item.usedInRecipes.map((r, i) => (
                 <Badge key={i} variant="outline" className="bg-muted/50">{formatName(r)}</Badge>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ItemsList({
  searchTerm,
  onSearchTermChange,
  letterFilter,
  onLetterFilterChange,
}: {
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  letterFilter?: ItemLetterFilter;
  onLetterFilterChange?: (value: ItemLetterFilter) => void;
} = {}) {
  const { data: items, isLoading } = useItems();
  const [internalSearchTerm, setInternalSearchTerm] = React.useState('');
  const [internalLetterFilter, setInternalLetterFilter] = React.useState<ItemLetterFilter>('all');

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading items...</div>;
  }

  const itemsList = Object.values(items || {});
  const resolvedSearchTerm = searchTerm ?? internalSearchTerm;
  const resolvedLetterFilter = letterFilter ?? internalLetterFilter;
  const setResolvedSearchTerm = onSearchTermChange ?? setInternalSearchTerm;
  const setResolvedLetterFilter = onLetterFilterChange ?? setInternalLetterFilter;
  const letterFilteredItems = filterItemsByLetter(itemsList, resolvedLetterFilter);
  
  // Create distinct types for filter
  const types = Array.from(new Set(letterFilteredItems.map(item => item.type))).sort();
  const filterOptions = types.map(t => ({
    label: t,
    value: t,
    filterFn: (item: Item) => item.type === t
  }));

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: Item, b: Item) => a.name.localeCompare(b.name) },
    { label: 'Name (Z-A)', value: 'name-desc', sortFn: (a: Item, b: Item) => b.name.localeCompare(a.name) },
    { label: 'Type', value: 'type-asc', sortFn: (a: Item, b: Item) => (a.type || '').localeCompare(b.type || '') },
    { label: 'Buy Price (High-Low)', value: 'buy-desc', sortFn: (a: Item, b: Item) => (b.buy || 0) - (a.buy || 0) },
    { label: 'Sell Price (High-Low)', value: 'sell-desc', sortFn: (a: Item, b: Item) => (b.sell || 0) - (a.sell || 0) },
  ];

  return (
    <PageLayout<Item>
      data={letterFilteredItems}
      title="Items Database"
      searchKey="name"
      sortOptions={sortOptions}
      filterOptions={filterOptions}
      searchTerm={resolvedSearchTerm}
      onSearchTermChange={setResolvedSearchTerm}
      extraControls={
        <AlphabetFilter value={resolvedLetterFilter} onValueChange={setResolvedLetterFilter} />
      }
      renderCard={(item, onClick) => <ItemCard item={item} onClick={onClick} />}
      renderDetails={(item) => <ItemDetails item={item} />}
      detailsTitle={(item) => item.name}
    />
  );
}
