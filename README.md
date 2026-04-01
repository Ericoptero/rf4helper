# RF4 Helper

A helper app for **Rune Factory 4**. Browse and search static game data, items, monsters, characters, maps, festivals, crafting, fishing, crops, and player systems.

**Live**: [GitHub](https://github.com/Ericoptero/rf4helper)

---

## Features

- **Items** — Full item database with stats, recipes, effects, and crafting ingredients
- **Monsters** — Stats, drops, taming info, and resistances
- **Characters** — Profiles, battle info, gift preferences, and schedules
- **Crafter** — Interactive slot-by-slot equipment planner with build serialization
- **Fishing** — Fish catalog with locations, seasons, and shadow sizes
- **Maps** — Region explorer with chest and fishing location data
- **Calendar** — Festival and birthday calendar
- **Player** — Prince/Princess orders and progression tracker

---

## Tech Stack

- [Next.js](https://nextjs.org/) App Router (React 19, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) for testing

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run test:run` | Run unit/integration tests |
| `npm run test:e2e` | Run Playwright smoke tests |
| `npm run ci` | Full CI pipeline (lint + types + tests + build) |

---

## Docker

Build and run with Docker (standalone output):

```bash
docker build -t rf4-helper .
docker run -p 3000:3000 rf4-helper
```

Open [http://localhost:3000](http://localhost:3000).

> The `NEXT_OUTPUT=standalone` env var is set automatically in the Dockerfile. The Vercel deploy uses a standard build (no standalone output needed).

---

## Contributing contributions, bug reports, and feature requests are welcome! Please open an issue or submit a pull request.
