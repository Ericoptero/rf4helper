import { existsSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { getDataIndex } from './loaders';

describe('data index metadata', () => {
  it('references only data files that exist on disk', async () => {
    const index = await getDataIndex();

    for (const entry of Object.values(index.files)) {
      expect(existsSync(path.resolve(process.cwd(), 'data', entry.path))).toBe(true);
    }
  });
});
