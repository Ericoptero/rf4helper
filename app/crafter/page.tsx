import { CrafterPageClient } from '@/components/Crafter/CrafterPageClient';
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

  return <CrafterPageClient items={items} crafterData={crafterData} search={search} />;
}
