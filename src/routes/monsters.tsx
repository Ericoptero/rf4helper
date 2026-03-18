import { createFileRoute } from '@tanstack/react-router';
import { MonstersList } from '@/components/Monsters/MonstersList';

export const Route = createFileRoute('/monsters')({
  component: MonstersRoute,
});

function MonstersRoute() {
  return <MonstersList />;
}
