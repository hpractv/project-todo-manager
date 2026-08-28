import { Router } from 'express';
import {
  createTask,
  listTasksByProject,
  getTask,
  updateTask,
  deleteTask,
} from '../db/tasks.js';
import { getProject } from '../db/projects.js';

const router = Router();

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
  res.status(201).json(task);
});

router.get('/projects/:projectId/tasks', (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = getProject(projectId);

  if (!project) {
    res.status(404).json({ error: 'project not found' });
    return;
  }

  res.json(listTasksByProject(projectId));
});

router.get('/tasks/:id', (req, res) => {
  const task = getTask(Number(req.params.id));

  if (!task) {
    res.status(404).json({ error: 'task not found' });
    return;
  }

  res.json(task);
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

  res.json(task);
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
