import { CrafterPageClient } from '@/components/Crafter/CrafterPageClient';
import { sanitizeCrafterBootstrapItems } from '@/lib/crafterCommon';
import { parseCrafterSearchParams } from '@/server/catalogQueries';
import { getCrafterData, getItemsData } from '@/server/data/loaders';

export default async function CrafterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [items, crafterData, rawSearchParams] = await Promise.all([
    getItemsData(),
    getCrafterData(),
    searchParams,
  ]);
  const search = parseCrafterSearchParams(rawSearchParams);
  const strippedItems = sanitizeCrafterBootstrapItems(items);

  return <CrafterPageClient items={strippedItems} crafterData={crafterData} search={search} />;
}
