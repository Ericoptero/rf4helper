import { CharactersPageClient } from '@/components/Characters/CharactersPageClient';
import { buildCharactersCatalogData, parseCharactersSearchParams } from '@/server/catalogQueries';
import { getCharactersCatalogFilterOptions, getCharactersData } from '@/server/data/loaders';

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [characters, filterOptions, rawSearchParams] = await Promise.all([
    getCharactersData(),
    getCharactersCatalogFilterOptions(),
    searchParams,
  ]);
  const search = parseCharactersSearchParams(rawSearchParams);
  const catalog = buildCharactersCatalogData(characters, search, filterOptions);

  return <CharactersPageClient catalog={catalog} search={search} />;
}
