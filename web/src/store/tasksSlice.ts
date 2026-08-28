import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api/client';
import type { Task, TaskInput } from '../api/types';
import { deleteLabel, updateLabel } from './labelsSlice';
import type { RootState } from './index';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentProjectId: number | null;
}

const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
  currentProjectId: null,
};

export const fetchTasksByProject = createAsyncThunk<Task[], number>(
  'tasks/fetchTasksByProject',
  (projectId) => api.fetchTasks(projectId),
);

export const createTask = createAsyncThunk<Task, { projectId: number; data: TaskInput }>(
  'tasks/createTask',
  ({ projectId, data }) => api.createTask(projectId, data),
);

export const updateTask = createAsyncThunk<
  Task,
  { id: number; data: Partial<TaskInput> & { completed?: boolean } }
>('tasks/updateTask', ({ id, data }) => api.updateTask(id, data));

export const toggleComplete = createAsyncThunk<Task, Task>(
  'tasks/toggleComplete',
  (task) => api.updateTask(task.id, { completed: !task.completed }),
);

export const deleteTask = createAsyncThunk<number, number>(
  'tasks/deleteTask',
  async (id) => {
    await api.deleteTask(id);
    return id;
  },
);

export const setTaskLabels = createAsyncThunk<Task, { taskId: number; labelIds: number[] }>(
  'tasks/setTaskLabels',
  ({ taskId, labelIds }) => api.setTaskLabels(taskId, labelIds),
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasksByProject.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentProjectId = action.meta.arg;
      })
      .addCase(fetchTasksByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(toggleComplete.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleComplete.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(toggleComplete.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(setTaskLabels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setTaskLabels.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(setTaskLabels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(deleteLabel.fulfilled, (state, action) => {
        const deletedId = action.payload;
        for (const task of state.tasks) {
          if (task.labels) {
            task.labels = task.labels.filter((label) => label.id !== deletedId);
          }
        }
      })
      .addCase(updateLabel.fulfilled, (state, action) => {
        const updatedLabel = action.payload;
        for (const task of state.tasks) {
          if (!task.labels) continue;
          const index = task.labels.findIndex((label) => label.id === updatedLabel.id);
          if (index !== -1) {
            task.labels[index] = updatedLabel;
          }
        }
      });
  },
});

export default tasksSlice.reducer;

export const selectTasks = (state: RootState): Task[] => state.tasks.tasks;

export const selectTasksLoading = (state: RootState): boolean => state.tasks.loading;

export const selectTasksError = (state: RootState): string | null => state.tasks.error;

export const selectCurrentTaskProjectId = (state: RootState): number | null =>
  state.tasks.currentProjectId;
