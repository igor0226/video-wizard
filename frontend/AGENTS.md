# Frontend Agent Notes

Make sure to read the AGENTS.md file in the parent direction.

Run the app with Docker Compose from the repo root (`docker compose up --build`); see the parent [`AGENTS.md`](../AGENTS.md).

## Architecture

Next.js 14 App Router under `app/`:

- `/` — tasks list
- `/tasks/new` — upload form
- `/tasks/[id]` — task detail + player

Client data fetching uses TanStack Query (poll list/status). Nest API base URL comes from `app/lib/api.ts` (`apiUrl()`). Feature UI lives under `app/components/*`; shadcn-style primitives under `app/components/ui/*`.

## Tech stack

- Next.js 14 App Router, React 18, TypeScript
- TanStack Query
- Vidstack (`@vidstack/react`) + dash.js for DASH playback
- shadcn-style UI primitives (manually wired)
- Tailwind CSS + Biome (lint/format)
- Vitest + React Testing Library (unit/component tests)

## Key technical details

### Playback

- Ready videos play from Nest `/api/dash/<videoId>/manifest.mpd` via `apiUrl(...)`.
- `PlayerPanel` loads dash.js with `import * as DASH from "dashjs"` and sets `provider.library = DASH` in `onProviderChange`.
- Use `key={videoId}` on `MediaPlayer` when switching task detail pages to avoid stale dash.js state.
- Do not reintroduce custom MSE/SourceBuffer playback; use Vidstack + dash.js.

### UI / styling

- Prefer ready-made `app/components/ui/*` before building custom controls.
- **Hard rule:** prioritize Tailwind theme tokens over hardcoded hex/rgb for colors and spacing.
- Theme tokens are defined in `:root` and mapped in `tailwind.config.js` (e.g. `background`, `foreground`, `card`, `border`, `muted-foreground`, `destructive`, `ring`).
- In TSX, use utilities (`bg-card`, `text-muted-foreground`, `gap-2`, `p-4`).
- Colocate CSS with components; do not dump styles into a single global file.
- In component CSS, use `@apply` with Tailwind utilities, or `hsl(var(--token))` when `@apply` is impractical.
- Use Tailwind spacing/radius scales instead of raw pixel values.
- Page-level theme overrides may redefine CSS variables; children should still use tokens.

## Testing

Stack: Vitest + React Testing Library + jsdom.

Run from `frontend/`:

- `npm run test` — single CI-style run
- `npm run test:watch` — watch mode during development

Conventions:

- Colocate tests as `*.test.ts` or `*.test.tsx` beside the source file.
- Utility tests: call pure functions directly; cover edge cases and invalid input.
- Component tests: use `render` from `@testing-library/react`, prefer role/text queries, and use `@testing-library/user-event` for clicks/typing.
- Assert behavior and accessibility, not implementation details (avoid testing internal state).
- Stub environment variables with `vi.stubEnv` and call `vi.unstubAllEnvs()` in `afterEach`.
- Mock Next.js modules (e.g. `next/link`) at the top of component test files when needed.

Example utility test: `app/lib/format.test.ts`.
Example component test: `app/components/ui/button.test.tsx`.

## Validation

From `frontend/`:

- **Hard rule:** before commit, `npm run lint:fix`
- **Hard rule:** `npm run typecheck && npm run lint && npm run test`
