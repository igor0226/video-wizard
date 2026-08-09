# Video Streaming Project: Agent Notes

Shared monorepo context. Package-specific guidance lives in [`frontend/AGENTS.md`](frontend/AGENTS.md) and [`backend/AGENTS.md`](backend/AGENTS.md).

## Goal

Users upload videos, browse the list, and watch processed videos via DASH.

## Architecture

- `frontend/` — Next.js UI (own `package.json`)
- `backend/` — Nest.js API + processing worker (own `package.json`)
- `videos/` — local filesystem storage (repo root)
- Root `package.json` — husky/commitlint only

Product flow:

1. Upload via Nest `POST /api/videos/upload` → record created as `pending`.
2. Backend worker picks jobs and runs FFmpeg to produce DASH assets.
3. Status transitions: `pending → processing → ready|failed`.
4. Frontend polls Nest for list/status and plays ready videos from Nest DASH routes.

The browser calls Nest directly (no Next.js API proxy).

## Tech stack

- npm as package manager (separate installs in `frontend/` and `backend/`)
- Frontend: Next.js under `frontend/`
- Backend: Nest.js under `backend/`

## Key technical details

- **Hard rule:** always run `nvm use` before Node commands.
- FFmpeg must be available on system `PATH`.
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
