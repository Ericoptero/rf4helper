import { MonstersPageClient } from '@/components/Monsters/MonstersPageClient';
import { buildMonstersCatalogData, parseMonstersSearchParams } from '@/server/catalogQueries';
import { getMonstersData } from '@/server/data/loaders';

export default async function MonstersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [monsters, rawSearchParams] = await Promise.all([getMonstersData(), searchParams]);
  const search = parseMonstersSearchParams(rawSearchParams);
  const catalog = buildMonstersCatalogData(monsters, search);

  return <MonstersPageClient catalog={catalog} search={search} />;
}
