import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema } from './validators';

describe('createTaskSchema', () => {
  it('accepts a valid title', () => {
    const result = createTaskSchema.safeParse({ title: 'Buy groceries' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Buy groceries');
    }
  });

  it('trims whitespace from title', () => {
    const result = createTaskSchema.safeParse({ title: '  Buy groceries  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Buy groceries');
    }
  });

  it('rejects a missing title', () => {
    const result = createTaskSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only title', () => {
    const result = createTaskSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a title longer than 255 characters', () => {
    const result = createTaskSchema.safeParse({ title: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('ignores unknown fields', () => {
    const result = createTaskSchema.safeParse({
      title: 'Valid',
      completed: true,
      extra: 'ignored',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ title: 'Valid' });
    }
  });
});

describe('updateTaskSchema', () => {
  it('accepts a title update', () => {
    const result = updateTaskSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts a completed update', () => {
    const result = updateTaskSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it('accepts both fields', () => {
    const result = updateTaskSchema.safeParse({
      title: 'Updated',
      completed: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a whitespace-only title', () => {
    const result = updateTaskSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-boolean completed value', () => {
    const result = updateTaskSchema.safeParse({ completed: 'true' });
    expect(result.success).toBe(false);
  });

  it('ignores unknown fields', () => {
    const result = updateTaskSchema.safeParse({ completed: true, unknown: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ completed: true });
    }
  });
});
