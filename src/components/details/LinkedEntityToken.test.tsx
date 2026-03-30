import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DetailDrawerProvider } from './DetailDrawerContext';
import { LinkedEntityToken } from './LinkedEntityToken';

describe('LinkedEntityToken', () => {
  it('renders an item thumbnail when provided and still opens the linked detail', async () => {
    const user = userEvent.setup();
    const onDetailReferenceChange = vi.fn();

    render(
      <DetailDrawerProvider onDetailReferenceChange={onDetailReferenceChange}>
        <LinkedEntityToken
          reference={{ type: 'item', id: 'item-flour' }}
          label="Flour"
          meta="Ingredient"
          imageSrc="/item-flour.png"
        />
      </DetailDrawerProvider>,
    );

    expect(screen.getByRole('img', { name: 'Flour image' })).toHaveAttribute('src', '/item-flour.png');

    await user.click(screen.getByRole('button', { name: /flour/i }));

    expect(onDetailReferenceChange).toHaveBeenCalledWith({ type: 'item', id: 'item-flour' });
  });
});
