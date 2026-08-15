# Language Learning with Video — Agent Notes

Shared monorepo context. Package-specific guidance lives in [`frontend/AGENTS.md`](frontend/AGENTS.md) and [`backend/AGENTS.md`](backend/AGENTS.md).

## Goal

Help users learn foreign languages from videos. A user uploads a source video in a chosen language and receives a **longer, learner-friendly output video** with on-screen subtitles, visually marked tricky phrases (idioms, collocations, grammatically hard constructions), and **inserted explanation segments** that play right after the sentence containing each target phrase ends.

Language inputs (selected per upload):

- **Video language** — the source language spoken in the upload (`sourceLanguage` on upload).
- **Explanation language** — the language for AI-generated explanations and TTS narration (`explanationLanguage` on upload).
- **Language level** — the learner's CEFR level (`A1`–`C2`, `languageLevel` on upload); drives phrase-detection difficulty filtering.

## Target scenario

A user uploads a video and selects the video language and explanation language. The pipeline transcribes the speech, identifies learner-relevant phrases, and uses AI to write short explanations in the explanation language. Each explanation is turned into TTS audio and paired with a simple text slide. FFmpeg composes the **destination video**: original footage with burned-in subtitles and phrase highlights, plus explanation inserts (text slide + TTS) appended after each target sentence ends. The enriched video is longer than the original. The user watches it in the app via DASH playback.

## Architecture

- `frontend/` — Next.js UI (own `package.json`)
- `backend/` — Nest.js API + processing worker (own `package.json`)
- `videos/` — local filesystem storage (repo root)
- Root `package.json` — husky/commitlint only

### Artifacts

Target on-disk outputs under `videos/` (exact folder names may evolve during implementation):

- `videos/uploads/<videoId>/` — source upload
- `videos/transcripts/<videoId>/transcript.json` — timed transcript (word/segment timestamps)
- `videos/explanations/<videoId>/phrases.json` — detected tricky phrases (word indexes + explanations)
- `videos/explanations/<videoId>/` — future TTS audio clips, slide assets
- `videos/enriched/<videoId>/` — composed destination video (pre-DASH)
- `videos/dash/<videoId>/` — streamable DASH output (enriched video, not raw source)
- `videos/records/<videoId>.json` — metadata including `sourceLanguage`, `explanationLanguage`, `languageLevel`

## Product flow

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

## Key technical details

- **Hard rule:** ask questions if something from the user's instruction seems not clear enough.
- **Hard rule:** always run `nvm use` before Node commands.
- FFmpeg must be available on system `PATH` for DASH packaging and video compositing (burn-in subtitles, phrase highlights, splice explanation clips at sentence boundaries derived from transcript timestamps).
- **Transcription:** Whisper (or equivalent) for speech-to-text with timed word/segment output.
- **Phrase analysis + explanations:** LLM (e.g. OpenAI) to flag idioms, collocations, and grammatically tricky phrases and generate learner explanations in the explanation language.
- **TTS:** explanation text is spoken via TTS (provider TBD); locale follows the explanation language.
- **Language params** travel with the upload record and drive prompt and TTS locale selection.
- No authentication/authorization layer yet.
- Defaults: frontend `http://localhost:3000`, backend `http://localhost:3001`.
  - `NEXT_PUBLIC_API_URL` (frontend → Nest)
  - `CORS_ORIGIN` (Nest → Next origin)
- Keep files under 300 lines. If not possible, ask.

### Local dev (two terminals)

```bash
nvm use
cd backend && npm install && npm run start:dev   # :3001
cd frontend && npm install && npm run dev        # :3000
```

Package validation steps live in [`frontend/AGENTS.md`](frontend/AGENTS.md) and [`backend/AGENTS.md`](backend/AGENTS.md).
