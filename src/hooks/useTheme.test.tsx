import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTheme } from './useTheme';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  it('hydrates from localStorage and syncs the html theme state', async () => {
    localStorage.setItem('rf4-theme', 'light');
    mockMatchMedia(true);

    const { result } = renderHook(() => useTheme());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('rf4-theme')).toBe('light');
  });

  it('falls back to the system preference when no stored theme exists', async () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useTheme());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('rf4-theme')).toBe('dark');
  });

  it('toggles the theme and persists the new value', async () => {
    localStorage.setItem('rf4-theme', 'light');
    mockMatchMedia(false);

    const { result } = renderHook(() => useTheme());

    await waitFor(() => expect(result.current.theme).toBe('light'));

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('rf4-theme')).toBe('dark');
  });
});
