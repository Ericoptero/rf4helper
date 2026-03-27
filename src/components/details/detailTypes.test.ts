import { describe, expect, it } from 'vitest';

import { decodeDetailEntity, encodeDetailEntity } from './detailTypes';

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
});
