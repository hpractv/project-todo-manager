import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import app from '../server.js';
import { db } from '../db/index.js';

const TEST_DB_PATH = path.resolve(process.cwd(), process.env.DB_PATH ?? './data/test.db');

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

describe('POST /api/projects', () => {
  it('creates a project and returns 201', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project', description: 'A test project' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Test Project', description: 'A test project' });
    expect(typeof res.body.id).toBe('number');
    expect(typeof res.body.created_at).toBe('string');
  });

  it('defaults description to null when omitted', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'No Description' });

    expect(res.status).toBe(201);
    expect(res.body.description).toBeNull();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/projects').send({ description: 'Missing name' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'name is required' });
  });

  it('returns 400 when name is blank', async () => {
    const res = await request(app).post('/api/projects').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'name is required' });
  });
});

describe('GET /api/projects', () => {
  it('returns an array of projects with task_count', async () => {
    await request(app).post('/api/projects').send({ name: 'Project A' });
    await request(app).post('/api/projects').send({ name: 'Project B' });

    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    for (const project of res.body) {
      expect(project).toHaveProperty('task_count');
      expect(typeof project.task_count).toBe('number');
    }
  });

  it('returns an empty array when there are no projects', async () => {
    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns the project when it exists', async () => {
    const created = await request(app).post('/api/projects').send({ name: 'Findable' });

    const res = await request(app).get(`/api/projects/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, name: 'Findable' });
  });

  it('returns 404 when the project does not exist', async () => {
    const res = await request(app).get('/api/projects/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'project not found' });
  });
});

describe('PUT /api/projects/:id', () => {
  it('updates the project and returns 200', async () => {
    const created = await request(app).post('/api/projects').send({ name: 'Original' });

    const res = await request(app)
      .put(`/api/projects/${created.body.id}`)
      .send({ name: 'Renamed', description: 'Updated description' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created.body.id,
      name: 'Renamed',
      description: 'Updated description',
    });
  });

  it('returns 404 when the project does not exist', async () => {
    const res = await request(app).put('/api/projects/999999').send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'project not found' });
  });

  it('returns 400 when name is missing', async () => {
    const created = await request(app).post('/api/projects').send({ name: 'Needs Name' });

    const res = await request(app)
      .put(`/api/projects/${created.body.id}`)
      .send({ description: 'No name provided' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'name is required' });
  });
});

describe('DELETE /api/projects/:id', () => {
  it('deletes the project and returns 204 with an empty body', async () => {
    const created = await request(app).post('/api/projects').send({ name: 'To Delete' });

    const res = await request(app).delete(`/api/projects/${created.body.id}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const followUp = await request(app).get(`/api/projects/${created.body.id}`);
    expect(followUp.status).toBe(404);
  });

  it('returns 404 when the project does not exist', async () => {
    const res = await request(app).delete('/api/projects/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'project not found' });
  });
});

describe('cascade behavior', () => {
  it('deleting a project removes its tasks and their task_labels rows, but keeps the label', async () => {
    const project = await request(app).post('/api/projects').send({ name: 'Cascade Project' });
    const projectId = project.body.id;

    const task1 = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Task One' });
    const task2 = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Task Two' });
    const task1Id = task1.body.id;
    const task2Id = task2.body.id;

    const label = await request(app).post('/api/labels').send({ name: 'Urgent' });
    const labelId = label.body.id;

    await request(app).put(`/api/tasks/${task1Id}/labels`).send({ label_ids: [labelId] });

    const deleteRes = await request(app).delete(`/api/projects/${projectId}`);
    expect(deleteRes.status).toBe(204);

    const allTasks = await request(app).get('/api/tasks');
    const remainingIds = allTasks.body.map((task: { id: number }) => task.id);
    expect(remainingIds).not.toContain(task1Id);
    expect(remainingIds).not.toContain(task2Id);

    const taskLabelRows = db
      .prepare('SELECT * FROM task_labels WHERE task_id = ?')
      .all(task1Id);
    expect(taskLabelRows).toEqual([]);

    const labelRes = await request(app).get(`/api/labels/${labelId}`);
    expect(labelRes.status).toBe(200);
    expect(labelRes.body).toMatchObject({ id: labelId, name: 'Urgent' });
  });
});
