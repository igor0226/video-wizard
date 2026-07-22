# Video Streaming Project: Agent Notes

## Goal
This app allows users to upload their videos, see the list of them, and watch the processed videos with DASH technology.

## Agent prerequisites
- **Hard rule** always run `nvm use` to make sure you are using the required Node JS version.

## Tech Stack
- npm as a package manager
- Next.js 14 App Router
- React 18 + TypeScript
- TanStack Query (client data fetching)
- Vidstack (`@vidstack/react`) + dash.js for DASH playback
- shadcn-style UI primitives (manually wired)
- Biome (lint + format via `npm run lint:fix`)
- Local disk storage (no DB/S3 yet)
- FFmpeg for DASH generation
- `cron` npm lib for background processing loop

## Core Product Flow
1. User uploads a video (`/api/videos/upload`).
2. Video record is created with `pending` status.
3. In-process worker (every 15s) picks jobs and runs FFmpeg to create DASH files.
4. Video status transitions: `pending -> processing -> ready|failed`.
5. Client polls list/status and plays ready videos via Vidstack `MediaPlayer` + dash.js.

## Important Runtime Constraints
- FFmpeg **must** exist in system PATH.
- Worker startup is triggered by importing `lib/server/init` (currently in list/upload routes).
- Storage is filesystem-only under `videos/`.
- No authentication/authorization layer yet.

## Storage Layout (local)
- `videos/uploads/<videoId>/<source-file>`
- `videos/dash/<videoId>/manifest.mpd` + segments
- `videos/records/<videoId>.json`
- `videos/locks/<videoId>.lock` (worker concurrency guard)

## Key Backend Files
- `lib/storage/*` -> storage + repository abstractions
- `lib/processing/worker.ts` -> cron scheduler
- `lib/processing/jobs.ts` -> job pick/resume + status transitions
- `lib/processing/ffmpeg-dash.ts` -> FFmpeg command execution
- `lib/dash.ts` -> manifest read/rewrite + segment path resolution
- `lib/videos.ts` -> video list/status helpers for API routes
- `app/api/videos/route.ts` -> list videos
- `app/api/videos/upload/route.ts` -> upload endpoint
- `app/api/videos/[id]/status/route.ts` -> status polling
- `app/api/dash/[videoId]/manifest.mpd/route.ts` -> DASH manifest serving
- `app/api/dash/[videoId]/segment/[...assetPath]/route.ts` -> DASH segment serving

## Key Frontend Files
- `app/page.tsx` -> tasks list page
- `app/tasks/[id]/page.tsx` -> task detail + player
- `app/tasks/new/page.tsx` -> upload form
- `app/hooks/useVideoUpload.ts` -> upload flow
- `app/components/AppPageHeader/` -> page header + breadcrumbs
- `app/components/TasksTable/` -> tasks table
- `app/components/TasksToolbar/` -> search/filter toolbar
- `app/components/TasksTablePagination/` -> pagination controls
- `app/components/PlayerPanel/` -> Vidstack DASH player wrapper
- `app/lib/format.ts` -> time/byte formatting helpers
- `app/lib/task-status.tsx` -> task status badge rendering

## Playback Notes
- Ready videos play from `/api/dash/<videoId>/manifest.mpd`.
- `lib/dash.ts` rewrites served manifests at read time to inject `<BaseURL>/api/dash/<videoId>/segment/</BaseURL>` before each `<SegmentTemplate>`; on-disk FFmpeg output stays relative.
- `PlayerPanel` loads dash.js via static namespace import (`import * as DASH from "dashjs"`) and assigns `provider.library = DASH` in `onProviderChange`.
- Use `key={videoId}` on `MediaPlayer` when switching between task detail pages to avoid stale dash.js state.

## UI / Styling Notes
- Use `components/ui/*` primitives for controls/forms/dialogs/cards/sliders.
- **Hard rule** Prioritize Tailwind theme tokens over hardcoded hex/rgb values for colors and spacing.
- Theme tokens are defined in `:root` and mapped in `tailwind.config.js` (e.g. `background`, `foreground`, `card`, `border`, `muted-foreground`, `destructive`, `ring`).
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

## Verification
- **Hard rule** Before committing, make sure to format your code with `npm run lint:fix`
- **Hard rule** To make sure your changes are OK, run `npm run typecheck && npm run lint`
