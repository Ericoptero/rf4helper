import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';

// Setup MSW (handlers will be added per-test or globally later)
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());

// Polyfills for missing jsdom features required by Radix UI
if (typeof window !== 'undefined') {
  window.PointerEvent = window.PointerEvent || class PointerEvent extends Event {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  } as any;
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia for useTheme hook
  window.matchMedia = window.matchMedia || function(query: string) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  };
}
