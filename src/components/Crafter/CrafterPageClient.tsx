'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { CrafterView } from '@/components/Crafter/CrafterView';
import { DetailDrawerProvider } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import { deserializeCrafterBuild, serializeCrafterBuild } from '@/lib/crafter';
import type { CrafterBootstrapItem } from '@/lib/crafterCommon';
import type { CrafterSearchParams } from '@/server/catalogQueries';
import type { CrafterData } from '@/lib/schemas';

export const CRAFTER_BUILD_STORAGE_KEY = 'rf4-helper:crafter-build:v2';

function buildHref(pathname: string, search: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function normalizePersistedBuild(serializedBuild: string | undefined, crafterData: CrafterData) {
  if (!serializedBuild) return undefined;
  const normalizedBuild = deserializeCrafterBuild(serializedBuild, crafterData);
  return serializeCrafterBuild(normalizedBuild, crafterData) || undefined;
}

export function CrafterPageClient({
  items,
  crafterData,
  search,
}: {
  items: Record<string, CrafterBootstrapItem>;
  crafterData: CrafterData;
  search: CrafterSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [resolvedBuild, setResolvedBuild] = React.useState(search.build);
  const latestRouterRef = React.useRef(router);
  const latestSearchRef = React.useRef(search);

  React.useEffect(() => {
    latestRouterRef.current = router;
  }, [router]);

  React.useEffect(() => {
    latestSearchRef.current = search;
  }, [search]);

  const replaceRouteBuild = React.useCallback(
    (build: string | undefined) => {
      latestRouterRef.current.replace(buildHref(pathname, { ...latestSearchRef.current, build }), { scroll: false });
    },
    [pathname],
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedBuild = window.localStorage.getItem(CRAFTER_BUILD_STORAGE_KEY) ?? undefined;
    const nextBuild = search.build || storedBuild || undefined;
    const normalizedBuild = normalizePersistedBuild(nextBuild, crafterData);
    setResolvedBuild(normalizedBuild);

    if (normalizedBuild) {
      window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, normalizedBuild);
    } else {
      window.localStorage.removeItem(CRAFTER_BUILD_STORAGE_KEY);
    }

    if (search.build !== normalizedBuild) {
      React.startTransition(() => {
        replaceRouteBuild(normalizedBuild);
      });
    }
  }, [crafterData, replaceRouteBuild, search.build, search.view]);

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
        replaceRouteBuild(build || undefined);
      });
    },
    [replaceRouteBuild],
  );

  return (
    <DetailDrawerProvider onDetailReferenceChange={() => undefined}>
      <CrafterView
        items={items}
        crafterData={crafterData}
        serializedBuild={resolvedBuild}
        onSerializedBuildChange={handleSerializedBuildChange}
      />
      <UniversalDetailsDrawer />
    </DetailDrawerProvider>
  );
}
