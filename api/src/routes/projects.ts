import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../db/projects.js';

const router = Router();

router.post('/', (req, res) => {
  const { name, description } = req.body ?? {};

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const project = createProject(name, description);
  res.status(201).json(project);
});

router.get('/', (_req, res) => {
  res.json(listProjects());
});

router.get('/:id', (req, res) => {
  const project = getProject(Number(req.params.id));

  if (!project) {
    res.status(404).json({ error: 'project not found' });
    return;
  }

  res.json(project);
});

router.put('/:id', (req, res) => {
  const { name, description } = req.body ?? {};

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const project = updateProject(Number(req.params.id), { name, description });

  if (!project) {
    res.status(404).json({ error: 'project not found' });
    return;
  }

  res.json(project);
});

router.delete('/:id', (req, res) => {
  const deleted = deleteProject(Number(req.params.id));

  if (!deleted) {
    res.status(404).json({ error: 'project not found' });
    return;
  }

  res.status(204).send();
});

export default router;
