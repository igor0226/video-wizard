# Backend

Nest.js API and background worker for the local video streaming app. Handles upload, S3/MinIO-backed blob storage, FFmpeg DASH processing, and manifest/segment serving.

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

## Object storage

Pipeline blobs live in an S3-compatible bucket (MinIO in Compose, AWS S3 in production). See `S3_*` and `MEDIA_WORKSPACE_ROOT` in [`.env.example`](.env.example).

Object keys mirror the former repo-root `videos/` layout:

- `uploads/<videoId>/` — source files
- `dash/<videoId>/` — `manifest.mpd` + segments
- `audio/<videoId>/` — extracted MP3 for transcription
- `transcripts/<videoId>/` — Whisper transcript JSON
- `explanations/<videoId>/` — detected phrases JSON and rendered clips
- `enriched/<videoId>/` — composed output video

Video metadata and processing history are in PostgreSQL. To migrate existing local `videos/` data into MinIO, see the one-time command in [`AGENTS.md`](AGENTS.md).

## Notes

- The processing worker starts on Nest boot via `ProcessingWorkerService` (`OnModuleInit`).
- No authentication/authorization layer yet.
- Agent guidance: [`AGENTS.md`](AGENTS.md)
