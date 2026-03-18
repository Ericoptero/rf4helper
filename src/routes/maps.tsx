import { createFileRoute } from '@tanstack/react-router';
import { MapsList } from '@/components/Maps/MapsList';

export const Route = createFileRoute('/maps')({
  component: MapsRoute,
});

function MapsRoute() {
  return <MapsList />;
}
