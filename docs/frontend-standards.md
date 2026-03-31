# Frontend Standards

## Enchanted Codex Contract

- Reuse the shared surfaces from [`src/lib/catalogPresentation.ts`](src/lib/catalogPresentation.ts) before introducing a new panel style.
- `AppShell`, `CatalogPageLayout`, cards, drawers, badges, and tabs are the approved composition primitives.
- New routes should preserve the established visual language: parchment/midnight palette, soft borders, rounded surfaces, and restrained motion.

## Layout and Visual Rules

- Prefer shared surface classes over ad hoc `bg-card/90`, `shadow-sm`, and hover stacks copied inline.
- Every new screen must be checked in desktop and mobile widths.
- Every interactive control must have visible focus, hover, loading, empty, and error states.
- Dark mode is part of the default acceptance criteria, not a follow-up task.

## Vibecoding Guardrails

- Start from an existing route or approved component instead of freehanding a new layout.
- If a new Tailwind combination appears in more than one place, extract it immediately.
- Treat lint, type, and visual regressions as product bugs.
- Use deterministic states when capturing screenshots: fixed theme, animations disabled, stable data.
