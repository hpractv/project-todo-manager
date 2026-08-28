import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../api/types';
import labelsReducer, { deleteLabel, updateLabel } from './labelsSlice';
import projectsReducer from './projectsSlice';
import tasksReducer, {
  createTask,
  deleteTask,
  fetchTasksByProject,
  selectCurrentTaskProjectId,
  selectFilteredSortedTasks,
  selectTasks,
  selectTasksError,
  selectTasksLoading,
  setFilterLabels,
  setSort,
  setTaskLabels,
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
  setTaskLabels: vi.fn(),
  fetchLabels: vi.fn(),
  createLabel: vi.fn(),
  updateLabel: vi.fn(),
  deleteLabel: vi.fn(),
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
  return configureStore({
    reducer: { projects: projectsReducer, tasks: tasksReducer, labels: labelsReducer },
  });
}

describe('tasksSlice initial state', () => {
  it('has the expected default shape', () => {
    const store = makeStore();
    expect(store.getState().tasks).toEqual({
      tasks: [],
      loading: false,
      error: null,
      currentProjectId: null,
      filterLabelIds: [],
      sortBy: 'completed',
      sortDir: 'asc',
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

describe('setTaskLabels', () => {
  it('calls the api with the label ids and replaces the task with its updated labels', async () => {
    const original = makeTask();
    const withLabels = makeTask({ labels: [{ id: 1, name: 'Urgent', color: '#ff0000' }] });
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([original]);
    vi.mocked(api.setTaskLabels).mockResolvedValueOnce(withLabels);

    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));
    await store.dispatch(setTaskLabels({ taskId: 1, labelIds: [1] }));

    expect(api.setTaskLabels).toHaveBeenCalledWith(1, [1]);
    expect(selectTasks(store.getState())).toEqual([withLabels]);
  });
});

describe('selectFilteredSortedTasks', () => {
  const urgent = { id: 1, name: 'Urgent', color: '#ff0000' };
  const home = { id: 2, name: 'Home', color: '#00ff00' };

  const taskA = makeTask({ id: 1, title: 'Beta task', completed: false, labels: [urgent, home] });
  const taskB = makeTask({ id: 2, title: 'Alpha task', completed: true, labels: [urgent] });
  const taskC = makeTask({ id: 3, title: 'Gamma task', completed: false, labels: [] });
  const taskD = makeTask({ id: 4, title: 'Delta task', completed: false, labels: [home] });

  async function makeSeededStore() {
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([taskA, taskB, taskC, taskD]);
    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));
    return store;
  }

  it('returns every task, sorted by the default tie-break, when no filter is set', async () => {
    const store = await makeSeededStore();

    expect(selectFilteredSortedTasks(store.getState()).map((t) => t.id)).toEqual([1, 4, 3, 2]);
  });

  it('filters to tasks with the selected label', async () => {
    const store = await makeSeededStore();

    store.dispatch(setFilterLabels([1]));

    expect(selectFilteredSortedTasks(store.getState()).map((t) => t.id)).toEqual([1, 2]);
  });

  it('applies AND semantics when multiple labels are selected', async () => {
    const store = await makeSeededStore();

    store.dispatch(setFilterLabels([1, 2]));

    expect(selectFilteredSortedTasks(store.getState()).map((t) => t.id)).toEqual([1]);
  });

  it('restores the full list when the filter is cleared', async () => {
    const store = await makeSeededStore();

    store.dispatch(setFilterLabels([1]));
    store.dispatch(setFilterLabels([]));

    expect(selectFilteredSortedTasks(store.getState()).map((t) => t.id)).toEqual([1, 4, 3, 2]);
  });

  it('sorts by title ascending, then descending', async () => {
    const store = await makeSeededStore();

    store.dispatch(setSort({ sortBy: 'title', sortDir: 'asc' }));
    expect(selectFilteredSortedTasks(store.getState()).map((t) => t.id)).toEqual([2, 1, 4, 3]);

    store.dispatch(setSort({ sortBy: 'title', sortDir: 'desc' }));
    expect(selectFilteredSortedTasks(store.getState()).map((t) => t.id)).toEqual([3, 4, 1, 2]);
  });

  it('sorts by completion, tie-breaking incomplete tasks by title', async () => {
    const store = await makeSeededStore();

    store.dispatch(setSort({ sortBy: 'completed', sortDir: 'asc' }));

    expect(selectFilteredSortedTasks(store.getState()).map((t) => t.id)).toEqual([1, 4, 3, 2]);
  });

  it('sorts by label, using the lowest alphabetical label per task and tie-breaking on title', async () => {
    const store = await makeSeededStore();

    store.dispatch(setSort({ sortBy: 'label', sortDir: 'asc' }));

    // taskC has no labels ('' sorts first), taskA/taskD both key on 'Home' (tie-break: title),
    // taskB keys on 'Urgent'.
    expect(selectFilteredSortedTasks(store.getState()).map((t) => t.id)).toEqual([3, 1, 4, 2]);
  });
});

describe('reacting to label changes from labelsSlice', () => {
  it('strips a deleted label from every task that had it embedded', async () => {
    const taskWithLabel = makeTask({
      labels: [
        { id: 5, name: 'Urgent', color: '#ff0000' },
        { id: 6, name: 'Later', color: '#00ff00' },
      ],
    });
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([taskWithLabel]);
    vi.mocked(api.deleteLabel).mockResolvedValueOnce(undefined);

    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));
    await store.dispatch(deleteLabel(5));

    const [task] = selectTasks(store.getState());
    expect(task.labels).toEqual([{ id: 6, name: 'Later', color: '#00ff00' }]);
  });

  it('patches an embedded label in place when it is renamed/recolored', async () => {
    const taskWithLabel = makeTask({
      labels: [{ id: 5, name: 'Urgent', color: '#ff0000' }],
    });
    const renamed = { id: 5, name: 'Critical', color: '#0000ff' };
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([taskWithLabel]);
    vi.mocked(api.updateLabel).mockResolvedValueOnce(renamed);

    const store = makeStore();
    await store.dispatch(fetchTasksByProject(1));
    await store.dispatch(updateLabel({ id: 5, data: { name: 'Critical', color: '#0000ff' } }));

    const [task] = selectTasks(store.getState());
    expect(task.labels).toEqual([renamed]);
  });
});
