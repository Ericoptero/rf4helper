import React from 'react';
import { Box, Fish, MapPin } from 'lucide-react';

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
import type { MapRegionRecord } from '@/lib/mapFishingRelations';

function MapCard({ region, onClick }: { region: MapRegionRecord; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left">
      <Card className="h-full cursor-pointer transition-colors hover:ring-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg leading-tight">{region.name}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getSemanticBadgeClass('warning')}>
              <Box className="mr-1 h-3 w-3" />
              {region.chests.length} Chests
            </Badge>
            <Badge variant="outline" className={getSemanticBadgeClass('fish')}>
              <Fish className="mr-1 h-3 w-3" />
              {region.fishingLocations.length} Fishing
            </Badge>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function MapsCatalog({
  regions,
  totalCount,
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
  regions: MapRegionRecord[];
  totalCount?: number;
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

  const filters: ServerCatalogFilterDefinition[] = [
    {
      key: 'hasChests',
      label: 'Chests',
      control: 'boolean-toggle',
      options: [{ label: 'Has Chests', value: 'yes' }],
    },
    {
      key: 'hasNotes',
      label: 'Notes',
      control: 'boolean-toggle',
      options: [{ label: 'Has Chest Notes', value: 'yes' }],
    },
    {
      key: 'hasRecipe',
      label: 'Recipes',
      control: 'boolean-toggle',
      options: [{ label: 'Has Recipe Chest', value: 'yes' }],
    },
    {
      key: 'hasFishing',
      label: 'Fishing Location',
      control: 'boolean-toggle',
      options: [{ label: 'Has Fishing', value: 'yes' }],
    },
  ];

  const serverSortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Most Chests', value: 'chests-desc' },
    { label: 'Most Fishing Spots', value: 'fishing-desc' },
  ];

  const tableColumns: CatalogTableColumn<MapRegionRecord>[] = [
    { key: 'region', header: 'Region', cell: (region) => region.name },
    { key: 'rooms', header: 'Rooms', cell: (region) => new Set(region.chests.map((chest) => chest.roomCode)).size },
    { key: 'chests', header: 'Chests', cell: (region) => region.chests.length },
    { key: 'recipes', header: 'Recipe Chests', cell: (region) => region.chests.filter((chest) => chest.recipe).length },
    { key: 'fishing', header: 'Fishing Locations', cell: (region) => region.fishingLocations.length },
  ];

  return (
    <>
      <CatalogPageLayout<MapRegionRecord>
        data={regions}
        totalCount={totalCount}
        title="World Maps & Chests"
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
        getItemKey={(region) => region.id}
        renderCard={(region, onClick) => <MapCard region={region} onClick={onClick} />}
        onOpenItem={(region) => openRoot({ type: 'map', id: region.id })}
        sortOptions={serverSortOptions}
        filters={filters}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function MapsList({
  regions,
  totalCount,
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
  regions: MapRegionRecord[];
  totalCount?: number;
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
  const [internalSortValue, setInternalSortValue] = React.useState('name-asc');
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, CatalogFilterValue>>({});

  return (
    <DetailDrawerProvider
      detailReference={detailReference ?? internalDetailReference}
      onDetailReferenceChange={onDetailReferenceChange ?? setInternalDetailReference}
    >
      <MapsCatalog
        regions={regions}
        totalCount={totalCount}
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
