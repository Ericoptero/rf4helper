const characterImageModules = {
  ...import.meta.glob('@/assets/images/characters/icons/sm/*', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('@/assets/images/characters/icons/md/*', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('@/assets/images/characters/portrait/*', {
    eager: true,
    import: 'default',
  }),
} as Record<string, string>;

function normalizeCharacterAssetPath(assetPath: string) {
  const segments = assetPath.split('/');
  const fileName = segments.pop();

  if (!fileName) return assetPath;

  const normalizedFileName = fileName
    .toLowerCase()
    .replace(/\s+/g, '-');

  return [...segments, normalizedFileName].join('/');
}

export function resolveCharacterImage(assetPath?: string | null) {
  if (!assetPath) return undefined;

  const normalizedPath = normalizeCharacterAssetPath(assetPath);
  return characterImageModules[`/src/assets/images${normalizedPath}`];
}
