import { describe, expect, it } from 'vitest';

import { readJsonDataFile } from './files';

describe('readJsonDataFile', () => {
  it('rejects unsupported runtime file names', async () => {
    await expect(readJsonDataFile('../items.json')).rejects.toThrow('Unsupported data file');
  });
});
