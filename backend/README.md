# Backend

Nest.js API and background worker for the local video streaming app. Handles upload, filesystem-backed video records, FFmpeg DASH processing, and manifest/segment serving.

## Prerequisites

Preferred: Docker Compose from the repo root (see [`../README.md`](../README.md)). The backend image includes FFmpeg.

Without Docker: Node.js v24 (see repo-root `.nvmrc`), npm, and FFmpeg on system `PATH`.

## Startup

From the repository root:

```bash
cp backend/.env.example backend/.env   # then set OPENAI_API_KEY
npm run dev
```

API: [http://localhost:3001](http://localhost:3001) (global prefix `/api`)

Without Docker:

```bash
nvm use
cd backend
npm install
cp .env.example .env   # then set OPENAI_API_KEY
npm run start:dev
```

## Main endpoints

- `POST /api/videos/upload` — upload a source video (requires `title`, `file`, `sourceLanguage`, `explanationLanguage`, `languageLevel`)
- `GET /api/videos` — list videos
- `GET /api/videos/:id` — video status/detail
- `GET /api/dash/:id/manifest.mpd` — DASH manifest (BaseURL rewritten at serve time)
- `GET /api/dash/:id/segment/*` — DASH segments

## Local storage

Assets live under repo-root `videos/` by default (Compose mounts this at `/videos` via `STORAGE_ROOT`):

- `uploads/<videoId>/` — source files
- `dash/<videoId>/` — `manifest.mpd` + segments
- `audio/<videoId>/` — extracted MP3 for transcription
- `transcripts/<videoId>/` — Whisper transcript JSON
- `explanations/<videoId>/` — detected phrases JSON (`phrases.json`)
- `records/<videoId>.json` — video records
- `locks/<videoId>.lock` — worker concurrency locks

## Notes

- The processing worker starts on Nest boot via `ProcessingWorkerService` (`OnModuleInit`).
- No authentication/authorization layer yet.
- Agent guidance: [`AGENTS.md`](AGENTS.md)
