'use client';

import * as React from 'react';

import type { DetailPayload } from '@/server/details';

import { buildDetailApiPath, encodeDetailEntity, type DetailEntityReference } from './detailTypes';

type DetailPayloadStatus = 'idle' | 'loading' | 'ready' | 'error';

const detailPayloadCache = new Map<string, DetailPayload>();

export function resetDetailPayloadCache() {
  detailPayloadCache.clear();
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
    const cachedPayload = detailPayloadCache.get(cacheKey);

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

        const nextPayload = (await response.json()) as DetailPayload;
        detailPayloadCache.set(cacheKey, nextPayload);
        setPayload(nextPayload);
        setStatus('ready');
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setPayload(null);
        setStatus('error');
        console.error(error);
      }
    }

    void loadDetail();

    return () => controller.abort();
  }, [reference]);

  return { payload, status };
}
