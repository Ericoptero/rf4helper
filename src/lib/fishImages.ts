const fishImageModules = import.meta.glob('@/assets/images/fish/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function normalizeFishAssetPath(assetPath: string) {
  const segments = assetPath.split('/');
  const fileName = segments.pop();

  if (!fileName) return assetPath;

  const normalizedFileName = fileName
    .toLowerCase()
    .replace(/\s+/g, '-');

  return [...segments, normalizedFileName].join('/');
}

export function resolveFishImage(assetPath?: string | null) {
  if (!assetPath) return undefined;

  const normalizedPath = normalizeFishAssetPath(assetPath);
  return fishImageModules[`/src/assets/images/${normalizedPath}`];
}
