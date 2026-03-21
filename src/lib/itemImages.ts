const itemImageModules = {
  ...import.meta.glob('@/assets/images/items/*.png', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('@/assets/images/fish/*.png', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('@/assets/images/rune-abilities/*.png', {
    eager: true,
    import: 'default',
  }),
} as Record<string, string>;

function slugifyItemName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeAssetPath(assetPath: string) {
  const segments = assetPath.split('/');
  const fileName = segments.pop();

  if (!fileName) return assetPath;

  const normalizedFileName = fileName
    .toLowerCase()
    .replace(/\s+/g, '-');

  return [...segments, normalizedFileName].join('/');
}

function resolveConfiguredItemImage(assetPath?: string | null) {
  if (!assetPath) return undefined;

  const normalizedPath = normalizeAssetPath(assetPath);
  return itemImageModules[`/src/assets/images/${normalizedPath}`];
}

export function resolveItemImage(name?: string | null, assetPath?: string | null) {
  const configuredImage = resolveConfiguredItemImage(assetPath);
  if (configuredImage) return configuredImage;

  if (!name) return undefined;

  const fileName = `${slugifyItemName(name)}.png`;
  return itemImageModules[`/src/assets/images/items/${fileName}`];
}
