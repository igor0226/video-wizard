# Language Learning Platform — Agent Notes

Shared monorepo context. Package-specific guidance lives in [`frontend/AGENTS.md`](frontend/AGENTS.md) and [`backend/AGENTS.md`](backend/AGENTS.md).

## Goal

Build a language learning platform that helps self-directed learners acquire fluency across four core skills:

- **Listening** *(implemented)* — comprehension from real-world video with automated transcription, phrase detection, and AI-generated explanation inserts
- **Speaking** *(planned)* — live 1-on-1 conversational sessions with an AI language teacher (real-time captions, feedback, vocabulary tracking)
- **Writing** *(planned)* — guided essay and short-form composition with AI feedback
- **Reading** *(planned)* — leveled reading practice with comprehension support

Only **Listening** is built today. The other three skills are on the roadmap.

Language inputs for Listening uploads (selected per upload):

- **Video language** — the source language spoken in the upload (`sourceLanguage` on upload).
- **Explanation language** — the language for AI-generated explanations and TTS narration (`explanationLanguage` on upload).
- **Language level** — the learner's CEFR level (`A1`–`C2`, `languageLevel` on upload); drives phrase-detection difficulty filtering.

## Target scenario

A learner uses the platform to practice all four skills. Today, only the Listening skill is available:

**Listening (implemented):** A user uploads a video and selects the video language and explanation language. The pipeline transcribes the speech, identifies learner-relevant phrases, and uses AI to write short explanations in the explanation language. Each explanation is turned into TTS audio and paired with a simple text slide. FFmpeg composes the **destination video**: original footage with burned-in subtitles and phrase highlights, plus explanation inserts (text slide + TTS) appended after each target sentence ends. The enriched video is longer than the original. The user watches it in the app via DASH playback.

**Speaking (planned):** Live 1-on-1 simulated conversational sessions with an AI language teacher featuring real-time captioning, conversational feedback, and interactive vocabulary tracking.

**Writing (planned):** Guided essay and short-form composition feedback.

**Reading (planned):** Leveled reading practice with comprehension support.

## Architecture

- `frontend/` — Next.js UI (own `package.json`)
- `backend/` — Nest.js API + processing worker (own `package.json`)
- `videos/` — legacy on-disk data (optional one-time migration source into MinIO)
- `compose.yaml` — Docker Compose dev stack (frontend + backend, hot reload)
- Root `package.json` — husky/commitlint and `npm run dev` (`docker compose up`)

### Skills

| Skill | Status | Target routes | Current modules |
|---|---|---|---|
| **Listening** | Implemented | `/listening`, `/listening/upload`, `/listening/:videoId` | `videos/`, `processing/`, `dash/`, `storage/` |
| **Speaking** | Planned | `/speaking`, `/speaking/call/:callId` | — (WebRTC signaling, session persistence TBD) |
| **Writing** | Planned | `/writing` | — (composition feedback TBD) |
| **Reading** | Planned | `/reading` | — (reading practice TBD) |
| **Dashboard** | Planned | `/dashboard` | — (cross-skill analytics TBD) |

Today's frontend routes (`/`, `/tasks/new`, `/tasks/[id]`) implement the Listening skill and will migrate to `/listening/*`.

### Artifacts (Listening skill)

Target blob outputs in S3/MinIO (same key layout as the former repo-root `videos/` tree):

- `uploads/<videoId>/` — source upload
- `transcripts/<videoId>/transcript.json` — timed transcript (word/segment timestamps)
- `explanations/<videoId>/phrases.json` — detected tricky phrases (word indexes + explanations)
- `explanations/<videoId>/` — TTS audio clips, slide assets
- `enriched/<videoId>/` — composed destination video (pre-DASH)
- `dash/<videoId>/` — streamable DASH output (enriched video, not raw source)

Video metadata lives in PostgreSQL. Legacy `videos/records/*.json` may still exist locally for one-time backfill only.

## Product flow (Listening skill)

1. Upload via Nest `POST /api/videos/upload` with source file and language settings → record created as `pending`.
2. Backend worker transcribes speech to text with word/segment timestamps.
3. AI analyzes the transcript and flags tricky phrases for language learners (`gpt-5.6-luna`).
4. AI generates brief explanations in the explanation language (included in phrase detection output for now).
5. Explanation text is converted to TTS audio and paired with simple text slides.
6. FFmpeg composes the enriched destination video: burned-in subtitles, phrase highlights, and explanation inserts (slide + TTS) spliced after target sentences.
7. Enriched video is packaged as DASH assets.
8. Status transitions: `pending → processing → ready|failed`.
9. Frontend polls Nest for list/status and plays ready videos from Nest DASH routes.

The browser calls Nest directly (no Next.js API proxy).

## Tech stack

- npm as package manager (separate installs in `frontend/` and `backend/`)
- Frontend: Next.js under `frontend/`
- Backend: Nest.js under `backend/`
- Local dev: Docker Compose (`compose.yaml`)

## Key technical details

- **Hard rule:** ask questions if something from the user's instruction seems not clear enough.
- **Hard rule:** always run `nvm use` before host Node commands (lint, test, commit hooks).
- FFmpeg is provided by the backend Docker image when using Compose. On the host (without Docker), FFmpeg must be on system `PATH` for DASH packaging and video compositing (burn-in subtitles, phrase highlights, splice explanation clips at sentence boundaries derived from transcript timestamps).
- **Transcription (Listening):** Whisper (or equivalent) for speech-to-text with timed word/segment output.
- **Phrase analysis + explanations (Listening):** LLM (e.g. OpenAI) to flag idioms, collocations, and grammatically tricky phrases and generate learner explanations in the explanation language.
- **TTS (Listening):** explanation text is spoken via TTS (provider TBD); locale follows the explanation language.
- **Language params** travel with the upload record and drive prompt and TTS locale selection.
- No authentication/authorization layer yet.
- Defaults: frontend `http://localhost:3000`, backend `http://localhost:3001`.
  - `NEXT_PUBLIC_API_URL` (frontend → Nest)
  - `CORS_ORIGIN` (Nest → Next origin)
- Keep files under 300 lines. If not possible, ask.
- Keep functions under 50 lines. If not possible, ask.
- Store module-bound utility functions under "utils" directory, don't blend them with the rest business logic files.

### Local dev (Docker Compose)

```bash
cp backend/.env.example backend/.env   # then set OPENAI_API_KEY
docker compose up --build              # frontend :3000, backend :3001
```

Host Node (lint/test/hooks) still uses `nvm use`. Package validation steps live in [`frontend/AGENTS.md`](frontend/AGENTS.md) and [`backend/AGENTS.md`](backend/AGENTS.md).
