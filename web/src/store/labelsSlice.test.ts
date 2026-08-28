import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import type { Label } from '../api/types';
import labelsReducer, {
  createLabel,
  deleteLabel,
  fetchLabels,
  selectLabels,
  selectLabelsError,
  selectLabelsLoading,
  updateLabel,
} from './labelsSlice';
import projectsReducer from './projectsSlice';
import tasksReducer from './tasksSlice';

vi.mock('../api/client', () => ({
  fetchLabels: vi.fn(),
  createLabel: vi.fn(),
  updateLabel: vi.fn(),
  deleteLabel: vi.fn(),
}));

import * as api from '../api/client';

function makeLabel(overrides: Partial<Label> = {}): Label {
  return {
    id: 1,
    name: 'Urgent',
    color: '#ff0000',
    ...overrides,
  };
}

function makeStore() {
  return configureStore({
    reducer: { projects: projectsReducer, tasks: tasksReducer, labels: labelsReducer },
  });
}

describe('labelsSlice initial state', () => {
  it('has the expected default shape', () => {
    const store = makeStore();
    expect(store.getState().labels).toEqual({
      labels: [],
      loading: false,
      error: null,
    });
  });
});

describe('fetchLabels', () => {
  it('loads labels into state', async () => {
    const label = makeLabel();
    vi.mocked(api.fetchLabels).mockResolvedValueOnce([label]);

    const store = makeStore();
    await store.dispatch(fetchLabels());

    const state = store.getState();
    expect(api.fetchLabels).toHaveBeenCalled();
    expect(selectLabels(state)).toEqual([label]);
    expect(selectLabelsLoading(state)).toBe(false);
    expect(selectLabelsError(state)).toBeNull();
  });

  it('records an error message when the request fails', async () => {
    vi.mocked(api.fetchLabels).mockRejectedValueOnce(new Error('network down'));

    const store = makeStore();
    await store.dispatch(fetchLabels());

    expect(selectLabelsError(store.getState())).toBe('network down');
    expect(selectLabelsLoading(store.getState())).toBe(false);
  });
});

describe('createLabel', () => {
  it('appends the created label to state', async () => {
    const label = makeLabel({ id: 2, name: 'Home' });
    vi.mocked(api.createLabel).mockResolvedValueOnce(label);

    const store = makeStore();
    await store.dispatch(createLabel({ name: 'Home' }));

    expect(api.createLabel).toHaveBeenCalledWith({ name: 'Home' });
    expect(selectLabels(store.getState())).toEqual([label]);
  });
});

describe('updateLabel', () => {
  it('replaces the matching label with the updated one', async () => {
    const original = makeLabel();
    const updated = makeLabel({ name: 'Not Urgent', color: '#00ff00' });
    vi.mocked(api.fetchLabels).mockResolvedValueOnce([original]);
    vi.mocked(api.updateLabel).mockResolvedValueOnce(updated);

    const store = makeStore();
    await store.dispatch(fetchLabels());
    await store.dispatch(updateLabel({ id: 1, data: { name: 'Not Urgent', color: '#00ff00' } }));

    expect(api.updateLabel).toHaveBeenCalledWith(1, { name: 'Not Urgent', color: '#00ff00' });
    expect(selectLabels(store.getState())).toEqual([updated]);
  });
});

describe('deleteLabel', () => {
  it('removes the label from state', async () => {
    const label = makeLabel();
    vi.mocked(api.fetchLabels).mockResolvedValueOnce([label]);
    vi.mocked(api.deleteLabel).mockResolvedValueOnce(undefined);

    const store = makeStore();
    await store.dispatch(fetchLabels());
    await store.dispatch(deleteLabel(1));

    expect(api.deleteLabel).toHaveBeenCalledWith(1);
    expect(selectLabels(store.getState())).toEqual([]);
  });
});
