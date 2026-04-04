import { buildItemsCatalogData, parseItemsSearchParams } from '@/server/catalogQueries';
import { buildItemRecipeTooltipLookup } from '@/lib/itemRecipeTooltip';
import { getItemsCatalogFilterOptions, getItemsData } from '@/server/data/loaders';
import { ItemsPageClient } from '@/components/Items/ItemsPageClient';

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [items, filterOptions, rawSearchParams] = await Promise.all([
    getItemsData(),
    getItemsCatalogFilterOptions(),
    searchParams,
  ]);
  const search = parseItemsSearchParams(rawSearchParams);
  const catalog = buildItemsCatalogData(items, search, filterOptions);
  const tooltipItems = buildItemRecipeTooltipLookup(items);

  return <ItemsPageClient catalog={catalog} search={search} tooltipItems={tooltipItems} />;
}
