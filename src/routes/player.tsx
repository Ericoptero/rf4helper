import { createFileRoute } from '@tanstack/react-router';
import { PlayerView } from '@/components/Player/PlayerView';

export const Route = createFileRoute('/player')({
  component: PlayerRoute,
});

function PlayerRoute() {
  return <PlayerView />;
}
