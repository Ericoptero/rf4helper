import { resolveFishImageUrl } from './publicAssetUrls';

export function resolveFishImage(assetPath?: string | null) {
  return resolveFishImageUrl(assetPath);
}
