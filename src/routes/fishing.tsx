import { createFileRoute } from '@tanstack/react-router';
import { FishingList } from '@/components/Fishing/FishingList';

export const Route = createFileRoute('/fishing')({
  component: FishingRoute,
});

function FishingRoute() {
  return <FishingList />;
}
