# Rune Factory 4 Helper - Gemini Documentation

## Application Purpose & Domain
The **Rune Factory 4 Helper** is a modern React web application built as an interactive reference compendium for the game Rune Factory 4. It enables users to look up comprehensive statistics, crafting recipes, drops, gifts, and relations for entities spanning Items, Monsters, and Characters. Instead of flipping back and forth between sprawling wiki tables or Google Sheets, the application structures it into a searchable React frontend.

## Codebase Architecture
The app is constructed with the latest modern bleeding-edge tooling and heavily relies on **Test-Driven Development (TDD)**:

- **Framework:** React 19 + Vite (SWC Compilation)
- **Routing:** `@tanstack/react-router` configures powerful file-system-based routing with loaders logic mapped across `src/routes/*`.
- **Styling:** Tailwind CSS (v4 structure built upon `index.css`) & `shadcn/ui` components for rapid design system integrations (`src/components/ui/`).
- **Data Access:** Fetched strictly over `fetch` from local JSON static files (`/public/data/*`) parsed securely using `zod` schema files located at `src/lib/schemas.ts`. Data logic handles states via `@tanstack/react-query` under the `src/hooks/queries.ts` configuration.
- **Testing:** Unit Testing integration handles all components and queries utilizing `Vitest`, `React Testing Library`, and `Mock Service Worker (MSW)`. TDD practices mandate that no component or hook goes live before a valid MSW server renders the appropriate JSON mock test scenarios inside the jsdom environment.

## Folder Directory Mapping
1. `src/hooks/queries.test.tsx` -> Primary file validating data fetching intercepting. Uses a local `setupServer()` mocked network response payload resolving API paths.
2. `src/lib/api.ts` -> Exposes strict fetchers that query `/data/*.json` returning typed generic responses relying on strict runtime Zod parses. 
3. `src/routes/` -> Holds standard page views utilizing TanStack routing definitions.
4. `src/components/{Items|Characters|Monsters}/*` -> Specific list visual representations that combine generic base components and inject their specific TanStack hooks. Data arrays are parsed and rendered onto `Table` structures or grid layouts composed of `Card` submodules.

## Interaction Flow
When a user launches the app:
1. They access a specific page (`/items`). 
2. The UI renders the `ItemsList` component under `src/routes/items.tsx`.
3. The component executes the Custom Query Hook `useItems()` internally wrapping `fetchItems()`.
4. `TanStack Query` evaluates if cache is maintained, then initiates the HTTP request towards `http://localhost:<PORT>/data/items.json`.
5. The `Zod` validation parses the raw payload mapping `z.record(z.string(), ItemSchema)` ensuring zero type deviation.
6. The validated entity returns to the List component triggering a UI render update on the screen replacing the `Loading...` indicator with table rows.

## Future Developments
Continuing with the TDD format, upcoming tasks will include:
1. Creating parametric character profile pages (`/characters/$characterId`).
2. Search and filter utility layers over UI tables modifying TanStack query references or reacting specifically bound state slices on data maps.
3. Expanded recipe synthesis tables and drop percentage mathematical simulations linked via references. Ensure testing environments cover sorting parameters.
