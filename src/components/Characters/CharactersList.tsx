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
import type { Character } from '@/lib/schemas';
import type { CatalogOption } from '@/server/catalogQueries';

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
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Birthday', value: 'birthday-asc' },
  ];

  const tableColumns: CatalogTableColumn<Character>[] = [
    { key: 'name', header: 'Name', cell: (character) => character.name },
    { key: 'category', header: 'Category', cell: (character) => character.category },
    { key: 'gender', header: 'Gender', cell: (character) => character.gender ?? 'Unknown' },
    { key: 'birthday', header: 'Birthday', cell: (character) => formatBirthday(character) },
    { key: 'weaponType', header: 'Weapon Type', cell: (character) => character.battle?.weaponType ?? 'Unknown' },
    { key: 'battle', header: 'Battle Data', cell: (character) => (character.battle ? 'Yes' : 'No') },
  ];

  return (
    <>
      <CatalogPageLayout<Character>
        data={characters}
        totalCount={totalCount}
        title="Characters"
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
  const [internalSortValue, setInternalSortValue] = React.useState('name-asc');
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
