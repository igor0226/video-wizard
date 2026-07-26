# Video Streaming Project: Agent Notes

## Goal
This app allows users to upload their videos, see the list of them, and watch the processed videos with DASH technology.

## Agent prerequisites
- **Hard rule** always run `nvm use` to make sure you are using the required Node JS version.

## Tech Stack
- npm as a package manager (separate installs in `frontend/` and `backend/`)
- **Frontend:** Next.js 14 App Router under `frontend/`
- React 18 + TypeScript
- TanStack Query (client data fetching)
- Vidstack (`@vidstack/react`) + dash.js for DASH playback
- shadcn-style UI primitives (manually wired)
- Biome (lint + format via `cd frontend && npm run lint:fix`)
- **Backend:** Nest.js under `backend/`
- Local disk storage (no DB/S3 yet)
- FFmpeg for DASH generation
- `cron` npm lib for background processing loop (backend only)

## Core Product Flow
1. User uploads a video (`POST` Nest `/api/videos/upload`).
2. Video record is created with `pending` status.
3. Nest worker (every 15s, started on backend boot) picks jobs and runs FFmpeg to create DASH files.
4. Video status transitions: `pending -> processing -> ready|failed`.
5. Client polls list/status on Nest and plays ready videos via Vidstack `MediaPlayer` + dash.js (manifest loaded from Nest).

## Monorepo Layout
- `frontend/` — Next.js UI (own `package.json`)
- `backend/` — Nest.js API + worker (own `package.json`)
- `videos/` — local filesystem storage (repo root)
- Root `package.json` — husky/commitlint only

## Important Runtime Constraints
- FFmpeg **must** exist in system PATH.
- Backend worker starts via Nest `OnModuleInit` in `ProcessingWorkerService`.
- Storage is filesystem-only under repo-root `videos/` (`STORAGE_ROOT` defaults to `../videos` from `backend/` cwd).
- Browser calls Nest directly (`NEXT_PUBLIC_API_URL`, default `http://localhost:3001`); Nest enables CORS for the Next origin (`CORS_ORIGIN`, default `http://localhost:3000`).
- No authentication/authorization layer yet.

## Local Dev (two terminals)
```bash
nvm use
cd backend && npm install && npm run start:dev   # :3001
cd frontend && npm install && npm run dev        # :3000
```

## Storage Layout (local)
- `videos/uploads/<videoId>/<source-file>`
- `videos/dash/<videoId>/manifest.mpd` + segments
- `videos/records/<videoId>.json`
- `videos/locks/<videoId>.lock` (worker concurrency guard)

## Key Backend Files
- `backend/src/storage/*` -> storage + repository abstractions
- `backend/src/processing/*` -> cron worker, jobs, FFmpeg DASH
- `backend/src/dash/*` -> manifest rewrite + segment serving
- `backend/src/videos/*` -> list/upload/status HTTP API
- `backend/src/main.ts` -> CORS, global `api` prefix, port 3001

## Key Frontend Files
- `frontend/app/page.tsx` -> tasks list page
- `frontend/app/tasks/[id]/page.tsx` -> task detail + player
- `frontend/app/tasks/new/page.tsx` -> upload form
- `frontend/app/hooks/useVideoUpload.ts` -> upload flow
- `frontend/app/lib/api.ts` -> `apiUrl()` helper for Nest base URL
- `frontend/app/components/AppPageHeader/` -> page header + breadcrumbs
- `frontend/app/components/TasksTable/` -> tasks table
- `frontend/app/components/TasksToolbar/` -> search/filter toolbar
- `frontend/app/components/TasksTablePagination/` -> pagination controls
- `frontend/app/components/PlayerPanel/` -> Vidstack DASH player wrapper
- `frontend/app/components/ui/` -> shadcn UI primitives
- `frontend/app/lib/format.ts` -> time/byte formatting helpers
- `frontend/app/lib/task-status.tsx` -> task status badge rendering
- `frontend/app/lib/utils.ts` -> `cn()` helper

## Playback Notes
- Ready videos play from Nest `/api/dash/<videoId>/manifest.mpd` (via `apiUrl(...)`).
- `DashService` rewrites served manifests at read time to inject `<BaseURL>/api/dash/<videoId>/segment/</BaseURL>` before each `<SegmentTemplate>`; on-disk FFmpeg output stays relative. Because the MPD is loaded from Nest, relative BaseURL resolves to Nest.
- `PlayerPanel` loads dash.js via static namespace import (`import * as DASH from "dashjs"`) and assigns `provider.library = DASH` in `onProviderChange`.
- Use `key={videoId}` on `MediaPlayer` when switching between task detail pages to avoid stale dash.js state.

## UI / Styling Notes
- Use `frontend/app/components/ui/*` primitives for controls/forms/dialogs/cards/sliders.
- **Hard rule** Prioritize Tailwind theme tokens over hardcoded hex/rgb values for colors and spacing.
- Theme tokens are defined in `:root` and mapped in `frontend/tailwind.config.js` (e.g. `background`, `foreground`, `card`, `border`, `muted-foreground`, `destructive`, `ring`).
- In TSX, use Tailwind utility classes (`bg-card`, `text-muted-foreground`, `gap-2`, `p-4`).
- In component CSS files, use `@apply` with Tailwind utilities, or `hsl(var(--token))` when `@apply` is impractical (e.g. nested pseudo-selectors).
- Use Tailwind spacing/radius scales (`gap-2`, `p-3.5`, `rounded-lg`) instead of raw pixel values.
- Page-level theme overrides (e.g. `.tasksPage`) may redefine CSS variables; child styles should still reference tokens, not hardcoded colors.

## Guardrails for New Features
- Do not break `VideoRecord` schema unless migrations are handled.
- Keep worker idempotent and lock-safe (avoid duplicate processing).
- Return explicit failure reasons for processing errors.
- Preserve DASH manifest/segment URL conventions (`manifest.mpd` route + `/segment/` asset paths).
- Do not reintroduce custom MSE/SourceBuffer playback unless explicitly requested; use Vidstack + dash.js.

## UI constraints
- First look up for ready-to-go `shadcn` components before implementing your own ones
- Place css in related css files, don't use a single file for that

## Coding rules
- Keep files under 300 lines of code. If not possible ask me

## Verification
- **Hard rule** Before committing, make sure to format frontend code with `cd frontend && npm run lint:fix`
- **Hard rule** To make sure your changes are OK, run:
  - `cd frontend && npm run typecheck && npm run lint`
  - `cd backend && npm run typecheck`
