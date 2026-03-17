import { createFileRoute } from '@tanstack/react-router';
import { CharactersList } from '@/components/Characters/CharactersList';

export const Route = createFileRoute('/characters')({
  component: CharactersRoute,
});

function CharactersRoute() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Characters Directory</h1>
      <CharactersList />
    </div>
  );
}
