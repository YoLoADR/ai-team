import { describe, it, expect, beforeEach } from 'vitest';
import { TodoRepository } from '../../lib/repositories/todo-repository';
import { NotFoundError } from '../../lib/errors';
import { createTestDb } from '../helpers';
import type { DB } from '../../lib/db/client';

let db: DB;
let repo: TodoRepository;

beforeEach(() => {
  db = createTestDb();
  repo = new TodoRepository(db);
});

describe('TodoRepository', () => {
  describe('findAll', () => {
    it('should return empty array when no todos exist', () => {
      expect(repo.findAll()).toEqual([]);
    });

    it('should return all created todos', () => {
      repo.create({ title: 'Todo 1' });
      repo.create({ title: 'Todo 2' });
      const result = repo.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Todo 1');
      expect(result[1].title).toBe('Todo 2');
    });
  });

  describe('findById', () => {
    it('should return todo by id', () => {
      const created = repo.create({ title: 'Test todo' });
      const found = repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe('Test todo');
    });

    it('should return null for non-existent id', () => {
      expect(repo.findById(999)).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new todo with default completed false', () => {
      const todo = repo.create({ title: 'New todo' });
      expect(todo.id).toBeDefined();
      expect(todo.title).toBe('New todo');
      expect(todo.completed).toBe(false);
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });

    it('should create a new todo with completed true', () => {
      const todo = repo.create({ title: 'New todo', completed: true });
      expect(todo.completed).toBe(true);
    });
  });

  describe('update', () => {
    it('should update todo title', () => {
      const created = repo.create({ title: 'Original' });
      const updated = repo.update(created.id, { title: 'Updated' });
      expect(updated.title).toBe('Updated');
    });

    it('should update todo completed status', () => {
      const created = repo.create({ title: 'Test' });
      const updated = repo.update(created.id, { completed: true });
      expect(updated.completed).toBe(true);
    });

    it('should update both title and completed', () => {
      const created = repo.create({ title: 'Original' });
      const updated = repo.update(created.id, { title: 'Updated', completed: true });
      expect(updated.title).toBe('Updated');
      expect(updated.completed).toBe(true);
    });

    it('should throw NotFoundError for non-existent id', () => {
      expect(() => repo.update(999, { title: 'Updated' })).toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete an existing todo', () => {
      const created = repo.create({ title: 'To delete' });
      repo.delete(created.id);
      expect(repo.findById(created.id)).toBeNull();
    });

    it('should throw NotFoundError for non-existent id', () => {
      expect(() => repo.delete(999)).toThrow(NotFoundError);
    });
  });
});
