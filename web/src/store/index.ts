import { configureStore } from '@reduxjs/toolkit';
import labelsReducer from './labelsSlice';
import projectsReducer from './projectsSlice';
import tasksReducer from './tasksSlice';

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    tasks: tasksReducer,
    labels: labelsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
