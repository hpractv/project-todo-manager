import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './store';
import { useAppSelector } from './store/hooks';
import { selectAllProjects } from './store/projectsSlice';

vi.mock('./api/client', () => ({
  fetchProjects: vi.fn().mockResolvedValue([]),
  fetchProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
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
