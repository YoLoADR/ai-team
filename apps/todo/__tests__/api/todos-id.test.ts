import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../../app/api/todos/[id]/route';
import { todoRepository } from '../../lib/repositories/todo-repository';

beforeEach(() => {
  const todos = todoRepository.findAll();
  for (const todo of todos) {
    todoRepository.delete(todo.id);
  }
});

describe('GET /api/todos/[id]', () => {
  it('should return 200 with the todo', async () => {
    const todo = todoRepository.create({ title: 'Test todo' });
    const request = new NextRequest(`http://localhost/api/todos/${todo.id}`);
    const response = await GET(request, { params: { id: String(todo.id) } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(todo.id);
    expect(data.title).toBe('Test todo');
  });

  it('should return 404 for non-existent todo', async () => {
    const request = new NextRequest('http://localhost/api/todos/999');
    const response = await GET(request, { params: { id: '999' } });
    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid id format', async () => {
    const request = new NextRequest('http://localhost/api/todos/abc');
    const response = await GET(request, { params: { id: 'abc' } });
    expect(response.status).toBe(400);
  });
});

describe('PUT /api/todos/[id]', () => {
  it('should update a todo and return 200', async () => {
    const todo = todoRepository.create({ title: 'Original' });
    const request = new NextRequest(`http://localhost/api/todos/${todo.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated title' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: { id: String(todo.id) } });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe('Updated title');
  });

  it('should update completed status', async () => {
    const todo = todoRepository.create({ title: 'Test' });
    const request = new NextRequest(`http://localhost/api/todos/${todo.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: { id: String(todo.id) } });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.completed).toBe(true);
  });

  it('should return 404 for non-existent todo', async () => {
    const request = new NextRequest('http://localhost/api/todos/999', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: { id: '999' } });
    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid id format', async () => {
    const request = new NextRequest('http://localhost/api/todos/abc', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: { id: 'abc' } });
    expect(response.status).toBe(400);
  });

  it('should return 400 when title is empty string', async () => {
    const todo = todoRepository.create({ title: 'Original' });
    const request = new NextRequest(`http://localhost/api/todos/${todo.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: { id: String(todo.id) } });
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/todos/[id]', () => {
  it('should delete a todo and return 200', async () => {
    const todo = todoRepository.create({ title: 'To delete' });
    const request = new NextRequest(`http://localhost/api/todos/${todo.id}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: String(todo.id) } });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(todoRepository.findById(todo.id)).toBeNull();
  });

  it('should return 404 for non-existent todo', async () => {
    const request = new NextRequest('http://localhost/api/todos/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: '999' } });
    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid id format', async () => {
    const request = new NextRequest('http://localhost/api/todos/abc', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: 'abc' } });
    expect(response.status).toBe(400);
  });
});
