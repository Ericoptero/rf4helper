import { getDetailPayload } from '@/server/details';
import type { DetailEntityType } from '@/components/details/detailTypes';

const VALID_DETAIL_TYPES = [
  'item',
  'character',
  'birthday',
  'monster',
  'fish',
  'map',
  'festival',
  'crop',
] as const satisfies readonly DetailEntityType[];
const VALID_DETAIL_TYPE_SET = new Set<string>(VALID_DETAIL_TYPES);
const DETAIL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 '_-]*$/;

function isDetailEntityType(value: string): value is DetailEntityType {
  return VALID_DETAIL_TYPE_SET.has(value);
}

function isValidDetailId(id: string) {
  return id.length > 0
    && id.length <= 120
    && id === id.trim()
    && DETAIL_ID_PATTERN.test(id)
    && !id.includes(':')
    && !id.includes('/')
    && !id.includes('\\');
}

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

  if (!isDetailEntityType(type)) {
    return Response.json({ message: 'Unknown detail type.' }, { status: 404, headers: DETAIL_HEADERS });
  }

  if (!isValidDetailId(id)) {
    return Response.json({ message: 'Invalid detail id.' }, { status: 400, headers: DETAIL_HEADERS });
  }

  const payload = await getDetailPayload({ type, id });

  if (!payload) {
    return Response.json({ message: 'Entity not found.' }, { status: 404, headers: DETAIL_HEADERS });
  }

  return Response.json(payload, { headers: DETAIL_HEADERS });
}
