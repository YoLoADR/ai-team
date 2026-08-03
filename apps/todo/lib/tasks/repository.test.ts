import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabase } from '../db/client';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from './repository';

beforeEach(() => resetDatabase());

describe('createTask', () => {
  it('creates a task with default completed false', () => {
    const task = createTask({ title: 'Buy groceries' });
    expect(task.title).toBe('Buy groceries');
    expect(task.completed).toBe(false);
    expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(task.createdAt).toBe(task.updatedAt);
  });

  it('trims the title', () => {
    const task = createTask({ title: '  Trim me  ' });
    expect(task.title).toBe('Trim me');
  });
});

describe('getAllTasks', () => {
  it('returns an empty array initially', () => {
    expect(getAllTasks()).toEqual([]);
  });

  it('returns all created tasks', () => {
    createTask({ title: 'One' });
    createTask({ title: 'Two' });
    const tasks = getAllTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks.map((t) => t.title)).toEqual(['One', 'Two']);
  });
});

describe('updateTask', () => {
  it('updates the title and refreshes updatedAt', () => {
    const task = createTask({ title: 'Old' });
    const updated = updateTask(task.id, { title: 'New' });
    expect(updated).toBeDefined();
    expect(updated!.title).toBe('New');
    expect(updated!.updatedAt > updated!.createdAt).toBe(true);
  });

  it('updates completed status', () => {
    const task = createTask({ title: 'Do it' });
    const updated = updateTask(task.id, { completed: true });
    expect(updated!.completed).toBe(true);
  });

  it('returns undefined for a missing id', () => {
    const updated = updateTask(
      '00000000-0000-4000-8000-000000000000',
      { title: 'X' },
    );
    expect(updated).toBeUndefined();
  });
});

describe('deleteTask', () => {
  it('deletes an existing task', () => {
    const task = createTask({ title: 'Delete me' });
    expect(deleteTask(task.id)).toBe(true);
    expect(getTaskById(task.id)).toBeUndefined();
  });

  it('returns false for a missing id', () => {
    expect(
      deleteTask('00000000-0000-4000-8000-000000000000'),
    ).toBe(false);
  });
});
