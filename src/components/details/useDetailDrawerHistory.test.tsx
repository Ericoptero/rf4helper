import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useDetailDrawerHistory } from './useDetailDrawerHistory';
import type { DetailEntityReference } from './detailTypes';

function HistoryHarness() {
  const history = useDetailDrawerHistory();
  const currentLabel = history.current ? `${history.current.type}:${history.current.id}` : 'none';

  return (
    <div>
      <div data-testid="current-entry">{currentLabel}</div>
      <div data-testid="can-go-back">{history.canGoBack ? 'yes' : 'no'}</div>
      <button
        type="button"
        onClick={() => history.openRoot({ type: 'item', id: 'item-bread' })}
      >
        Open item
      </button>
      <button
        type="button"
        onClick={() =>
          history.openLinked({ type: 'character', id: 'char-forte' } satisfies DetailEntityReference)
        }
      >
        Open linked
      </button>
      <button
        type="button"
        onClick={() => history.syncTo({ type: 'monster', id: 'monster-orc' })}
      >
        Sync to monster
      </button>
      <button type="button" onClick={() => history.syncTo(null)}>
        Sync clear
      </button>
      <button type="button" onClick={() => history.back()}>
        Back
      </button>
      <button type="button" onClick={() => history.close()}>
        Close
      </button>
    </div>
  );
}

describe('useDetailDrawerHistory', () => {
  it('pushes linked entries, supports back, and clears on close', async () => {
    const user = userEvent.setup();

    render(<HistoryHarness />);

    expect(screen.getByTestId('current-entry')).toHaveTextContent('none');
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('no');

    await user.click(screen.getByRole('button', { name: 'Open item' }));
    expect(screen.getByTestId('current-entry')).toHaveTextContent('item:item-bread');
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('no');

    await user.click(screen.getByRole('button', { name: 'Open linked' }));
    expect(screen.getByTestId('current-entry')).toHaveTextContent('character:char-forte');
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('yes');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('current-entry')).toHaveTextContent('item:item-bread');
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('no');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByTestId('current-entry')).toHaveTextContent('none');
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('no');
  });

  it('can open a linked entry from an empty stack and sync external state', async () => {
    const user = userEvent.setup();

    render(<HistoryHarness />);

    await user.click(screen.getByRole('button', { name: 'Open linked' }));
    expect(screen.getByTestId('current-entry')).toHaveTextContent('character:char-forte');
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('no');

    await user.click(screen.getByRole('button', { name: 'Sync to monster' }));
    expect(screen.getByTestId('current-entry')).toHaveTextContent('monster:monster-orc');
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('no');

    await user.click(screen.getByRole('button', { name: 'Sync clear' }));
    expect(screen.getByTestId('current-entry')).toHaveTextContent('none');
  });
});
