import React from 'react';
import { Box, Fish, MapPin } from 'lucide-react';
import { useChests, useFish } from '@/hooks/queries';
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
import { buildMapRegions, type MapRegionRecord } from '@/lib/mapFishingRelations';

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
  regionsData,
  chestsData,
  fishData,
  totalCount,
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
  regionsData?: MapRegionRecord[];
  chestsData?: import('@/lib/schemas').Chest[];
  fishData?: import('@/lib/schemas').Fish[];
  totalCount?: number;
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
  const { data: fetchedChests, isLoading: chestsLoading } = useChests();
  const { data: fetchedFish, isLoading: fishLoading } = useFish();
  const { openRoot } = useDetailDrawer();
  const chests = chestsData ?? fetchedChests;
  const fish = fishData ?? fetchedFish;

  const regions = React.useMemo(
    () => regionsData ?? buildMapRegions(chests ?? [], fish ?? []),
    [chests, fish, regionsData],
  );

  const filters: CatalogFilterDefinition<MapRegionRecord>[] = [
    {
      key: 'hasFishing',
      label: 'Fishing',
      control: 'boolean-toggle',
      options: [{ label: 'Has Fishing Locations', value: 'yes' }],
      predicate: (region, value) => value !== 'yes' || region.fishingLocations.length > 0,
    },
    {
      key: 'hasNotes',
      label: 'Notes',
      control: 'boolean-toggle',
      options: [{ label: 'Has Chest Notes', value: 'yes' }],
      predicate: (region, value) => value !== 'yes' || region.chests.some((chest) => Boolean(chest.notes)),
    },
    {
      key: 'hasRecipe',
      label: 'Recipes',
      control: 'boolean-toggle',
      options: [{ label: 'Has Recipe Chest', value: 'yes' }],
      predicate: (region, value) => value !== 'yes' || region.chests.some((chest) => Boolean(chest.recipe)),
    },
    {
      key: 'chestBand',
      label: 'Chest Count',
      placement: 'advanced',
      options: [
        { label: '1 to 2 Chests', value: 'low' },
        { label: '3 to 5 Chests', value: 'medium' },
        { label: '6+ Chests', value: 'high' },
      ],
      predicate: (region, value) => {
        if (value === 'low') return region.chests.length <= 2;
        if (value === 'medium') return region.chests.length >= 3 && region.chests.length <= 5;
        if (value === 'high') return region.chests.length >= 6;
        return true;
      },
    },
  ];

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: MapRegionRecord, b: MapRegionRecord) => a.name.localeCompare(b.name) },
    { label: 'Chests (High-Low)', value: 'chests-desc', sortFn: (a: MapRegionRecord, b: MapRegionRecord) => b.chests.length - a.chests.length },
    { label: 'Fishing (High-Low)', value: 'fishing-desc', sortFn: (a: MapRegionRecord, b: MapRegionRecord) => b.fishingLocations.length - a.fishingLocations.length },
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
        getItemKey={(region) => region.id}
        isLoading={(!chestsData && chestsLoading) || (!fishData && fishLoading)}
        disableClientFiltering={serverDriven}
        renderCard={(region, onClick) => <MapCard region={region} onClick={onClick} />}
        onOpenItem={(region) => openRoot({ type: 'map', id: region.id })}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function MapsList({
  regions,
  chests,
  fish,
  totalCount,
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
  regions?: MapRegionRecord[];
  chests?: import('@/lib/schemas').Chest[];
  fish?: import('@/lib/schemas').Fish[];
  totalCount?: number;
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
      <MapsCatalog
        regionsData={regions}
        chestsData={chests}
        fishData={fish}
        totalCount={totalCount}
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
