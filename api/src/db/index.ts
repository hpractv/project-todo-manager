import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || './data/todo.db';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');

export function initSchema(): void {
  // Table definitions are added here as features are implemented.
}

initSchema();
