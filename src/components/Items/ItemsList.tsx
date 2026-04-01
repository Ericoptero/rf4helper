import React from 'react';
import { Box, Coins, Hammer, Star } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CatalogPageLayout,
  type ServerCatalogFilterDefinition,
  type CatalogFilterValue,
  type CatalogTableColumn,
} from '@/components/CatalogPageLayout';
import { DetailDrawerProvider, useDetailDrawer } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import type { DetailEntityReference } from '@/components/details/detailTypes';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';

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
  items,
  totalCount,
  filterOptions,
  searchTerm,
  onSearchTermChange,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValuesChange,
}: {
  items: Item[];
  totalCount?: number;
  filterOptions?: {
    type: CatalogOption[];
    category: CatalogOption[];
    region: CatalogOption[];
    rarity: CatalogOption[];
  };
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, CatalogFilterValue>;
  onFilterValuesChange?: (values: Record<string, CatalogFilterValue>) => void;
}) {
  const { openRoot } = useDetailDrawer();
  const derivedTypes = Array.from(new Set(items.map((item) => item.type))).sort();
  const derivedCategories = Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[])).sort();

  const filters: ServerCatalogFilterDefinition[] = [
    {
      key: 'type',
      label: 'Type',
      placement: 'primary',
      options: filterOptions?.type ?? derivedTypes.map((type) => ({ label: type, value: type.toLowerCase() })),
    },
    {
      key: 'category',
      label: 'Category',
      placement: 'advanced',
      options: filterOptions?.category ?? derivedCategories.map((category) => ({ label: category, value: category.toLowerCase() })),
    },
    {
      key: 'ship',
      label: 'Shippable',
      control: 'boolean-toggle',
      options: [{ label: 'Shippable', value: 'yes' }],
    },
    {
      key: 'buyable',
      label: 'Buyable',
      control: 'boolean-toggle',
      options: [{ label: 'Buyable', value: 'yes' }],
    },
    {
      key: 'sellable',
      label: 'Sellable',
      control: 'boolean-toggle',
      options: [{ label: 'Sellable', value: 'yes' }],
    },
    {
      key: 'hasRecipe',
      label: 'Has Recipe',
      placement: 'advanced',
      control: 'boolean-toggle',
      options: [{ label: 'Has recipe', value: 'yes' }],
    },
  ];

  const serverSortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Name (Z-A)', value: 'name-desc' },
    { label: 'Buy Price (High-Low)', value: 'buy-desc' },
    { label: 'Sell Price (High-Low)', value: 'sell-desc' },
    { label: 'Sell Price (Low-High)', value: 'sell-asc' },
    { label: 'Rarity (High-Low)', value: 'rarity-desc' },
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
        data={items}
        totalCount={totalCount}
        title="Items Database"
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sortValue={sortValue}
        onSortValueChange={onSortValueChange}
        filterValues={filterValues}
        onFilterValuesChange={onFilterValuesChange}
        tableColumns={tableColumns}
        getItemKey={(item) => item.id}
        renderCard={(item, onClick) => <ItemCard item={item} onClick={onClick} />}
        onOpenItem={(item) => openRoot({ type: 'item', id: item.id })}
        sortOptions={serverSortOptions}
        filters={filters}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function ItemsList({
  items,
  totalCount,
  filterOptions,
  detailReference,
  onDetailReferenceChange,
  searchTerm,
  onSearchTermChange,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValuesChange,
}: {
  items: Item[];
  totalCount?: number;
  filterOptions?: {
    type: CatalogOption[];
    category: CatalogOption[];
    region: CatalogOption[];
    rarity: CatalogOption[];
  };
  detailReference?: DetailEntityReference | null;
  onDetailReferenceChange?: (reference: DetailEntityReference | null) => void;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, CatalogFilterValue>;
  onFilterValuesChange?: (values: Record<string, CatalogFilterValue>) => void;
}) {
  const [internalDetailReference, setInternalDetailReference] = React.useState<DetailEntityReference | null>(null);
  const [internalSearchTerm, setInternalSearchTerm] = React.useState('');
  const [internalViewMode, setInternalViewMode] = React.useState<'cards' | 'table'>('cards');
  const [internalSortValue, setInternalSortValue] = React.useState('name-asc');
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, CatalogFilterValue>>({});

  return (
    <DetailDrawerProvider
      detailReference={detailReference ?? internalDetailReference}
      onDetailReferenceChange={onDetailReferenceChange ?? setInternalDetailReference}
    >
      <ItemsCatalog
        items={items}
        totalCount={totalCount}
        filterOptions={filterOptions}
        searchTerm={searchTerm ?? internalSearchTerm}
        onSearchTermChange={onSearchTermChange ?? setInternalSearchTerm}
        viewMode={viewMode ?? internalViewMode}
        onViewModeChange={onViewModeChange ?? setInternalViewMode}
        sortValue={sortValue ?? internalSortValue}
        onSortValueChange={onSortValueChange ?? setInternalSortValue}
        filterValues={filterValues ?? internalFilterValues}
        onFilterValuesChange={onFilterValuesChange ?? setInternalFilterValues}
      />
    </DetailDrawerProvider>
  );
}
