import { createFileRoute } from '@tanstack/react-router';
import { CharactersList } from '@/components/Characters/CharactersList';

export const Route = createFileRoute('/characters')({
  component: CharactersRoute,
});

function CharactersRoute() {
  return <CharactersList />;
}
