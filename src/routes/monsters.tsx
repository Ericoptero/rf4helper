import { createFileRoute } from '@tanstack/react-router';
import { MonstersList } from '@/components/Monsters/MonstersList';

export const Route = createFileRoute('/monsters')({
  component: MonstersRoute,
});

function MonstersRoute() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bestiary</h1>
      <MonstersList />
    </div>
  );
}
