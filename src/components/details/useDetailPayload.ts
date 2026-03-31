'use client';

import * as React from 'react';

import type { DetailPayload } from '@/server/details';

import { buildDetailApiPath, encodeDetailEntity, type DetailEntityReference } from './detailTypes';

type DetailPayloadStatus = 'idle' | 'loading' | 'ready' | 'error';

const DETAIL_PAYLOAD_CACHE_LIMIT = 25;
// Module-level singleton is safe: this file is 'use client', so Next.js excludes it from the
// SSR module graph. The typeof window guards below provide additional defense-in-depth.
const detailPayloadCache = new Map<string, DetailPayload>();

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasNamedEntity(value: unknown): value is Record<string, unknown> & { id: string; name: string } {
  return isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string';
}

function hasItemsRecord(value: unknown): value is Record<string, unknown> {
  return isObjectRecord(value) && !Array.isArray(value);
}

function isDetailPayload(value: unknown): value is DetailPayload {
  if (!isObjectRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'item':
      return hasNamedEntity(value.item) && hasItemsRecord(value.items);
    case 'character':
      return hasNamedEntity(value.character) && hasItemsRecord(value.items);
    case 'birthday':
      return hasNamedEntity(value.character);
    case 'monster':
      return isObjectRecord(value.group)
        && typeof value.group.displayName === 'string'
        && Array.isArray(value.group.variants)
        && hasItemsRecord(value.items);
    case 'fish':
      return hasNamedEntity(value.fish);
    case 'map':
      if (!hasNamedEntity(value.region)) {
        return false;
      }
      return Array.isArray(value.region.chests)
        && Array.isArray(value.region.fishingLocations);
    case 'festival':
      return hasNamedEntity(value.festival);
    case 'crop':
      return hasNamedEntity(value.crop);
    default:
      return false;
  }
}

function getCachedDetailPayload(cacheKey: string) {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const cachedPayload = detailPayloadCache.get(cacheKey);

  if (!cachedPayload) {
    return undefined;
  }

  detailPayloadCache.delete(cacheKey);
  detailPayloadCache.set(cacheKey, cachedPayload);
  return cachedPayload;
}

function setCachedDetailPayload(cacheKey: string, payload: DetailPayload) {
  if (typeof window === 'undefined') {
    return;
  }
  if (detailPayloadCache.has(cacheKey)) {
    detailPayloadCache.delete(cacheKey);
  }

  detailPayloadCache.set(cacheKey, payload);

  while (detailPayloadCache.size > DETAIL_PAYLOAD_CACHE_LIMIT) {
    const oldestCacheKey = detailPayloadCache.keys().next().value;

    if (!oldestCacheKey) {
      break;
    }

    detailPayloadCache.delete(oldestCacheKey);
  }
}

export function resetDetailPayloadCache() {
  if (typeof window !== 'undefined') {
    detailPayloadCache.clear();
  }
}

export function getDetailPayloadCacheSizeForTests() {
  return detailPayloadCache.size;
}

export function useDetailPayload(reference: DetailEntityReference | null) {
  const [payload, setPayload] = React.useState<DetailPayload | null>(null);
  const [status, setStatus] = React.useState<DetailPayloadStatus>('idle');

  React.useEffect(() => {
    if (!reference) {
      setPayload(null);
      setStatus('idle');
      return;
    }

    const activeReference = reference;
    const cacheKey = encodeDetailEntity(activeReference);
    const cachedPayload = getCachedDetailPayload(cacheKey);

    if (cachedPayload) {
      setPayload(cachedPayload);
      setStatus('ready');
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      setStatus('loading');

      try {
        const response = await fetch(buildDetailApiPath(activeReference), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load detail payload for ${cacheKey}`);
        }

        const nextPayload = await response.json();

        if (!isDetailPayload(nextPayload)) {
          throw new Error(`Invalid detail payload for ${cacheKey}`);
        }

        setCachedDetailPayload(cacheKey, nextPayload);
        setPayload(nextPayload);
        setStatus('ready');
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setPayload(null);
        setStatus('error');
      }
    }

    void loadDetail();

    return () => controller.abort();
  }, [reference]);

  return { payload, status };
}
