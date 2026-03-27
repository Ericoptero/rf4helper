import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('allows wrapping content without fixed height or nowrap classes', () => {
    render(<Badge>Very long badge content</Badge>);

    const badge = screen.getByText('Very long badge content');

    expect(badge).not.toHaveClass('h-5');
    expect(badge).not.toHaveClass('whitespace-nowrap');
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('w-fit');
  });
});
