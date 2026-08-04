import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../lib/db/schema';
import {
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
  type Todo,
} from '../../lib/db/repository';

type TestDb = ReturnType<typeof makeTestDb>;

function makeTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

describe('repository', () => {
  let testDb: TestDb;

  beforeEach(() => {
    testDb = makeTestDb();
  });

  describe('createTodo', () => {
    it('creates a todo with generated id, timestamps and completed false', () => {
      const todo = createTodo({ title: 'Buy groceries' }, testDb.db);
      expect(todo.title).toBe('Buy groceries');
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeTypeOf('string');
      expect(todo.id.length).toBeGreaterThan(0);
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });

    it('trims the title before storing', () => {
      const todo = createTodo({ title: '  Trim me  ' }, testDb.db);
      expect(todo.title).toBe('Trim me');
    });
  });

  describe('getAllTodos', () => {
    it('returns an empty array when no todos exist', () => {
      expect(getAllTodos(testDb.db)).toEqual([]);
    });

    it('returns todos ordered by createdAt descending', () => {
      testDb.sqlite.exec(`
        INSERT INTO todos (id, title, completed, createdAt, updatedAt) VALUES
        ('1', 'First', 0, '2025-01-01T10:00:00.000Z', '2025-01-01T10:00:00.000Z'),
        ('2', 'Second', 0, '2025-01-02T10:00:00.000Z', '2025-01-02T10:00:00.000Z'),
        ('3', 'Third', 0, '2025-01-03T10:00:00.000Z', '2025-01-03T10:00:00.000Z')
      `);

      const todos = getAllTodos(testDb.db);
      expect(todos).toHaveLength(3);
      expect(todos.map((t: Todo) => t.id)).toEqual(['3', '2', '1']);
    });
  });

  describe('getTodoById', () => {
    it('returns the matching todo', () => {
      const created = createTodo({ title: 'Find me' }, testDb.db);
      const found = getTodoById(created.id, testDb.db);
      expect(found).toEqual(created);
    });

    it('returns undefined for unknown id', () => {
      expect(getTodoById('does-not-exist', testDb.db)).toBeUndefined();
    });
  });

  describe('updateTodo', () => {
    it('updates the title and updatedAt', () => {
      const created = createTodo({ title: 'Old' }, testDb.db);
      const updated = updateTodo(created.id, { title: 'New' }, testDb.db);

      expect(updated?.title).toBe('New');
      expect(updated?.completed).toBe(false);
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('toggles completed', () => {
      const created = createTodo({ title: 'Toggle' }, testDb.db);

      let updated = updateTodo(created.id, { completed: true }, testDb.db);
      expect(updated?.completed).toBe(true);

      updated = updateTodo(created.id, { completed: false }, testDb.db);
      expect(updated?.completed).toBe(false);
    });

    it('updates title and completed together', () => {
      const created = createTodo({ title: 'Both' }, testDb.db);
      const updated = updateTodo(created.id, { title: 'Updated', completed: true }, testDb.db);

      expect(updated?.title).toBe('Updated');
      expect(updated?.completed).toBe(true);
    });

    it('returns undefined for unknown id', () => {
      expect(updateTodo('missing', { completed: true }, testDb.db)).toBeUndefined();
    });

    it('trims updated title', () => {
      const created = createTodo({ title: 'Old' }, testDb.db);
      const updated = updateTodo(created.id, { title: '  New  ' }, testDb.db);

      expect(updated?.title).toBe('New');
    });
  });

  describe('deleteTodo', () => {
    it('deletes an existing todo', () => {
      const created = createTodo({ title: 'Delete me' }, testDb.db);

      expect(deleteTodo(created.id, testDb.db)).toBe(true);
      expect(getTodoById(created.id, testDb.db)).toBeUndefined();
    });

    it('returns false for unknown id', () => {
      expect(deleteTodo('missing', testDb.db)).toBe(false);
    });
  });
});
