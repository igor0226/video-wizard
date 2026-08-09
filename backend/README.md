# Backend

Nest.js API and background worker for the local video streaming app. Handles upload, filesystem-backed video records, FFmpeg DASH processing, and manifest/segment serving.

## Prerequisites

- Node.js v24 (see repo-root `.nvmrc`)
- npm
- FFmpeg available on system `PATH`

Check FFmpeg:

```bash
ffmpeg -version
```

## Startup

From the repository root:

```bash
nvm use
cd backend
npm install
cp .env.example .env   # optional; defaults work for local dev
npm run start:dev
```

API: [http://localhost:3001](http://localhost:3001) (global prefix `/api`)

## Main endpoints

- `POST /api/videos/upload` — upload a source video
- `GET /api/videos` — list videos
- `GET /api/videos/:id` — video status/detail
- `GET /api/dash/:id/manifest.mpd` — DASH manifest (BaseURL rewritten at serve time)
- `GET /api/dash/:id/segment/*` — DASH segments

## Local storage

Assets live under repo-root `videos/` by default:

- `uploads/<videoId>/` — source files
- `dash/<videoId>/` — `manifest.mpd` + segments
- `records/<videoId>.json` — video records
- `locks/<videoId>.lock` — worker concurrency locks

## Notes

- The processing worker starts on Nest boot via `ProcessingWorkerService` (`OnModuleInit`).
- No authentication/authorization layer yet.
- Agent guidance: [`AGENTS.md`](AGENTS.md)
