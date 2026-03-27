import { getCrafterData, getItemsData } from '@/server/data/loaders';

export async function GET() {
  const [items, crafterData] = await Promise.all([getItemsData(), getCrafterData()]);

  return Response.json({
    items,
    crafterData,
  });
}
