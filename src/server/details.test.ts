import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as mapFishingRelations from '@/lib/mapFishingRelations';
import * as monsterGroups from '@/lib/monsterGroups';

import { resetServerDataCachesForTests } from './data/loaders';
import { getDetailPayload } from './details';

describe('detail payloads', () => {
  beforeEach(() => {
    resetServerDataCachesForTests();
  });

  it('builds an item detail payload with linked items data available', async () => {
    const payload = await getDetailPayload({ type: 'item', id: 'item-iron' });

    expect(payload?.type).toBe('item');
    expect(payload && 'item' in payload ? payload.item.name : null).toBe('Iron');
    expect(payload && 'items' in payload ? payload.items['item-steel-edge']?.name : null).toBe('Steel Edge');
    expect(payload && 'items' in payload ? payload.items['item-apple'] : undefined).toBeUndefined();
  });

  it('builds an item detail payload from craftedFrom recipes without the full catalog', async () => {
    const payload = await getDetailPayload({ type: 'item', id: 'item-steel-sword-plus' });

    expect(payload?.type).toBe('item');
    expect(payload && 'items' in payload ? payload.items['item-steel-sword']?.name : null).toBe('Steel Sword');
    expect(payload && 'items' in payload ? payload.items['item-apple'] : undefined).toBeUndefined();
  });

  it('builds a monster detail payload with the grouped monster record', async () => {
    const payload = await getDetailPayload({ type: 'monster', id: 'monster-orc' });

    expect(payload?.type).toBe('monster');
    expect(payload && 'group' in payload ? payload.group.displayName : null).toBe('Orc');
  });

  it('builds a monster detail payload when using the monster group key', async () => {
    const payload = await getDetailPayload({ type: 'monster', id: 'Orc' });

    expect(payload?.type).toBe('monster');
    expect(payload && 'group' in payload ? payload.group.representative.id : null).toBe('monster-orc');
  });

  it('builds a character detail payload', async () => {
    const payload = await getDetailPayload({ type: 'character', id: 'char-amber' });

    expect(payload?.type).toBe('character');
    expect(payload && 'character' in payload ? payload.character.name : null).toBe('Amber');
    expect(payload && 'items' in payload ? payload.items['item-emery-flower']?.name : null).toBe('Emery Flower');
    expect(payload && 'items' in payload ? payload.items['item-iron'] : undefined).toBeUndefined();
  });

  it('builds a birthday detail payload', async () => {
    const payload = await getDetailPayload({ type: 'birthday', id: 'char-amber' });

    expect(payload?.type).toBe('birthday');
    expect(payload && 'character' in payload ? payload.character.birthday?.season : null).toBe('Spring');
    expect(payload && 'items' in payload ? payload.items['item-emery-flower']?.name : null).toBe('Emery Flower');
  });

  it('builds a monster detail payload with only linked item references', async () => {
    const payload = await getDetailPayload({ type: 'monster', id: 'monster-orc' });

    expect(payload?.type).toBe('monster');
    expect(payload && 'items' in payload ? payload.items['item-cheap-bracelet']?.name : null).toBe('Cheap Bracelet');
    expect(payload && 'items' in payload ? payload.items['item-turnip'] : undefined).toBeUndefined();
  });

  it('builds a fish detail payload', async () => {
    const payload = await getDetailPayload({ type: 'fish', id: 'fish-squid' });

    expect(payload?.type).toBe('fish');
    expect(payload && 'fish' in payload ? payload.fish.name : null).toBe('Squid');
  });

  it('builds a map detail payload', async () => {
    const payload = await getDetailPayload({ type: 'map', id: 'Selphia Plains' });

    expect(payload?.type).toBe('map');
    expect(payload && 'region' in payload ? payload.region.name : null).toBe('Selphia Plains');
    expect(payload && 'items' in payload).toBe(true);
  });

  it('builds a festival detail payload', async () => {
    const payload = await getDetailPayload({ type: 'festival', id: 'festival-cooking-contest' });

    expect(payload?.type).toBe('festival');
    expect(payload && 'festival' in payload ? payload.festival.name : null).toBe('Cooking Contest');
  });

  it('builds a crop detail payload', async () => {
    const payload = await getDetailPayload({ type: 'crop', id: 'crop-turnip' });

    expect(payload?.type).toBe('crop');
    expect(payload && 'crop' in payload ? payload.crop.name : null).toBe('Turnip');
  });

  it('builds item drop sources and crop relations', async () => {
    const [dropPayload, cropPayload] = await Promise.all([
      getDetailPayload({ type: 'item', id: 'item-ammonite' }),
      getDetailPayload({ type: 'item', id: 'item-yam-seeds' }),
    ]);

    expect(dropPayload?.type).toBe('item');
    expect(dropPayload && 'dropSources' in dropPayload ? dropPayload.dropSources.some((source) => source.referenceId === 'Octopirate 2') : false).toBe(true);
    expect(dropPayload && 'monsterReferenceId' in dropPayload ? dropPayload.monsterReferenceId : null).toBe('Octopirate 2');

    expect(cropPayload?.type).toBe('item');
    expect(cropPayload && 'cropRelations' in cropPayload ? cropPayload.cropRelations.some((relation) => relation.crop.id === 'crop-yam') : false).toBe(true);
    expect(cropPayload && 'cropRelations' in cropPayload ? cropPayload.cropRelations.some((relation) => relation.counterpartItemId === 'item-yam') : false).toBe(true);
  });

  it('resolves non-regular crops by id', async () => {
    const payload = await getDetailPayload({ type: 'crop', id: 'crop-apple-tree-seed' });

    expect(payload?.type).toBe('crop');
    expect(payload && 'crop' in payload ? payload.crop.name : null).toBe('Apple Tree Seed');
  });

  it('returns null for unknown ids', async () => {
    const payload = await getDetailPayload({ type: 'item', id: 'missing-item' });

    expect(payload).toBeNull();
  });

  it('returns null for unknown characters', async () => {
    const payload = await getDetailPayload({ type: 'character', id: 'missing-character' });

    expect(payload).toBeNull();
  });

  it('returns null for unsupported detail types at the server boundary', async () => {
    const payload = await getDetailPayload({ type: 'unknown' as never, id: 'mystery' });

    expect(payload).toBeNull();
  });

  it('reuses cached monster groups across repeated monster detail requests', async () => {
    const buildGroupsSpy = vi.spyOn(monsterGroups, 'buildMonsterGroups');

    await getDetailPayload({ type: 'monster', id: 'monster-orc' });
    await getDetailPayload({ type: 'monster', id: 'monster-orc' });

    expect(buildGroupsSpy).toHaveBeenCalledTimes(1);
  });

  it('reuses cached map regions across repeated map detail requests', async () => {
    const buildRegionsSpy = vi.spyOn(mapFishingRelations, 'buildMapRegions');

    await getDetailPayload({ type: 'map', id: 'Selphia Plains' });
    await getDetailPayload({ type: 'map', id: 'Selphia Plains' });

    expect(buildRegionsSpy).toHaveBeenCalledTimes(1);
  });
});
