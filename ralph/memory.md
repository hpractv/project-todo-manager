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
- Do not name a root script `install` — it collides with npm's reserved lifecycle hook and would recursively re-trigger on every `npm install`, breaking that acceptance check. `install:all` (or similar) is the correct alternative even if a task's file list says "scripts: install, dev, build".

## Gotchas

- Task 2 (Vite React+TS scaffold): use `"build": "tsc && vite build"` (plain `tsc`, not `tsc -b`) in `web/package.json` — `tsc -b` is composite/project-reference build mode and adds unneeded complexity for a single non-composite `web/tsconfig.json`. Set `"noEmit": true` in `web/tsconfig.json` since Vite (esbuild) does the actual transpile/bundle; `tsc` there is type-check-only.
- `web/tsconfig.json` must override `lib` to add `"DOM", "DOM.Iterable"` on top of the root `tsconfig.base.json`'s `ES2022`-only lib list, or DOM globals (`document`, etc.) won't resolve.
- When manually verifying `npm run dev -w web`, port 5173 may already be occupied by an unrelated Vite server from a different project on the same machine — Vite auto-falls-back to 5174 and logs it; check `lsof -i :5173` / process cwd before assuming it's a conflict worth fixing.

- Repo started with zero commits on branch `init` (no `main` yet) — do not assume `git log`/`main` exist when bootstrapping.
- Root `.gitignore` must cover `node_modules/`, `dist/`, `*.db`, `*.sqlite`, `*.sqlite3` before running `npm install`, otherwise workspace installs will pollute git status.
- Placeholder `dev`/`build` scripts in `web/`/`api/` (before Vite/Express are scaffolded) use `echo "..."` so `npm run dev`/`npm run build` succeed end-to-end without erroring on missing scripts.