import React from 'react';
import { Coins, Fish as FishIcon, MapPin } from 'lucide-react';

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
import { resolveFishImage } from '@/lib/fishImages';
import { formatNumber } from '@/lib/formatters';
import type { Fish } from '@/lib/schemas';
import type { CatalogOption } from '@/server/catalogQueries';

export const DEFAULT_FISHING_SORT = 'name-asc';
export const FISHING_TABLE_ONLY_SORT_VALUES = new Set([
  'name-desc',
  'shadow-asc',
  'shadow-desc',
  'buy-asc',
  'buy-desc',
  'sell-asc',
  'regions-asc',
  'regions-desc',
  'locations-asc',
]);

const SEASON_ORDER = ['Spring', 'Summer', 'Fall', 'Winter'];

function getFishSeasonCoverage(fish: Fish) {
  return [...new Set((fish.locations ?? []).flatMap((location) => location.seasons ?? []))].sort(
    (a, b) => SEASON_ORDER.indexOf(a) - SEASON_ORDER.indexOf(b),
  );
}

function renderFishIdentityCell(fish: Fish) {
  const imageSrc = resolveFishImage(fish.image);

  return (
    <div className="flex min-w-[13rem] items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
        {imageSrc ? <img src={imageSrc} alt={fish.name} className="h-8 w-8 object-contain" /> : <FishIcon className="h-4 w-4" />}
      </div>
      <span className="truncate font-medium">{fish.name}</span>
    </div>
  );
}

function FishCard({ fish, onClick }: { fish: Fish; onClick: () => void }) {
  const imageSrc = resolveFishImage(fish.image);

  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left">
      <Card className="h-full cursor-pointer transition-colors hover:ring-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
              {imageSrc ? <img src={imageSrc} alt={fish.name} className="h-10 w-10 object-contain" /> : <FishIcon className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <CardTitle className="line-clamp-1 text-lg leading-tight">{fish.name}</CardTitle>
              {fish.shadow ? <Badge className={getSemanticBadgeClass('fish')}>{fish.shadow} Shadow</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getSemanticBadgeClass('success')}>
            <Coins className="mr-1 h-3 w-3" />
            Buy: {fish.buy == null ? '-' : formatNumber(fish.buy)}
          </Badge>
          <Badge variant="outline" className={getSemanticBadgeClass('danger')}>
            <Coins className="mr-1 h-3 w-3" />
            Sell: {fish.sell == null ? '-' : formatNumber(fish.sell)}
          </Badge>
          <Badge variant="outline" className={getSemanticBadgeClass('map')}>
            <MapPin className="mr-1 h-3 w-3" />
            {fish.locations?.length ?? 0} Locations
          </Badge>
        </CardContent>
      </Card>
    </button>
  );
}

function FishingCatalog({
  fish,
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
  fish: Fish[];
  totalCount?: number;
  filterOptions?: {
    shadow: CatalogOption[];
    region: CatalogOption[];
    season: CatalogOption[];
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

  const shadowOptions = Array.from(new Set(fish.map((f) => f.shadow).filter(Boolean) as string[])).sort();
  const regionOptions = Array.from(new Set(fish.flatMap((f) => (f.locations ?? []).map((location) => location.region)))).sort();
  const seasonOptions = Array.from(
    new Set(fish.flatMap((f) => (f.locations ?? []).flatMap((location) => location.seasons ?? []))),
  ).sort((a, b) => SEASON_ORDER.indexOf(a) - SEASON_ORDER.indexOf(b));

  const filters: ServerCatalogFilterDefinition[] = [
    {
      key: 'shadow',
      label: 'Shadow',
      placement: 'primary',
      options: filterOptions?.shadow ?? shadowOptions.map((shadow) => ({ label: `${shadow} Shadow`, value: shadow })),
    },
    {
      key: 'region',
      label: 'Region',
      placement: 'advanced',
      options: filterOptions?.region ?? regionOptions.map((region) => ({ label: region, value: region })),
    },
    {
      key: 'season',
      label: 'Season',
      placement: 'advanced',
      options: filterOptions?.season ?? seasonOptions.map((season) => ({ label: season, value: season })),
    },
    {
      key: 'hasMap',
      label: 'Map Detail',
      placement: 'advanced',
      control: 'boolean-toggle',
      options: [{ label: 'Has map reference', value: 'yes' }],
    },
  ];

  const serverSortOptions = [
    { label: 'Name (A-Z)', value: DEFAULT_FISHING_SORT },
    { label: 'Sell Price (High-Low)', value: 'sell-desc' },
    { label: 'Locations (High-Low)', value: 'locations-desc' },
  ];

  const tableColumns: CatalogTableColumn<Fish>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: renderFishIdentityCell,
      sortAscValue: DEFAULT_FISHING_SORT,
      sortDescValue: 'name-desc',
      defaultDirection: 'asc',
    },
    {
      key: 'shadow',
      header: 'Shadow',
      cell: (f) => f.shadow ?? '—',
      sortAscValue: 'shadow-asc',
      sortDescValue: 'shadow-desc',
      defaultDirection: 'asc',
    },
    {
      key: 'buy',
      header: 'Buy',
      cell: (f) => formatNumber(f.buy),
      sortAscValue: 'buy-asc',
      sortDescValue: 'buy-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'sell',
      header: 'Sell',
      cell: (f) => formatNumber(f.sell),
      sortAscValue: 'sell-asc',
      sortDescValue: 'sell-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'regions',
      header: 'Regions',
      cell: (f) => formatNumber(new Set((f.locations ?? []).map((location) => location.region)).size),
      sortAscValue: 'regions-asc',
      sortDescValue: 'regions-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'locations',
      header: 'Locations',
      cell: (f) => formatNumber(f.locations?.length ?? 0),
      sortAscValue: 'locations-asc',
      sortDescValue: 'locations-desc',
      defaultDirection: 'desc',
    },
    { key: 'season', header: 'Season Coverage', cell: (f) => getFishSeasonCoverage(f).join(', ') || '—' },
    {
      key: 'hasMap',
      header: 'Has Map',
      cell: (f) => ((f.locations ?? []).some((location) => Boolean(location.map)) ? 'Yes' : 'No'),
    },
  ];

  return (
    <>
      <CatalogPageLayout<Fish>
        data={fish}
        totalCount={totalCount}
        title="Fishing Guide"
        defaultSortValue={DEFAULT_FISHING_SORT}
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
        getItemKey={(f) => f.id}
        renderCard={(f, onClick) => <FishCard fish={f} onClick={onClick} />}
        onOpenItem={(f) => openRoot({ type: 'fish', id: f.id })}
        sortOptions={serverSortOptions}
        filters={filters}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function FishingList({
  fish,
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
  fish: Fish[];
  totalCount?: number;
  filterOptions?: {
    shadow: CatalogOption[];
    region: CatalogOption[];
    season: CatalogOption[];
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
  const [internalSortValue, setInternalSortValue] = React.useState(DEFAULT_FISHING_SORT);
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, CatalogFilterValue>>({});

  return (
    <DetailDrawerProvider
      detailReference={detailReference ?? internalDetailReference}
      onDetailReferenceChange={onDetailReferenceChange ?? setInternalDetailReference}
    >
      <FishingCatalog
        fish={fish}
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
