import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api/client';
import type { Label, LabelInput } from '../api/types';
import type { RootState } from './index';

interface LabelsState {
  labels: Label[];
  loading: boolean;
  error: string | null;
}

const initialState: LabelsState = {
  labels: [],
  loading: false,
  error: null,
};

export const fetchLabels = createAsyncThunk<Label[]>(
  'labels/fetchLabels',
  () => api.fetchLabels(),
);

export const createLabel = createAsyncThunk<Label, LabelInput>(
  'labels/createLabel',
  (data) => api.createLabel(data),
);

export const updateLabel = createAsyncThunk<Label, { id: number; data: Partial<LabelInput> }>(
  'labels/updateLabel',
  ({ id, data }) => api.updateLabel(id, data),
);

export const deleteLabel = createAsyncThunk<number, number>(
  'labels/deleteLabel',
  async (id) => {
    await api.deleteLabel(id);
    return id;
  },
);

const labelsSlice = createSlice({
  name: 'labels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLabels.fulfilled, (state, action) => {
        state.loading = false;
        state.labels = action.payload;
      })
      .addCase(fetchLabels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(createLabel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLabel.fulfilled, (state, action) => {
        state.loading = false;
        state.labels.push(action.payload);
      })
      .addCase(createLabel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(updateLabel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLabel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.labels.findIndex((label) => label.id === action.payload.id);
        if (index !== -1) {
          state.labels[index] = action.payload;
        }
      })
      .addCase(updateLabel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      })
      .addCase(deleteLabel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLabel.fulfilled, (state, action) => {
        state.loading = false;
        state.labels = state.labels.filter((label) => label.id !== action.payload);
      })
      .addCase(deleteLabel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export default labelsSlice.reducer;

export const selectLabels = (state: RootState): Label[] => state.labels.labels;

export const selectLabelsLoading = (state: RootState): boolean => state.labels.loading;

export const selectLabelsError = (state: RootState): string | null => state.labels.error;
