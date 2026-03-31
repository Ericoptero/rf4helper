import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RootLayout from './layout';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers([['x-nonce', 'test-nonce']])),
}));

describe('RootLayout', () => {
  it('applies the request nonce to the theme bootstrap script', async () => {
    const ui = await RootLayout({
      children: <div>Children</div>,
    });

    render(ui);

    const script = document.querySelector('script#theme-bootstrap');

    expect(script).toHaveAttribute('nonce', 'test-nonce');
    expect(script?.textContent).toContain("localStorage.getItem('rf4-theme')");
  });
});
