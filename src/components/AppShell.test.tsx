import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from './AppShell';

const mockUsePathname = vi.fn();
const mockUseTheme = vi.fn();

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('AppShell', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/items');
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: vi.fn(),
      isHydrated: true,
    });
  });

  it('renders a generic theme toggle label until hydration finishes', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: vi.fn(),
      isHydrated: false,
    });

    render(
      <AppShell>
        <div>Catalog content</div>
      </AppShell>,
    );

    expect(screen.getAllByRole('button', { name: /toggle color theme/i })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /switch to light mode/i })).not.toBeInTheDocument();
  });

  it('renders the resolved theme action after hydration', () => {
    render(
      <AppShell>
        <div>Catalog content</div>
      </AppShell>,
    );

    expect(screen.getAllByRole('button', { name: /switch to light mode/i })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /items/i })).toHaveAttribute('data-status', 'active');
  });

  it('renders the branded Barrett logo in the shell header', () => {
    render(
      <AppShell>
        <div>Catalog content</div>
      </AppShell>,
    );

    const logos = screen.getAllByAltText('Barrett logo');

    expect(logos).toHaveLength(2);
    for (const logo of logos) {
      expect(logo).toHaveAttribute('src', '/brand/barrett-logo.png');
    }

    expect(screen.queryAllByText('Rune Factory 4')).toHaveLength(0);
  });
});
