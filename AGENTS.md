# Rune Factory 4 Helper - Repository Guide

## Product Purpose
Rune Factory 4 Helper is a production-focused reference application for Rune Factory 4. It organizes static game data such as items, monsters, characters, maps, festivals, crafting, fishing, and player systems into a searchable Next.js experience.

## Canonical Architecture
- Framework: Next.js App Router with React 19 and TypeScript
- Rendering model: server-driven pages in `app/*` backed by server loaders in `src/server/data/*`
- Client model: thin client wrappers own URL synchronization and interactive drawer state only
- Styling: Tailwind CSS and local UI primitives in `src/components/ui/*`
- Data source: static JSON files in `data/*`, loaded server-side and normalized through shared schemas/utilities in `src/lib/*`
- Detail loading: entity drawers resolve payloads through `app/api/details/[type]/[id]`
- Test tooling: Vitest + Testing Library for unit/integration, Playwright for smoke/visual, Vite only as test/build tooling for Vitest

## Current Directory Map
1. `app/*` -> route entrypoints and API routes for the Next App Router
2. `src/server/data/loaders.ts` -> canonical server-side data access for static datasets
3. `src/server/catalogQueries.ts` -> server-side search param parsing, filtering, sorting, and catalog shaping
4. `src/server/details.ts` -> detail payload assembly for drawers
5. `src/components/*PageClient.tsx` -> URL state synchronization for server-rendered pages
6. `src/components/{Items|Characters|Monsters|Fishing|Maps|Calendar|Player|Crafter}/*` -> domain UI
7. `src/components/details/*` -> drawer state, detail payload loading, and detail rendering
8. `src/lib/*` -> shared schemas, formatters, domain helpers, and asset resolution
9. `data/*` -> versioned static game datasets consumed by server loaders
10. `tests/playwright/*` -> smoke and visual end-to-end coverage

## Development Rules
- Treat Next App Router as the only production runtime. Do not reintroduce TanStack Router or client-side catalog fetch fallbacks.
- New catalog and view components must accept server-provided data by props. Avoid optional "fetch internally" branches.
- URL state should be coordinated through shared client hooks instead of ad hoc `router.replace` logic per field.
- Keep detail URLs structured with `detailType` and `detailId`. Legacy `detail=type:id` is read-only compatibility, not the preferred write path.
- Preserve strict TypeScript typing across loaders, page clients, and UI contracts.
- After repository changes, run `npm run ci`.

## Testing Expectations
- Prefer tests that exercise the server-driven production path first.
- High-risk UI modules such as Crafter and detail drawers are part of coverage enforcement and should not be excluded.
- Add focused regression tests when changing URL synchronization, detail loading, or catalog filtering/sorting semantics.

## Helper Script Policy
- Temporary helper scripts must live outside the repository, preferably under `/tmp`.
- Remove temporary scripts after use so the workspace stays clean.
