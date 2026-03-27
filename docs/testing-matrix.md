# Testing Matrix
Use playwright-cli when testing playwright.

## Required Checks
- `npm run lint`: ESLint, React hooks, React Compiler compatibility, and dead-code hygiene.
- `npm run typecheck`: TypeScript project references with strict unused checks enabled.
- `npm run test:run`: unit and integration coverage through Vitest.
- `npm run test:visual`: Playwright visual regression on golden routes.

## Coverage Expectations
- Pure functions: unit tests for formatting, transformation, normalization, and predicate logic.
- Shared components: RTL tests for accessibility roles, keyboard behavior, state transitions, and empty/loading states.
- Routes: integration smoke coverage for `/`, `/items`, `/characters`, `/monsters`, and `/crafter`.
- Visual integrity: screenshot baselines for desktop and mobile where layout or theme can regress.

## Golden Routes
- `/`
- `/items`
- `/items?detail=item:item-bread`
- `/monsters`
- `/crafter?view=advanced`

## Fast Local Workflow
- Use `npm run check:changed` during active vibecoding.
- Use `npm run check` before merge or when touching shared UI contracts.
- Update visual baselines only after reviewing the rendered diff intentionally.
