import { describe, expect, it } from 'vitest';

import {
  buildDetailApiPath,
  decodeDetailEntity,
  encodeDetailEntity,
  readDetailSearchParams,
  writeDetailSearchParams,
} from './detailTypes';

describe('detail entity helpers', () => {
  it('encodes detail entity references', () => {
    expect(encodeDetailEntity({ type: 'item', id: 'item-bread' })).toBe('item:item-bread');
  });

  it('decodes valid detail entity references', () => {
    expect(decodeDetailEntity('monster:monster-orc')).toEqual({
      type: 'monster',
      id: 'monster-orc',
    });
  });

  it('returns null for invalid encoded values', () => {
    expect(decodeDetailEntity(null)).toBeNull();
    expect(decodeDetailEntity('')).toBeNull();
    expect(decodeDetailEntity('monster')).toBeNull();
    expect(decodeDetailEntity('unknown:item-bread')).toBeNull();
    expect(decodeDetailEntity('item:')).toBeNull();
  });

  it('reads structured detail search params before the legacy detail value', () => {
    expect(
      readDetailSearchParams({
        detail: 'item:item-bread',
        detailType: 'monster',
        detailId: 'monster-orc',
      }),
    ).toEqual({
      type: 'monster',
      id: 'monster-orc',
    });
  });

  it('falls back to the legacy detail param for backward compatibility', () => {
    expect(
      readDetailSearchParams({
        detail: 'item:item-bread',
      }),
    ).toEqual({
      type: 'item',
      id: 'item-bread',
    });
  });

  it('writes structured detail search params for new URLs', () => {
    expect(writeDetailSearchParams({ type: 'fish', id: 'fish-lamp-squid' })).toEqual({
      detail: undefined,
      detailType: 'fish',
      detailId: 'fish-lamp-squid',
    });
    expect(writeDetailSearchParams(null)).toEqual({
      detail: undefined,
      detailType: undefined,
      detailId: undefined,
    });
  });

  it('encodes detail api paths safely', () => {
    expect(buildDetailApiPath({ type: 'item', id: 'item:bread/1' })).toBe('/api/details/item/item%3Abread%2F1');
  });
});
