import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as api from '../api/client';
import type { Project, ProjectInput, ProjectWithTaskCount } from '../api/types';
import type { RootState } from './index';

interface ProjectsState {
  projects: ProjectWithTaskCount[];
  selectedProjectId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  selectedProjectId: null,
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk<ProjectWithTaskCount[]>(
  'projects/fetchProjects',
  () => api.fetchProjects(),
);

export const createProject = createAsyncThunk<Project, ProjectInput>(
  'projects/createProject',
  (data) => api.createProject(data),
);

export const updateProject = createAsyncThunk<Project, { id: number; data: ProjectInput }>(
  'projects/updateProject',
  ({ id, data }) => api.updateProject(id, data),
);

export const deleteProject = createAsyncThunk<number, number>(
  'projects/deleteProject',
  async (id) => {
    await api.deleteProject(id);
    return id;
  },
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    selectProject(state, action: PayloadAction<number | null>) {
      state.selectedProjectId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push({ ...action.payload, task_count: 0 });
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex((project) => project.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = { ...state.projects[index], ...action.payload };
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter((project) => project.id !== action.payload);
        if (state.selectedProjectId === action.payload) {
          state.selectedProjectId = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export const { selectProject } = projectsSlice.actions;

export default projectsSlice.reducer;

export const selectAllProjects = (state: RootState): ProjectWithTaskCount[] => state.projects.projects;

export const selectSelectedProject = (state: RootState): ProjectWithTaskCount | null =>
  state.projects.projects.find((project) => project.id === state.projects.selectedProjectId) ?? null;

export const selectProjectsLoading = (state: RootState): boolean => state.projects.loading;

export const selectProjectsError = (state: RootState): string | null => state.projects.error;
