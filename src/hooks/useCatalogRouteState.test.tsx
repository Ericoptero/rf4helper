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

  it('merges immediate patches with the latest draft search term', async () => {
    const { result } = renderHook(() =>
      useCatalogRouteState<ItemsSearchParams>({
        search: {
          q: undefined,
          sort: 'name-asc',
          view: undefined,
        } satisfies ItemsSearchParams,
        searchTermKey: 'q',
        debounceMs: 200,
      }),
    );

    await act(async () => {});

    act(() => {
      result.current.setDraftSearchTerm('bread');
      result.current.patchSearch({ view: 'table' });
    });

    expect(replace).toHaveBeenCalledWith('/items?q=bread&sort=name-asc&view=table', { scroll: false });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(replace).toHaveBeenCalledTimes(1);
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

  it('flushes the current draft search immediately when requested', async () => {
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
      result.current.setDraftSearchTerm('bread');
      result.current.commitSearchNow();
    });

    expect(replace).toHaveBeenCalledWith('/items?q=bread&sort=name-asc', { scroll: false });
  });

  it('flushes a cleared search immediately without waiting for debounce', async () => {
    const { result } = renderHook(() =>
      useCatalogRouteState<ItemsSearchParams>({
        search: {
          q: 'bread',
          sort: 'name-asc',
        } satisfies ItemsSearchParams,
        searchTermKey: 'q',
        debounceMs: 200,
      }),
    );

    await act(async () => {});

    act(() => {
      result.current.setDraftSearchTerm('');
      result.current.commitSearchNow();
    });

    expect(replace).toHaveBeenCalledWith('/items?sort=name-asc', { scroll: false });
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

  it('cancels a pending search commit before the debounce fires', async () => {
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
      result.current.setDraftSearchTerm('bread');
      result.current.cancelPendingSearch();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
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

  it('keeps the active draft when an older committed search arrives from the server', async () => {
    const initialSearch: ItemsSearchParams = {
      q: undefined,
      sort: 'name-asc',
    };

    const { result, rerender } = renderHook(
      ({ search }: { search: ItemsSearchParams }) =>
        useCatalogRouteState<ItemsSearchParams>({
          search,
          searchTermKey: 'q',
          debounceMs: 50,
        }),
      {
        initialProps: {
          search: initialSearch,
        },
      },
    );

    await act(async () => {});

    act(() => {
      result.current.setDraftSearchTerm('br');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(replace).toHaveBeenCalledWith('/items?q=br&sort=name-asc', { scroll: false });

    act(() => {
      result.current.setDraftSearchTerm('bread');
    });

    rerender({
      search: {
        q: 'br',
        sort: 'name-asc',
      } satisfies ItemsSearchParams,
    });

    expect(result.current.draftSearchTerm).toBe('bread');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(replace).toHaveBeenLastCalledWith('/items?q=bread&sort=name-asc', { scroll: false });
  });
});
