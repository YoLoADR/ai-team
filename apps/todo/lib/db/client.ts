import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export type DB = BetterSQLite3Database<typeof schema>;

let _db: DB | null = null;

export function getDb(): DB {
  if (!_db) {
    const dbPath = process.env.DB_PATH || './sqlite.db';
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

export function setDb(db: DB): void {
  _db = db;
}

export { schema };
