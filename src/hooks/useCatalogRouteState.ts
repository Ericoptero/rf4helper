'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

type SearchRecord = Record<string, string | undefined>;

type UseCatalogRouteStateOptions<TSearch extends SearchRecord> = {
  search: TSearch;
  searchTermKey?: keyof TSearch;
  debounceMs?: number;
};

function normalizeSearchRecord(search: SearchRecord): SearchRecord {
  return Object.fromEntries(
    Object.entries(search)
      .map(([key, value]) => [key, value?.trim() || undefined])
      .filter(([, value]) => value != null && value !== ''),
  ) as SearchRecord;
}

function areSearchRecordsEqual(left: SearchRecord, right: SearchRecord) {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  for (const [key, value] of leftEntries) {
    if (right[key] !== value) {
      return false;
    }
  }

  return true;
}

export function serializeRouteValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.join(',') || undefined;
  }

  return value;
}

export function buildRouteSearchHref(pathname: string, search: SearchRecord) {
  const params = new URLSearchParams();

  Object.entries(normalizeSearchRecord(search)).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function useCatalogRouteState<TSearch extends SearchRecord>({
  search,
  searchTermKey,
  debounceMs = 350,
}: UseCatalogRouteStateOptions<TSearch>) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const [isNavigationPending, startTransition] = React.useTransition();
  const [draftSearch, setDraftSearch] = React.useState<TSearch>(() => ({ ...search }));
  const [hasPendingSearchCommit, setHasPendingSearchCommit] = React.useState(false);
  const committedSearchRef = React.useRef<TSearch>(search);
  const draftSearchRef = React.useRef<TSearch>(search);
  const pendingSearchTimeoutRef = React.useRef<number | null>(null);
  const latestRequestedSearchRef = React.useRef<SearchRecord>(normalizeSearchRecord(search));
  const cancelledDraftSearchRef = React.useRef<SearchRecord | null>(null);
  const searchTermRecordKey = searchTermKey as string | undefined;
  const draftSearchTerm = searchTermKey ? draftSearch[searchTermKey] ?? '' : '';

  const updateDraftSearch = React.useCallback((nextSearch: TSearch) => {
    const normalizedNextSearch = normalizeSearchRecord(nextSearch);

    if (
      cancelledDraftSearchRef.current
      && !areSearchRecordsEqual(cancelledDraftSearchRef.current, normalizedNextSearch)
    ) {
      cancelledDraftSearchRef.current = null;
    }

    draftSearchRef.current = nextSearch;
    setDraftSearch(nextSearch);
  }, []);

  const setPendingSearchCommit = React.useCallback((nextPendingState: boolean) => {
    setHasPendingSearchCommit(nextPendingState);
  }, []);

  const cancelPendingSearch = React.useCallback(() => {
    if (pendingSearchTimeoutRef.current != null) {
      window.clearTimeout(pendingSearchTimeoutRef.current);
      pendingSearchTimeoutRef.current = null;
    }

    cancelledDraftSearchRef.current = normalizeSearchRecord(draftSearchRef.current);
    setPendingSearchCommit(false);
  }, [setPendingSearchCommit]);

  React.useEffect(() => {
    const nextCommittedSearch = { ...search } as TSearch;
    const normalizedCommittedSearch = normalizeSearchRecord(nextCommittedSearch);
    const normalizedDraftSearch = normalizeSearchRecord(draftSearchRef.current);
    const latestRequestedSearch = latestRequestedSearchRef.current;

    committedSearchRef.current = nextCommittedSearch;

    if (areSearchRecordsEqual(normalizedCommittedSearch, latestRequestedSearch)) {
      latestRequestedSearchRef.current = normalizedCommittedSearch;

      if (
        areSearchRecordsEqual(normalizedDraftSearch, normalizedCommittedSearch)
        && !areSearchRecordsEqual(draftSearchRef.current, nextCommittedSearch)
      ) {
        updateDraftSearch(nextCommittedSearch);
      }

      return;
    }

    latestRequestedSearchRef.current = normalizedCommittedSearch;

    if (!areSearchRecordsEqual(draftSearchRef.current, nextCommittedSearch)) {
      updateDraftSearch(nextCommittedSearch);
    }
  }, [search, updateDraftSearch]);

  const replaceSearch = React.useCallback(
    (nextSearch: SearchRecord) => {
      const normalizedCurrent = normalizeSearchRecord(committedSearchRef.current);
      const normalizedNext = normalizeSearchRecord(nextSearch);
      const latestRequestedSearch = latestRequestedSearchRef.current;

      if (
        areSearchRecordsEqual(normalizedCurrent, normalizedNext)
        && areSearchRecordsEqual(latestRequestedSearch, normalizedNext)
      ) {
        return;
      }

      if (areSearchRecordsEqual(latestRequestedSearch, normalizedNext)) {
        return;
      }

      cancelledDraftSearchRef.current = null;
      latestRequestedSearchRef.current = normalizedNext;
      startTransition(() => {
        router.replace(buildRouteSearchHref(pathname, normalizedNext), { scroll: false });
      });
    },
    [pathname, router],
  );

  const patchSearch = React.useCallback(
    (patch: Partial<TSearch>) => {
      const nextSearch = {
        ...draftSearchRef.current,
        ...patch,
      } as TSearch;

      updateDraftSearch(nextSearch);
      cancelPendingSearch();
      replaceSearch(nextSearch);
    },
    [cancelPendingSearch, replaceSearch, updateDraftSearch],
  );

  const commitSearchNow = React.useCallback(() => {
    if (!searchTermKey) {
      return;
    }

    cancelPendingSearch();
    replaceSearch(draftSearchRef.current);
  }, [cancelPendingSearch, replaceSearch, searchTermKey]);

  const setDraftSearchTerm = React.useCallback(
    (value: string) => {
      if (!searchTermKey || !searchTermRecordKey) {
        return;
      }

      const nextSearch = {
        ...draftSearchRef.current,
        [searchTermRecordKey]: value,
      } as TSearch;

      updateDraftSearch(nextSearch);
    },
    [searchTermKey, searchTermRecordKey, updateDraftSearch],
  );

  React.useEffect(() => {
    if (!searchTermKey) {
      return undefined;
    }

    const normalizedCommittedSearch = normalizeSearchRecord(committedSearchRef.current);
    const normalizedDraftSearch = normalizeSearchRecord(draftSearch);
    const latestRequestedSearch = latestRequestedSearchRef.current;
    const cancelledDraftSearch = cancelledDraftSearchRef.current;

    if (
      areSearchRecordsEqual(normalizedDraftSearch, normalizedCommittedSearch)
      || areSearchRecordsEqual(normalizedDraftSearch, latestRequestedSearch)
      || (cancelledDraftSearch != null && areSearchRecordsEqual(normalizedDraftSearch, cancelledDraftSearch))
    ) {
      cancelPendingSearch();
      return undefined;
    }

    setPendingSearchCommit(true);
    pendingSearchTimeoutRef.current = window.setTimeout(() => {
      pendingSearchTimeoutRef.current = null;
      setPendingSearchCommit(false);
      replaceSearch(draftSearchRef.current);
    }, debounceMs);

    return () => {
      if (pendingSearchTimeoutRef.current != null) {
        window.clearTimeout(pendingSearchTimeoutRef.current);
        pendingSearchTimeoutRef.current = null;
      }
    };
  }, [cancelPendingSearch, debounceMs, draftSearch, replaceSearch, searchTermKey, setPendingSearchCommit]);

  React.useEffect(() => cancelPendingSearch, [cancelPendingSearch]);

  return {
    draftSearch,
    draftSearchTerm,
    setDraftSearchTerm,
    isRoutePending: hasPendingSearchCommit || isNavigationPending,
    commitSearchNow,
    cancelPendingSearch,
    patchSearch,
    replaceSearch,
  };
}
