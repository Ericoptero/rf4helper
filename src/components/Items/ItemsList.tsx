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
import { ItemRecipeTooltipContent } from '@/components/details/content/shared';

import { formatNumber } from '@/lib/formatters';
import {
  buildItemRecipeTooltipLookup,
  type ItemRecipeTooltipLookup,
} from '@/lib/itemRecipeTooltip';
import { getDisplayStats } from '@/lib/itemPresentation';
import type { Item } from '@/lib/schemas';
import type { CatalogOption } from '@/server/catalogQueries';

export const DEFAULT_ITEMS_SORT = 'name-asc';
export const ITEMS_TABLE_ONLY_SORT_VALUES = new Set([
  'level-asc',
  'level-desc',
  'buy-asc',
  'rarity-asc',
  'atk-asc',
  'atk-desc',
  'matk-asc',
  'matk-desc',
  'def-asc',
  'def-desc',
  'mdef-asc',
  'mdef-desc',
  'str-asc',
  'str-desc',
  'vit-asc',
  'vit-desc',
  'int-asc',
  'int-desc',
]);

function renderItemIdentityCell(item: Item) {
  return (
    <div className="flex min-w-[13rem] items-center gap-3">
      {item.image ? (
        <img
          src={item.image}
          alt={`${item.name} image`}
          className="h-9 w-9 shrink-0 rounded-lg border bg-background/70 object-contain p-1"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-sm font-bold text-indigo-300">
          {item.name.charAt(0)}
        </div>
      )}
      <span className="truncate font-medium">{item.name}</span>
    </div>
  );
}

function getItemCraftingLevel(item: Item) {
  const recipeLevels = [...(item.craft ?? []), ...(item.craftedFrom ?? [])]
    .map((recipe) => recipe.level)
    .filter((level) => typeof level === 'number');

  if (recipeLevels.length === 0) {
    return undefined;
  }

  return Math.min(...recipeLevels);
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
            Buy: {item.buy == null ? '-' : formatNumber(item.buy)}
          </Badge>
          <Badge variant="outline" className={getSemanticBadgeClass('danger')}>
            <Coins className="mr-1 h-3 w-3" />
            Sell: {item.sell == null ? '-' : formatNumber(item.sell)}
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
              {formatNumber(item.rarityPoints)}
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
  tooltipItems,
  totalCount,
  filterOptions,
  searchTerm,
  onSearchTermChange,
  onCommitSearch,
  onClearSearch,
  onCancelPendingSearch,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValuesChange,
  isRoutePending,
  resultResetKeys,
}: {
  items: Item[];
  tooltipItems?: ItemRecipeTooltipLookup;
  totalCount?: number;
  filterOptions?: {
    type: CatalogOption[];
    category: CatalogOption[];
    region: CatalogOption[];
    rarity: CatalogOption[];
  };
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  onCommitSearch?: () => void;
  onClearSearch?: () => void;
  onCancelPendingSearch?: () => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, CatalogFilterValue>;
  onFilterValuesChange?: (values: Record<string, CatalogFilterValue>) => void;
  isRoutePending?: boolean;
  resultResetKeys?: readonly unknown[];
}) {
  const { openRoot } = useDetailDrawer();
  const derivedTypes = Array.from(new Set(items.map((item) => item.type))).sort();
  const derivedCategories = Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[])).sort();
  const tooltipItemLookup = React.useMemo(
    () => tooltipItems ?? buildItemRecipeTooltipLookup(items),
    [items, tooltipItems],
  );

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
    { label: 'Name (A-Z)', value: DEFAULT_ITEMS_SORT },
    { label: 'Name (Z-A)', value: 'name-desc' },
    { label: 'Buy Price (High-Low)', value: 'buy-desc' },
    { label: 'Sell Price (High-Low)', value: 'sell-desc' },
    { label: 'Sell Price (Low-High)', value: 'sell-asc' },
    { label: 'Rarity (High-Low)', value: 'rarity-desc' },
  ];

  const tableColumns: CatalogTableColumn<Item>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: renderItemIdentityCell,
      tooltipContent: (item) => <ItemRecipeTooltipContent itemId={item.id} items={tooltipItemLookup} />,
      sortAscValue: DEFAULT_ITEMS_SORT,
      sortDescValue: 'name-desc',
      defaultDirection: 'asc',
    },
    { key: 'type', header: 'Type', cell: (item) => item.type },
    { key: 'category', header: 'Category', cell: (item) => item.category ?? '—' },
    {
      key: 'level',
      header: 'Level',
      cell: (item) => formatNumber(getItemCraftingLevel(item)),
      sortAscValue: 'level-asc',
      sortDescValue: 'level-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'buy',
      header: 'Buy',
      cell: (item) => formatNumber(item.buy),
      sortAscValue: 'buy-asc',
      sortDescValue: 'buy-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'sell',
      header: 'Sell',
      cell: (item) => formatNumber(item.sell),
      sortAscValue: 'sell-asc',
      sortDescValue: 'sell-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'rarity',
      header: 'Rarity',
      cell: (item) => formatNumber(item.rarityPoints),
      sortAscValue: 'rarity-asc',
      sortDescValue: 'rarity-desc',
      defaultDirection: 'desc',
    },
    { key: 'shippable', header: 'Shippable', cell: (item) => (item.shippable ? 'Yes' : 'No') },
    { key: 'region', header: 'Region', cell: (item) => item.region ?? '—' },
    {
      key: 'atk',
      header: 'ATK',
      cell: (item) => formatNumber(getDisplayStats(item)?.atk),
      sortAscValue: 'atk-asc',
      sortDescValue: 'atk-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'matk',
      header: 'M.ATK',
      cell: (item) => formatNumber(getDisplayStats(item)?.matk),
      sortAscValue: 'matk-asc',
      sortDescValue: 'matk-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'def',
      header: 'DEF',
      cell: (item) => formatNumber(getDisplayStats(item)?.def),
      sortAscValue: 'def-asc',
      sortDescValue: 'def-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'mdef',
      header: 'M.DEF',
      cell: (item) => formatNumber(getDisplayStats(item)?.mdef),
      sortAscValue: 'mdef-asc',
      sortDescValue: 'mdef-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'str',
      header: 'STR',
      cell: (item) => formatNumber(getDisplayStats(item)?.str),
      sortAscValue: 'str-asc',
      sortDescValue: 'str-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'vit',
      header: 'VIT',
      cell: (item) => formatNumber(getDisplayStats(item)?.vit),
      sortAscValue: 'vit-asc',
      sortDescValue: 'vit-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'int',
      header: 'INT',
      cell: (item) => formatNumber(getDisplayStats(item)?.int),
      sortAscValue: 'int-asc',
      sortDescValue: 'int-desc',
      defaultDirection: 'desc',
    },
  ];

  return (
    <>
      <CatalogPageLayout<Item>
        data={items}
        totalCount={totalCount}
        title="Items Database"
        defaultSortValue={DEFAULT_ITEMS_SORT}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        onCommitSearch={onCommitSearch}
        onClearSearch={onClearSearch}
        onCancelPendingSearch={onCancelPendingSearch}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sortValue={sortValue}
        onSortValueChange={onSortValueChange}
        filterValues={filterValues}
        onFilterValuesChange={onFilterValuesChange}
        isRoutePending={isRoutePending}
        resultResetKeys={resultResetKeys}
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
  tooltipItems,
  totalCount,
  filterOptions,
  detailReference,
  onDetailReferenceChange,
  searchTerm,
  onSearchTermChange,
  onCommitSearch,
  onClearSearch,
  onCancelPendingSearch,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValuesChange,
  isRoutePending,
  resultResetKeys,
}: {
  items: Item[];
  tooltipItems?: ItemRecipeTooltipLookup;
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
  onCommitSearch?: () => void;
  onClearSearch?: () => void;
  onCancelPendingSearch?: () => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, CatalogFilterValue>;
  onFilterValuesChange?: (values: Record<string, CatalogFilterValue>) => void;
  isRoutePending?: boolean;
  resultResetKeys?: readonly unknown[];
}) {
  const [internalDetailReference, setInternalDetailReference] = React.useState<DetailEntityReference | null>(null);
  const [internalSearchTerm, setInternalSearchTerm] = React.useState('');
  const [internalViewMode, setInternalViewMode] = React.useState<'cards' | 'table'>('cards');
  const [internalSortValue, setInternalSortValue] = React.useState(DEFAULT_ITEMS_SORT);
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, CatalogFilterValue>>({});

  return (
    <DetailDrawerProvider
      detailReference={detailReference ?? internalDetailReference}
      onDetailReferenceChange={onDetailReferenceChange ?? setInternalDetailReference}
    >
      <ItemsCatalog
        items={items}
        tooltipItems={tooltipItems}
        totalCount={totalCount}
        filterOptions={filterOptions}
        searchTerm={searchTerm ?? internalSearchTerm}
        onSearchTermChange={onSearchTermChange ?? setInternalSearchTerm}
        onCommitSearch={onCommitSearch}
        onClearSearch={onClearSearch}
        onCancelPendingSearch={onCancelPendingSearch}
        viewMode={viewMode ?? internalViewMode}
        onViewModeChange={onViewModeChange ?? setInternalViewMode}
        sortValue={sortValue ?? internalSortValue}
        onSortValueChange={onSortValueChange ?? setInternalSortValue}
        filterValues={filterValues ?? internalFilterValues}
        onFilterValuesChange={onFilterValuesChange ?? setInternalFilterValues}
        isRoutePending={isRoutePending}
        resultResetKeys={resultResetKeys}
      />
    </DetailDrawerProvider>
  );
}
