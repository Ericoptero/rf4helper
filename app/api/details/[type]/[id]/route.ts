import { getDetailPayload } from '@/server/details';
import type { DetailEntityType } from '@/components/details/detailTypes';

const VALID_DETAIL_TYPES: DetailEntityType[] = [
  'item',
  'character',
  'birthday',
  'monster',
  'fish',
  'map',
  'festival',
  'crop',
];

const DETAIL_HEADERS = {
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff',
} as const;

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ type: string; id: string }>;
  },
) {
  const { type, id } = await context.params;

  if (!VALID_DETAIL_TYPES.includes(type as DetailEntityType)) {
    return Response.json({ message: 'Unknown detail type.' }, { status: 404, headers: DETAIL_HEADERS });
  }

  const payload = await getDetailPayload({ type: type as DetailEntityType, id });

  if (!payload) {
    return Response.json({ message: 'Entity not found.' }, { status: 404, headers: DETAIL_HEADERS });
  }

  return Response.json(payload, { headers: DETAIL_HEADERS });
}
