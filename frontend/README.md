# Frontend

Next.js 14 App Router UI for the local video streaming app: task list, upload form, and DASH playback via Vidstack + dash.js.

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

- `/` — tasks list
- `/tasks/new` — upload form
- `/tasks/[id]` — task detail + DASH player

## Notes

- If the Next.js build cache is corrupted: `rm -rf .next && npm run build`
- Agent guidance: [`AGENTS.md`](AGENTS.md)
