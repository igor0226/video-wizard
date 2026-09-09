# Backend Agent Notes

Nest.js backend for the **Language Learning Platform**. Today's modules implement the **Listening** skill (video upload, transcription, phrase detection, explanation clips, video composition, DASH playback). Planned modules will add Speaking (WebRTC signaling and session persistence), Writing (composition feedback), and Reading (comprehension practice).

Make sure to read the AGENTS.md file in the parent direction.

Run the app with Docker Compose from the repo root (`docker compose up --build`); see the parent [`AGENTS.md`](../AGENTS.md). Compose starts **postgres**, **minio**, **backend**, and **frontend**. FFmpeg is in the backend image when using Compose. The backend runs migrations on boot (`npm run migration:run`) before `start:dev`.

## Architecture

Nest.js app under `src/` with feature modules:

- `videos/` — list/upload/status HTTP API
- `speaking/` — AI teacher call HTTP API (create/end/status) + LiveKit token/room/dispatch + agent worker (`src/speaking/agent/`)
- `processing/` — cron worker, jobs, FFmpeg DASH generation, audio extraction, Whisper transcription, phrase detection, explanation clip generation, video composition
- `dash/` — manifest rewrite + segment serving
- `storage/` — `BlobStorageService` (S3/MinIO object keys) + Postgres-backed repositories/services
- `models/` — TypeORM entity declarations (`Video`, `ProcessingHistory`, `ProcessingLock`, `TeacherCall`)
- `database/` — TypeORM wiring, migrations, backfill script

`main.ts` sets Pino app logger, CORS, global `api` prefix, port `3001`. Worker starts on boot via `ProcessingWorkerService` (`OnModuleInit`) and polls about every 15s.

Store module-bound utility functions under each module's `utils/` directory (e.g. `storage/utils/`, `videos/utils/`, `processing/utils/`). Do not blend helpers into service files.

## Tech stack

- Nest.js + TypeScript
- SWC for Nest emit (`nest build` / `nest start`); `tsc --noEmit` for type checking (`npm run typecheck`, and forked in parallel on `start:dev`)
- Pino via `nestjs-pino` (pretty in non-production)
- PostgreSQL + TypeORM (`@nestjs/typeorm`, `typeorm`, `pg`)
- S3-compatible object storage via AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`); MinIO locally, AWS S3 in production
- FFmpeg for DASH generation and pipeline compositing (uses local temp workspaces under `MEDIA_WORKSPACE_ROOT`)
- `cron` for the background processing loop
- Biome (lint/format)

## Key technical details

### PostgreSQL

Credentials come from env (see `backend/.env.example`):

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

In Docker Compose, backend uses `POSTGRES_HOST=postgres`. Host dev defaults to `localhost`.

**Tables** (see `src/models/`):

- `videos` — video metadata (`VideoRecord` fields)
- `processing_history` — per-video step history (`currentStep`, `events` jsonb)
- `processing_locks` — worker concurrency guard (row insert = acquire, PK = one lock per video)
- `teacher_calls` — speaking-skill AI teacher call records (`TeacherCallRecord` fields)

Domain types live in [`src/storage/types.ts`](src/storage/types.ts). Entities mirror those types; ISO date/bigint transformers are in `src/models/utils/`.

**Migrations** (TypeORM CLI via `src/database/data-source.ts`):

```bash
npm run migration:run      # apply pending migrations
npm run migration:revert   # revert last migration
npm run migration:generate # generate from entity diff (rename output file)
npm run migration:create   # empty migration scaffold
```

**Legacy backfill** — one-time import of old JSON metadata into Postgres:

```bash
npm run db:backfill
```

Reads legacy `videos/records/*.json` and `videos/history/*.json` from the repo-root `videos/` directory (or `STORAGE_ROOT` if set), applies legacy defaults for missing language fields, and inserts into Postgres. Safe to re-run only if tables are empty/truncated.

**Tests** — unit/e2e suites that boot `AppModule` use `@testcontainers/postgresql` and a MinIO testcontainer (see `test/postgres-test-setup.ts`, `test/minio-test-setup.ts`). E2e global setup runs migrations before the suite.

### Object storage (MinIO / S3)

Blob artifacts are stored in an S3-compatible bucket using the same object keys as the old on-disk layout. Configure via `backend/.env.example`:

- `S3_ENDPOINT` — MinIO URL locally (`http://localhost:9000` on host, `http://minio:9000` in Compose); omit for AWS S3
- `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE` — `true` for MinIO (default when `S3_ENDPOINT` is set)
- `MEDIA_WORKSPACE_ROOT` — local scratch dir for FFmpeg steps (download inputs → process → upload outputs)

Object keys (unchanged from the former filesystem layout):

- `uploads/<videoId>/<source-file>`
- `dash/<videoId>/manifest.mpd` + segments
- `audio/<videoId>/track.mp3` — extracted mono MP3 for transcription
- `transcripts/<videoId>/transcript.json` — Whisper verbose JSON (word timestamps)
- `explanations/<videoId>/phrases.json` — detected tricky phrases with word indexes and explanations
- `explanations/<videoId>/clips.json` — manifest of rendered explanation clips
- `explanations/<videoId>/clips/<nnn>.speech.mp3|mp3|ass|mp4` — per-phrase TTS, combined audio, ASS subtitles, rendered clip
- `assets/listen-again/<language>.mp3` — cached per-language "Let's listen once again!" TTS
- `enriched/<videoId>/output.mp4` — composed destination video
- `enriched/<videoId>/playback-phrases.json` — playback phrase timings for the API

Metadata (`VideoRecord`, processing history, worker locks) is in **PostgreSQL**.

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
- Worker locking via `ProcessingLockService` (Postgres `processing_locks` table)

Processing steps tracked in history: `queued`, `audio_extract`, `transcribing`, `detecting_phrases`, `generating_clips`, `composing_video`, `dash_encoding`, `completed`, `failed`.

### Upload language fields

`POST /api/videos/upload` requires multipart fields:

- `sourceLanguage` — source language spoken in the video
- `explanationLanguage` — language for AI-generated explanations
- `languageLevel` — learner CEFR level (`A1`–`C2`, case-insensitive)

These are stored on the video record (Postgres) and passed into the phrase-detection prompt.

### Video API processing fields

- `GET /api/videos` — each item includes `processingStep` and `queuePosition` (`null` unless `status === "pending"`)
- `GET /api/videos/:id/status` — adds `processingHistory` (full event log) plus `processingStep` and `queuePosition`
- `POST /api/videos/:id/retry` — retry a **failed** video; returns `409` for non-failed videos, `404` if missing
- `queuePosition` is computed at read time: 1-based index among pending videos sorted by `createdAt`

### Retry failed videos

`POST /api/videos/:id/retry`:

1. Validates `status === "failed"`
2. Reads the last failed resumable step from processing history in Postgres (`audio_extract`, `transcribing`, `detecting_phrases`, `generating_clips`, `composing_video`, or `dash_encoding`)
3. Clears object-storage artifacts for that step and any downstream steps (keeps upstream outputs so the worker skips completed work)
4. Appends a history event (`message: "retry requested"`) and sets `currentStep` to the resume step
5. Sets video record back to `pending` with `failureReason: null` — the cron worker picks it up on the next tick

### DASH

- Serve manifests at `/api/dash/<videoId>/manifest.mpd`.
- `DashService` rewrites served MPDs at read time to inject `<BaseURL>/api/dash/<videoId>/segment/</BaseURL>` before each `<SegmentTemplate>`; segment bytes are streamed from object storage through the backend.
- Preserve `manifest.mpd` route + `/segment/` asset path conventions.

### Guardrails

- Keep the worker idempotent and lock-safe (avoid duplicate processing).
- Return explicit failure reasons for processing errors.
- Do not break `VideoRecord` or entity schemas without TypeORM migrations.
- Never read or write pipeline blobs except through `BlobStorageService` (S3 keys). FFmpeg steps may use disposable local workspaces under `MEDIA_WORKSPACE_ROOT` via `MediaWorkspaceService`.

### Logging

- Override level with `LOG_LEVEL` (default `debug` non-prod, `info` prod).
- Automatic HTTP access logs skip DASH segment routes to avoid spam.

### Processing worker env

- `VIDEO_PROCESSING_CRON_ENABLED` — set to `false` to skip cron scheduling and the startup tick (used in tests and local API-only runs). Default: enabled (`true` in `.env.example`).
- `VIDEO_PROCESSOR_CRON` — cron expression for the worker loop (default every 15s).
- `CLIP_GENERATION_CONCURRENCY` — max number of explanation clips rendered in parallel per video (default `3`, minimum `1`).

### Speaking (AI teacher)

Self-hosted LiveKit (`livekit` in Compose) plus a Node agent worker (`teacher-agent` in Compose, `npm run start:agent`).

- `POST /api/speaking/calls` — stub auth via `userId`; creates a `teacher_calls` row, LiveKit room, agent dispatch, and participant token. Returns `{ callId, roomName, token, livekitUrl }`.
- `GET /api/speaking/calls/:id?userId=` — owner-scoped call status.
- `POST /api/speaking/calls/:id/end` — owner-scoped end; deletes the LiveKit room and marks the call `ended`.
- `POST /api/speaking/livekit/webhook` — LiveKit `room_finished` / `participant_left` reconciliation.
- Agent publishes teacher audio into the room and emotion JSON on data topic `teacher-emotion` (`source: "reply" | "reaction"`).

Env: `LIVEKIT_URL` (browser-facing), `LIVEKIT_API_URL` (Nest Room/Dispatch API, defaults to `http` form of `LIVEKIT_URL`), `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `SPEAKING_AGENT_NAME`, `SPEAKING_TEACHER_MODEL`, `SPEAKING_TEACHER_VOICE`, `SPEAKING_CALL_TOKEN_TTL`, `SPEAKING_EMPTY_ROOM_TIMEOUT_SECONDS`.

## Validation

From `backend/`:

- **Hard rule:** Never read or write pipeline blobs except through `BlobStorageService`. FFmpeg steps use `MediaWorkspaceService` temp dirs. Tests may seed objects via `BlobStorageService`.
- **Hard rule:** if you see that the changes suggested by the user may require changing the frontend files as well, never change them without asking for the user's permission.
- **Hard rule:** functions should not receive more than 2 parameters. If the function's logic requires so, pass the paramaters grouped in an object.
- **Hard rule:** before commit, `npm run lint:fix`
- **Hard rule:** `npm run typecheck && npm run lint && npm run test && npm run test:e2e`
