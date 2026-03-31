import { MonstersPageClient } from '@/components/Monsters/MonstersPageClient';
import { buildMonstersCatalogData, parseMonstersSearchParams } from '@/server/catalogQueries';
import { getMonstersCatalogFilterOptions, getMonstersData } from '@/server/data/loaders';

export default async function MonstersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [monsters, filterOptions, rawSearchParams] = await Promise.all([
    getMonstersData(),
    getMonstersCatalogFilterOptions(),
    searchParams,
  ]);
  const search = parseMonstersSearchParams(rawSearchParams);
  const catalog = buildMonstersCatalogData(monsters, search, filterOptions);

  return <MonstersPageClient catalog={catalog} search={search} />;
}
