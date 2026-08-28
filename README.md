# Project Todo Manager

A local, single-user web application for managing todos organized by project. The
front end is a React/Redux (TypeScript, Vite) app talking to an Express REST API,
which persists all state in a local SQLite database via `better-sqlite3`. Everything
runs on your machine — no accounts, no cloud sync, no external network dependency.

## Prerequisites

- Node.js v20.x (developed and tested against v20.20.2)
- npm 10.x (bundled with Node 20)

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

This starts both workspaces concurrently:
- API server on http://localhost:3101
- Web app (Vite dev server) on http://localhost:5173

## Development

Root-level scripts (run from the repo root):

| Command         | Description                                                   |
| --------------- | ------------------------------------------------------------- |
| `npm install`   | Install dependencies for both workspaces (`web/` and `api/`). |
| `npm run dev`   | Run the API and web dev servers concurrently.                 |
| `npm run build` | Type-check and build both workspaces.                         |
| `npm run test`  | Run tests in both workspaces (if present).                    |
| `npm run lint`  | Lint both workspaces (if present).                            |

Individual workspace commands (useful for running just one side, or with a custom
`PORT`/`DB_PATH`/`VITE_API_URL`):

```bash
# API only
npm run dev -w api
npm run build -w api
npm run start -w api   # run the compiled build (dist/index.js)

# Web only
npm run dev -w web
npm run build -w web
npm run preview -w web
```

The API listens on port `3101` by default; override with the `PORT` environment
variable (and set `API_PORT` to the same value if you run the Vite app separately).
The web dev server defaults to port `5173` (Vite falls back to the next free port,
e.g. `5174`, if that port is in use). Browser requests go to same-origin `/api`
paths and Vite proxies them to the API, so creating a project still works when
Vite is not on 5173.

## Database Location

Data is stored in a local SQLite file at `api/data/todo.db`, created automatically
the first time the API server starts. Override the location with the `DB_PATH`
environment variable (resolved relative to the `api/` working directory when using
the `-w api` npm scripts).

The schema is initialized idempotently on every server start, so restarting the app
never errors or wipes existing data — projects (and later, tasks) persist across
restarts as long as they point at the same database file.

## Verification

To confirm data persists across a restart:

1. `npm install`
2. `npm run dev`
3. Open http://localhost:5173 and create a project.
4. Stop both servers (Ctrl+C).
5. `npm run dev` again, and reopen http://localhost:5173.
6. The project you created is still there — it was read from `api/data/todo.db`,
   not held in memory.
