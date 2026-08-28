import { Router } from 'express';
import {
  createTask,
  listTasksByProject,
  getTask,
  updateTask,
  deleteTask,
  listAllTasks,
  listCompletedTasks,
  listTasksByLabel,
} from '../db/tasks.js';
import { getProject } from '../db/projects.js';
import {
  listLabelsForTask,
  getLabel,
  assignLabelToTask,
  removeLabelFromTask,
} from '../db/labels.js';
import type { Task } from '../types/task.js';
import type { Label } from '../types/label.js';

const router = Router();

function withLabels<T extends Task>(task: T): T & { labels: Label[] } {
  return { ...task, labels: listLabelsForTask(task.id) };
}

router.post('/projects/:projectId/tasks', (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = getProject(projectId);

  if (!project) {
    res.status(404).json({ error: 'project not found' });
    return;
  }

  const { title, note } = req.body ?? {};

  if (typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const task = createTask(projectId, title, note);
  res.status(201).json(withLabels(task));
});

router.get('/projects/:projectId/tasks', (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = getProject(projectId);

  if (!project) {
    res.status(404).json({ error: 'project not found' });
    return;
  }

  res.json(listTasksByProject(projectId).map(withLabels));
});

router.get('/tasks', (req, res) => {
  const { labelId, completed } = req.query;

  if (labelId !== undefined) {
    const parsedLabelId = Number(labelId);

    if (!Number.isInteger(parsedLabelId) || !getLabel(parsedLabelId)) {
      res.status(400).json({ error: 'labelId must reference an existing label' });
      return;
    }

    res.json(listTasksByLabel(parsedLabelId).map(withLabels));
    return;
  }

  if (completed === 'true') {
    res.json(listCompletedTasks().map(withLabels));
    return;
  }

  res.json(listAllTasks().map(withLabels));
});

router.get('/tasks/:id', (req, res) => {
  const task = getTask(Number(req.params.id));

  if (!task) {
    res.status(404).json({ error: 'task not found' });
    return;
  }

  res.json(withLabels(task));
});

router.put('/tasks/:id', (req, res) => {
  const { title, note, completed } = req.body ?? {};

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    res.status(400).json({ error: 'title must be a non-empty string' });
    return;
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    res.status(400).json({ error: 'completed must be a boolean' });
    return;
  }

  const task = updateTask(Number(req.params.id), { title, note, completed });

  if (!task) {
    res.status(404).json({ error: 'task not found' });
    return;
  }

  res.json(withLabels(task));
});

router.put('/tasks/:id/labels', (req, res) => {
  const taskId = Number(req.params.id);
  const task = getTask(taskId);

  if (!task) {
    res.status(404).json({ error: 'task not found' });
    return;
  }

  const { label_ids } = req.body ?? {};

  if (!Array.isArray(label_ids) || !label_ids.every((id) => typeof id === 'number')) {
    res.status(400).json({ error: 'label_ids must be an array of numbers' });
    return;
  }

  for (const labelId of label_ids) {
    if (!getLabel(labelId)) {
      res.status(400).json({ error: `label ${labelId} not found` });
      return;
    }
  }

  for (const label of listLabelsForTask(taskId)) {
    removeLabelFromTask(taskId, label.id);
  }
  for (const labelId of label_ids) {
    assignLabelToTask(taskId, labelId);
  }

  res.json(withLabels(task));
});

router.delete('/tasks/:id', (req, res) => {
  const deleted = deleteTask(Number(req.params.id));

  if (!deleted) {
    res.status(404).json({ error: 'task not found' });
    return;
  }

  res.status(204).send();
});

export default router;
