'use client';

import { usePathname, useRouter } from 'next/navigation';

import { CrafterView } from '@/components/Crafter/CrafterView';
import type { CrafterSearchParams } from '@/server/catalogQueries';
import type { CrafterData, Item } from '@/lib/schemas';

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

  return (
    <CrafterView
      items={items}
      crafterData={crafterData}
      serializedBuild={search.build}
      onSerializedBuildChange={(build) =>
        router.replace(buildHref(pathname, { ...search, build }), { scroll: false })
      }
    />
  );
}
