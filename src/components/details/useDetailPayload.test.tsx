import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetDetailPayloadCache, useDetailPayload } from './useDetailPayload';

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
});
