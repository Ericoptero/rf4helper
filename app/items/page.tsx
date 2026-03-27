import { buildItemsCatalogData, parseItemsSearchParams } from '@/server/catalogQueries';
import { getItemsData } from '@/server/data/loaders';
import { ItemsPageClient } from '@/components/Items/ItemsPageClient';

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [items, rawSearchParams] = await Promise.all([getItemsData(), searchParams]);
  const search = parseItemsSearchParams(rawSearchParams);
  const catalog = buildItemsCatalogData(items, search);

  return <ItemsPageClient catalog={catalog} search={search} />;
}
