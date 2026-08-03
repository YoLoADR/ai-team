import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../../app/api/todos/[id]/route';
import { getTodoById, updateTodo, deleteTodo } from '../../lib/db/repository';

vi.mock('../../lib/db/repository', () => ({
  getTodoById: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

const mockedGet = vi.mocked(getTodoById);
const mockedUpdate = vi.mocked(updateTodo);
const mockedDelete = vi.mocked(deleteTodo);

function idRequest(method: 'GET' | 'PATCH' | 'DELETE', id: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/todos/${id}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/todos/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('returns an existing todo', async () => {
      const todo = {
        id: 'abc-123',
        title: 'A',
        completed: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      mockedGet.mockReturnValue(todo);

      const res = await GET(idRequest('GET', 'abc-123'), { params: { id: 'abc-123' } });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(todo);
      expect(mockedGet).toHaveBeenCalledWith('abc-123');
    });

    it('returns 404 TODO_NOT_FOUND for unknown id', async () => {
      mockedGet.mockReturnValue(undefined);

      const res = await GET(idRequest('GET', 'abc-123'), { params: { id: 'abc-123' } });
      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({ error: 'TODO_NOT_FOUND' });
    });

    it('returns 400 INVALID_ID for empty id', async () => {
      const res = await GET(idRequest('GET', ''), { params: { id: '' } });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_ID' });
      expect(mockedGet).not.toHaveBeenCalled();
    });
  });

  describe('PATCH', () => {
    it('marks a todo as completed', async () => {
      const todo = {
        id: 'abc-123',
        title: 'A',
        completed: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };
      mockedUpdate.mockReturnValue(todo);

      const res = await PATCH(idRequest('PATCH', 'abc-123', { completed: true }), {
        params: { id: 'abc-123' },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(todo);
      expect(mockedUpdate).toHaveBeenCalledWith('abc-123', { completed: true });
    });

    it('marks a todo as incomplete', async () => {
      const todo = {
        id: 'abc-123',
        title: 'A',
        completed: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };
      mockedUpdate.mockReturnValue(todo);

      const res = await PATCH(idRequest('PATCH', 'abc-123', { completed: false }), {
        params: { id: 'abc-123' },
      });
      expect(res.status).toBe(200);
      expect(mockedUpdate).toHaveBeenCalledWith('abc-123', { completed: false });
    });

    it('updates the title', async () => {
      const todo = {
        id: 'abc-123',
        title: 'New title',
        completed: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };
      mockedUpdate.mockReturnValue(todo);

      const res = await PATCH(idRequest('PATCH', 'abc-123', { title: 'New title' }), {
        params: { id: 'abc-123' },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(todo);
      expect(mockedUpdate).toHaveBeenCalledWith('abc-123', { title: 'New title' });
    });

    it('updates title and completed together', async () => {
      const todo = {
        id: 'abc-123',
        title: 'New',
        completed: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };
      mockedUpdate.mockReturnValue(todo);

      const res = await PATCH(
        idRequest('PATCH', 'abc-123', { title: 'New', completed: true }),
        { params: { id: 'abc-123' } },
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(todo);
      expect(mockedUpdate).toHaveBeenCalledWith('abc-123', { title: 'New', completed: true });
    });

    it('rejects a body with no fields using NO_FIELDS_TO_UPDATE', async () => {
      const res = await PATCH(idRequest('PATCH', 'abc-123', {}), { params: { id: 'abc-123' } });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'NO_FIELDS_TO_UPDATE' });
      expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it('rejects an empty title with INVALID_TITLE', async () => {
      const res = await PATCH(idRequest('PATCH', 'abc-123', { title: '' }), {
        params: { id: 'abc-123' },
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_TITLE' });
    });

    it('rejects a title longer than 200 characters with TITLE_TOO_LONG', async () => {
      const res = await PATCH(idRequest('PATCH', 'abc-123', { title: 'a'.repeat(201) }), {
        params: { id: 'abc-123' },
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'TITLE_TOO_LONG' });
    });

    it('returns 404 TODO_NOT_FOUND for unknown id', async () => {
      mockedUpdate.mockReturnValue(undefined);

      const res = await PATCH(idRequest('PATCH', 'abc-123', { completed: true }), {
        params: { id: 'abc-123' },
      });
      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({ error: 'TODO_NOT_FOUND' });
    });

    it('rejects malformed JSON with INVALID_JSON', async () => {
      const req = new NextRequest('http://localhost/api/todos/abc-123', {
        method: 'PATCH',
        body: '{not json',
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await PATCH(req, { params: { id: 'abc-123' } });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_JSON' });
    });

    it('rejects a payload larger than 10 KB with PAYLOAD_TOO_LARGE', async () => {
      const req = new NextRequest('http://localhost/api/todos/abc-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Valid', payload: 'x'.repeat(10240) }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await PATCH(req, { params: { id: 'abc-123' } });
      expect(res.status).toBe(413);
      expect(await res.json()).toMatchObject({ error: 'PAYLOAD_TOO_LARGE' });
    });
  });

  describe('DELETE', () => {
    it('deletes an existing todo and returns 204', async () => {
      mockedDelete.mockReturnValue(true);

      const res = await DELETE(idRequest('DELETE', 'abc-123'), { params: { id: 'abc-123' } });
      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
      expect(mockedDelete).toHaveBeenCalledWith('abc-123');
    });

    it('returns 404 TODO_NOT_FOUND for unknown id', async () => {
      mockedDelete.mockReturnValue(false);

      const res = await DELETE(idRequest('DELETE', 'abc-123'), { params: { id: 'abc-123' } });
      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({ error: 'TODO_NOT_FOUND' });
    });

    it('returns 400 INVALID_ID for empty id', async () => {
      const res = await DELETE(idRequest('DELETE', ''), { params: { id: '' } });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: 'INVALID_ID' });
      expect(mockedDelete).not.toHaveBeenCalled();
    });
  });
});
