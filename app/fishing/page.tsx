import { FishingPageClient } from '@/components/Fishing/FishingPageClient';
import { buildFishingCatalogData, parseFishingSearchParams } from '@/server/catalogQueries';
import { getFishData } from '@/server/data/loaders';

export default async function FishingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [fish, rawSearchParams] = await Promise.all([getFishData(), searchParams]);
  const search = parseFishingSearchParams(rawSearchParams);
  const catalog = buildFishingCatalogData(fish, search);

  return <FishingPageClient catalog={catalog} search={search} />;
}
