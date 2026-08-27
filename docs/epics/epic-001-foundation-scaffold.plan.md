---
name: Foundation Scaffold — Projects CRUD & Local Persistence
epic: epic-001
overview: "Stand up the local Node app skeleton (Vite React/Redux+TS front end, Express+TS API, SQLite via better-sqlite3) and deliver full Projects CRUD end to end."
todos:
  - id: init-monorepo
    content: Initialize the repository with a web/ (Vite React+TS) workspace and an api/ (Express+TS) workspace, plus root scripts to install and run both.
    status: pending
  - id: setup-vite-react-redux
    content: Scaffold the Vite React+TypeScript app in web/ and configure the Redux store (Redux Toolkit) with a typed root state and typed hooks.
    status: pending
  - id: setup-express-api
    content: Create the Express+TypeScript server in api/ with JSON middleware, CORS for the local Vite origin, a health check route, and a configurable port.
    status: pending
  - id: setup-sqlite-db
    content: Add better-sqlite3, create a DB bootstrap module that opens/creates the local SQLite file and runs an idempotent schema init for the projects table.
    status: pending
  - id: define-projects-schema
    content: Define the projects table (id INTEGER PK, name TEXT NOT NULL, description TEXT, created_at DATETIME) and a data-access module with typed functions for create/list/get/update/delete.
    status: pending
  - id: build-projects-rest-api
    content: Implement REST endpoints — POST /api/projects, GET /api/projects (with task_count), GET /api/projects/:id, PUT /api/projects/:id, DELETE /api/projects/:id — wired to the data-access module.
    status: pending
  - id: projects-redux-slice
    content: Create a projects Redux slice with async thunks calling the REST endpoints, plus loading/error state, and a typed API client module for the web app.
    status: pending
  - id: projects-ui
    content: Build the projects UI — a project list showing name and task count, a create/edit form, a select-project interaction, and a delete action with a confirmation prompt.
    status: pending
  - id: cascade-delete-confirm
    content: Implement project deletion so it prompts for confirmation and cascades to the project's tasks at the DB layer (foreign-key ON DELETE CASCADE ready for the tasks table).
    status: pending
  - id: run-and-persist-docs
    content: Document install and run commands in a README, and verify data persists across an app restart by pointing at the same SQLite file.
    status: pending
  - id: foundation-tests
    content: Add integration tests for all five projects endpoints (happy path plus not-found and validation errors) and a smoke test asserting the web app builds and the store initializes.
    status: pending
isProject: false
---

# Foundation Scaffold — Projects CRUD & Local Persistence

## Goal
Establish the runnable local skeleton for Project Todo Manager and deliver the first
vertical feature slice — Projects CRUD — end to end. After this epic, a developer can install
and start both the Express API and the Vite React/Redux app, create/list/edit/select/delete
projects through the UI, and see that data persist in a local SQLite database across restarts.
This is the base every later epic (tasks, task types, tags, search, activity, theming) builds on.

## Current Baseline
Greenfield. Only the approved requirements artifact
(`20260825_project-todo-manager_requirements.md`) exists; no code yet.

## Implementation Plan

### Repository & tooling
- Two-workspace layout: `web/` (front end) and `api/` (back end), with root-level install/run scripts.
  - File: [package.json](package.json)
  - Keep everything local; no external services required to run.

### Front end (React / Redux / TypeScript / Vite)
- Vite React+TS app with a Redux Toolkit store, typed root state, and typed `useAppSelector`/`useAppDispatch` hooks.
  - File: [web/src/store/index.ts](web/src/store/index.ts)
  - File: [web/src/store/projectsSlice.ts](web/src/store/projectsSlice.ts)
- Typed REST client used by all thunks; browser never touches SQLite directly (REQ-029).
  - File: [web/src/api/client.ts](web/src/api/client.ts)
- Projects UI: list with name + task count, create/edit form, select interaction, delete-with-confirm.
  - File: [web/src/features/projects/ProjectList.tsx](web/src/features/projects/ProjectList.tsx)
  - File: [web/src/features/projects/ProjectForm.tsx](web/src/features/projects/ProjectForm.tsx)

### Back end (Express / TypeScript / better-sqlite3)
- Express app with JSON body parsing, CORS for the Vite origin, health check, configurable port.
  - File: [api/src/server.ts](api/src/server.ts)
- SQLite bootstrap: open/create the DB file, run idempotent schema init, enable foreign keys.
  - File: [api/src/db/index.ts](api/src/db/index.ts)
- Projects schema + data-access functions and REST routes.
  - File: [api/src/db/projects.ts](api/src/db/projects.ts)
  - File: [api/src/routes/projects.ts](api/src/routes/projects.ts)

## Data Flow
Projects CRUD request path from UI to disk.

```mermaid
flowchart LR
    UI["Project UI"] --> Slice["projects Redux slice (thunks)"]
    Slice -->|"HTTP JSON"| Routes["Express /api/projects"]
    Routes --> DAL["projects data-access (better-sqlite3)"]
    DAL --> DB[("SQLite file")]
    DB --> DAL --> Routes --> Slice --> UI
```

## Primary Files Expected to Change
- [package.json](package.json)
- [api/src/server.ts](api/src/server.ts)
- [api/src/db/index.ts](api/src/db/index.ts)
- [api/src/db/projects.ts](api/src/db/projects.ts)
- [api/src/routes/projects.ts](api/src/routes/projects.ts)
- [web/src/store/index.ts](web/src/store/index.ts)
- [web/src/store/projectsSlice.ts](web/src/store/projectsSlice.ts)
- [web/src/api/client.ts](web/src/api/client.ts)
- [web/src/features/projects/ProjectList.tsx](web/src/features/projects/ProjectList.tsx)
- [web/src/features/projects/ProjectForm.tsx](web/src/features/projects/ProjectForm.tsx)

## Validation
Verifies acceptance criteria AC-001–AC-006 and AC-026–AC-030 from the requirements artifact.

1. Install dependencies and start both the API and the web app with the documented commands.
2. Create a project via the UI; reload the page — it still appears (AC-001).
3. The project list shows each project with a task count (AC-002).
4. Edit a project's name/description; reload — the change persists (AC-003).
5. Select a project — the app switches to that project's context (AC-004, task list may be empty here).
6. Delete a project — a confirmation is required; after confirming it is gone and stays gone after reload (AC-005, AC-006).
7. Stop and restart the app pointing at the same SQLite file — all projects are still present (AC-027).
8. With external network access disabled, all of the above still work (AC-026).
9. Inspect network traffic: all persistence goes through `/api/projects`; the browser makes no direct DB access (AC-029).
10. Integration tests for all five endpoints pass (happy path + not-found + validation).

## Risks to manage
- better-sqlite3 is a native module — ensure it builds against the local Node version; document the Node version.
- Enable `PRAGMA foreign_keys = ON` per connection so the future tasks cascade behaves as specified.
- Keep the schema-init idempotent so restarts don't error on existing tables.
- Design the projects data-access and schema so the tasks table (next epic) can be added with a foreign key without rework.

## Out of scope
- Tasks, task types, tags, search, sorting, drag-and-drop, activity history, and theming — all handled in later epics.
- Authentication, multi-user, cloud sync, and any remote backend.
- Data import/export.
