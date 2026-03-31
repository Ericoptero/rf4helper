import React from 'react';

import { CatalogDetailsDrawerShell } from './CatalogDetailsDrawerShell';
import { useDetailDrawer } from './DetailDrawerContext';
import { useDetailPayload } from './useDetailPayload';
import { BirthdayDetailsContent } from './content/BirthdayDetailsContent';
import { CharacterDetailsContent } from './content/CharacterDetailsContent';
import { CropDetailsContent } from './content/CropDetailsContent';
import { FestivalDetailsContent } from './content/FestivalDetailsContent';
import { FishDetailsContent } from './content/FishDetailsContent';
import { ItemDetailsContent } from './content/ItemDetailsContent';
import { MapDetailsContent } from './content/MapDetailsContent';
import { MonsterDetailsContent } from './content/MonsterDetailsContent';

export function UniversalDetailsDrawer() {
  const { current } = useDetailDrawer();
  const { payload, status } = useDetailPayload(current);

  const resolved = React.useMemo(() => {
    if (!current) {
      return null;
    }

    if (status === 'loading') {
      return {
        title: 'Loading details',
        content: (
          <div className="rounded-2xl border border-dashed px-6 py-20 text-center text-muted-foreground">
            Loading entry details...
          </div>
        ),
      };
    }

    if (status === 'error' || !payload) {
      return {
        title: 'Details unavailable',
        content: (
          <div className="rounded-2xl border border-dashed px-6 py-20 text-center text-muted-foreground">
            We could not load this entry right now.
          </div>
        ),
      };
    }

    switch (payload.type) {
      case 'item':
        return { title: payload.item.name, content: <ItemDetailsContent item={payload.item} items={payload.items} /> };
      case 'character':
        return { title: payload.character.name, content: <CharacterDetailsContent character={payload.character} items={payload.items} /> };
      case 'birthday':
        return { title: `${payload.character.name}'s Birthday`, content: <BirthdayDetailsContent character={payload.character} /> };
      case 'monster':
        return { title: payload.group.displayName, content: <MonsterDetailsContent group={payload.group} items={payload.items} /> };
      case 'fish':
        return { title: payload.fish.name, content: <FishDetailsContent fish={payload.fish} /> };
      case 'map':
        return { title: payload.region.name, content: <MapDetailsContent region={payload.region} /> };
      case 'festival':
        return { title: payload.festival.name, content: <FestivalDetailsContent festival={payload.festival} /> };
      case 'crop':
        return { title: payload.crop.name, content: <CropDetailsContent crop={payload.crop} /> };
      default:
        return null;
    }
  }, [current, payload, status]);

  return <CatalogDetailsDrawerShell resolved={resolved} />;
}
