import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CRAFTER_BUILD_STORAGE_KEY, CrafterPageClient } from './CrafterPageClient';
import type { CrafterData, Item } from '@/lib/schemas';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/crafter',
  useRouter: () => ({
    replace,
  }),
}));

vi.mock('@/components/Crafter/CrafterView', () => ({
  CrafterView: ({
    serializedBuild,
    onSerializedBuildChange,
  }: {
    serializedBuild?: string;
    onSerializedBuildChange: (build: string) => void;
  }) => (
    <div>
      <output data-testid="serialized-build">{serializedBuild ?? ''}</output>
      <button type="button" onClick={() => onSerializedBuildChange('next-build')}>
        save build
      </button>
      <button type="button" onClick={() => onSerializedBuildChange('')}>
        clear build
      </button>
    </div>
  ),
}));

const items = {} as Record<string, Item>;
const crafterData = {} as CrafterData;

describe('CrafterPageClient', () => {
  beforeEach(() => {
    replace.mockReset();
    window.localStorage.clear();
  });

  it('restores the crafter build from localStorage when the URL is empty and syncs it back to the route', async () => {
    window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, 'stored-build');

    render(<CrafterPageClient items={items} crafterData={crafterData} search={{}} />);

    await waitFor(() => {
      expect(screen.getByTestId('serialized-build')).toHaveTextContent('stored-build');
    });
    expect(replace).toHaveBeenCalledWith('/crafter?build=stored-build', { scroll: false });
  });

  it('prefers the URL build over localStorage and persists new changes back to both places', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, 'stored-build');

    render(<CrafterPageClient items={items} crafterData={crafterData} search={{ build: 'url-build' }} />);

    expect(screen.getByTestId('serialized-build')).toHaveTextContent('url-build');

    await user.click(screen.getByRole('button', { name: /save build/i }));

    expect(window.localStorage.getItem(CRAFTER_BUILD_STORAGE_KEY)).toBe('next-build');
    expect(replace).toHaveBeenCalledWith('/crafter?build=next-build', { scroll: false });
  });

  it('removes the saved build when the crafter returns to the default empty state', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(CRAFTER_BUILD_STORAGE_KEY, 'stored-build');

    render(<CrafterPageClient items={items} crafterData={crafterData} search={{ build: 'stored-build' }} />);

    await user.click(screen.getByRole('button', { name: /clear build/i }));

    expect(window.localStorage.getItem(CRAFTER_BUILD_STORAGE_KEY)).toBeNull();
    expect(replace).toHaveBeenCalledWith('/crafter', { scroll: false });
  });
});
