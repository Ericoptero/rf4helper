import { MapsPageClient } from '@/components/Maps/MapsPageClient';
import { buildMapsCatalogData, parseMapsSearchParams } from '@/server/catalogQueries';
import { getChestsData, getFishData } from '@/server/data/loaders';

export default async function MapsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [chests, fish, rawSearchParams] = await Promise.all([
    getChestsData(),
    getFishData(),
    searchParams,
  ]);
  const search = parseMapsSearchParams(rawSearchParams);
  const catalog = buildMapsCatalogData(chests, fish, search);

  return <MapsPageClient catalog={catalog} search={search} />;
}
