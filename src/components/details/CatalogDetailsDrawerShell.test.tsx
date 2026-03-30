import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DetailDrawerProvider, useDetailDrawer } from './DetailDrawerContext';
import { CatalogDetailsDrawerShell } from './CatalogDetailsDrawerShell';
import type { DetailEntityReference } from './detailTypes';

function ShellInner({ autoOpenLinked = false }: { autoOpenLinked?: boolean }) {
  const drawer = useDetailDrawer();
  const hasOpenedLinkedRef = React.useRef(false);
  const resolved = drawer.current
    ? {
        title: `${drawer.current.type}:${drawer.current.id}`,
        content: <div>Detail body</div>,
      }
    : null;

  React.useEffect(() => {
    if (!autoOpenLinked || hasOpenedLinkedRef.current || drawer.current?.id !== 'item-bread') {
      return;
    }

    hasOpenedLinkedRef.current = true;
    drawer.openLinked({ type: 'item', id: 'item-flour' });
  }, [autoOpenLinked, drawer, drawer.current?.id]);

  return (
    <>
      <CatalogDetailsDrawerShell resolved={resolved} />
    </>
  );
}

function renderShell(
  initialReference: DetailEntityReference | null,
  onChange = vi.fn(),
  options?: { autoOpenLinked?: boolean },
) {
  function ControlledShellHarness() {
    const [detailReference, setDetailReference] = React.useState<DetailEntityReference | null>(initialReference);

    const handleChange = React.useCallback(
      (nextReference: DetailEntityReference | null) => {
        setDetailReference(nextReference);
        onChange(nextReference);
      },
      [],
    );

    return (
      <DetailDrawerProvider
        detailReference={detailReference}
        onDetailReferenceChange={handleChange}
      >
        <ShellInner autoOpenLinked={options?.autoOpenLinked} />
      </DetailDrawerProvider>
    );
  }

  return render(
    <ControlledShellHarness />,
  );
}

describe('CatalogDetailsDrawerShell', () => {
  it('stays closed when there is no resolved content', () => {
    renderShell(null);

    expect(screen.queryByText('Detail body')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('renders the active detail and closes through drawer state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderShell({ type: 'item', id: 'item-bread' }, onChange);

    expect(screen.getByText('Detail body')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('shows a back button when linked history exists', async () => {
    const user = userEvent.setup();

    renderShell({ type: 'item', id: 'item-bread' }, vi.fn(), { autoOpenLinked: true });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });
});
