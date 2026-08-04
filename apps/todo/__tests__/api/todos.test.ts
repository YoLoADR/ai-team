import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/todos/route';
import { todoRepository } from '../../lib/repositories/todo-repository';

beforeEach(() => {
  const todos = todoRepository.findAll();
  for (const todo of todos) {
    todoRepository.delete(todo.id);
  }
});

describe('GET /api/todos', () => {
  it('should return 200 with empty array when no todos exist', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it('should return 200 with all todos', async () => {
    todoRepository.create({ title: 'Todo 1' });
    todoRepository.create({ title: 'Todo 2' });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe('Todo 1');
    expect(data[1].title).toBe('Todo 2');
  });
});

describe('POST /api/todos', () => {
  it('should create a new todo and return 201', async () => {
    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title: 'New todo' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe('New todo');
    expect(data.completed).toBe(false);
  });

  it('should create a new todo with completed true', async () => {
    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title: 'New todo', completed: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.completed).toBe(true);
  });

  it('should return 400 when title is missing', async () => {
    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should return 400 when title is empty', async () => {
    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 when body is invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/todos', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
