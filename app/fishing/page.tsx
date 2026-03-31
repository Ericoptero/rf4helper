import { FishingPageClient } from '@/components/Fishing/FishingPageClient';
import { buildFishingCatalogData, parseFishingSearchParams } from '@/server/catalogQueries';
import { getFishData, getFishingCatalogFilterOptions } from '@/server/data/loaders';

export default async function FishingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [fish, filterOptions, rawSearchParams] = await Promise.all([
    getFishData(),
    getFishingCatalogFilterOptions(),
    searchParams,
  ]);
  const search = parseFishingSearchParams(rawSearchParams);
  const catalog = buildFishingCatalogData(fish, search, filterOptions);

  return <FishingPageClient catalog={catalog} search={search} />;
}
