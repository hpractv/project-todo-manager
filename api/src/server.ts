import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/projects', projectsRouter);

export default app;
