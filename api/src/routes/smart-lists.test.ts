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

async function setTaskLabels(taskId: number, labelIds: number[]): Promise<void> {
  await request(app).put(`/api/tasks/${taskId}/labels`).send({ label_ids: labelIds });
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

describe('GET /api/tasks (smart lists)', () => {
  it('returns all tasks across projects with project_name and labels', async () => {
    const projectId1 = await createProject('Project A');
    const projectId2 = await createProject('Project B');
    const taskId1 = await createTask(projectId1, 'Mango');
    const taskId2 = await createTask(projectId2, 'Zebra');
    const labelId = await createLabel('Urgent');
    await setTaskLabels(taskId1, [labelId]);

    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const mango = res.body.find((t: { id: number }) => t.id === taskId1);
    const zebra = res.body.find((t: { id: number }) => t.id === taskId2);

    expect(mango).toMatchObject({ project_id: projectId1, project_name: 'Project A' });
    expect(mango.labels.map((l: { id: number }) => l.id)).toEqual([labelId]);
    expect(zebra).toMatchObject({ project_id: projectId2, project_name: 'Project B', labels: [] });
  });

  it('sorts incomplete tasks first, then alphabetically by title', async () => {
    const projectId = await createProject();
    const zebraId = await createTask(projectId, 'Zebra');
    const appleId = await createTask(projectId, 'Apple');
    const mangoId = await createTask(projectId, 'Mango');
    await request(app).put(`/api/tasks/${appleId}`).send({ completed: true });

    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body.map((t: { id: number }) => t.id)).toEqual([mangoId, zebraId, appleId]);
  });

  it('returns an empty array when there are no tasks', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/tasks?completed=true', () => {
  it('returns only completed tasks', async () => {
    const projectId = await createProject();
    const taskId1 = await createTask(projectId, 'Done task');
    const taskId2 = await createTask(projectId, 'Pending task');
    await request(app).put(`/api/tasks/${taskId1}`).send({ completed: true });

    const res = await request(app).get('/api/tasks?completed=true');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: taskId1, completed: true });
    expect(res.body.some((t: { id: number }) => t.id === taskId2)).toBe(false);
  });

  it('returns an empty array when no tasks are completed', async () => {
    const projectId = await createProject();
    await createTask(projectId, 'Pending task');

    const res = await request(app).get('/api/tasks?completed=true');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/tasks?labelId=<id>', () => {
  it('returns only tasks assigned that label', async () => {
    const projectId = await createProject();
    const taskId1 = await createTask(projectId, 'Labeled task');
    const taskId2 = await createTask(projectId, 'Unlabeled task');
    const labelId = await createLabel('Urgent');
    await setTaskLabels(taskId1, [labelId]);

    const res = await request(app).get(`/api/tasks?labelId=${labelId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(taskId1);
    expect(res.body[0].labels.map((l: { id: number }) => l.id)).toEqual([labelId]);
    expect(res.body.some((t: { id: number }) => t.id === taskId2)).toBe(false);
  });

  it('returns tasks with that label across multiple projects', async () => {
    const projectId1 = await createProject('Project A');
    const projectId2 = await createProject('Project B');
    const labelId = await createLabel('Shared');
    const taskId1 = await createTask(projectId1, 'From A');
    const taskId2 = await createTask(projectId2, 'From B');
    await setTaskLabels(taskId1, [labelId]);
    await setTaskLabels(taskId2, [labelId]);

    const res = await request(app).get(`/api/tasks?labelId=${labelId}`);

    expect(res.status).toBe(200);
    expect(res.body.map((t: { id: number }) => t.id).sort()).toEqual(
      [taskId1, taskId2].sort(),
    );
  });

  it('returns 400 when labelId does not reference an existing label', async () => {
    const res = await request(app).get('/api/tasks?labelId=9999');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'labelId must reference an existing label' });
  });

  it('returns 400 when labelId is malformed', async () => {
    const res = await request(app).get('/api/tasks?labelId=abc');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'labelId must reference an existing label' });
  });
});
