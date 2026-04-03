import { readFileSync } from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DetailDrawerProvider } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import { buildCrafterData } from '@/lib/crafterData';
import { CrafterConfigSchema, type Item } from '@/lib/schemas';
import { CrafterView } from './CrafterView';

const dataDir = path.resolve(process.cwd(), 'data');
const items = JSON.parse(readFileSync(path.join(dataDir, 'items.json'), 'utf8')) as Record<string, Item>;
const crafterConfig = CrafterConfigSchema.parse(JSON.parse(readFileSync(path.join(dataDir, 'crafter.json'), 'utf8')));
const crafterData = buildCrafterData(items, crafterConfig);

describe('CrafterView real data', () => {
  it('switches from dashboard to the weapon editor with production data', async () => {
    const user = userEvent.setup();

    render(
      <DetailDrawerProvider onDetailReferenceChange={() => undefined}>
        <CrafterView
          items={items}
          crafterData={crafterData}
          onSerializedBuildChange={() => {}}
        />
        <UniversalDetailsDrawer />
      </DetailDrawerProvider>,
    );

    await user.click(screen.getByRole('tab', { name: /weapon/i }));

    expect(screen.getByRole('button', { name: /^base$/i })).toBeInTheDocument();
    expect(screen.getByText(/^Recipe Slots$/i)).toBeInTheDocument();
  });
});
