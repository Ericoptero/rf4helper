import { PlayerView } from '@/components/Player/PlayerView';
import {
  getOrdersData,
  getRequestsData,
  getRuneAbilitiesData,
  getSkillsData,
  getTrophiesData,
} from '@/server/data/loaders';

export default async function PlayerPage() {
  const [orders, requestsData, runeAbilitiesData, skills, trophiesData] = await Promise.all([
    getOrdersData(),
    getRequestsData(),
    getRuneAbilitiesData(),
    getSkillsData(),
    getTrophiesData(),
  ]);

  return (
    <PlayerView
      orders={orders}
      requestsData={requestsData}
      runeAbilitiesData={runeAbilitiesData}
      skills={skills}
      trophiesData={trophiesData}
    />
  );
}
