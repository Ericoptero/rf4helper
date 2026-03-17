import { createFileRoute } from '@tanstack/react-router';
import { ItemsList } from '@/components/Items/ItemsList';

export const Route = createFileRoute('/items')({
  component: ItemsRoute,
});

function ItemsRoute() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Items Database</h1>
      <ItemsList />
    </div>
  );
}
