import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildRouteSearchHref, serializeRouteValue, useCatalogRouteState } from './useCatalogRouteState';
import type { ItemsSearchParams } from '@/server/catalogQueries';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/items',
  useRouter: () => ({
    replace,
  }),
}));

describe('buildRouteSearchHref', () => {
  it('omits empty values from the query string', () => {
    expect(
      buildRouteSearchHref('/items', {
        q: 'bread',
        sort: 'name-asc',
        detailType: undefined,
        detailId: '',
      }),
    ).toBe('/items?q=bread&sort=name-asc');
  });
});

describe('serializeRouteValue', () => {
  it('serializes multi-value params into a comma-separated string', () => {
    expect(serializeRouteValue(['crop', 'rare'])).toBe('crop,rare');
    expect(serializeRouteValue([])).toBeUndefined();
  });
});

describe('useCatalogRouteState', () => {
  beforeEach(() => {
    replace.mockReset();
    vi.useFakeTimers();
  });

  it('debounces search term commits into a single route replace', async () => {
    const { result } = renderHook(() =>
      useCatalogRouteState<ItemsSearchParams>({
        search: {
          q: undefined,
          sort: 'name-asc',
        } satisfies ItemsSearchParams,
        searchTermKey: 'q',
        debounceMs: 200,
      }),
    );

    await act(async () => {});

    act(() => {
      result.current.setDraftSearchTerm('br');
      result.current.setDraftSearchTerm('bread');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(199);
    });

    expect(replace).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(replace).toHaveBeenCalledWith('/items?q=bread&sort=name-asc', { scroll: false });
  });

  it('patches multiple search params in one navigation', () => {
    const { result } = renderHook(() =>
      useCatalogRouteState<ItemsSearchParams>({
        search: {
          q: 'bread',
          sort: 'name-asc',
          ship: undefined,
        } satisfies ItemsSearchParams,
      }),
    );

    act(() => {
      result.current.patchSearch({
        sort: 'sell-desc',
        ship: 'yes',
      });
    });

    expect(replace).toHaveBeenCalledWith('/items?q=bread&sort=sell-desc&ship=yes', { scroll: false });
  });

  it('does not navigate when the normalized search state is unchanged', () => {
    const { result } = renderHook(() =>
      useCatalogRouteState<ItemsSearchParams>({
        search: {
          q: undefined,
          sort: 'name-asc',
        } satisfies ItemsSearchParams,
      }),
    );

    act(() => {
      result.current.patchSearch({
        q: '',
      });
    });

    expect(replace).not.toHaveBeenCalled();
  });

  it('does not navigate when a debounced search normalizes to the current value', async () => {
    const { result } = renderHook(() =>
      useCatalogRouteState<ItemsSearchParams>({
        search: {
          q: 'bread',
          sort: 'name-asc',
        } satisfies ItemsSearchParams,
        searchTermKey: 'q',
        debounceMs: 50,
      }),
    );

    await act(async () => {});

    act(() => {
      result.current.setDraftSearchTerm('  bread  ');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(replace).not.toHaveBeenCalled();
  });
});
