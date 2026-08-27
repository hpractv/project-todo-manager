# Project Memory

This file is maintained by the Ralph loop. Each plan, dev, and QA phase reads it for context and appends new discoveries.

Keep entries concise and non-obvious. Remove entries that are no longer relevant.

## Commands

- Install (root, all workspaces): `npm install`
- Dev (both workspaces concurrently): `npm run dev` (uses `concurrently`, requires `-w api`/`-w web` scripts to exist)
- Build (both workspaces): `npm run build`
- Node: v20.20.2, npm: 10.8.2 (used to scaffold; better-sqlite3 native build should target this)

## Conventions

- Root `package.json` uses npm workspaces: `["web", "api"]`. Workspace packages are named `@project-todo-manager/web` and `@project-todo-manager/api`.
- `web/` and `api/` each get their own `package.json` with local `dev`/`build` scripts; root scripts delegate via `-w <workspace>`.
- Shared TS config lives at root `tsconfig.base.json` (ES2022 target, strict mode) — each workspace's own `tsconfig.json` should `extends` it with its own `outDir`/`rootDir`/`include`.
- Both workspaces are ESM (`"type": "module"` in package.json).

## QA notes

- Task 1 (init-monorepo) verified: `npm install`, `npm run dev`, and `npm run build` all succeed at root and delegate correctly to both workspaces.
- Task 4 (Express+TS server) verified: `npm run build -w api` compiles cleanly; both `npm run dev -w api` (tsx) and `npm run start -w api` (compiled `dist/index.js`) serve `GET /api/health` -> `{"status":"ok"}` with `Access-Control-Allow-Origin: http://localhost:5173` present. Used a non-default `PORT` env var during manual verification to sidestep the port-collision gotcha already noted below. `api/dist` is correctly untracked (root `.gitignore` covers `dist/`). No ESLint config exists in this repo yet, so lint is not part of the QA gate for these early tasks.
- Do not name a root script `install` — it collides with npm's reserved lifecycle hook and would recursively re-trigger on every `npm install`, breaking that acceptance check. `install:all` (or similar) is the correct alternative even if a task's file list says "scripts: install, dev, build".

## Gotchas

- Task 2 (Vite React+TS scaffold): use `"build": "tsc && vite build"` (plain `tsc`, not `tsc -b`) in `web/package.json` — `tsc -b` is composite/project-reference build mode and adds unneeded complexity for a single non-composite `web/tsconfig.json`. Set `"noEmit": true` in `web/tsconfig.json` since Vite (esbuild) does the actual transpile/bundle; `tsc` there is type-check-only.
- `web/tsconfig.json` must override `lib` to add `"DOM", "DOM.Iterable"` on top of the root `tsconfig.base.json`'s `ES2022`-only lib list, or DOM globals (`document`, etc.) won't resolve.
- When manually verifying `npm run dev -w web`, port 5173 may already be occupied by an unrelated Vite server from a different project on the same machine — Vite auto-falls-back to 5174 and logs it; check `lsof -i :5173` / process cwd before assuming it's a conflict worth fixing.

- Task 3 (Redux store + typed hooks): `@reduxjs/toolkit@2.12.0` + `react-redux@9.3.0` ship a `.withTypes<T>()` helper on `useDispatch`/`useSelector`, so `web/src/store/hooks.ts` is just `export const useAppDispatch = useDispatch.withTypes<AppDispatch>();` / `useSelector.withTypes<RootState>()` — no need for the older `TypedUseSelectorHook` generic-wrapper pattern from RTK docs examples predating this API.
- Repo started with zero commits on branch `init` (no `main` yet) — do not assume `git log`/`main` exist when bootstrapping.
- Root `.gitignore` must cover `node_modules/`, `dist/`, `*.db`, `*.sqlite`, `*.sqlite3` before running `npm install`, otherwise workspace installs will pollute git status.
- Placeholder `dev`/`build` scripts in `web/`/`api/` (before Vite/Express are scaffolded) use `echo "..."` so `npm run dev`/`npm run build` succeed end-to-end without erroring on missing scripts.

- Task 4 (Express+TS server): `npm view express version` resolved to `5.2.1` (Express 5 is now current/stable) — used `express@^5.2.1` + `@types/express@^5.0.6` together since v4 type defs don't match v5. No v4-specific API was needed for a basic health route, so this is a safe default going forward for this repo.
- Relative ESM imports in `api/src/*.ts` must use an explicit `.js` extension (e.g. `import app from './server.js'`) even though the source file is `.ts` — `tsconfig.base.json` uses `moduleResolution: "Bundler"` which tolerates extensionless imports for `tsc`/`tsx`, but the *compiled* `dist/*.js` runs under plain `node` with `"type": "module"`, which requires the extension at runtime. Omitting it breaks `npm run start -w api` (`node dist/index.js`) with `ERR_MODULE_NOT_FOUND` even though `tsc` and `tsx watch` both succeed.
- This dev machine can have an unrelated Node project (outside this repo, e.g. `izep/ralph-gui`) already bound to port 3001 (and separately 5173) from a prior/parallel session — same class of issue as the earlier Vite-port note. Symptom: `npm run dev -w api` logs "API server listening on port 3001" with no bind error, but `curl localhost:3001/api/health` returns Express's own generic 404 (`Cannot GET ...`), because the *other* project's Express server answered first, not this repo's. Do not assume a 404 here means our route is missing — verify by starting our server with `PORT=<free-port>` and curling that port instead before concluding anything is broken. Also: never `pkill -f` with a substring from this task's own prompt text (e.g. `"tsx watch src/index.ts"`) — the running `claude -p "..."` process includes the full task prompt as an argv string and matches, so the harness safety check refuses the pkill; target the specific child PIDs instead.

- Task 5 (better-sqlite3 DB bootstrap): the current `better-sqlite3` latest (`13.x`) declares `"engines": {"node": ">=22"}` and installs with an `EBADENGINE` warning on this machine's Node v20.20.2 (still works, but noisy/unsupported). Pin to `better-sqlite3@12.11.1` instead (`"engines": {"node": "20.x || 22.x || 23.x || 24.x || 25.x || 26.x"}`) — explicitly supports Node 20.x with a clean install, paired with `@types/better-sqlite3@^9.6.0`. `npm install better-sqlite3` with no version pin will grab 13.x and re-trigger the warning.
- `npm install <pkg> -w <workspace>` (no `-D`) always lands the package in `dependencies`, even for an `@types/*` package — move `@types/*` entries to `devDependencies` by hand afterward to match this repo's existing convention (`@types/cors`, `@types/express` are both dev deps).
- `DB_PATH` (default `./data/todo.db` in `api/src/db/index.ts`) is resolved relative to `process.cwd()` at run time, not relative to the source/dist file location. `npm run dev -w api` and `npm run start -w api` both set cwd to `api/`, so the file correctly lands at `api/data/todo.db` — but running `node api/dist/index.js` (or `npx tsx api/src/index.ts`) from the repo root instead creates `<repo-root>/data/todo.db`. Always verify DB-file-location acceptance checks via the actual `-w api` npm scripts, not an ad hoc `node`/`tsx` invocation from root.

- Task 6 (projects schema + data-access): `better-sqlite3`'s `db.prepare<T>(sql)` takes the *bind-parameter* shape as its generic (used with named `@param` placeholders passed as a single object), not a return-row type — there's no built-in generic for the result row, so cast `.get()`/`.all()` results with `as Project | undefined` / `as (Project & {...})[]`. Named params (`@name`) read cleanly against an object arg (`{ name, description }`) and keep call sites self-documenting vs. positional `?` placeholders.
- For manually smoke-testing a `api/src/db/*.ts` module's relative imports (which need the `.js` extension per the ESM/tsx note above), put the throwaway script inside `api/src/` itself (e.g. `api/src/smoke.ts`) and run `npx tsx src/smoke.ts` from `api/` — a script under `/tmp` fails to resolve the sibling `.js`-suffixed relative imports (`Cannot find module`) because tsx/node resolve them relative to the script's own directory, not the repo. Delete the smoke script and any generated `data/*.db` file afterward so they don't leak into `git status`.
- `listProjects()`'s `task_count` placeholder is done via `SELECT ..., 0 AS task_count FROM projects` in the prepared statement (not appended in JS after `.all()`) — keeps the shape identical to what the future real subquery (`LEFT JOIN` + `COUNT`) will produce, so swapping it later only touches the SQL string, not the TS surface.