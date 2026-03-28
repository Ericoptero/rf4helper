'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { CrafterView } from '@/components/Crafter/CrafterView';
import type { CrafterSearchParams } from '@/server/catalogQueries';
import type { CrafterData, Item } from '@/lib/schemas';

export const CRAFTER_BUILD_STORAGE_KEY = 'rf4-helper:crafter-build:v2';

function buildHref(pathname: string, search: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function CrafterPageClient({
  items,
  crafterData,
  search,
}: {
  items: Record<string, Item>;
  crafterData: CrafterData;
  search: CrafterSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [resolvedBuild, setResolvedBuild] = React.useState(search.build);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedBuild = window.localStorage.getItem(CRAFTER_BUILD_STORAGE_KEY) ?? undefined;
    const nextBuild = search.build || storedBuild || undefined;
    setResolvedBuild(nextBuild);

    if (!search.build && storedBuild) {
      React.startTransition(() => {
        router.replace(buildHref(pathname, { ...search, build: storedBuild }), { scroll: false });
      });
    }
  }, [pathname, router, search]);

  const handleSerializedBuildChange = React.useCallback(
    (build: string) => {
      setResolvedBuild(build || undefined);

      if (typeof window !== 'undefined') {
        if (build) {
          window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, build);
        } else {
          window.localStorage.removeItem(CRAFTER_BUILD_STORAGE_KEY);
        }
      }

      React.startTransition(() => {
        router.replace(buildHref(pathname, { ...search, build: build || undefined }), { scroll: false });
      });
    },
    [pathname, router, search],
  );

  return (
    <CrafterView
      items={items}
      crafterData={crafterData}
      serializedBuild={resolvedBuild}
      onSerializedBuildChange={handleSerializedBuildChange}
    />
  );
}
