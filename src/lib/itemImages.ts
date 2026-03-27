import { resolveItemImageUrl } from './publicAssetUrls';

export function resolveItemImage(name?: string | null, assetPath?: string | null) {
  return resolveItemImageUrl(name, assetPath);
}
