import React from 'react';
import { Heart, MapPin, Shield, Sword } from 'lucide-react';
import { useMonsters } from '@/hooks/queries';
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
import { buildMonsterGroups, isMonsterActuallyTameable, type MonsterGroup } from '@/lib/monsterGroups';
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
              <CardTitle className="text-lg leading-tight line-clamp-1">{group.displayName}</CardTitle>
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
  monstersData,
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
  monstersData?: Record<string, import('@/lib/schemas').Monster>;
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
  onFilterValueChange?: (key: string, value: CatalogFilterValue) => void;
}) {
  const { data: fetchedMonsters, isLoading } = useMonsters();
  const { openRoot } = useDetailDrawer();
  const monsters = monstersData ?? fetchedMonsters;
  const groups = React.useMemo(() => buildMonsterGroups(Object.values(monsters || {})), [monsters]);
  const locations = Array.from(new Set(groups.flatMap((group) => group.locations))).sort();

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
        data={groups}
        totalCount={totalCount}
        title="Monsters Compendium"
        searchKey={(group) => group.searchText}
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
        getItemKey={(group) => group.key}
        isLoading={!monstersData && isLoading}
        disableClientFiltering={serverDriven}
        renderCard={(group, onClick) => <MonsterCard group={group} onClick={onClick} />}
        onOpenItem={(group) => openRoot({ type: 'monster', id: group.key })}
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
  monsters?: Record<string, import('@/lib/schemas').Monster>;
  totalCount?: number;
  filterOptions?: {
    location: CatalogOption[];
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
      <MonstersCatalog
        monstersData={monsters}
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
