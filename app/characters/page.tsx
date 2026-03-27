import { CharactersPageClient } from '@/components/Characters/CharactersPageClient';
import { buildCharactersCatalogData, parseCharactersSearchParams } from '@/server/catalogQueries';
import { getCharactersData } from '@/server/data/loaders';

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [characters, rawSearchParams] = await Promise.all([getCharactersData(), searchParams]);
  const search = parseCharactersSearchParams(rawSearchParams);
  const catalog = buildCharactersCatalogData(characters, search);

  return <CharactersPageClient catalog={catalog} search={search} />;
}
