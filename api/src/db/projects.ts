import { db } from './index.js';
import type { Project } from '../types/project.js';

const insertStmt = db.prepare<{ name: string; description: string | null }>(
  'INSERT INTO projects (name, description) VALUES (@name, @description)',
);

const selectByIdStmt = db.prepare<{ id: number }>(
  'SELECT id, name, description, created_at FROM projects WHERE id = @id',
);

const selectAllWithTaskCountStmt = db.prepare(
  `SELECT projects.id, projects.name, projects.description, projects.created_at,
          COUNT(tasks.id) AS task_count
   FROM projects
   LEFT JOIN tasks ON tasks.project_id = projects.id
   GROUP BY projects.id
   ORDER BY projects.id`,
);

const deleteStmt = db.prepare<{ id: number }>('DELETE FROM projects WHERE id = @id');

export function createProject(name: string, description?: string): Project {
  const result = insertStmt.run({ name, description: description ?? null });
  return getProject(Number(result.lastInsertRowid)) as Project;
}

export function listProjects(): (Project & { task_count: number })[] {
  return selectAllWithTaskCountStmt.all() as (Project & { task_count: number })[];
}

export function getProject(id: number): Project | undefined {
  return selectByIdStmt.get({ id }) as Project | undefined;
}

export function updateProject(
  id: number,
  data: { name?: string; description?: string },
): Project | undefined {
  const existing = getProject(id);
  if (!existing) {
    return undefined;
  }

  const name = data.name ?? existing.name;
  const description = data.description !== undefined ? data.description : existing.description;

  db.prepare<{ id: number; name: string; description: string | null }>(
    'UPDATE projects SET name = @name, description = @description WHERE id = @id',
  ).run({ id, name, description });

  return getProject(id);
}

export function deleteProject(id: number): boolean {
  const result = deleteStmt.run({ id });
  return result.changes > 0;
}
