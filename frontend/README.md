# Frontend

Next.js 14 App Router UI for the **Language Learning Platform**. The current routes implement the **Listening** skill: task list, upload form, and DASH playback via Vidstack + dash.js. Planned surfaces add Dashboard, Speaking (AI teacher call), Writing, and Reading.

The browser talks to the Nest backend directly (`NEXT_PUBLIC_API_URL`).

## Prerequisites

Preferred: Docker Compose from the repo root (see [`../README.md`](../README.md)).

Without Docker: Node.js v24 (see repo-root `.nvmrc`) and the backend running on `http://localhost:3001`.

## Startup

From the repository root:

```bash
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

Without Docker:

```bash
nvm use
cd frontend
npm install
npm run dev
```

### Environment (optional)

Compose sets `NEXT_PUBLIC_API_URL=http://localhost:3001`. Create `frontend/.env.local` only if you need a non-default API URL on the host:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Routes

**Target platform routes** (planned IA):

- `/dashboard` — progress overview and recent activity
- `/listening` — video library
- `/listening/upload` — standalone upload form
- `/listening/:videoId` — video detail + DASH player
- `/speaking` — AI teacher session launcher and call history
- `/speaking/call/:callId` — live speaking call
- `/writing` — writing workspace (coming soon)
- `/reading` — reading practice (planned)

**Current Listening routes** (implemented today):

- `/` — tasks list
- `/tasks/new` — upload form
- `/tasks/[id]` — task detail + DASH player

## Notes

- If the Next.js build cache is corrupted: `rm -rf .next && npm run build`
- Agent guidance: [`AGENTS.md`](AGENTS.md)
