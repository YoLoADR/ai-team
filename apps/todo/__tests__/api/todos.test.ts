import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/todos/route';
import { createTodo, getAllTodos } from '../../lib/db/repository';

vi.mock('../../lib/db/repository', () => ({
  createTodo: vi.fn(),
  getAllTodos: vi.fn(),
}));

const mockedCreateTodo = vi.mocked(createTodo);
const mockedGetAllTodos = vi.mocked(getAllTodos);

function jsonRequest(method: 'GET' | 'POST', body?: unknown) {
  return new NextRequest('http://localhost/api/todos', {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/todos', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('returns an empty array when no todos exist', async () => {
      mockedGetAllTodos.mockReturnValue([]);
      const res = await GET(jsonRequest('GET'));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    it('returns all todos ordered by creation date descending', async () => {
      const todos = [
        {
          id: '3',
          title: 'Third',
          completed: false,
          createdAt: '2025-01-03T00:00:00.000Z',
          updatedAt: '2025-01-03T00:00:00.000Z',
        },
        {
          id: '2',
          title: 'Second',
          completed: false,
          createdAt: '2025-01-02T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
        {
          id: '1',
          title: 'First',
          completed: false,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];
      mockedGetAllTodos.mockReturnValue(todos);

      const res = await GET(jsonRequest('GET'));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(todos);
      expect(mockedGetAllTodos).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST', () => {
    it('creates a todo with a valid title and returns 201', async () => {
      const created = {
        id: 'uuid',
        title: 'Buy groceries',
        completed: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      mockedCreateTodo.mockReturnValue(created);

      const res = await POST(jsonRequest('POST', { title: 'Buy groceries' }));
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(created);
      expect(mockedCreateTodo).toHaveBeenCalledWith({ title: 'Buy groceries' });
    });

    it('ignores extra fields in the body', async () => {
      const created = {
        id: 'uuid',
        title: 'Valid',
        completed: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      mockedCreateTodo.mockReturnValue(created);

      await POST(jsonRequest('POST', { title: 'Valid', extra: 'ignored', count: 42 }));
      expect(mockedCreateTodo).toHaveBeenCalledWith({ title: 'Valid' });
    });

    it('rejects an empty title with INVALID_TITLE', async () => {
      const res = await POST(jsonRequest('POST', { title: '' }));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_TITLE' });
      expect(mockedCreateTodo).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only title with INVALID_TITLE', async () => {
      const res = await POST(jsonRequest('POST', { title: '   ' }));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_TITLE' });
    });

    it('rejects a title longer than 200 characters with TITLE_TOO_LONG', async () => {
      const res = await POST(jsonRequest('POST', { title: 'a'.repeat(201) }));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'TITLE_TOO_LONG' });
    });

    it('rejects a missing title with INVALID_TITLE', async () => {
      const res = await POST(jsonRequest('POST', {}));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_TITLE' });
    });

    it('rejects a non-string title with INVALID_TITLE', async () => {
      const res = await POST(jsonRequest('POST', { title: 123 }));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_TITLE' });
    });

    it('rejects malformed JSON with INVALID_JSON', async () => {
      const req = new NextRequest('http://localhost/api/todos', {
        method: 'POST',
        body: '{not json',
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_JSON' });
    });

    it('rejects a payload larger than 10 KB with PAYLOAD_TOO_LARGE', async () => {
      const req = new NextRequest('http://localhost/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title: 'Valid', payload: 'x'.repeat(10240) }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(413);
      expect(await res.json()).toMatchObject({ error: 'PAYLOAD_TOO_LARGE' });
      expect(mockedCreateTodo).not.toHaveBeenCalled();
    });
  });
});
