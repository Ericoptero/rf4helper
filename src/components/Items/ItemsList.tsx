import React from 'react';
import { Box, Coins, Hammer, MapPin, Star } from 'lucide-react';
import { useItems } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CatalogPageLayout,
  type CatalogFilterDefinition,
  type CatalogTableColumn,
} from '@/components/CatalogPageLayout';
import { DetailDrawerProvider, useDetailDrawer } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import type { Item } from '@/lib/schemas';

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
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const isCrafted = Boolean(item.craft?.length || item.craftedFrom?.length);

  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left">
      <Card className="h-full cursor-pointer transition-colors hover:ring-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            {item.image ? (
              <img
                src={item.image}
                alt={`${item.name} image`}
                className="h-12 w-12 shrink-0 rounded-lg border bg-background/70 object-contain p-1"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-lg font-bold text-indigo-300">
                {item.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="line-clamp-2 text-lg leading-tight">{item.name}</CardTitle>
              <Badge className={getSemanticBadgeClass('item')}>{item.type}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getSemanticBadgeClass('success')}>
            <Coins className="mr-1 h-3 w-3" />
            Buy: {item.buy ?? '-'}
          </Badge>
          <Badge variant="outline" className={getSemanticBadgeClass('danger')}>
            <Coins className="mr-1 h-3 w-3" />
            Sell: {item.sell ?? '-'}
          </Badge>
          {item.shippable ? (
            <Badge variant="outline" className={getSemanticBadgeClass('warning')}>
              <Box className="mr-1 h-3 w-3" />
              Shippable
            </Badge>
          ) : null}
          {item.rarityPoints ? (
            <Badge variant="outline" className={getSemanticBadgeClass('warning')}>
              <Star className="mr-1 h-3 w-3" />
              {item.rarityPoints}
            </Badge>
          ) : null}
          {isCrafted ? (
            <Badge variant="outline" className={getSemanticBadgeClass('info')}>
              <Hammer className="mr-1 h-3 w-3" />
              Crafted
            </Badge>
          ) : null}
        </CardContent>
      </Card>
    </button>
  );
}

function ItemsCatalog({
  searchTerm,
  onSearchTermChange,
  letterFilter,
  onLetterFilterChange,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValueChange,
}: {
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  letterFilter?: ItemLetterFilter;
  onLetterFilterChange?: (value: ItemLetterFilter) => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, string | undefined>;
  onFilterValueChange?: (key: string, value: string | undefined) => void;
}) {
  const { data: items, isLoading } = useItems();
  const { openRoot } = useDetailDrawer();

  const list = Object.values(items || {});
  const filteredByLetter = filterItemsByLetter(list, letterFilter ?? 'all');
  const types = Array.from(new Set(filteredByLetter.map((item) => item.type))).sort();
  const categories = Array.from(new Set(filteredByLetter.map((item) => item.category).filter(Boolean) as string[])).sort();
  const regions = Array.from(new Set(filteredByLetter.map((item) => item.region).filter(Boolean) as string[])).sort();
  const rarityCategories = Array.from(
    new Set(filteredByLetter.map((item) => item.rarityCategory).filter(Boolean) as string[]),
  ).sort();

  const filters: CatalogFilterDefinition<Item>[] = [
    {
      key: 'type',
      label: 'Type',
      placement: 'primary',
      options: types.map((type) => ({ label: type, value: type.toLowerCase() })),
      predicate: (item, value) => item.type.toLowerCase() === value,
    },
    {
      key: 'category',
      label: 'Category',
      placement: 'advanced',
      options: categories.map((category) => ({ label: category, value: category.toLowerCase() })),
      predicate: (item, value) => item.category?.toLowerCase() === value,
    },
    {
      key: 'region',
      label: 'Region',
      placement: 'advanced',
      options: regions.map((region) => ({ label: region, value: region.toLowerCase() })),
      predicate: (item, value) => item.region?.toLowerCase() === value,
    },
    {
      key: 'ship',
      label: 'Shippable',
      placement: 'advanced',
      options: [{ label: 'Shippable', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || Boolean(item.shippable),
    },
    {
      key: 'buyable',
      label: 'Buyable',
      placement: 'advanced',
      options: [{ label: 'Buyable', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || (item.buy ?? 0) > 0,
    },
    {
      key: 'sellable',
      label: 'Sellable',
      placement: 'advanced',
      options: [{ label: 'Sellable', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || (item.sell ?? 0) > 0,
    },
    {
      key: 'rarity',
      label: 'Rarity',
      placement: 'advanced',
      options: rarityCategories.map((rarity) => ({ label: rarity, value: rarity.toLowerCase() })),
      predicate: (item, value) => item.rarityCategory?.toLowerCase() === value,
    },
    {
      key: 'craft',
      label: 'Crafting',
      placement: 'advanced',
      options: [{ label: 'Has crafting data', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || Boolean(item.craft?.length || item.craftedFrom?.length),
    },
    {
      key: 'effects',
      label: 'Effects',
      placement: 'advanced',
      options: [{ label: 'Has effects', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || Boolean(item.effects?.length),
    },
  ];

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: Item, b: Item) => a.name.localeCompare(b.name) },
    { label: 'Name (Z-A)', value: 'name-desc', sortFn: (a: Item, b: Item) => b.name.localeCompare(a.name) },
    { label: 'Buy Price (High-Low)', value: 'buy-desc', sortFn: (a: Item, b: Item) => (b.buy || 0) - (a.buy || 0) },
    { label: 'Sell Price (High-Low)', value: 'sell-desc', sortFn: (a: Item, b: Item) => (b.sell || 0) - (a.sell || 0) },
  ];

  const tableColumns: CatalogTableColumn<Item>[] = [
    { key: 'name', header: 'Name', cell: (item) => item.name },
    { key: 'type', header: 'Type', cell: (item) => item.type },
    { key: 'category', header: 'Category', cell: (item) => item.category ?? '—' },
    { key: 'buy', header: 'Buy', cell: (item) => item.buy ?? '-' },
    { key: 'sell', header: 'Sell', cell: (item) => item.sell ?? '-' },
    { key: 'region', header: 'Region', cell: (item) => item.region ?? '—' },
    { key: 'rarity', header: 'Rarity', cell: (item) => item.rarityPoints ?? '—' },
  ];

  return (
    <>
      <CatalogPageLayout<Item>
        data={filteredByLetter}
        title="Items Database"
        searchKey="name"
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sortValue={sortValue}
        onSortValueChange={onSortValueChange}
        sortOptions={sortOptions}
        filters={filters}
        filterValues={filterValues}
        onFilterValueChange={onFilterValueChange}
        tableColumns={tableColumns}
        getItemKey={(item) => item.id}
        isLoading={isLoading}
        extraControls={<AlphabetFilter value={letterFilter ?? 'all'} onValueChange={onLetterFilterChange ?? (() => undefined)} />}
        renderCard={(item, onClick) => <ItemCard item={item} onClick={onClick} />}
        onOpenItem={(item) => openRoot({ type: 'item', id: item.id })}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function ItemsList({
  detailValue,
  onDetailValueChange,
  searchTerm,
  onSearchTermChange,
  letterFilter,
  onLetterFilterChange,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValueChange,
}: {
  detailValue?: string;
  onDetailValueChange?: (value?: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  letterFilter?: ItemLetterFilter;
  onLetterFilterChange?: (value: ItemLetterFilter) => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, string | undefined>;
  onFilterValueChange?: (key: string, value: string | undefined) => void;
} = {}) {
  const [internalDetailValue, setInternalDetailValue] = React.useState<string | undefined>();
  const [internalSearchTerm, setInternalSearchTerm] = React.useState('');
  const [internalLetterFilter, setInternalLetterFilter] = React.useState<ItemLetterFilter>('all');
  const [internalViewMode, setInternalViewMode] = React.useState<'cards' | 'table'>('cards');
  const [internalSortValue, setInternalSortValue] = React.useState('name-asc');
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, string | undefined>>({});

  return (
    <DetailDrawerProvider
      detailValue={detailValue ?? internalDetailValue}
      onDetailValueChange={onDetailValueChange ?? setInternalDetailValue}
    >
      <ItemsCatalog
        searchTerm={searchTerm ?? internalSearchTerm}
        onSearchTermChange={onSearchTermChange ?? setInternalSearchTerm}
        letterFilter={letterFilter ?? internalLetterFilter}
        onLetterFilterChange={onLetterFilterChange ?? setInternalLetterFilter}
        viewMode={viewMode ?? internalViewMode}
        onViewModeChange={onViewModeChange ?? setInternalViewMode}
        sortValue={sortValue ?? internalSortValue}
        onSortValueChange={onSortValueChange ?? setInternalSortValue}
        filterValues={filterValues ?? internalFilterValues}
        onFilterValueChange={onFilterValueChange ?? ((key, value) => setInternalFilterValues((previous) => ({ ...previous, [key]: value })))}
      />
    </DetailDrawerProvider>
  );
}
