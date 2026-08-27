import app from './server.js';
import './db/index.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
