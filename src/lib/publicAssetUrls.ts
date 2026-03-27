function normalizeAssetPath(assetPath: string) {
  const trimmed = assetPath.trim().replace(/^\/+/, '');
  const segments = trimmed.split('/');
  const fileName = segments.pop();

  if (!fileName) {
    return trimmed;
  }

  const normalizedFileName = fileName.toLowerCase().replace(/\s+/g, '-');
  return [...segments, normalizedFileName].join('/');
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPublicImageUrl(relativePath: string) {
  const trimmed = relativePath.trim();

  if (trimmed.startsWith('/images/')) {
    return trimmed;
  }

  return `/images/${normalizeAssetPath(relativePath)}`;
}

export function resolveItemImageUrl(name?: string | null, assetPath?: string | null) {
  if (assetPath) {
    return toPublicImageUrl(assetPath);
  }

  if (!name) {
    return undefined;
  }

  return `/images/items/${slugifyName(name)}.png`;
}

export function resolveCharacterImageUrl(assetPath?: string | null) {
  if (!assetPath) {
    return undefined;
  }

  return toPublicImageUrl(assetPath);
}

export function resolveFishImageUrl(assetPath?: string | null) {
  if (!assetPath) {
    return undefined;
  }

  return toPublicImageUrl(assetPath);
}

export function resolveMonsterImageUrl(assetPath?: string | null) {
  if (!assetPath) {
    return undefined;
  }

  if (assetPath.endsWith('.png')) {
    return assetPath;
  }

  return `${assetPath}.png`;
}

export function resolveRuneAbilityImageUrl(assetPath?: string | null) {
  if (!assetPath) {
    return undefined;
  }

  return toPublicImageUrl(assetPath);
}
