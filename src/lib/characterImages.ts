import { resolveCharacterImageUrl } from './publicAssetUrls';

export function resolveCharacterImage(assetPath?: string | null) {
  return resolveCharacterImageUrl(assetPath);
}
