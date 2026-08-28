import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as api from '../api/client';
import type { Task, TaskInput, TaskWithProject } from '../api/types';
import { deleteLabel, updateLabel } from './labelsSlice';
import type { RootState } from './index';

export type TaskSortBy = 'title' | 'label' | 'completed';
export type SortDir = 'asc' | 'desc';
/** number = label id smart list; null = no smart list active (viewing a project instead). */
export type CurrentSmartList = 'all' | 'completed' | number | null;

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentProjectId: number | null;
  currentSmartList: CurrentSmartList;
  filterLabelIds: number[];
  sortBy: TaskSortBy;
  sortDir: SortDir;
}

const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
  currentProjectId: null,
  currentSmartList: null,
  filterLabelIds: [],
  sortBy: 'completed',
  sortDir: 'asc',
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

export const fetchAllTasks = createAsyncThunk<TaskWithProject[]>(
  'tasks/fetchAllTasks',
  () => api.fetchAllTasks(),
);

export const fetchCompletedTasks = createAsyncThunk<TaskWithProject[]>(
  'tasks/fetchCompletedTasks',
  () => api.fetchCompletedTasks(),
);

export const fetchTasksByLabel = createAsyncThunk<TaskWithProject[], number>(
  'tasks/fetchTasksByLabel',
  (labelId) => api.fetchTasksByLabelId(labelId),
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilterLabels(state, action: PayloadAction<number[]>) {
      state.filterLabelIds = action.payload;
    },
    setSort(state, action: PayloadAction<{ sortBy: TaskSortBy; sortDir: SortDir }>) {
      state.sortBy = action.payload.sortBy;
      state.sortDir = action.payload.sortDir;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasksByProject.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentProjectId = action.meta.arg;
        state.currentSmartList = null;
      })
      .addCase(fetchTasksByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(fetchAllTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentProjectId = null;
        state.currentSmartList = 'all';
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(fetchCompletedTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentProjectId = null;
        state.currentSmartList = 'completed';
      })
      .addCase(fetchCompletedTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchCompletedTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(fetchTasksByLabel.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentProjectId = null;
        state.currentSmartList = action.meta.arg;
      })
      .addCase(fetchTasksByLabel.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksByLabel.rejected, (state, action) => {
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
        if (state.currentSmartList === deletedId) {
          state.currentSmartList = null;
          state.tasks = [];
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

export const { setFilterLabels, setSort } = tasksSlice.actions;

export default tasksSlice.reducer;

export const selectTasks = (state: RootState): Task[] => state.tasks.tasks;

export const selectTasksLoading = (state: RootState): boolean => state.tasks.loading;

export const selectTasksError = (state: RootState): string | null => state.tasks.error;

export const selectCurrentTaskProjectId = (state: RootState): number | null =>
  state.tasks.currentProjectId;

export const selectCurrentSmartList = (state: RootState): CurrentSmartList =>
  state.tasks.currentSmartList;

export const selectFilterLabelIds = (state: RootState): number[] => state.tasks.filterLabelIds;

export const selectSortBy = (state: RootState): TaskSortBy => state.tasks.sortBy;

export const selectSortDir = (state: RootState): SortDir => state.tasks.sortDir;

/** Lowest alphabetical label name on a task, or '' when it has none, used as the 'label' sort key. */
function labelSortKey(task: Task): string {
  if (!task.labels || task.labels.length === 0) {
    return '';
  }
  return task.labels
    .map((label) => label.name)
    .sort((a, b) => a.localeCompare(b))[0];
}

// Tie-breaking: incomplete first, then title alphabetically. Applied after the
// primary sort key so every sort option remains fully deterministic.
function compareTasks(a: Task, b: Task, sortBy: TaskSortBy, sortDir: SortDir): number {
  const dir = sortDir === 'desc' ? -1 : 1;
  let primary = 0;
  switch (sortBy) {
    case 'title':
      primary = a.title.localeCompare(b.title);
      break;
    case 'completed':
      primary = Number(a.completed) - Number(b.completed);
      break;
    case 'label':
      primary = labelSortKey(a).localeCompare(labelSortKey(b));
      break;
  }
  if (primary !== 0) {
    return primary * dir;
  }
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }
  return a.title.localeCompare(b.title);
}

export const selectFilteredSortedTasks = (state: RootState): Task[] => {
  const { tasks, filterLabelIds, sortBy, sortDir } = state.tasks;
  const filtered =
    filterLabelIds.length === 0
      ? tasks
      : tasks.filter((task) =>
          filterLabelIds.every((labelId) => task.labels?.some((label) => label.id === labelId)),
        );
  return [...filtered].sort((a, b) => compareTasks(a, b, sortBy, sortDir));
};
