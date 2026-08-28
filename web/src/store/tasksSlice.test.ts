import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../api/types';
import projectsReducer from './projectsSlice';
import tasksReducer, {
  createTask,
  deleteTask,
  fetchTasksByProject,
  selectCurrentTaskProjectId,
  selectTasks,
  selectTasksError,
  selectTasksLoading,
  toggleComplete,
  updateTask,
} from './tasksSlice';

vi.mock('../api/client', () => ({
  fetchProjects: vi.fn(),
  fetchProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import * as api from '../api/client';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    project_id: 1,
    title: 'Buy milk',
    note: null,
    completed: false,
    sort_order: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeStore() {
  return configureStore({ reducer: { projects: projectsReducer, tasks: tasksReducer } });
}

describe('tasksSlice initial state', () => {
  it('has the expected default shape', () => {
    const store = makeStore();
    expect(store.getState().tasks).toEqual({
      tasks: [],
      loading: false,
      error: null,
      currentProjectId: null,
    });
  });
});

describe('fetchTasksByProject', () => {
  it('loads tasks for a project and records currentProjectId', async () => {
    const task = makeTask();
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([task]);

    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));

    const state = store.getState();
    expect(api.fetchTasks).toHaveBeenCalledWith(1);
    expect(selectTasks(state)).toEqual([task]);
    expect(selectCurrentTaskProjectId(state)).toBe(1);
    expect(selectTasksLoading(state)).toBe(false);
    expect(selectTasksError(state)).toBeNull();
  });

  it('records an error message when the request fails', async () => {
    vi.mocked(api.fetchTasks).mockRejectedValueOnce(new Error('network down'));

    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));

    expect(selectTasksError(store.getState())).toBe('network down');
    expect(selectTasksLoading(store.getState())).toBe(false);
  });
});

describe('createTask', () => {
  it('appends the created task to state', async () => {
    const task = makeTask({ id: 2, title: 'New task' });
    vi.mocked(api.createTask).mockResolvedValueOnce(task);

    const store = makeStore();
    await store.dispatch(createTask({ projectId: 1, data: { title: 'New task' } }));

    expect(api.createTask).toHaveBeenCalledWith(1, { title: 'New task' });
    expect(selectTasks(store.getState())).toEqual([task]);
  });
});

describe('updateTask', () => {
  it('replaces the matching task with the updated one', async () => {
    const original = makeTask();
    const updated = makeTask({ title: 'Buy oat milk' });
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([original]);
    vi.mocked(api.updateTask).mockResolvedValueOnce(updated);

    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));
    await store.dispatch(updateTask({ id: 1, data: { title: 'Buy oat milk' } }));

    expect(api.updateTask).toHaveBeenCalledWith(1, { title: 'Buy oat milk' });
    expect(selectTasks(store.getState())).toEqual([updated]);
  });
});

describe('toggleComplete', () => {
  it('calls updateTask with the completed flag flipped', async () => {
    const original = makeTask({ completed: false });
    const toggled = makeTask({ completed: true });
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([original]);
    vi.mocked(api.updateTask).mockResolvedValueOnce(toggled);

    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));
    await store.dispatch(toggleComplete(original));

    expect(api.updateTask).toHaveBeenCalledWith(1, { completed: true });
    expect(selectTasks(store.getState())).toEqual([toggled]);
  });
});

describe('deleteTask', () => {
  it('removes the task from state', async () => {
    const task = makeTask();
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([task]);
    vi.mocked(api.deleteTask).mockResolvedValueOnce(undefined);

    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));
    await store.dispatch(deleteTask(1));

    expect(api.deleteTask).toHaveBeenCalledWith(1);
    expect(selectTasks(store.getState())).toEqual([]);
  });
});
