import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.next', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      complexity: ['error', 60],
      'no-console': 'error',
    },
  },
  {
    files: [
      'src/components/CatalogPageLayout.tsx',
      'src/components/Crafter/CrafterView.tsx',
      'src/components/Crafter/crafterNodeBehavior.ts',
      'src/lib/crafterCalculation.ts',
    ],
    rules: {
      complexity: 'off',
      'react-hooks/refs': 'off',
    },
  },
  {
    // useReactTable returns functions that React Compiler cannot safely memoize.
    // The "use no memo" directive in the component body handles the Babel build path;
    // this config override suppresses the ESLint lint warning for this file.
    files: ['src/components/CatalogResultsTable.tsx'],
    rules: {
      'react-hooks/incompatible-library': 'off',
    },
  },
])
