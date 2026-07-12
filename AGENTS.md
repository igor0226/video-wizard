# Video Streaming Project: Agent Notes

## Goal
This app allows users to upload their videos, see the list of them, and watch the proecessed videos with DASH technology.

## Tech Stack
- npm as a package manager
- Next.js 14 App Router
- React 18 + TypeScript
- TanStack Query (client data fetching)
- shadcn-style UI primitives (manually wired)
- Local disk storage (no DB/S3 yet)
- FFmpeg for DASH generation
- `cron` npm lib for background processing loop

## Core Product Flow
1. User uploads a video (`/api/videos/upload`).
2. Video record is created with `pending` status.
3. In-process worker (every 15s) picks jobs and runs FFmpeg to create DASH files.
4. Video status transitions: `pending -> processing -> ready|failed`.
5. Client polls list/status and plays ready videos via MSE + SourceBuffer.

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
- `app/api/videos/route.ts` -> list videos
- `app/api/videos/upload/route.ts` -> upload endpoint
- `app/api/videos/[id]/status/route.ts` -> status polling
- `app/api/dash/[videoId]/*` -> manifest + segment serving

## Key Frontend Files
- `app/page.tsx` -> composition/orchestration
- `app/hooks/useDashPlayer.ts` -> MSE playback lifecycle
- `app/components/*` -> UI blocks (header/sidebar/player/modal/metadata)
- `app/lib/dash.ts` -> MPD parsing + buffered calculations

## UI / Styling Notes
- Keep custom layout CSS in `app/globals.css`.
- Use `components/ui/*` primitives for controls/forms/dialogs/cards/sliders.
- Theme tokens are defined in `:root`; prefer token-based colors over hardcoded values.

## Guardrails for New Features
- Preserve global timeline behavior (`current/total`) and seamless chunk playback.
- Do not break `VideoRecord` schema unless migrations are handled.
- Keep worker idempotent and lock-safe (avoid duplicate processing).
- Return explicit failure reasons for processing errors.

## UI constraints
- First look up for ready-to-go `shadcn` components before implementing your own ones

## Verification
**Hard rule**  To make sure your changes are OK, run `npm run typecheck && npm run lint`

