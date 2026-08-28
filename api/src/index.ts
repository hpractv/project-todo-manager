import type { ListenOptions } from 'node:net';
import app from './server.js';
import './db/index.js';

const DEFAULT_PORT = 3101;
const PORT = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;

function start(port: number): void {
  const options: ListenOptions = { port, host: '127.0.0.1' };
  const server = app.listen(options, () => {
    console.log(`API server listening on port ${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. Stop the other process or set PORT to a free port.`,
      );
      return;
    }

    throw err;
  });
}

start(PORT);
