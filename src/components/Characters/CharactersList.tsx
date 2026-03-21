import React from 'react';
import { Shield, Smile, Swords } from 'lucide-react';
import { useCharacters } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CatalogPageLayout,
  type CatalogFilterDefinition,
  type CatalogTableColumn,
} from '@/components/CatalogPageLayout';
import { DetailDrawerProvider, useDetailDrawer } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import { resolveCharacterImage } from '@/lib/characterImages';
import type { Character } from '@/lib/schemas';

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
  searchTerm,
  onSearchTermChange,
  viewMode,
  onViewModeChange,
  sortValue,
  onSortValueChange,
  filterValues,
  onFilterValueChange,
}: {
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, string | undefined>;
  onFilterValueChange?: (key: string, value: string | undefined) => void;
}) {
  const { data: characters, isLoading } = useCharacters();
  const { openRoot } = useDetailDrawer();
  const list = Object.values(characters || {});

  const categories = Array.from(new Set(list.map((character) => character.category))).sort();
  const genders = Array.from(new Set(list.map((character) => character.gender).filter(Boolean) as string[])).sort();
  const seasons = Array.from(
    new Set(list.map((character) => character.birthday?.season).filter(Boolean) as string[]),
  ).sort();
  const weaponTypes = Array.from(
    new Set(list.map((character) => character.battle?.weaponType).filter(Boolean) as string[]),
  ).sort();

  const filters: CatalogFilterDefinition<Character>[] = [
    {
      key: 'category',
      label: 'Category',
      placement: 'primary',
      options: categories.map((category) => ({ label: category, value: category.toLowerCase() })),
      predicate: (character, value) => character.category.toLowerCase() === value,
    },
    {
      key: 'gender',
      label: 'Gender',
      placement: 'primary',
      options: genders.map((gender) => ({ label: gender, value: gender.toLowerCase() })),
      predicate: (character, value) => character.gender?.toLowerCase() === value,
    },
    {
      key: 'season',
      label: 'Birthday Season',
      placement: 'advanced',
      options: seasons.map((season) => ({ label: season, value: season.toLowerCase() })),
      predicate: (character, value) => character.birthday?.season?.toLowerCase() === value,
    },
    {
      key: 'battle',
      label: 'Battle Data',
      placement: 'advanced',
      options: [{ label: 'Has battle data', value: 'yes' }],
      predicate: (character, value) => value !== 'yes' || Boolean(character.battle),
    },
    {
      key: 'weaponType',
      label: 'Weapon Type',
      placement: 'advanced',
      options: weaponTypes.map((weaponType) => ({ label: weaponType, value: weaponType.toLowerCase() })),
      predicate: (character, value) => character.battle?.weaponType?.toLowerCase() === value,
    },
  ];

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: Character, b: Character) => a.name.localeCompare(b.name) },
    { label: 'Birthday', value: 'birthday-asc', sortFn: (a: Character, b: Character) => (a.birthday?.day || 99) - (b.birthday?.day || 99) },
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
        data={list}
        title="Characters"
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
        getItemKey={(character) => character.id}
        isLoading={isLoading}
        renderCard={(character, onClick) => <CharacterCard character={character} onClick={onClick} />}
        onOpenItem={(character) => openRoot({ type: 'character', id: character.id })}
      />
      <UniversalDetailsDrawer />
    </>
  );
}

export function CharactersList({
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
  detailValue?: string;
  onDetailValueChange?: (value?: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, string | undefined>;
  onFilterValueChange?: (key: string, value: string | undefined) => void;
} = {}) {
  const [internalDetailValue, setInternalDetailValue] = React.useState<string | undefined>();
  const [internalSearchTerm, setInternalSearchTerm] = React.useState('');
  const [internalViewMode, setInternalViewMode] = React.useState<'cards' | 'table'>('cards');
  const [internalSortValue, setInternalSortValue] = React.useState('name-asc');
  const [internalFilterValues, setInternalFilterValues] = React.useState<Record<string, string | undefined>>({});

  return (
    <DetailDrawerProvider
      detailValue={detailValue ?? internalDetailValue}
      onDetailValueChange={onDetailValueChange ?? setInternalDetailValue}
    >
      <CharactersCatalog
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
