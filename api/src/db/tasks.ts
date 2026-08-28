import { db } from './index.js';
import type { Task, TaskWithProject } from '../types/task.js';

interface TaskRow {
  id: number;
  project_id: number;
  title: string;
  note: string | null;
  completed: number;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

interface TaskWithProjectRow extends TaskRow {
  project_name: string | null;
}

function toTask(row: TaskRow): Task {
  return { ...row, completed: !!row.completed };
}

function toTaskWithProject(row: TaskWithProjectRow): TaskWithProject {
  return { ...toTask(row), project_name: row.project_name ?? '' };
}

const insertStmt = db.prepare<{ project_id: number; title: string; note: string | null }>(
  'INSERT INTO tasks (project_id, title, note) VALUES (@project_id, @title, @note)',
);

const selectByIdStmt = db.prepare<{ id: number }>('SELECT * FROM tasks WHERE id = @id');

const selectByProjectStmt = db.prepare<{ project_id: number }>(
  'SELECT * FROM tasks WHERE project_id = @project_id ORDER BY id',
);

const deleteStmt = db.prepare<{ id: number }>('DELETE FROM tasks WHERE id = @id');

const countByProjectStmt = db.prepare<{ project_id: number }>(
  'SELECT COUNT(*) AS count FROM tasks WHERE project_id = @project_id',
);

const selectAllWithProjectStmt = db.prepare(
  `SELECT tasks.*, projects.name AS project_name
   FROM tasks
   LEFT JOIN projects ON projects.id = tasks.project_id
   ORDER BY tasks.completed ASC, tasks.title ASC`,
);

const selectCompletedWithProjectStmt = db.prepare(
  `SELECT tasks.*, projects.name AS project_name
   FROM tasks
   LEFT JOIN projects ON projects.id = tasks.project_id
   WHERE tasks.completed = 1
   ORDER BY tasks.completed ASC, tasks.title ASC`,
);

const selectByLabelWithProjectStmt = db.prepare<{ label_id: number }>(
  `SELECT tasks.*, projects.name AS project_name
   FROM tasks
   LEFT JOIN projects ON projects.id = tasks.project_id
   JOIN task_labels ON task_labels.task_id = tasks.id
   WHERE task_labels.label_id = @label_id
   ORDER BY tasks.completed ASC, tasks.title ASC`,
);

export function createTask(projectId: number, title: string, note?: string): Task {
  const result = insertStmt.run({ project_id: projectId, title, note: note ?? null });
  return getTask(Number(result.lastInsertRowid)) as Task;
}

export function listTasksByProject(projectId: number): Task[] {
  const rows = selectByProjectStmt.all({ project_id: projectId }) as TaskRow[];
  return rows.map(toTask);
}

export function getTask(id: number): Task | undefined {
  const row = selectByIdStmt.get({ id }) as TaskRow | undefined;
  return row ? toTask(row) : undefined;
}

export function updateTask(
  id: number,
  data: { title?: string; note?: string; completed?: boolean },
): Task | undefined {
  const existing = getTask(id);
  if (!existing) {
    return undefined;
  }

  const title = data.title ?? existing.title;
  const note = data.note !== undefined ? data.note : existing.note;
  const completed = data.completed !== undefined ? data.completed : existing.completed;

  db.prepare<{ id: number; title: string; note: string | null; completed: number }>(
    `UPDATE tasks
     SET title = @title, note = @note, completed = @completed, updated_at = CURRENT_TIMESTAMP
     WHERE id = @id`,
  ).run({ id, title, note, completed: completed ? 1 : 0 });

  return getTask(id);
}

export function deleteTask(id: number): boolean {
  const result = deleteStmt.run({ id });
  return result.changes > 0;
}

export function countTasksByProject(projectId: number): number {
  const row = countByProjectStmt.get({ project_id: projectId }) as { count: number };
  return row.count;
}

export function listAllTasks(): TaskWithProject[] {
  const rows = selectAllWithProjectStmt.all() as TaskWithProjectRow[];
  return rows.map(toTaskWithProject);
}

export function listCompletedTasks(): TaskWithProject[] {
  const rows = selectCompletedWithProjectStmt.all() as TaskWithProjectRow[];
  return rows.map(toTaskWithProject);
}

export function listTasksByLabel(labelId: number): TaskWithProject[] {
  const rows = selectByLabelWithProjectStmt.all({ label_id: labelId }) as TaskWithProjectRow[];
  return rows.map(toTaskWithProject);
}
