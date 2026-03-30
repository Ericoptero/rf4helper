import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DetailDrawerProvider, useDetailDrawer } from './DetailDrawerContext';
import type { DetailEntityReference } from './detailTypes';

function DrawerHarness({
  detailReference,
  onDetailReferenceChange,
}: {
  detailReference?: DetailEntityReference | null;
  onDetailReferenceChange: (value: DetailEntityReference | null) => void;
}) {
  return (
    <DetailDrawerProvider detailReference={detailReference} onDetailReferenceChange={onDetailReferenceChange}>
      <DrawerButtons />
    </DetailDrawerProvider>
  );
}

function DrawerButtons() {
  const drawer = useDetailDrawer();

  return (
    <div>
      <div data-testid="current">{drawer.current ? `${drawer.current.type}:${drawer.current.id}` : 'none'}</div>
      <div data-testid="back">{drawer.canGoBack ? 'yes' : 'no'}</div>
      <button type="button" onClick={() => drawer.openRoot({ type: 'item', id: 'item-bread' })}>
        Open root
      </button>
      <button type="button" onClick={() => drawer.openLinked({ type: 'item', id: 'item-flour' })}>
        Open linked flour
      </button>
      <button type="button" onClick={() => drawer.openLinked({ type: 'item', id: 'item-toast' })}>
        Open linked toast
      </button>
      <button type="button" onClick={() => drawer.back()}>
        Back
      </button>
    </div>
  );
}

describe('DetailDrawerProvider', () => {
  it('keeps in-drawer navigation history while syncing the visible detail value', async () => {
    const user = userEvent.setup();
    const updates: Array<DetailEntityReference | null> = [];

    render(<DrawerHarness onDetailReferenceChange={(value) => updates.push(value)} />);

    await user.click(screen.getByRole('button', { name: 'Open root' }));
    expect(screen.getByTestId('current')).toHaveTextContent('item:item-bread');
    expect(screen.getByTestId('back')).toHaveTextContent('no');

    await user.click(screen.getByRole('button', { name: 'Open linked flour' }));
    expect(screen.getByTestId('current')).toHaveTextContent('item:item-flour');
    expect(screen.getByTestId('back')).toHaveTextContent('yes');

    await user.click(screen.getByRole('button', { name: 'Open linked toast' }));
    expect(screen.getByTestId('current')).toHaveTextContent('item:item-toast');
    expect(screen.getByTestId('back')).toHaveTextContent('yes');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('current')).toHaveTextContent('item:item-flour');
    expect(screen.getByTestId('back')).toHaveTextContent('yes');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('current')).toHaveTextContent('item:item-bread');
    expect(screen.getByTestId('back')).toHaveTextContent('no');

    expect(updates).toEqual([
      { type: 'item', id: 'item-bread' },
      { type: 'item', id: 'item-flour' },
      { type: 'item', id: 'item-toast' },
      { type: 'item', id: 'item-flour' },
      { type: 'item', id: 'item-bread' },
    ]);
  });

  it('throws when the drawer hook is used outside the provider', () => {
    expect(() => render(<DrawerButtons />)).toThrow('useDetailDrawer must be used within DetailDrawerProvider');
  });
});
