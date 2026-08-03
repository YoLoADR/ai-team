import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import * as schema from './schema';

let sqliteInstance: Database | null = null;
let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

function ensureDirectory(path: string) {
  if (path !== ':memory:' && !existsSync(dirname(path))) {
    mkdirSync(dirname(path), { recursive: true });
  }
}

export function getSqlite(): Database {
  if (!sqliteInstance) {
    const databaseUrl = process.env.DATABASE_URL || './data/todo.db';
    ensureDirectory(databaseUrl);
    sqliteInstance = new Database(databaseUrl);
  }

  return sqliteInstance;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getSqlite(), { schema });
  }

  return dbInstance;
}
