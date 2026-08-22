# Backend Agent Notes

Make sure to read the AGENTS.md file in the parent direction.

Run the app with Docker Compose from the repo root (`docker compose up --build`); see the parent [`AGENTS.md`](../AGENTS.md). FFmpeg is in the backend image when using Compose.

## Architecture

Nest.js app under `src/` with feature modules:

- `videos/` — list/upload/status HTTP API
- `processing/` — cron worker, jobs, FFmpeg DASH generation, audio extraction, Whisper transcription, phrase detection, explanation clip generation, video composition
- `dash/` — manifest rewrite + segment serving
- `storage/` — filesystem storage + video record repository

`main.ts` sets Pino app logger, CORS, global `api` prefix, port `3001`. Worker starts on boot via `ProcessingWorkerService` (`OnModuleInit`) and polls about every 15s.

## Tech stack

- Nest.js + TypeScript
- SWC for Nest emit (`nest build` / `nest start`); `tsc --noEmit` for type checking (`npm run typecheck`, and forked in parallel on `start:dev`)
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
- `videos/explanations/<videoId>/phrases.json` — detected tricky phrases with word indexes and explanations
- `videos/explanations/<videoId>/clips.json` — manifest of rendered explanation clips (`insertAtSeconds`, `sentenceStartSeconds`, duration, paths)
- `videos/explanations/<videoId>/clips/<nnn>.speech.mp3|mp3|ass|mp4` — per-phrase speech TTS, combined audio (speech + cached closing), ASS subtitles, and rendered clip
- `videos/assets/listen-again/<language>.mp3` — cached per-language "Let's listen once again!" TTS (recorded once, reused across videos)
- `videos/enriched/<videoId>/output.mp4` — composed destination video (source + spliced explanation clips)
- `videos/records/<videoId>.json` — includes `sourceLanguage`, `explanationLanguage`, `languageLevel`
- `videos/history/<videoId>.json` — processing step history (events + current step)
- `videos/locks/<videoId>.lock` (worker concurrency guard)

### Processing pipeline

Worker order for each pending video: **audio extract → Whisper transcribe → phrase detection → explanation clips → compose video → DASH transcode → ready**.

- `FfmpegAudioService` — extracts mono 16 kHz MP3 (`audio/<videoId>/track.mp3`); fails if no audio track
- `WhisperTranscriptionService` — OpenAI `whisper-1` with `verbose_json` + word timestamps; writes `transcripts/<videoId>/transcript.json`
- `PhraseDetectionService` — OpenAI `gpt-5.6-luna` with structured JSON output; writes `explanations/<videoId>/phrases.json`
- `ExplanationTtsService` — OpenAI `gpt-4o-mini-tts` for explanation narration audio; lazily caches per-language closing audio under `assets/listen-again/<language>.mp3`
- `ExplanationClipService` — FFmpeg slide clips with burned-in phrase title + explanation subtitles; concatenates cached localized "Let's listen once again!" audio (spoken + shown) after each clip's explanation (`explanations/<videoId>/clips/`)
- `FfmpegComposeService` — splices explanation clips after the sentence containing each phrase, fades source audio out over 700ms before each clip, then resumes playback from `sentenceStartSeconds` so the target sentence replays after the explanation; writes `enriched/<videoId>/output.mp4`
- `FfmpegDashService` — DASH packaging from the enriched video
- Files > 24 MB are split into ~10-minute chunks before transcription and merged with offset word timestamps
- `OPENAI_API_KEY` is required when the worker runs transcription, phrase detection, or explanation TTS
- Any step failure marks the video `failed` and records the failing step in history
- Completed steps are skipped on resume when their output files already exist

Processing steps tracked in history: `queued`, `audio_extract`, `transcribing`, `detecting_phrases`, `generating_clips`, `composing_video`, `dash_encoding`, `completed`, `failed`.

### Upload language fields

`POST /api/videos/upload` requires multipart fields:

- `sourceLanguage` — source language spoken in the video
- `explanationLanguage` — language for AI-generated explanations
- `languageLevel` — learner CEFR level (`A1`–`C2`, case-insensitive)

These are stored on the video record and passed into the phrase-detection prompt.

### Video API processing fields

- `GET /api/videos` — each item includes `processingStep` and `queuePosition` (`null` unless `status === "pending"`)
- `GET /api/videos/:id/status` — adds `processingHistory` (full event log) plus `processingStep` and `queuePosition`
- `POST /api/videos/:id/retry` — retry a **failed** video; returns `409` for non-failed videos, `404` if missing
- `queuePosition` is computed at read time: 1-based index among pending videos sorted by `createdAt`

### Retry failed videos

`POST /api/videos/:id/retry`:

1. Validates `status === "failed"`
2. Reads the last failed resumable step from `videos/history/<videoId>.json` (`audio_extract`, `transcribing`, `detecting_phrases`, `generating_clips`, `composing_video`, or `dash_encoding`)
3. Clears artifacts for that step and any downstream steps (keeps upstream outputs so the worker skips completed work)
4. Appends a history event (`message: "retry requested"`) and sets `currentStep` to the resume step
5. Sets video record back to `pending` with `failureReason: null` — the cron worker picks it up on the next tick

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
- `CLIP_GENERATION_CONCURRENCY` — max number of explanation clips rendered in parallel per video (default `3`, minimum `1`).

## Validation

From `backend/`:

- **Hard rule:** Never write or read files from the disk in a way around the BlobStorageService. The only exception is tests.
- **Hard rule:** if you see that the changes suggested by the user may require changing the frontend files as well, never change them without asking for the user's permission.
- **Hard rule:** functions should not receive more than 2 parameters. If the function's logic requires so, pass the paramaters grouped in an object.
- **Hard rule:** before commit, `npm run lint:fix`
- **Hard rule:** `npm run typecheck && npm run lint && npm run test && npm run test:e2e`
