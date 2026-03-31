import { getCrafterData, getItemsData } from '@/server/data/loaders';
import type { Item } from '@/lib/schemas';

type CrafterBootstrapItem = Pick<Item, 'id' | 'name' | 'image' | 'type' | 'category' | 'stats' | 'craft' | 'crafter'>;

const CRAFTER_BOOTSTRAP_HEADERS = {
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff',
} as const;

function sanitizeCrafterBootstrapItems(items: Record<string, Item>) {
  return Object.fromEntries(
    Object.entries(items).map(([itemId, item]) => [
      itemId,
      {
        id: item.id,
        name: item.name,
        image: item.image,
        type: item.type,
        category: item.category,
        stats: item.stats,
        craft: item.craft,
        crafter: item.crafter,
      } satisfies CrafterBootstrapItem,
    ]),
  );
}

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
