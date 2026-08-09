# Backend Agent Notes

## Architecture

Nest.js app under `src/` with feature modules:

- `videos/` — list/upload/status HTTP API
- `processing/` — cron worker, jobs, FFmpeg DASH generation, audio extraction, Whisper transcription
- `dash/` — manifest rewrite + segment serving
- `storage/` — filesystem storage + video record repository

`main.ts` sets Pino app logger, CORS, global `api` prefix, port `3001`. Worker starts on boot via `ProcessingWorkerService` (`OnModuleInit`) and polls about every 15s.

## Tech stack

- Nest.js + TypeScript
- Pino via `nestjs-pino` (pretty in non-production)
- Local disk storage (no DB/S3 yet)
- FFmpeg for DASH generation
- `cron` for the background processing loop
- Biome (lint/format)

## Key technical details

### Storage (repo-root `videos/`)

`STORAGE_ROOT` defaults to `../videos` from the `backend/` cwd:

- `videos/uploads/<videoId>/<source-file>`
- `videos/dash/<videoId>/manifest.mpd` + segments
- `videos/audio/<videoId>/track.mp3` — extracted mono MP3 for transcription
- `videos/transcripts/<videoId>/transcript.json` — Whisper verbose JSON (word timestamps)
- `videos/records/<videoId>.json`
- `videos/locks/<videoId>.lock` (worker concurrency guard)

### Processing pipeline

Worker order for each pending video: **DASH transcode → audio extract → Whisper transcribe → ready**.

- `FfmpegDashService` — DASH packaging
- `FfmpegAudioService` — extracts mono 16 kHz MP3 (`audio/<videoId>/track.mp3`); fails if no audio track
- `WhisperTranscriptionService` — OpenAI `whisper-1` with `verbose_json` + word timestamps; writes `transcripts/<videoId>/transcript.json`
- Files > 24 MB are split into ~10-minute chunks before transcription and merged with offset word timestamps
- `OPENAI_API_KEY` is required when the worker runs transcription
- Any step failure marks the video `failed` (same as DASH errors today)

### DASH

- Serve manifests at `/api/dash/<videoId>/manifest.mpd`.
- `DashService` rewrites served MPDs at read time to inject `<BaseURL>/api/dash/<videoId>/segment/</BaseURL>` before each `<SegmentTemplate>`; on-disk FFmpeg output stays relative.
- Preserve `manifest.mpd` route + `/segment/` asset path conventions.

### Guardrails

- Keep the worker idempotent and lock-safe (avoid duplicate processing).
- Return explicit failure reasons for processing errors.
- Do not break `VideoRecord` schema unless migrations are handled.

### Logging

- Override level with `LOG_LEVEL` (default `debug` non-prod, `info` prod).
- Automatic HTTP access logs skip DASH segment routes to avoid spam.

### Processing worker env

- `VIDEO_PROCESSING_CRON_ENABLED` — set to `false` to skip cron scheduling and the startup tick (used in tests and local API-only runs). Default: enabled (`true` in `.env.example`).
- `VIDEO_PROCESSOR_CRON` — cron expression for the worker loop (default every 15s).

## Validation

From `backend/`:

- **Hard rule:** before commit, `npm run lint:fix`
- **Hard rule:** `npm run typecheck && npm run lint && npm run test && npm run test:e2e`
