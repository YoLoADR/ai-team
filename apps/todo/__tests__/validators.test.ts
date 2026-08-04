import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  validateCreateTodo,
  validateUpdateTodo,
} from '../lib/validators';

describe('createTodoSchema', () => {
  it('should validate a valid todo with title only', () => {
    const result = validateCreateTodo({ title: 'Buy groceries' });
    expect(result).toEqual({ title: 'Buy groceries', completed: false });
  });

  it('should validate a valid todo with title and completed', () => {
    const result = validateCreateTodo({ title: 'Buy groceries', completed: true });
    expect(result).toEqual({ title: 'Buy groceries', completed: true });
  });

  it('should reject empty title', () => {
    expect(() => validateCreateTodo({ title: '' })).toThrow(ZodError);
  });

  it('should reject missing title', () => {
    expect(() => validateCreateTodo({})).toThrow(ZodError);
  });

  it('should reject title over 255 characters', () => {
    expect(() => validateCreateTodo({ title: 'a'.repeat(256) })).toThrow(ZodError);
  });

  it('should reject non-string title', () => {
    expect(() => validateCreateTodo({ title: 123 })).toThrow(ZodError);
  });

  it('should reject non-boolean completed', () => {
    expect(() => validateCreateTodo({ title: 'Test', completed: 'yes' })).toThrow(ZodError);
  });
});

describe('updateTodoSchema', () => {
  it('should validate partial update with completed only', () => {
    const result = validateUpdateTodo({ completed: true });
    expect(result).toEqual({ completed: true });
  });

  it('should validate partial update with title only', () => {
    const result = validateUpdateTodo({ title: 'New title' });
    expect(result).toEqual({ title: 'New title' });
  });

  it('should validate update with both fields', () => {
    const result = validateUpdateTodo({ title: 'New title', completed: true });
    expect(result).toEqual({ title: 'New title', completed: true });
  });

  it('should accept empty object', () => {
    const result = validateUpdateTodo({});
    expect(result).toEqual({});
  });

  it('should reject empty title when provided', () => {
    expect(() => validateUpdateTodo({ title: '' })).toThrow(ZodError);
  });

  it('should reject title over 255 characters', () => {
    expect(() => validateUpdateTodo({ title: 'a'.repeat(256) })).toThrow(ZodError);
  });

  it('should reject non-boolean completed', () => {
    expect(() => validateUpdateTodo({ completed: 'yes' })).toThrow(ZodError);
  });
});
