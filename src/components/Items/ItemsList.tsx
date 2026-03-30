import React from 'react';
import { Box, Coins, Hammer, Star } from 'lucide-react';
import { useItems } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CatalogPageLayout,
  type CatalogFilterValue,
  type CatalogFilterDefinition,
  type CatalogTableColumn,
} from '@/components/CatalogPageLayout';
import { DetailDrawerProvider, useDetailDrawer } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import { hasDisplayEffects } from '@/lib/itemPresentation';
import type { Item } from '@/lib/schemas';
import type { CatalogOption } from '@/server/catalogQueries';

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
  itemsData,
  totalCount,
  filterOptions,
  serverDriven = false,
  searchTerm,
  onSearchTermChange,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValueChange,
}: {
  itemsData?: Record<string, Item>;
  totalCount?: number;
  filterOptions?: {
    type: CatalogOption[];
    category: CatalogOption[];
    region: CatalogOption[];
    rarity: CatalogOption[];
  };
  serverDriven?: boolean;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, CatalogFilterValue>;
  onFilterValueChange?: (key: string, value: CatalogFilterValue) => void;
}) {
  const { data: fetchedItems, isLoading } = useItems({ enabled: !itemsData });
  const { openRoot } = useDetailDrawer();

  const items = itemsData ?? fetchedItems;
  const list = Object.values(items || {});
  const derivedTypes = Array.from(new Set(list.map((item) => item.type))).sort();
  const derivedCategories = Array.from(new Set(list.map((item) => item.category).filter(Boolean) as string[])).sort();
  const derivedRegions = Array.from(new Set(list.map((item) => item.region).filter(Boolean) as string[])).sort();
  const derivedRarityCategories = Array.from(
    new Set(list.map((item) => item.rarityCategory).filter(Boolean) as string[]),
  ).sort();

  const filters: CatalogFilterDefinition<Item>[] = [
    {
      key: 'type',
      label: 'Type',
      placement: 'primary',
      options: filterOptions?.type ?? derivedTypes.map((type) => ({ label: type, value: type.toLowerCase() })),
      predicate: (item, value) => item.type.toLowerCase() === value,
    },
    {
      key: 'category',
      label: 'Category',
      placement: 'advanced',
      options: filterOptions?.category ?? derivedCategories.map((category) => ({ label: category, value: category.toLowerCase() })),
      predicate: (item, value) => item.category?.toLowerCase() === value,
    },
    {
      key: 'region',
      label: 'Region',
      placement: 'advanced',
      options: filterOptions?.region ?? derivedRegions.map((region) => ({ label: region, value: region.toLowerCase() })),
      predicate: (item, value) => item.region?.toLowerCase() === value,
    },
    {
      key: 'ship',
      label: 'Shippable',
      control: 'boolean-toggle',
      options: [{ label: 'Shippable', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || Boolean(item.shippable),
    },
    {
      key: 'buyable',
      label: 'Buyable',
      control: 'boolean-toggle',
      options: [{ label: 'Buyable', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || (item.buy ?? 0) > 0,
    },
    {
      key: 'sellable',
      label: 'Sellable',
      control: 'boolean-toggle',
      options: [{ label: 'Sellable', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || (item.sell ?? 0) > 0,
    },
    {
      key: 'rarity',
      label: 'Rarity',
      placement: 'advanced',
      options: filterOptions?.rarity ?? derivedRarityCategories.map((rarity) => ({ label: rarity, value: rarity.toLowerCase() })),
      predicate: (item, value) => item.rarityCategory?.toLowerCase() === value,
    },
    {
      key: 'craft',
      label: 'Crafting',
      control: 'boolean-toggle',
      options: [{ label: 'Has crafting data', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || Boolean(item.craft?.length || item.craftedFrom?.length),
    },
    {
      key: 'effects',
      label: 'Effects',
      control: 'boolean-toggle',
      options: [{ label: 'Has effects', value: 'yes' }],
      predicate: (item, value) => value !== 'yes' || hasDisplayEffects(item),
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
        data={list}
        totalCount={totalCount}
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
        isLoading={!itemsData && isLoading}
        disableClientFiltering={serverDriven}
        renderCard={(item, onClick) => <ItemCard item={item} onClick={onClick} />}
        onOpenItem={(item) => openRoot({ type: 'item', id: item.id })}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function ItemsList({
  items,
  totalCount,
  filterOptions,
  serverDriven = false,
  detailValue,
  onDetailValueChange,
  searchTerm,
  onSearchTermChange,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValueChange,
}: {
  items?: Record<string, Item>;
  totalCount?: number;
  filterOptions?: {
    type: CatalogOption[];
    category: CatalogOption[];
    region: CatalogOption[];
    rarity: CatalogOption[];
  };
  serverDriven?: boolean;
  detailValue?: string;
  onDetailValueChange?: (value?: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, CatalogFilterValue>;
  onFilterValueChange?: (key: string, value: CatalogFilterValue) => void;
} = {}) {
  const [internalDetailValue, setInternalDetailValue] = React.useState<string | undefined>();
  const [internalSearchTerm, setInternalSearchTerm] = React.useState('');
  const [internalViewMode, setInternalViewMode] = React.useState<'cards' | 'table'>('cards');
  const [internalSortValue, setInternalSortValue] = React.useState('name-asc');
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, CatalogFilterValue>>({});

  return (
    <DetailDrawerProvider
      detailValue={detailValue ?? internalDetailValue}
      onDetailValueChange={onDetailValueChange ?? setInternalDetailValue}
    >
      <ItemsCatalog
        itemsData={items}
        totalCount={totalCount}
        filterOptions={filterOptions}
        serverDriven={serverDriven}
        searchTerm={searchTerm ?? internalSearchTerm}
        onSearchTermChange={onSearchTermChange ?? setInternalSearchTerm}
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
