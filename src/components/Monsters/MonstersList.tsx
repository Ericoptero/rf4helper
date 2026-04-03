import React from 'react';
import { Heart, MapPin, Shield, Sword } from 'lucide-react';

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
import { formatNumber } from '@/lib/formatters';
import { isMonsterActuallyTameable, type MonsterGroup } from '@/lib/monsterGroups';
import { resolveMonsterImageUrl } from '@/lib/publicAssetUrls';
import type { CatalogOption } from '@/server/catalogQueries';

export const DEFAULT_MONSTERS_SORT = 'name-asc';
export const MONSTERS_TABLE_ONLY_SORT_VALUES = new Set([
  'name-desc',
  'location-asc',
  'location-desc',
  'level-asc',
  'hp-asc',
  'hp-desc',
  'atk-asc',
  'atk-desc',
  'def-asc',
  'def-desc',
  'matk-asc',
  'matk-desc',
  'mdef-asc',
  'mdef-desc',
  'str-asc',
  'str-desc',
  'vit-asc',
  'vit-desc',
  'int-asc',
  'int-desc',
  'exp-asc',
  'exp-desc',
]);

function resolveMonsterImage(image?: string) {
  return resolveMonsterImageUrl(image);
}

function renderMonsterIdentityCell(group: MonsterGroup) {
  const imageSrc = resolveMonsterImage(group.representative.image);

  return (
    <div className="flex min-w-[13rem] items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300">
        {imageSrc ? <img src={imageSrc} alt={group.displayName} className="h-8 w-8 object-contain" /> : <Sword className="h-4 w-4" />}
      </div>
      <span className="truncate font-medium">{group.displayName}</span>
    </div>
  );
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
              {formatNumber(group.representative.stats.hp)}
            </Badge>
            <Badge variant="outline" className={getSemanticBadgeClass('monster')}>
              <Sword className="mr-1 h-3 w-3" />
              {formatNumber(group.representative.stats.atk)}
            </Badge>
            <Badge variant="outline" className={getSemanticBadgeClass('info')}>
              <Shield className="mr-1 h-3 w-3" />
              {formatNumber(group.representative.stats.def)}
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
  monsterGroups: MonsterGroup[];
  totalCount?: number;
  filterOptions?: {
    location: CatalogOption[];
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
  const locations = Array.from(new Set(monsterGroups.flatMap((group) => group.locations))).sort();

  const filters: ServerCatalogFilterDefinition[] = [
    {
      key: 'tameable',
      label: 'Tameable',
      control: 'boolean-toggle',
      options: [{ label: 'Tameable', value: 'yes' }],
    },
    {
      key: 'boss',
      label: 'Boss',
      control: 'boolean-toggle',
      options: [{ label: 'Bosses', value: 'yes' }],
    },
    {
      key: 'rideable',
      label: 'Rideable',
      control: 'boolean-toggle',
      options: [{ label: 'Rideable', value: 'yes' }],
    },
    {
      key: 'location',
      label: 'Location',
      placement: 'advanced',
      options: filterOptions?.location ?? locations.map((location) => ({ label: location, value: location.toLowerCase() })),
    },
    {
      key: 'drops',
      label: 'Drops',
      placement: 'advanced',
      control: 'boolean-toggle',
      options: [{ label: 'Has drops', value: 'yes' }],
    },
  ];

  const serverSortOptions = [
    { label: 'Name (A-Z)', value: DEFAULT_MONSTERS_SORT },
    { label: 'Base LV (High-Low)', value: 'level-desc' },
  ];

  const tableColumns: CatalogTableColumn<MonsterGroup>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: renderMonsterIdentityCell,
      sortAscValue: DEFAULT_MONSTERS_SORT,
      sortDescValue: 'name-desc',
      defaultDirection: 'asc',
    },
    {
      key: 'location',
      header: 'Location',
      cell: (group) => group.locations[0] ?? '—',
      sortAscValue: 'location-asc',
      sortDescValue: 'location-desc',
      defaultDirection: 'asc',
    },
    { key: 'tameable', header: 'Tameable', cell: (group) => (group.variants.some(isMonsterActuallyTameable) ? 'Yes' : 'No') },
    { key: 'rideable', header: 'Rideable', cell: (group) => (group.variants.some((monster) => monster.taming?.isRideable) ? 'Yes' : 'No') },
    {
      key: 'level',
      header: 'Base LV',
      cell: (group) => formatNumber(group.representative.stats.baseLevel),
      sortAscValue: 'level-asc',
      sortDescValue: 'level-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'hp',
      header: 'HP',
      cell: (group) => formatNumber(group.representative.stats.hp),
      sortAscValue: 'hp-asc',
      sortDescValue: 'hp-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'atk',
      header: 'ATK',
      cell: (group) => formatNumber(group.representative.stats.atk),
      sortAscValue: 'atk-asc',
      sortDescValue: 'atk-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'def',
      header: 'DEF',
      cell: (group) => formatNumber(group.representative.stats.def),
      sortAscValue: 'def-asc',
      sortDescValue: 'def-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'matk',
      header: 'M.ATK',
      cell: (group) => formatNumber(group.representative.stats.matk),
      sortAscValue: 'matk-asc',
      sortDescValue: 'matk-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'mdef',
      header: 'M.DEF',
      cell: (group) => formatNumber(group.representative.stats.mdef),
      sortAscValue: 'mdef-asc',
      sortDescValue: 'mdef-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'str',
      header: 'STR',
      cell: (group) => formatNumber(group.representative.stats.str),
      sortAscValue: 'str-asc',
      sortDescValue: 'str-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'vit',
      header: 'VIT',
      cell: (group) => formatNumber(group.representative.stats.vit),
      sortAscValue: 'vit-asc',
      sortDescValue: 'vit-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'int',
      header: 'INT',
      cell: (group) => formatNumber(group.representative.stats.int),
      sortAscValue: 'int-asc',
      sortDescValue: 'int-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'exp',
      header: 'EXP',
      cell: (group) => formatNumber(group.representative.stats.exp),
      sortAscValue: 'exp-asc',
      sortDescValue: 'exp-desc',
      defaultDirection: 'desc',
    },
  ];

  return (
    <>
      <CatalogPageLayout<MonsterGroup>
        data={monsterGroups}
        totalCount={totalCount}
        title="Monsters Compendium"
        defaultSortValue={DEFAULT_MONSTERS_SORT}
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
        getItemKey={(group) => group.key}
        renderCard={(group, onClick) => <MonsterCard group={group} onClick={onClick} />}
        onOpenItem={(group) => openRoot({ type: 'monster', id: group.key })}
        sortOptions={serverSortOptions}
        filters={filters}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function MonstersList({
  monsters,
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
  monsters: MonsterGroup[];
  totalCount?: number;
  filterOptions?: {
    location: CatalogOption[];
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
  const [internalSortValue, setInternalSortValue] = React.useState(DEFAULT_MONSTERS_SORT);
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
