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

beforeEach(() => {
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM projects');
});

afterAll(() => {
  db.close();
  fs.rmSync(TEST_DB_PATH, { force: true });
});

describe('POST /api/projects/:projectId/tasks', () => {
  it('creates a task with only a title and returns 201', async () => {
    const projectId = await createProject();

    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Buy milk' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      project_id: projectId,
      title: 'Buy milk',
      note: null,
      completed: false,
      labels: [],
    });
    expect(typeof res.body.id).toBe('number');
    expect(typeof res.body.created_at).toBe('string');
  });

  it('creates a task with a note and returns 201', async () => {
    const projectId = await createProject();

    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Buy milk', note: 'Get the oat kind' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Buy milk',
      note: 'Get the oat kind',
    });
  });

  it('returns 400 when title is missing', async () => {
    const projectId = await createProject();

    const res = await request(app).post(`/api/projects/${projectId}/tasks`).send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });

  it('returns 400 when title is blank', async () => {
    const projectId = await createProject();

    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title is required' });
  });

  it('returns 404 when the project does not exist', async () => {
    const res = await request(app)
      .post('/api/projects/999999/tasks')
      .send({ title: 'Orphan task' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'project not found' });
  });
});

describe('GET /api/projects/:projectId/tasks', () => {
  it('returns only tasks belonging to that project', async () => {
    const projectId = await createProject('Project A');
    const otherProjectId = await createProject('Project B');
    await request(app).post(`/api/projects/${projectId}/tasks`).send({ title: 'Task 1' });
    await request(app).post(`/api/projects/${projectId}/tasks`).send({ title: 'Task 2' });
    await request(app).post(`/api/projects/${otherProjectId}/tasks`).send({ title: 'Other' });

    const res = await request(app).get(`/api/projects/${projectId}/tasks`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    for (const task of res.body) {
      expect(task.project_id).toBe(projectId);
    }
  });

  it('returns an empty array when the project has no tasks', async () => {
    const projectId = await createProject();

    const res = await request(app).get(`/api/projects/${projectId}/tasks`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 when the project does not exist', async () => {
    const res = await request(app).get('/api/projects/999999/tasks');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'project not found' });
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns the task when it exists', async () => {
    const projectId = await createProject();
    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Findable task' });

    const res = await request(app).get(`/api/tasks/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, title: 'Findable task' });
  });

  it('returns 404 when the task does not exist', async () => {
    const res = await request(app).get('/api/tasks/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'task not found' });
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates the title and returns 200', async () => {
    const projectId = await createProject();
    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Original title' });

    const res = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ title: 'Renamed title' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, title: 'Renamed title' });
  });

  it('updates completed and converts it to a boolean', async () => {
    const projectId = await createProject();
    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Task to complete' });

    const res = await request(app).put(`/api/tasks/${created.body.id}`).send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(typeof res.body.completed).toBe('boolean');

    const uncheck = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ completed: false });

    expect(uncheck.status).toBe(200);
    expect(uncheck.body.completed).toBe(false);
  });

  it('returns 400 when completed is not a boolean', async () => {
    const projectId = await createProject();
    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Task' });

    const res = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ completed: 'yes' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'completed must be a boolean' });
  });

  it('returns 400 when title is blank', async () => {
    const projectId = await createProject();
    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Task' });

    const res = await request(app).put(`/api/tasks/${created.body.id}`).send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'title must be a non-empty string' });
  });

  it('returns 404 when the task does not exist', async () => {
    const res = await request(app).put('/api/tasks/999999').send({ title: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'task not found' });
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes the task and returns 204 with an empty body', async () => {
    const projectId = await createProject();
    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'To delete' });

    const res = await request(app).delete(`/api/tasks/${created.body.id}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const followUp = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(followUp.status).toBe(404);
  });

  it('returns 404 when the task does not exist', async () => {
    const res = await request(app).delete('/api/tasks/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'task not found' });
  });

  it('returns 404 when deleting an already-deleted task', async () => {
    const projectId = await createProject();
    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Delete twice' });

    await request(app).delete(`/api/tasks/${created.body.id}`);
    const res = await request(app).delete(`/api/tasks/${created.body.id}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'task not found' });
  });
});
