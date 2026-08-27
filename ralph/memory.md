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

## Task 7 notes (projects REST routes)

- `api/src/routes/projects.ts` uses `Router()` from `express` and is mounted at `app.use('/api/projects', projectsRouter)` in `server.ts`, with the router's own paths as `/` and `/:id` (not `/api/projects/:id`) — keeps the router portable if the mount path ever changes.
- Both POST and PUT require a non-empty string `name` in the body and 400 with `{"error": "name is required"}` otherwise — this applies to PUT too, even though `updateProject()` in the DAL supports partial updates (name optional). The route-level contract (full replace, name always required) is stricter than the DAL's capability; that's intentional per the task spec, not a bug.
- `Number(req.params.id)` is passed straight to `getProject`/`updateProject`/`deleteProject` with no separate NaN check — a malformed id (e.g. `/api/projects/abc`) naturally falls through to the same 404 path as a valid-but-missing id, since `better-sqlite3` just returns no rows for `NaN`/non-matching params. No need for a distinct 400-for-bad-id branch.
- For manual smoke-testing the running server end-to-end (not just the DAL), start the compiled server with an override `DB_PATH` and `PORT` (e.g. `DB_PATH=./data/test.db PORT=3099 node dist/index.js &` from `api/`) to avoid clobbering the real dev DB and avoid the known port-collision gotcha — then `curl` against that port and `pkill -f "node dist/index.js"` (not the tsx-watch pattern) to stop it afterward, and delete the test db file.
- `listProjects()`'s `task_count` placeholder is done via `SELECT ..., 0 AS task_count FROM projects` in the prepared statement (not appended in JS after `.all()`) — keeps the shape identical to what the future real subquery (`LEFT JOIN` + `COUNT`) will produce, so swapping it later only touches the SQL string, not the TS surface.

## Task 8 notes (web/src/api typed client)

- `task_count` is only present on the `GET /api/projects` (list) response — `GET /api/projects/:id`, `POST`, and `PUT` all return a plain `Project` with no `task_count` field (confirmed by curling the running server). `web/src/api/types.ts` reflects this with a base `Project` interface plus a `ProjectWithTaskCount extends Project` used only by `fetchProjects()`'s return type, rather than forcing `task_count` onto every response shape.
- `web/src/vite-env.d.ts` needs an explicit `ImportMetaEnv`/`ImportMeta` interface augmentation (`readonly VITE_API_URL?: string`) for `import.meta.env.VITE_API_URL` to be typed as `string | undefined` instead of falling back to vite/client's default `[key: string]: any` index signature.
- API error bodies are always `{"error": "<message>"}` (both 400 validation and 404 not-found) — `web/src/api/client.ts`'s `request()` helper reads `body.error` for the thrown `ApiError` message, with a `response.statusText` fallback if the body isn't JSON or lacks that shape.
- DELETE returns `204` with an empty body — `request()` must special-case `response.status === 204` and return `undefined as T` before attempting `response.json()`, since parsing an empty body as JSON throws.
- To manually verify a `web/src/api/client.ts` change without a browser, build+run the compiled API (`DB_PATH=./data/<tmp>.db PORT=<free-port> node dist/index.js` from `api/`) and `curl` each of the 5 endpoints directly — confirms response shapes match the client's types even though `import.meta.env` (Vite-only global) prevents running `client.ts` itself under plain `node`. Delete the temp `data/*.db` file afterward.

## Task 9 notes (projects Redux slice)

- To smoke-test a store/slice module that transitively imports `web/src/api/client.ts` (and thus reads `import.meta.env`) from a plain script — without spinning up a browser — use Vite's programmatic SSR module loader instead of `tsx`/`node` directly: `createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true } })` then `server.ssrLoadModule('/src/store/index.ts')`. This runs the real Vite transform pipeline (so `import.meta.env.VITE_API_URL` resolves correctly, settable via `process.env.VITE_API_URL` before `createServer`) without needing jsdom or a browser. The script must live inside `web/` (or be copied there before running) so `node` resolves the local `vite` package; call `server.close()` in a `finally` block or the process hangs.
- Headless Chrome (`google-chrome --headless=new --no-sandbox --dump-dom`) is installed on this machine but is slow/heavyweight to spin up in this WSL environment (many renderer/utility subprocesses, several seconds to converge) and `--dump-dom` captures the DOM at load, not after async effects resolve — not worth it for a quick smoke test when the Vite SSR module loader (above) answers the same question faster and more reliably. Reserve headless Chrome for cases where actual DOM/CSS rendering matters.
- `createSlice`'s `extraReducers` `.rejected` case action's `action.error` is RTK's `SerializedError` (plain object with an optional `message: string`), not an `Error` instance — use `action.error.message ?? 'Unknown error'` directly; don't write an `error instanceof Error` helper for it, since `action.error` never satisfies `instanceof Error` and the helper would silently always fall through to its default branch.
- `projectsSlice.ts` importing `type { RootState }` from `./index` while `./index` imports the slice's default export reducer is a circular import, but since the `RootState` import is `import type`-only it's erased at compile time and creates no runtime circular-require issue — safe pattern, no need to move selectors to a separate file to avoid it.