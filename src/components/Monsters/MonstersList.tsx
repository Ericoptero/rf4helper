import React from 'react';
import { Heart, MapPin, Shield, Sword } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CatalogPageLayout,
  type CatalogFilterDefinition,
  type CatalogFilterValue,
  type CatalogTableColumn,
} from '@/components/CatalogPageLayout';
import { DetailDrawerProvider, useDetailDrawer } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import type { DetailEntityReference } from '@/components/details/detailTypes';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import { isMonsterActuallyTameable, type MonsterGroup } from '@/lib/monsterGroups';
import { resolveMonsterImageUrl } from '@/lib/publicAssetUrls';
import type { CatalogOption } from '@/server/catalogQueries';

function resolveMonsterImage(image?: string) {
  return resolveMonsterImageUrl(image);
}

function MonsterCard({ group, onClick }: { group: MonsterGroup; onClick: () => void }) {
  const imageSrc = resolveMonsterImage(group.representative.image);

  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left">
      <Card className="h-full cursor-pointer transition-colors hover:ring-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300">
              {imageSrc ? <img src={imageSrc} alt={group.displayName} className="h-10 w-10 object-contain" /> : <Sword className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <CardTitle className="line-clamp-1 text-lg leading-tight">{group.displayName}</CardTitle>
              {group.variants.some(isMonsterActuallyTameable) ? (
                <Badge className={getSemanticBadgeClass('success')}>Tameable</Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getSemanticBadgeClass('danger')}>
              <Heart className="mr-1 h-3 w-3" />
              {group.representative.stats.hp}
            </Badge>
            <Badge variant="outline" className={getSemanticBadgeClass('monster')}>
              <Sword className="mr-1 h-3 w-3" />
              {group.representative.stats.atk}
            </Badge>
            <Badge variant="outline" className={getSemanticBadgeClass('info')}>
              <Shield className="mr-1 h-3 w-3" />
              {group.representative.stats.def}
            </Badge>
          </div>
          {group.locations.length > 0 ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              {group.locations.map((location) => (
                <div key={location} className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </button>
  );
}

function MonstersCatalog({
  monsterGroups,
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
  onFilterValuesChange,
}: {
  monsterGroups: MonsterGroup[];
  totalCount?: number;
  filterOptions?: {
    location: CatalogOption[];
  };
  serverDriven?: boolean;
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
  const locations = Array.from(new Set(monsterGroups.flatMap((group) => group.locations))).sort();

  const filters: CatalogFilterDefinition<MonsterGroup>[] = [
    {
      key: 'tameable',
      label: 'Tameable',
      control: 'boolean-toggle',
      options: [{ label: 'Tameable', value: 'yes' }],
      predicate: (group, value) => value !== 'yes' || group.variants.some(isMonsterActuallyTameable),
    },
    {
      key: 'boss',
      label: 'Boss',
      control: 'boolean-toggle',
      options: [{ label: 'Bosses', value: 'yes' }],
      predicate: (group, value) => value !== 'yes' || group.variants.some((monster) => monster.location?.toLowerCase().includes('boss')),
    },
    {
      key: 'rideable',
      label: 'Rideable',
      control: 'boolean-toggle',
      options: [{ label: 'Rideable', value: 'yes' }],
      predicate: (group, value) => value !== 'yes' || group.variants.some((monster) => Boolean(monster.taming?.isRideable)),
    },
    {
      key: 'location',
      label: 'Location',
      placement: 'advanced',
      options: filterOptions?.location ?? locations.map((location) => ({ label: location, value: location.toLowerCase() })),
      predicate: (group, value) => group.locations.some((location) => location.toLowerCase() === value),
    },
    {
      key: 'drops',
      label: 'Drops',
      placement: 'advanced',
      control: 'boolean-toggle',
      options: [{ label: 'Has drops', value: 'yes' }],
      predicate: (group, value) => value !== 'yes' || group.variants.some((monster) => monster.drops.length > 0),
    },
  ];

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: MonsterGroup, b: MonsterGroup) => a.displayName.localeCompare(b.displayName) },
    { label: 'Base LV (High-Low)', value: 'level-desc', sortFn: (a: MonsterGroup, b: MonsterGroup) => (b.representative.stats.baseLevel || 0) - (a.representative.stats.baseLevel || 0) },
  ];
  const serverFilters = filters.map((filter) => ({
    key: filter.key,
    label: filter.label,
    placement: filter.placement,
    control: filter.control,
    options: filter.options,
  }));
  const serverSortOptions = sortOptions.map((option) => ({ label: option.label, value: option.value }));

  const tableColumns: CatalogTableColumn<MonsterGroup>[] = [
    { key: 'name', header: 'Name', cell: (group) => group.displayName },
    { key: 'location', header: 'Location', cell: (group) => group.locations[0] ?? '—' },
    { key: 'tameable', header: 'Tameable', cell: (group) => (group.variants.some(isMonsterActuallyTameable) ? 'Yes' : 'No') },
    { key: 'rideable', header: 'Rideable', cell: (group) => (group.variants.some((monster) => monster.taming?.isRideable) ? 'Yes' : 'No') },
    { key: 'level', header: 'Base LV', cell: (group) => group.representative.stats.baseLevel ?? '—' },
    { key: 'hp', header: 'HP', cell: (group) => group.representative.stats.hp ?? '—' },
    { key: 'atk', header: 'ATK', cell: (group) => group.representative.stats.atk ?? '—' },
    { key: 'def', header: 'DEF', cell: (group) => group.representative.stats.def ?? '—' },
  ];

  return (
    <>
      <CatalogPageLayout<MonsterGroup>
        data={monsterGroups}
        totalCount={totalCount}
        title="Monsters Compendium"
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sortValue={sortValue}
        onSortValueChange={onSortValueChange}
        filterValues={filterValues}
        onFilterValuesChange={onFilterValuesChange}
        tableColumns={tableColumns}
        getItemKey={(group) => group.key}
        renderCard={(group, onClick) => <MonsterCard group={group} onClick={onClick} />}
        onOpenItem={(group) => openRoot({ type: 'monster', id: group.key })}
        {...(serverDriven
          ? {
              mode: 'server' as const,
              sortOptions: serverSortOptions,
              filters: serverFilters,
            }
          : {
              mode: 'client' as const,
              searchKey: (group: MonsterGroup) => group.searchText,
              sortOptions,
              filters,
            })}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function MonstersList({
  monsters,
  totalCount,
  filterOptions,
  serverDriven = false,
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
  monsters: MonsterGroup[];
  totalCount?: number;
  filterOptions?: {
    location: CatalogOption[];
  };
  serverDriven?: boolean;
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
      <MonstersCatalog
        monsterGroups={monsters}
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
        onFilterValuesChange={onFilterValuesChange ?? setInternalFilterValues}
      />
    </DetailDrawerProvider>
  );
}
