import { createFileRoute } from '@tanstack/react-router';
import { ItemsList } from '@/components/Items/ItemsList';

export const Route = createFileRoute('/items')({
  component: ItemsRoute,
});

function ItemsRoute() {
  return <ItemsList />;
}
