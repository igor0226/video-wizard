# 🚀🎬 Video Streaming (Local DASH Pipeline)

A local video processing and playback app with a **Next.js frontend** and **Nest.js backend**.  
It accepts uploaded videos, transcodes them into DASH format with FFmpeg in a background worker, and plays ready streams in the browser via Vidstack + dash.js.

![Main page screenshot](readme/main.png)
![Task list](readme/task-list.png)

## Purpose

This project provides an end-to-end local streaming workflow:

- upload a source video from the UI
- process it asynchronously into DASH segments + manifest
- track processing status (`pending`, `processing`, `ready`, `failed`)
- play the final stream from Nest-served filesystem-backed endpoints

It is designed for local development and feature iteration (no cloud storage or database yet).

## Tech Stack

- **Frontend:** Next.js 14 (App Router) in `frontend/`
- **Backend:** Nest.js in `backend/`
- **Language:** TypeScript + React 18
- **Data Fetching:** TanStack Query
- **Playback:** Vidstack (`@vidstack/react`) + dash.js
- **UI:** Radix UI primitives + shadcn-style component patterns
- **Lint/Format:** Biome (frontend)
- **Processing:** FFmpeg (DASH generation)
- **Logging (backend):** Pino via `nestjs-pino` (pretty-print in development)
- **Background Scheduling:** `cron` npm package (Nest worker loop)
- **Storage:** Local filesystem under repo-root `videos/`

## Work Schema (Processing Flow)

1. User uploads a video through Nest `POST /api/videos/upload`.
2. A video record is created with `pending` status.
3. Background worker (started when Nest boots) scans for jobs every ~15 seconds.
4. FFmpeg converts input into DASH output (`manifest.mpd` + segments).
5. Status is updated to:
   - `ready` on success
   - `failed` on processing error
6. Client polls Nest list/status APIs and plays ready media through Vidstack on the task detail page.

## Status Lifecycle

`pending -> processing -> ready | failed`

## App Routes (frontend)

- `/` — tasks list
- `/tasks/new` — upload form
- `/tasks/[id]` — task detail + DASH player

## Playback Endpoints (backend)

Ready videos are served from Nest (`http://localhost:3001` by default):

- Manifest: `/api/dash/<videoId>/manifest.mpd`
- Segments: `/api/dash/<videoId>/segment/<asset-path>`

The manifest API rewrites on-disk FFmpeg output at serve time to inject segment `BaseURL`s pointing at the segment route above. The browser loads the manifest from Nest, so relative segment URLs resolve to Nest.

## Local Storage Schema

All runtime assets are stored on disk at the repo root:

- `videos/uploads/<videoId>/<original-file>`
- `videos/dash/<videoId>/manifest.mpd` (+ segment files)
- `videos/records/<videoId>.json`
- `videos/locks/<videoId>.lock`

## Prerequisites

- Node.js v24 (see `.nvmrc`)
- npm
- FFmpeg available in your system `PATH`

Check FFmpeg:

```bash
ffmpeg -version
```

## Required Commands

Use the project Node version:

```bash
nvm use
```

Install and run **backend** (terminal 1):

```bash
cd backend
npm install
npm run start:dev
```

Install and run **frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Optional frontend env (`frontend/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Optional backend env:

```bash
PORT=3001
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
VIDEO_PROCESSOR_CRON="*/15 * * * * *"
STORAGE_ROOT=/absolute/path/to/videos
```

Create production builds:

```bash
cd backend && npm run build && npm run start:prod
cd frontend && npm run build && npm run start
```

Format, typecheck, and lint:

```bash
cd frontend && npm run lint:fix && npm run typecheck && npm run lint
cd backend && npm run typecheck
```

If Next.js build cache gets corrupted with route resolution issues:

```bash
cd frontend && rm -rf .next && npm run build
```

## Notes

- Worker initialization runs on Nest module init (not via Next API routes).
- The app currently has no authentication/authorization layer.
- This is a filesystem-first implementation (no DB/S3 integration yet).
