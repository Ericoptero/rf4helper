import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { CrafterView } from '@/components/Crafter/CrafterView';
import { useCrafterData, useItems } from '@/hooks/queries';

type CrafterSearch = {
  build?: string;
  view?: 'simple' | 'advanced';
};

const crafterSearchSchema = z.object({
  build: z
    .unknown()
    .optional()
    .transform((value) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }
      if (value && typeof value === 'object') {
        return JSON.stringify(value);
      }
      return undefined;
    })
    .catch(undefined),
  view: z.enum(['simple', 'advanced']).optional().catch(undefined),
});

export const Route = createFileRoute('/crafter')({
  validateSearch: (search: Record<string, unknown>): CrafterSearch => crafterSearchSchema.parse(search),
  component: CrafterRoute,
});

function CrafterRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: items, isLoading: isLoadingItems } = useItems();
  const { data: crafterData, isLoading: isLoadingCrafter } = useCrafterData();

  if (isLoadingItems || isLoadingCrafter || !items || !crafterData) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading crafter data...</div>;
  }

  return (
    <CrafterView
      items={items}
      crafterData={crafterData}
      serializedBuild={search.build}
      viewMode={search.view ?? 'simple'}
      onSerializedBuildChange={(build) => {
        void navigate({
          search: (previous) => ({
            ...previous,
            build,
          }),
          replace: true,
        });
      }}
      onViewModeChange={(view) => {
        void navigate({
          search: (previous) => ({
            ...previous,
            view,
          }),
          replace: true,
        });
      }}
    />
  );
}
