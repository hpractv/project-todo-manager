import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './store';
import { useAppSelector } from './store/hooks';
import { selectAllProjects } from './store/projectsSlice';
import * as api from './api/client';

vi.mock('./api/client', () => ({
  fetchProjects: vi.fn().mockResolvedValue([]),
  fetchProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  setTaskLabels: vi.fn(),
  fetchAllTasks: vi.fn().mockResolvedValue([]),
  fetchCompletedTasks: vi.fn().mockResolvedValue([]),
  fetchTasksByLabelId: vi.fn().mockResolvedValue([]),
  fetchLabels: vi.fn().mockResolvedValue([]),
  createLabel: vi.fn(),
  updateLabel: vi.fn(),
  deleteLabel: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('store', () => {
  it('initializes with the projects slice default shape', () => {
    expect(store.getState().projects).toEqual({
      projects: [],
      selectedProjectId: null,
      loading: false,
      error: null,
    });
  });
});

describe('App', () => {
  it('renders without crashing', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    expect(await screen.findByText('Project Todo Manager')).toBeInTheDocument();
  });
});

describe('label management', () => {
  it('reveals the label list after clicking Manage Labels', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manage Labels' }));

    expect(await screen.findByText('No labels yet.')).toBeInTheDocument();
  });
});

describe('smart lists', () => {
  it('shows cross-project tasks with their project name when a smart list is selected', async () => {
    vi.mocked(api.fetchAllTasks).mockResolvedValueOnce([
      {
        id: 101,
        project_id: 5,
        title: 'Buy milk',
        note: null,
        completed: false,
        sort_order: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        project_name: 'Groceries',
      },
    ]);

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'All' }));

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(await screen.findByText('Groceries')).toBeInTheDocument();
  });

  it('selecting a smart list clears the selected project', async () => {
    vi.mocked(api.fetchProjects).mockResolvedValueOnce([
      {
        id: 9,
        name: 'Home',
        description: null,
        created_at: '2026-01-01T00:00:00.000Z',
        task_count: 0,
      },
    ]);
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([]);
    vi.mocked(api.fetchCompletedTasks).mockResolvedValueOnce([]);

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    const projectButton = await screen.findByRole('button', { name: 'Home (0)' });
    fireEvent.click(projectButton);
    expect(projectButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));

    expect(projectButton).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('redux hooks', () => {
  function ProjectCount() {
    const projects = useAppSelector(selectAllProjects);
    return <p>{projects.length} projects</p>;
  }

  it('reads state via useAppSelector without crashing', () => {
    render(
      <Provider store={store}>
        <ProjectCount />
      </Provider>,
    );

    expect(screen.getByText(/projects$/)).toBeInTheDocument();
  });
});
