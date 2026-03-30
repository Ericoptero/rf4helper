import { describe, expect, it } from 'vitest';

import { getDetailPayload } from './details';

describe('detail payloads', () => {
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
    expect(payload && 'items' in payload).toBe(false);
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
});
