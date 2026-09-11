# Frontend Agent Notes

Next.js frontend for the **Language Learning Platform**. Today's routes implement the **Listening** skill (task list, upload form, DASH playback). The target information architecture adds Dashboard, Speaking, Writing, and Reading surfaces.

Make sure to read the AGENTS.md file in the parent direction.

Run the app with Docker Compose from the repo root (`docker compose up --build`); see the parent [`AGENTS.md`](../AGENTS.md).

## Architecture

**Target platform routes** (planned IA):

- `/dashboard` — progress overview, activity heatmap, recent activity
- `/listening` — video library with filters and search
- `/listening/upload` — standalone full-page upload form
- `/listening/:videoId` — video detail + DASH player
- `/speaking` — AI teacher session launcher and call history
- `/speaking/call/:callId` — live speaking call with captions and vocabulary sheet
- `/writing` — writing workspace (coming soon)
- `/reading` — reading practice (planned)

**Current routes** (implemented today):

- `/` — redirect to `/dashboard`
- `/dashboard` — progress overview
- `/listening` — video library
- `/listening/upload` — upload form
- `/listening/[id]` — task detail + player
- `/speaking` — call launcher + history
- `/speaking/call/[callId]` — live AI teacher call (LiveKit)
- `/writing` — coming soon

The UI is organized with Feature-Sliced Design under `src/`:

- `src/app` — Next.js App Router (thin `page.tsx` re-exports) plus providers, layout, global styles
- `src/pages` — page compositions (not the Next Pages Router)
- `src/widgets` — composite UI blocks
- `src/features` — user interactions
- `src/entities` — business models and entity UI
- `src/shared` — UI kit, lib, API helpers, config

Import only downward (pages → widgets → features → entities → shared). Each slice exposes a public `index.ts` with named exports (no `export *`). Import shadcn primitives as `@/shared/ui/button`.

A root `pages/README.md` exists so Next.js does not treat `src/pages` as the Pages Router.

Client data fetching uses TanStack Query (poll list/status). Nest API base URL comes from `src/shared/api` (`apiUrl()`).

## Tech stack

- Next.js 14 App Router, React 18, TypeScript
- TanStack Query
- Vidstack (`@vidstack/react`) + dash.js for DASH playback
- shadcn-style UI primitives (manually wired)
- Tailwind CSS + Biome (lint/format)
- Vitest + React Testing Library (unit/component tests)

## Key technical details

### Speaking (LiveKit)

- Start a call from `/speaking`; the call page `POST`s Nest `/api/speaking/calls` with a stable anonymous `userId` from `localStorage` (`getAnonymousUserId()`), `sourceLanguage`/`explanationLanguage` `"English"`, and `languageLevel` parsed from the topic (first CEFR token).
- The response `{ callId, token, livekitUrl }` is used with `livekit-client` `Room.connect`. The browser publishes the microphone and plays the agent's remote audio track.
- Compose LiveKit must be **v1.9.11+** (repo uses `livekit/livekit-server:v1.13.6`). `livekit-client` 2.17+ connects via `/rtc/v1`; older servers only expose `/rtc` and the browser shows `404 /rtc/v1/validate`.
- End call `POST`s `/api/speaking/calls/:id/end` then returns to `/speaking`.
- Teacher facial emotions arrive on the LiveKit data topic `teacher-emotion` (`{ emotion, intensity?, source }`). v1 logs them to the console; do not render teacher SVG emotions yet.
- Transcript and vocabulary panels still use fixtures.

### Playback

- Ready videos play from Nest `/api/dash/<videoId>/manifest.mpd` via `apiUrl(...)`.
- `PlayerPanel` loads dash.js with `import * as DASH from "dashjs"` and sets `provider.library = DASH` in `onProviderChange`.
- Use `key={videoId}` on `MediaPlayer` when switching task detail pages to avoid stale dash.js state.
- Do not reintroduce custom MSE/SourceBuffer playback; use Vidstack + dash.js.

### UI / styling

- Prefer ready-made `src/shared/ui/*` before building custom controls.
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

Example utility test: `src/shared/lib/format.test.ts`.
Example component test: `src/shared/ui/button.test.tsx`.

## Validation

From `frontend/`:

- **Hard rule:** before commit, `npm run lint:fix`
- **Hard rule:** `npm run typecheck && npm run lint && npm run test`
