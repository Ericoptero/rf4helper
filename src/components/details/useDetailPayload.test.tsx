import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDetailPayloadCacheSizeForTests,
  resetDetailPayloadCache,
  useDetailPayload,
} from './useDetailPayload';

describe('useDetailPayload', () => {
  beforeEach(() => {
    resetDetailPayloadCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays idle without a detail reference', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useDetailPayload(null));

    expect(result.current.status).toBe('idle');
    expect(result.current.payload).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('loads a payload once and reuses the in-session cache on the next mount', async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(
        JSON.stringify({
          type: 'map',
          region: {
            id: 'selphia-plains',
            name: 'Selphia Plains',
            chests: [],
            fishingLocations: [],
          },
          items: {},
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const reference = { type: 'map' as const, id: 'selphia-plains' };
    const first = renderHook(() => useDetailPayload(reference));

    await waitFor(() => {
      expect(first.result.current.status).toBe('ready');
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    first.unmount();

    const second = renderHook(() => useDetailPayload(reference));

    await waitFor(() => {
      expect(second.result.current.status).toBe('ready');
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(second.result.current.payload).toMatchObject({
      type: 'map',
      region: { id: 'selphia-plains' },
    });
  });

  it('reports an error state when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'boom' }), { status: 500 })),
    );

    const { result } = renderHook(() =>
      useDetailPayload({ type: 'item', id: 'item-bread' }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.payload).toBeNull();
  });

  it('rejects malformed payloads before caching them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ type: 'map', region: { id: 'bad-region' }, items: {} }), { status: 200 })),
    );

    const { result } = renderHook(() =>
      useDetailPayload({ type: 'map', id: 'bad-region' }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(getDetailPayloadCacheSizeForTests()).toBe(0);
  });

  it('evicts the least-recently-used payload when the cache grows past the limit', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const id = url.split('/').pop() ?? 'missing';

      return new Response(
        JSON.stringify({
          type: 'map',
          region: {
            id,
            name: id,
            chests: [],
            fishingLocations: [],
          },
          items: {},
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { rerender } = renderHook(
      ({ reference }) => useDetailPayload(reference),
      {
        initialProps: {
          reference: { type: 'map' as const, id: 'region-0' },
        },
      },
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    for (let index = 1; index <= 25; index += 1) {
      rerender({ reference: { type: 'map' as const, id: `region-${index}` } });

      await waitFor(() => {
        expect(getDetailPayloadCacheSizeForTests()).toBeLessThanOrEqual(25);
      });
    }

    expect(getDetailPayloadCacheSizeForTests()).toBe(25);
    expect(fetchSpy).toHaveBeenCalledTimes(26);

    rerender({ reference: { type: 'map' as const, id: 'region-0' } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(27);
    });
  });
});
