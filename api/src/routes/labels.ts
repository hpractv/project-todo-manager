import { Router } from 'express';
import { createLabel, listLabels, getLabel, updateLabel, deleteLabel } from '../db/labels.js';

const router = Router();

router.post('/', (req, res) => {
  const { name, color } = req.body ?? {};

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const label = createLabel(name, color);
  res.status(201).json(label);
});

router.get('/', (_req, res) => {
  res.json(listLabels());
});

router.get('/:id', (req, res) => {
  const label = getLabel(Number(req.params.id));

  if (!label) {
    res.status(404).json({ error: 'label not found' });
    return;
  }

  res.json(label);
});

router.put('/:id', (req, res) => {
  const { name, color } = req.body ?? {};

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    res.status(400).json({ error: 'name must be a non-empty string' });
    return;
  }

  const label = updateLabel(Number(req.params.id), { name, color });

  if (!label) {
    res.status(404).json({ error: 'label not found' });
    return;
  }

  res.json(label);
});

router.delete('/:id', (req, res) => {
  const deleted = deleteLabel(Number(req.params.id));

  if (!deleted) {
    res.status(404).json({ error: 'label not found' });
    return;
  }

  res.status(204).send();
});

export default router;
