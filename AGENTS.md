# Rune Factory 4 Helper - Gemini Documentation

## Application Purpose & Domain
The **Rune Factory 4 Helper** is a modern React web application built as an interactive reference compendium for the game Rune Factory 4. It enables users to look up comprehensive statistics, crafting recipes, drops, gifts, and relations for entities spanning Items, Monsters, and Characters. Instead of flipping back and forth between sprawling wiki tables or Google Sheets, the application structures it into a searchable, gorgeous React frontend themed as an "Enchanted Codex."

## Codebase Architecture
The app is constructed with the latest modern bleeding-edge tooling and heavily relies on **Test-Driven Development (TDD)**:

- **Framework:** React 19 + Vite (SWC Compilation)
- **Routing:** `@tanstack/react-router` configures powerful file-system-based routing with loaders logic mapped across `src/routes/*`.
- **Styling:** Tailwind CSS v4 (`index.css`) with an **"Enchanted Codex" RPG-themed color palette** (warm parchment light / midnight blue + gold dark mode) & `shadcn/ui` components (`src/components/ui/`). Dark mode toggle persisted via `localStorage`.
- **Data Access:** Fetched via `fetch` from local JSON static files (`/public/data/*`) parsed securely using `zod` schemas (`src/lib/schemas.ts`). Data cached via `@tanstack/react-query` with `staleTime: Infinity` and `gcTime: Infinity` (static game data never changes at runtime).
- **Shared Utilities:** Common formatting functions live in `src/lib/formatters.ts` (e.g., `formatName`, `formatNumber`, `capitalize`). Theme management lives in `src/hooks/useTheme.ts`.

### Strict TDD Protocol
**Tests MUST be written BEFORE any implementation.** This project follows a strict Test-Driven Development workflow:
1. **Define Test Cases**: Create `*.test.tsx` file for the new component/feature.
2. **Mock Data & Services**: Set up MSW handlers for any API dependencies.
3. **Verify Failure**: Run tests to confirm they fail as expected.
4. **Implement**: Write only the code necessary to make the tests pass.
5. **Refactor**: Clean up the code while keeping tests green.

- **Testing Tools**: Unit Testing integration handles all components and queries utilizing `Vitest`, `React Testing Library`, and `Mock Service Worker (MSW)`.
- **Constraint**: No component, hook, or utility goes live before its corresponding test suite is passing in the `jsdom` environment.

## Folder Directory Mapping
1. `src/hooks/queries.ts` → TanStack Query hooks for all 12 data types with `staleTime: Infinity`.
2. `src/hooks/useTheme.ts` → Dark mode toggle hook with `localStorage` persistence and system preference detection.
3. `src/lib/api.ts` → Strict fetchers that query `/data/*.json` returning typed responses via Zod.
4. `src/lib/schemas.ts` → Zod schemas for all data types (Items, Monsters, Characters, etc.).
5. `src/lib/formatters.ts` → Shared formatting utilities (`formatName`, `formatNumber`, `capitalize`).
6. `src/routes/__root.tsx` → Root layout with sticky top nav bar (icons, dark mode toggle, glassmorphism).
7. `src/routes/index.tsx` → Dashboard landing page with hero section and category cards showing live counts.
8. `src/routes/` → Page route definitions using TanStack Router file-based routing.
9. `src/components/PageLayout.tsx` → Generic data page layout with skeleton loading, search with icon/clear button, result count indicator, filter/sort selects, card grid with stagger-in animation, and detail sheet with backdrop blur.
10. `src/components/{Items|Characters|Monsters|Calendar|Fishing|Maps|Player}/*` → Domain-specific list/detail components.
11. `src/components/ui/` → Shadcn UI primitives.
12. `src/index.css` → "Enchanted Codex" theme (warm parchment light / midnight blue + gold dark), keyframe animations (card-fade-in, skeleton shimmer, nav-pill-slide).

## Design System — "Enchanted Codex"
| Token | Light | Dark |
|---|---|---|
| Background | Warm parchment | Deep midnight blue |
| Primary | Royal gold | Bright gold |
| Accent | Forest emerald | Glowing emerald |
| Card | Off-white warm tint | Dark slate with gold tint |

### Navigation
- Sticky top bar with glassmorphism (`backdrop-blur-lg`)
- RF4 logo badge + responsive icon links per section
- Animated active link pill indicator
- Dark/light mode toggle (sun/moon icons)

### Animations
- Card fade-in with stagger delay (`animate-card-in`)
- Skeleton shimmer loading states (`skeleton-shimmer`)
- Nav pill slide animation (`animate-nav-pill`)
- Smooth theme color transitions

## Interaction Flow
When a user launches the app:
1. They see the **Dashboard** landing page with hero + category cards showing live data counts.
2. They navigate to a section (e.g. `/items`) via the icon nav bar.
3. The `PageLayout` renders skeleton cards while data loads.
4. The TanStack Query hook executes the fetcher → Zod parses the response → cache stores it with `Infinity` staleTime.
5. Cards animate in with stagger delays. The result count shows "1,083 total".
6. They search/filter/sort, seeing the count update in real-time.
7. Clicking a card opens a detail sheet with backdrop blur.

## Future Developments
Continuing with the TDD format, upcoming tasks will include:
1. List virtualization via `@tanstack/react-virtual` for the Items page (1,600+ cards).
2. Splitting `PlayerView.tsx` (403 lines, 5 data queries) into lazy-loaded sub-components per tab.
3. Splitting `CalendarView.tsx` (361 lines) into sidebar + event detail sub-components.
4. Route-level `loader` functions for data prefetching to eliminate loading flashes.
5. Creating parametric character profile pages (`/characters/$characterId`).

## Helper Script Policy
- Before creating any helper script to manipulate data or gather data, always create it inside a temporary folder such as `/tmp`.
- After the helper script has been used, remove it immediately so it does not remain in the repository or workspace as leftover tooling.
