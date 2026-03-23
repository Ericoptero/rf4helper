import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

type MatchMediaListener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<MatchMediaListener>();

  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string): MediaQueryList => {
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: (_type: 'change', listener: MatchMediaListener) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: 'change', listener: MatchMediaListener) => {
          listeners.delete(listener);
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    }),
  );

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
}

describe('useMediaQuery', () => {
  it('reads the initial match value and reacts to media query updates', () => {
    const controller = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(result.current).toBe(false);

    act(() => {
      controller.setMatches(true);
    });

    expect(result.current).toBe(true);
  });
});
