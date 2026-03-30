import { isSupportedDataFile, readJsonDataFile } from '@/server/data/files';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ file: string }>;
  },
) {
  const { file } = await context.params;

  if (!isSupportedDataFile(file)) {
    return Response.json({ message: 'Data file not found.' }, { status: 404 });
  }

  const payload = await readJsonDataFile(file);

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
