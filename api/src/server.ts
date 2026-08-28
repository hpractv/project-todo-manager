import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';

const app = express();

function isLocalDevOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isLocalDevOrigin(origin));
    },
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/projects', projectsRouter);
app.use('/api', tasksRouter);

export default app;
