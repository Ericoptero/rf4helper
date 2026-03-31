'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

type SearchRecord = Record<string, string | undefined>;

type UseCatalogRouteStateOptions<TSearch extends SearchRecord> = {
  search: TSearch;
  searchTermKey?: keyof TSearch;
  debounceMs?: number;
};

function normalizeSearchRecord(search: SearchRecord) {
  return Object.fromEntries(
    Object.entries(search).filter(([, value]) => value != null && value !== ''),
  );
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
  debounceMs = 250,
}: UseCatalogRouteStateOptions<TSearch>) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const activeSearchTerm = searchTermKey ? search[searchTermKey] ?? '' : '';
  const [draftSearchTerm, setDraftSearchTerm] = React.useState(activeSearchTerm);

  React.useEffect(() => {
    setDraftSearchTerm(activeSearchTerm);
  }, [activeSearchTerm]);

  const replaceSearch = React.useCallback(
    (nextSearch: SearchRecord) => {
      const normalizedCurrent = normalizeSearchRecord(search);
      const normalizedNext = normalizeSearchRecord(nextSearch);

      if (areSearchRecordsEqual(normalizedCurrent, normalizedNext)) {
        return;
      }

      router.replace(buildRouteSearchHref(pathname, normalizedNext), { scroll: false });
    },
    [pathname, router, search],
  );

  const patchSearch = React.useCallback(
    (patch: Partial<TSearch>) => {
      replaceSearch({
        ...search,
        ...patch,
      });
    },
    [replaceSearch, search],
  );

  React.useEffect(() => {
    if (!searchTermKey) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const nextValue = draftSearchTerm.trim() || undefined;

      if ((search[searchTermKey] ?? undefined) === nextValue) {
        return;
      }

      patchSearch({
        [searchTermKey]: nextValue,
      } as Partial<TSearch>);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, draftSearchTerm, patchSearch, search, searchTermKey]);

  return {
    draftSearchTerm,
    setDraftSearchTerm,
    patchSearch,
    replaceSearch,
  };
}
