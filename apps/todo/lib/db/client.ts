import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.DATABASE_PATH || './todo.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Auto-migration minimale : s'assure que la table existe en dev/test.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    completed INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    category TEXT DEFAULT 'general',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

export const db = drizzle(sqlite, { schema });