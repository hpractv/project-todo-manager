import { db } from './index.js';
import type { Label } from '../types/label.js';

const insertStmt = db.prepare<{ name: string; color: string | null }>(
  'INSERT INTO labels (name, color) VALUES (@name, @color)',
);

const selectByIdStmt = db.prepare<{ id: number }>('SELECT * FROM labels WHERE id = @id');

const selectAllStmt = db.prepare('SELECT * FROM labels ORDER BY id');

const deleteStmt = db.prepare<{ id: number }>('DELETE FROM labels WHERE id = @id');

const assignStmt = db.prepare<{ task_id: number; label_id: number }>(
  'INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (@task_id, @label_id)',
);

const removeAssignmentStmt = db.prepare<{ task_id: number; label_id: number }>(
  'DELETE FROM task_labels WHERE task_id = @task_id AND label_id = @label_id',
);

const selectLabelsForTaskStmt = db.prepare<{ task_id: number }>(
  `SELECT labels.* FROM labels
   JOIN task_labels ON task_labels.label_id = labels.id
   WHERE task_labels.task_id = @task_id
   ORDER BY labels.id`,
);

const selectTaskIdsForLabelStmt = db.prepare<{ label_id: number }>(
  'SELECT task_id FROM task_labels WHERE label_id = @label_id ORDER BY task_id',
);

export function createLabel(name: string, color?: string): Label {
  const result = insertStmt.run({ name, color: color ?? null });
  return getLabel(Number(result.lastInsertRowid)) as Label;
}

export function listLabels(): Label[] {
  return selectAllStmt.all() as Label[];
}

export function getLabel(id: number): Label | undefined {
  return selectByIdStmt.get({ id }) as Label | undefined;
}

export function updateLabel(
  id: number,
  data: { name?: string; color?: string },
): Label | undefined {
  const existing = getLabel(id);
  if (!existing) {
    return undefined;
  }

  const name = data.name ?? existing.name;
  const color = data.color !== undefined ? data.color : existing.color;

  db.prepare<{ id: number; name: string; color: string | null }>(
    'UPDATE labels SET name = @name, color = @color WHERE id = @id',
  ).run({ id, name, color });

  return getLabel(id);
}

export function deleteLabel(id: number): boolean {
  const result = deleteStmt.run({ id });
  return result.changes > 0;
}

export function assignLabelToTask(taskId: number, labelId: number): void {
  assignStmt.run({ task_id: taskId, label_id: labelId });
}

export function removeLabelFromTask(taskId: number, labelId: number): boolean {
  const result = removeAssignmentStmt.run({ task_id: taskId, label_id: labelId });
  return result.changes > 0;
}

export function listLabelsForTask(taskId: number): Label[] {
  return selectLabelsForTaskStmt.all({ task_id: taskId }) as Label[];
}

export function listTaskIdsForLabel(labelId: number): number[] {
  const rows = selectTaskIdsForLabelStmt.all({ label_id: labelId }) as { task_id: number }[];
  return rows.map((row) => row.task_id);
}
