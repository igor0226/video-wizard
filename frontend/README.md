# Frontend

Next.js 14 App Router UI for the local video streaming app: task list, upload form, and DASH playback via Vidstack + dash.js.

The browser talks to the Nest backend directly (`NEXT_PUBLIC_API_URL`).

## Prerequisites

- Node.js v24 (see repo-root `.nvmrc`)
- npm
- Backend running on `http://localhost:3001` (see [`../backend/README.md`](../backend/README.md))

## Startup

From the repository root:

```bash
nvm use
cd frontend
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### Environment (optional)

Create `frontend/.env.local` if you need a non-default API URL:

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
