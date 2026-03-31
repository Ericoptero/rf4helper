import { getCrafterData, getItemsData } from '@/server/data/loaders';
import { sanitizeCrafterBootstrapItems } from '@/lib/crafterCommon';

const CRAFTER_BOOTSTRAP_HEADERS = {
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff',
} as const;

export const dynamic = 'force-static';

export async function GET() {
  const [items, crafterData] = await Promise.all([getItemsData(), getCrafterData()]);

  return Response.json(
    {
      items: sanitizeCrafterBootstrapItems(items),
      crafterData,
    },
    {
      headers: CRAFTER_BOOTSTRAP_HEADERS,
    },
  );
}
