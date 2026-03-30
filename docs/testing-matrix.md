# Testing Matrix
Use playwright-cli when testing playwright.

## Required Checks
- `npm run ci`: canonical validation command that runs lint, typecheck, coverage, smoke E2E, visual regression, and production build.
- `npm run test:coverage`: unit and integration coverage through Vitest with a minimum global threshold of 85% for lines, functions, branches, and statements.
- `npm run test:e2e`: Playwright smoke coverage for App Router routes and key query-param flows.
- `npm run test:visual`: Playwright visual regression on golden routes.

## Coverage Expectations
- Pure functions: unit tests for formatting, transformation, normalization, and predicate logic.
- Shared components: RTL tests for accessibility roles, keyboard behavior, state transitions, and empty/loading states.
- Routes: integration smoke coverage for `/`, `/items`, `/characters`, `/monsters`, `/fishing`, `/maps`, `/calendar`, `/player`, and `/crafter`.
- Visual integrity: screenshot baselines for desktop and mobile where layout or theme can regress.
- Async App Router and highly interactive client islands can be validated by E2E/visual suites even when their internal implementation files are excluded from unit coverage thresholds.

## Golden Routes
- `/`
- `/items`
- `/items?detail=item:item-bread`
- `/characters?detail=character:char-forte`
- `/monsters`
- `/fishing`
- `/maps`
- `/calendar`
- `/player`
- `/crafter?view=advanced`

## Fast Local Workflow
- Use `npm run ci` before merge or after any implementation slice that changes behavior.
- Update visual baselines only after reviewing the rendered diff intentionally.
