import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    setupFiles: './src/setupTests.ts',
    globals: true,
    exclude: ['tests/playwright/**', 'node_modules/**', 'dist/**'],
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'tests/playwright/**',
        'node_modules/**',
        'dist/**',
        'src/components/Crafter/CrafterView.tsx',
        'src/components/details/UniversalDetailsDrawer.tsx',
        'src/components/details/CatalogDetailsDrawerShell.tsx',
        'src/components/details/DetailDrawerContext.tsx',
        'src/components/details/useDetailDrawerHistory.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});
