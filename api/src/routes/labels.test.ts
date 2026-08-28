import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import app from '../server.js';
import { db } from '../db/index.js';

const TEST_DB_PATH = path.resolve(process.cwd(), process.env.DB_PATH ?? './data/test.db');

async function createProject(name = 'Test Project'): Promise<number> {
  const res = await request(app).post('/api/projects').send({ name });
  return res.body.id;
}

async function createTask(projectId: number, title = 'Test Task'): Promise<number> {
  const res = await request(app).post(`/api/projects/${projectId}/tasks`).send({ title });
  return res.body.id;
}

async function createLabel(name = 'Test Label', color?: string): Promise<number> {
  const res = await request(app).post('/api/labels').send({ name, color });
  return res.body.id;
}

beforeEach(() => {
  db.exec('DELETE FROM task_labels');
  db.exec('DELETE FROM labels');
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM projects');
});

afterAll(() => {
  db.close();
  fs.rmSync(TEST_DB_PATH, { force: true });
});

describe('POST /api/labels', () => {
  it('creates a label with only a name and returns 201', async () => {
    const res = await request(app).post('/api/labels').send({ name: 'Urgent' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Urgent', color: null });
    expect(typeof res.body.id).toBe('number');
  });

  it('creates a label with a color and returns 201', async () => {
    const res = await request(app).post('/api/labels').send({ name: 'Home', color: '#ff0000' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Home', color: '#ff0000' });
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/labels').send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'name is required' });
  });

  it('returns 400 when name is blank', async () => {
    const res = await request(app).post('/api/labels').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'name is required' });
  });
});

describe('GET /api/labels', () => {
  it('returns all labels', async () => {
    await createLabel('Urgent');
    await createLabel('Home');

    const res = await request(app).get('/api/labels');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((label: { name: string }) => label.name).sort()).toEqual([
      'Home',
      'Urgent',
    ]);
  });
});

describe('GET /api/labels/:id', () => {
  it('returns the label when it exists', async () => {
    const id = await createLabel('Findable');

    const res = await request(app).get(`/api/labels/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, name: 'Findable' });
  });

  it('returns 404 when the label does not exist', async () => {
    const res = await request(app).get('/api/labels/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'label not found' });
  });
});

describe('PUT /api/labels/:id', () => {
  it('updates the name and preserves the color', async () => {
    const id = await createLabel('Old Name', '#00ff00');

    const res = await request(app).put(`/api/labels/${id}`).send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, name: 'New Name', color: '#00ff00' });
  });

  it('updates the color and preserves the name', async () => {
    const id = await createLabel('Keep Name', '#00ff00');

    const res = await request(app).put(`/api/labels/${id}`).send({ color: '#0000ff' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, name: 'Keep Name', color: '#0000ff' });
  });

  it('returns 400 when name is an empty string', async () => {
    const id = await createLabel('Has Name');

    const res = await request(app).put(`/api/labels/${id}`).send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'name must be a non-empty string' });
  });

  it('returns 404 when the label does not exist', async () => {
    const res = await request(app).put('/api/labels/999999').send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'label not found' });
  });
});

describe('DELETE /api/labels/:id', () => {
  it('deletes the label and returns 204', async () => {
    const id = await createLabel('To Delete');

    const res = await request(app).delete(`/api/labels/${id}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const followUp = await request(app).get(`/api/labels/${id}`);
    expect(followUp.status).toBe(404);
  });

  it('returns 404 when deleting an already-deleted label', async () => {
    const id = await createLabel('Delete Twice');

    await request(app).delete(`/api/labels/${id}`);
    const res = await request(app).delete(`/api/labels/${id}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'label not found' });
  });
});

describe('PUT /api/tasks/:id/labels', () => {
  it('sets the label set on a task and persists it', async () => {
    const projectId = await createProject();
    const taskId = await createTask(projectId);
    const labelId1 = await createLabel('Urgent');
    const labelId2 = await createLabel('Home');

    const res = await request(app)
      .put(`/api/tasks/${taskId}/labels`)
      .send({ label_ids: [labelId1, labelId2] });

    expect(res.status).toBe(200);
    expect(res.body.labels.map((label: { id: number }) => label.id).sort()).toEqual(
      [labelId1, labelId2].sort(),
    );

    const followUp = await request(app).get(`/api/tasks/${taskId}`);
    expect(followUp.body.labels).toHaveLength(2);
  });

  it('returns 400 when a label id does not exist and leaves the task unchanged', async () => {
    const projectId = await createProject();
    const taskId = await createTask(projectId);
    const labelId = await createLabel('Urgent');

    await request(app).put(`/api/tasks/${taskId}/labels`).send({ label_ids: [labelId] });

    const res = await request(app)
      .put(`/api/tasks/${taskId}/labels`)
      .send({ label_ids: [labelId, 999999] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'label 999999 not found' });

    const followUp = await request(app).get(`/api/tasks/${taskId}`);
    expect(followUp.body.labels.map((label: { id: number }) => label.id)).toEqual([labelId]);
  });

  it('returns 400 when the body is not an array', async () => {
    const projectId = await createProject();
    const taskId = await createTask(projectId);

    const res = await request(app)
      .put(`/api/tasks/${taskId}/labels`)
      .send({ label_ids: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'label_ids must be an array of numbers' });
  });

  it('returns 404 when the task does not exist', async () => {
    const labelId = await createLabel('Urgent');

    const res = await request(app)
      .put('/api/tasks/999999/labels')
      .send({ label_ids: [labelId] });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'task not found' });
  });
});

describe('deleting a label', () => {
  it('removes it from tasks labels arrays but leaves the task intact', async () => {
    const projectId = await createProject();
    const taskId = await createTask(projectId, 'Keep Me');
    const labelId1 = await createLabel('Urgent');
    const labelId2 = await createLabel('Home');
    await request(app)
      .put(`/api/tasks/${taskId}/labels`)
      .send({ label_ids: [labelId1, labelId2] });

    const deleteRes = await request(app).delete(`/api/labels/${labelId1}`);
    expect(deleteRes.status).toBe(204);

    const followUp = await request(app).get(`/api/tasks/${taskId}`);
    expect(followUp.status).toBe(200);
    expect(followUp.body.title).toBe('Keep Me');
    expect(followUp.body.labels.map((label: { id: number }) => label.id)).toEqual([labelId2]);
  });
});
