import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { unlinkSync } from 'node:fs';

const dbPath = process.env.DATABASE_PATH || './todo.db';

beforeAll(() => {
  // Ensure the tasks table exists before integration tests run.
  db.run(
    sql`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );`
  );
});

afterAll(() => {
  try {
    unlinkSync(dbPath);
    unlinkSync(`${dbPath}-shm`);
    unlinkSync(`${dbPath}-wal`);
  } catch {
    // files may already be absent
  }
});

// MSW server setup (sera configuré par les agents pour les tests composants)
// import { server } from './__tests__/mocks/server';
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
