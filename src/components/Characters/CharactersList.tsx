import React from 'react';
import { Smile } from 'lucide-react';

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
import { resolveCharacterImage } from '@/lib/characterImages';
import { formatNumber } from '@/lib/formatters';
import type { Character } from '@/lib/schemas';
import type { CatalogOption } from '@/server/catalogQueries';

export const DEFAULT_CHARACTERS_SORT = 'name-asc';
export const CHARACTERS_TABLE_ONLY_SORT_VALUES = new Set([
  'name-desc',
  'birthday-desc',
  'weapon-type-asc',
  'weapon-type-desc',
  'level-asc',
  'level-desc',
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
]);

function formatBirthday(character: Character) {
  if (!character.birthday?.season || character.birthday.day == null) {
    return 'Unknown';
  }

  return `${character.birthday.season} ${character.birthday.day}`;
}

function CharacterAvatar({
  src,
  alt,
  fallback,
  className,
}: {
  src: string | null;
  alt: string;
  fallback: string;
  className: string;
}) {
  const resolvedSrc = resolveCharacterImage(src);

  if (resolvedSrc) {
    return <img src={resolvedSrc} alt={alt} className={className} />;
  }

  return (
    <div className={`${className} bg-primary/10 flex items-center justify-center text-primary font-bold`}>
      {fallback}
    </div>
  );
}

function renderCharacterIdentityCell(character: Character) {
  return (
    <div className="flex min-w-[13rem] items-center gap-3">
      <CharacterAvatar
        src={character.icon.md}
        alt={`${character.name} icon`}
        fallback={character.name.charAt(0)}
        className="h-9 w-9 shrink-0 rounded-full object-contain"
      />
      <span className="truncate font-medium">{character.name}</span>
    </div>
  );
}

function CharacterCard({ character, onClick }: { character: Character; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block h-full w-full text-left">
      <Card className="h-full cursor-pointer transition-colors hover:ring-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <CharacterAvatar
              src={character.icon.md}
              alt={`${character.name} icon`}
              fallback={character.name.charAt(0)}
              className="h-12 w-12 rounded-full object-contain shrink-0"
            />
            <div className="min-w-0">
              <CardTitle className="text-lg">{character.name}</CardTitle>
              <Badge className={getSemanticBadgeClass('character')}>{character.category}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
            {character.gender ?? 'Unknown'}
          </Badge>
          <div className="flex items-center gap-2 rounded-md bg-muted/30 p-2 text-muted-foreground">
            <Smile className="h-5 w-5 text-green-400" />
            <span className="font-medium text-foreground">Birthday:</span>
            <span className="text-xs">{formatBirthday(character)}</span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function CharactersCatalog({
  characters,
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
  characters: Character[];
  totalCount?: number;
  filterOptions?: {
    category: CatalogOption[];
    gender: CatalogOption[];
    season: CatalogOption[];
    weaponType: CatalogOption[];
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
  const categories = Array.from(new Set(characters.map((character) => character.category))).sort();
  const genders = Array.from(new Set(characters.map((character) => character.gender).filter(Boolean) as string[])).sort();
  const seasons = Array.from(
    new Set(characters.map((character) => character.birthday?.season).filter(Boolean) as string[]),
  ).sort();
  const weaponTypes = Array.from(
    new Set(characters.map((character) => character.battle?.weaponType).filter(Boolean) as string[]),
  ).sort();

  const filters: ServerCatalogFilterDefinition[] = [
    {
      key: 'category',
      label: 'Category',
      placement: 'primary',
      options: filterOptions?.category ?? categories.map((category) => ({ label: category, value: category.toLowerCase() })),
    },
    {
      key: 'gender',
      label: 'Gender',
      placement: 'primary',
      options: filterOptions?.gender ?? genders.map((gender) => ({ label: gender, value: gender.toLowerCase() })),
    },
    {
      key: 'season',
      label: 'Birthday Season',
      placement: 'advanced',
      options: filterOptions?.season ?? seasons.map((season) => ({ label: season, value: season.toLowerCase() })),
    },
    {
      key: 'wedding',
      label: 'Marriage Candidate',
      placement: 'advanced',
      control: 'boolean-toggle',
      options: [{ label: 'Marriage Candidate', value: 'yes' }],
    },
    {
      key: 'weaponType',
      label: 'Weapon Type',
      placement: 'advanced',
      options: filterOptions?.weaponType ?? weaponTypes.map((weaponType) => ({ label: weaponType, value: weaponType.toLowerCase() })),
    },
  ];

  const serverSortOptions = [
    { label: 'Name (A-Z)', value: DEFAULT_CHARACTERS_SORT },
    { label: 'Birthday', value: 'birthday-asc' },
  ];

  const tableColumns: CatalogTableColumn<Character>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: renderCharacterIdentityCell,
      sortAscValue: DEFAULT_CHARACTERS_SORT,
      sortDescValue: 'name-desc',
      defaultDirection: 'asc',
    },
    { key: 'category', header: 'Category', cell: (character) => character.category },
    { key: 'gender', header: 'Gender', cell: (character) => character.gender ?? 'Unknown' },
    {
      key: 'birthday',
      header: 'Birthday',
      cell: (character) => formatBirthday(character),
      sortAscValue: 'birthday-asc',
      sortDescValue: 'birthday-desc',
      defaultDirection: 'asc',
    },
    {
      key: 'weaponType',
      header: 'Weapon Type',
      cell: (character) => character.battle?.weaponType ?? '—',
      sortAscValue: 'weapon-type-asc',
      sortDescValue: 'weapon-type-desc',
      defaultDirection: 'asc',
    },
    {
      key: 'level',
      header: 'Level',
      cell: (character) => formatNumber(character.battle?.stats?.level),
      sortAscValue: 'level-asc',
      sortDescValue: 'level-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'hp',
      header: 'HP',
      cell: (character) => formatNumber(character.battle?.stats?.hp),
      sortAscValue: 'hp-asc',
      sortDescValue: 'hp-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'atk',
      header: 'ATK',
      cell: (character) => formatNumber(character.battle?.stats?.atk),
      sortAscValue: 'atk-asc',
      sortDescValue: 'atk-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'def',
      header: 'DEF',
      cell: (character) => formatNumber(character.battle?.stats?.def),
      sortAscValue: 'def-asc',
      sortDescValue: 'def-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'matk',
      header: 'M.ATK',
      cell: (character) => formatNumber(character.battle?.stats?.matk),
      sortAscValue: 'matk-asc',
      sortDescValue: 'matk-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'mdef',
      header: 'M.DEF',
      cell: (character) => formatNumber(character.battle?.stats?.mdef),
      sortAscValue: 'mdef-asc',
      sortDescValue: 'mdef-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'str',
      header: 'STR',
      cell: (character) => formatNumber(character.battle?.stats?.str),
      sortAscValue: 'str-asc',
      sortDescValue: 'str-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'vit',
      header: 'VIT',
      cell: (character) => formatNumber(character.battle?.stats?.vit),
      sortAscValue: 'vit-asc',
      sortDescValue: 'vit-desc',
      defaultDirection: 'desc',
    },
    {
      key: 'int',
      header: 'INT',
      cell: (character) => formatNumber(character.battle?.stats?.int),
      sortAscValue: 'int-asc',
      sortDescValue: 'int-desc',
      defaultDirection: 'desc',
    },
  ];

  return (
    <>
      <CatalogPageLayout<Character>
        data={characters}
        totalCount={totalCount}
        title="Characters"
        defaultSortValue={DEFAULT_CHARACTERS_SORT}
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
        getItemKey={(character) => character.id}
        renderCard={(character, onClick) => <CharacterCard character={character} onClick={onClick} />}
        onOpenItem={(character) => openRoot({ type: 'character', id: character.id })}
        sortOptions={serverSortOptions}
        filters={filters}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function CharactersList({
  characters,
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
  characters: Character[];
  totalCount?: number;
  filterOptions?: {
    category: CatalogOption[];
    gender: CatalogOption[];
    season: CatalogOption[];
    weaponType: CatalogOption[];
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
  const [internalSortValue, setInternalSortValue] = React.useState(DEFAULT_CHARACTERS_SORT);
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, CatalogFilterValue>>({});

  return (
    <DetailDrawerProvider
      detailReference={detailReference ?? internalDetailReference}
      onDetailReferenceChange={onDetailReferenceChange ?? setInternalDetailReference}
    >
      <CharactersCatalog
        characters={characters}
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
