---
name: Round 2 Core Completion — Tasks, Labels, Smart Lists & Reminders UI
epic: epic-002
overview: "Deliver the full round-2 scope: tasks within projects, unified labels with filter/sort, cross-project smart lists, an Apple Reminders-style two-pane UI with theming and animation, and comprehensive tests."
todos:
  - id: tasks-schema
    content: Add a tasks table via additive idempotent CREATE TABLE IF NOT EXISTS in initSchema (id, project_id FK -> projects.id ON DELETE CASCADE, title NOT NULL, note nullable, completed INTEGER default 0, sort_order INTEGER, created_at, updated_at); keep PRAGMA foreign_keys = ON.
    status: pending
  - id: tasks-data-access
    content: Add api/src/types/task.ts and api/src/db/tasks.ts with prepared statements and typed functions createTask, listTasksByProject, getTask, updateTask (title/note/completed), deleteTask, countTasksByProject; map completed INTEGER 0/1 to/from boolean at the boundary.
    status: pending
  - id: tasks-rest-routes
    content: Add api/src/routes/tasks.ts (POST /api/projects/:projectId/tasks, GET /api/projects/:projectId/tasks, GET /api/tasks/:id, PUT /api/tasks/:id, DELETE /api/tasks/:id) with 400 validation and 404 for unknown task/parent project; register in server.ts.
    status: pending
  - id: live-task-count
    content: Update api/src/db/projects.ts listProjects to compute a real task_count via JOIN/subquery on tasks, replacing the hard-coded 0.
    status: pending
  - id: tasks-web-slice-ui
    content: Add web task types/client methods, web/src/store/tasksSlice.ts (fetch-by-project, create, update, toggle-complete, delete), register in store, and TaskList/TaskForm plus complete/incomplete toggle and delete-with-confirm wired to project selection in App.tsx.
    status: pending
  - id: labels-schema
    content: Add labels table (id, name NOT NULL, color) and task_labels join table (task_id FK ON DELETE CASCADE, label_id FK ON DELETE CASCADE, PK(task_id,label_id)) to initSchema, additive and idempotent.
    status: pending
  - id: labels-data-access
    content: Add api/src/types/label.ts and api/src/db/labels.ts with createLabel, listLabels, updateLabel (name/color), deleteLabel, plus assignLabelToTask, removeLabelFromTask, and listLabelsForTask; deleting a label removes its task_labels rows but not the tasks.
    status: pending
  - id: labels-rest-routes
    content: Add api/src/routes/labels.ts (CRUD on /api/labels/*) and label-assignment endpoints on tasks (e.g. PUT /api/tasks/:id/labels to set the label set); include tasks' label sets in task responses; register router in server.ts.
    status: pending
  - id: labels-web-slice-ui
    content: Add web/src/store/labelsSlice.ts and a labels management UI (create/rename/recolor/delete), plus a label picker on the task form and colored label chips on task rows.
    status: pending
  - id: filter-sort-labels
    content: Implement task filtering by one or more labels (AND semantics) and sorting by label, title, and completion with deterministic, documented tie-breaking; expose filter/sort controls in the main pane and apply them to both project lists and smart lists.
    status: pending
  - id: smart-lists-api
    content: Add API support for cross-project queries — list all tasks across projects (each with its project name), all completed tasks, and all tasks for a given label — via api/src/db and a routes/smart-lists (or query params on tasks) endpoint set.
    status: pending
  - id: smart-lists-ui
    content: Add smart lists in the sidebar — All, Completed, and one per label — that render cross-project tasks in the main pane with the project shown per row, honoring the same filter/sort controls.
    status: pending
  - id: reminders-layout
    content: Implement the two-pane layout — left sidebar (smart lists + projects with colored icons/dots) and a main task pane — replacing the current flat App layout; selecting any sidebar entry updates the main pane.
    status: pending
  - id: reminders-visuals
    content: Style task rows in the Apple Reminders idiom (circular checkbox, title, optional note, colored label chips, subtle dividers, system font) using CSS modules or a small utility layer, without copying proprietary assets.
    status: pending
  - id: theming-light-dark
    content: Add light and dark themes with a toggle; persist the choice (SQLite settings row or localStorage) and restore it on load; apply theme via CSS variables.
    status: pending
  - id: interaction-animations
    content: Add check-off completion transitions, hover/active states, and smooth add/remove row animations for tasks.
    status: pending
  - id: api-tests
    content: Add api tests for tasks, labels, label assignment, and smart-list queries — happy paths, validation (400), not-found (404), completion persistence, label-removal, and project-delete cascade to tasks and task_labels.
    status: pending
  - id: web-tests
    content: Add web tests for tasksSlice, labelsSlice, filtering/sorting logic, smart-list selection, task toggle, and label assignment components using Vitest + Testing Library.
    status: pending
  - id: single-command-suite
    content: Ensure a single documented command runs the full api + web suite green with no network access, and record run/build instructions in the README.
    status: pending
isProject: false
---

# Round 2 Core Completion — Tasks, Labels, Smart Lists & Reminders UI

## Goal
Deliver the complete round-2 scope in one epic, turning Project Todo Manager from a
projects-only skeleton into a usable, polished todo app. After this epic the user can create and
manage tasks within projects, apply a unified set of colored labels, filter and sort tasks by
label, browse tasks across all projects through Apple Reminders–style smart lists, and use a
two-pane themed UI with interaction polish — all covered by a comprehensive, single-command test
suite. Covers REQ-030–052 from the round-2 artifact.

## Current Baseline
- Monorepo: `api/` (Express + TS + better-sqlite3) and `web/` (React + Redux Toolkit + TS + Vite).
- Only a `projects` table exists (`id, name, description, created_at`); `PRAGMA foreign_keys = ON`.
- Projects REST CRUD exists; `GET /api/projects` returns `task_count` hard-coded to 0
  (`api/src/db/projects.ts`).
- Projects UI (`ProjectForm`, `ProjectList`, `DeleteConfirmDialog`) wired to `projectsSlice`;
  `App.tsx` is a flat, unstyled layout.
- Minimal tests only (`api/src/routes/projects.test.ts`, `web/src/App.test.tsx`); no styling.

## Implementation Plan
Recommended build order: Tasks → Labels + filter/sort → Smart lists → Reminders UI/theming →
finalize tests. Each phase ships its own tests.

### Phase 1 — Tasks CRUD & live count (REQ-030–036)
- Tasks table, data access, REST routes, and real project task count.
  - File: [api/src/db/index.ts](api/src/db/index.ts)
  - File: [api/src/types/task.ts](api/src/types/task.ts)
  - File: [api/src/db/tasks.ts](api/src/db/tasks.ts)
  - File: [api/src/db/projects.ts](api/src/db/projects.ts)
  - File: [api/src/routes/tasks.ts](api/src/routes/tasks.ts)
  - File: [api/src/server.ts](api/src/server.ts)
- Task web slice + UI wired to project selection.
  - File: [web/src/store/tasksSlice.ts](web/src/store/tasksSlice.ts)
  - File: [web/src/features/tasks/TaskList.tsx](web/src/features/tasks/TaskList.tsx)
  - File: [web/src/features/tasks/TaskForm.tsx](web/src/features/tasks/TaskForm.tsx)
  - File: [web/src/App.tsx](web/src/App.tsx)

### Phase 2 — Unified labels + filter/sort (REQ-037–041)
- Labels + join tables, data access, routes, web slice, and filter/sort controls.
  - File: [api/src/db/index.ts](api/src/db/index.ts)
  - File: [api/src/db/labels.ts](api/src/db/labels.ts)
  - File: [api/src/routes/labels.ts](api/src/routes/labels.ts)
  - File: [web/src/store/labelsSlice.ts](web/src/store/labelsSlice.ts)
  - File: [web/src/features/tasks/TaskList.tsx](web/src/features/tasks/TaskList.tsx)
  - Note: label filter is AND semantics; document sort tie-breaking (default incomplete-first, then title).

### Phase 3 — Cross-project smart lists (REQ-042–045)
- Cross-project queries (All, Completed, per-label) and sidebar smart lists reusing filter/sort.
  - File: [api/src/routes/tasks.ts](api/src/routes/tasks.ts)
  - File: [web/src/features/smartlists/SmartLists.tsx](web/src/features/smartlists/SmartLists.tsx)

### Phase 4 — Reminders-style UI, theming, animations (REQ-046–049)
- Two-pane layout, Reminders visuals, light/dark theme with persistence, interaction polish.
  - File: [web/src/App.tsx](web/src/App.tsx)
  - File: [web/src/features/layout/Sidebar.tsx](web/src/features/layout/Sidebar.tsx)
  - File: [web/src/styles/theme.css](web/src/styles/theme.css)

### Phase 5 — Testing (REQ-050–052)
- API and web tests shipped per phase; whole suite runs with one command.
  - File: [api/src/routes/tasks.test.ts](api/src/routes/tasks.test.ts)
  - File: [api/src/routes/labels.test.ts](api/src/routes/labels.test.ts)
  - File: [web/src/store/tasksSlice.test.ts](web/src/store/tasksSlice.test.ts)
  - File: [web/src/store/labelsSlice.test.ts](web/src/store/labelsSlice.test.ts)

## Data Flow
Representative request path (task + labels) from UI to SQLite.

```mermaid
flowchart LR
    UI["Sidebar + Task pane"] --> Slices["tasksSlice / labelsSlice thunks"]
    Slices -->|"HTTP JSON"| API["Express: /api/projects/:id/tasks, /api/tasks/:id, /api/labels"]
    API --> DAL["data-access (better-sqlite3)"]
    DAL --> DB[("SQLite: projects, tasks, labels, task_labels")]
    DB --> DAL --> API --> Slices --> UI
```

## Primary Files Expected to Change
- [api/src/db/index.ts](api/src/db/index.ts)
- [api/src/types/task.ts](api/src/types/task.ts)
- [api/src/types/label.ts](api/src/types/label.ts)
- [api/src/db/tasks.ts](api/src/db/tasks.ts)
- [api/src/db/labels.ts](api/src/db/labels.ts)
- [api/src/db/projects.ts](api/src/db/projects.ts)
- [api/src/routes/tasks.ts](api/src/routes/tasks.ts)
- [api/src/routes/labels.ts](api/src/routes/labels.ts)
- [api/src/server.ts](api/src/server.ts)
- [web/src/api/client.ts](web/src/api/client.ts)
- [web/src/api/types.ts](web/src/api/types.ts)
- [web/src/store/tasksSlice.ts](web/src/store/tasksSlice.ts)
- [web/src/store/labelsSlice.ts](web/src/store/labelsSlice.ts)
- [web/src/store/index.ts](web/src/store/index.ts)
- [web/src/features/tasks/TaskList.tsx](web/src/features/tasks/TaskList.tsx)
- [web/src/features/tasks/TaskForm.tsx](web/src/features/tasks/TaskForm.tsx)
- [web/src/features/smartlists/SmartLists.tsx](web/src/features/smartlists/SmartLists.tsx)
- [web/src/features/layout/Sidebar.tsx](web/src/features/layout/Sidebar.tsx)
- [web/src/styles/theme.css](web/src/styles/theme.css)
- [web/src/App.tsx](web/src/App.tsx)
- API + web test files listed in Phase 5

## Validation
Verifies AC-030–AC-052 from the round-2 artifact.

1. Project edit persists; project list shows a live task count that updates on task add/remove (AC-030, AC-031).
2. Create task with only a title; add a note; reload — both persist (AC-032).
3. Selecting a project shows only its tasks; edit and delete a task persist (AC-033–035).
4. Toggle completion on/off; reload — state and completed styling persist (AC-036).
5. Create/rename/recolor/delete labels persist; assign multiple labels to a task and remove one — exact set persists (AC-037, AC-038).
6. Delete a label — removed from all tasks, tasks remain (AC-039).
7. Filter by one and multiple labels (AND); clear restores full list; each sort option is deterministic (AC-040, AC-041).
8. "All" shows every task with its project; "Completed" shows only completed; a label smart list shows that label's tasks across projects; filter/sort behave identically in smart lists (AC-042–045).
9. Sidebar lists smart lists + projects; selecting updates the main pane; rows show checkbox/title/note/chips; sidebar shows colored icons (AC-046, AC-047).
10. Toggle theme switches light/dark immediately and persists after reload; check-off and add/remove animate; interactive elements have hover/active states (AC-048, AC-049).
11. A single documented command runs the whole api + web suite green with no network access (AC-050–052).
12. Deleting a project cascades to its tasks and their task_labels rows.

## Risks to manage
- Large scope — keep the recommended phase order so each slice is independently verifiable; do not start the UI phase before tasks and labels exist to display.
- Keep all schema changes additive and idempotent; never alter the existing `projects` table; keep `foreign_keys = ON` so cascades fire (project→tasks→task_labels).
- SQLite has no boolean — convert `completed` INTEGER 0/1 consistently at the API boundary.
- Define and document sort tie-breaking so tests are deterministic (default: incomplete-first, then title).
- Reuse one filter/sort implementation for both project lists and smart lists to avoid divergence.
- Reminders styling must be an idiomatic look-alike only — no proprietary Apple assets.

## Out of scope
- Due dates, reminders/notifications, priority, and recurring/sub-tasks.
- Drag-and-drop manual reordering (sort is by defined keys this round).
- Per-task activity history.
- Authentication, multi-user, cloud sync, or any remote backend.
- Data import/export and mobile-native apps.
