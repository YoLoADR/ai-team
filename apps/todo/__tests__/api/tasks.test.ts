import { describe, it, expect, beforeEach } from 'vitest';
import {
  GET as getTasks,
  POST as createTask,
  PUT as putCollection,
} from '../../app/api/tasks/route';
import {
  PATCH as patchTask,
  DELETE as deleteTask,
  POST as postItem,
} from '../../app/api/tasks/[id]/route';
import { resetDatabase } from '../../lib/db/client';

beforeEach(() => resetDatabase());

function jsonRequest(method: string, url: string, body?: object): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/tasks', () => {
  it('creates a task and returns 201', async () => {
    const res = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', {
        title: 'Buy groceries',
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('Buy groceries');
    expect(body.completed).toBe(false);
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });

  it('rejects a missing title with 400', async () => {
    const res = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', {}),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a whitespace-only title with 400', async () => {
    const res = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', { title: '   ' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a title longer than 255 characters', async () => {
    const res = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', {
        title: 'a'.repeat(256),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON with 400', async () => {
    const req = new Request('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ title: "missing quotes" }',
    });
    const res = await createTask(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('MALFORMED_JSON');
  });

  it('rejects an empty body with validation error', async () => {
    const req = new Request('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await createTask(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ignores unknown fields', async () => {
    const res = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', {
        title: 'Valid',
        completed: true,
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.completed).toBe(false);
  });
});

describe('GET /api/tasks', () => {
  it('returns an empty array when no tasks exist', async () => {
    const res = await getTasks();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('returns all existing tasks', async () => {
    await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', {
        title: 'Buy groceries',
      }),
    );
    await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', {
        title: 'Walk the dog',
      }),
    );
    const res = await getTasks();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    body.forEach((task: any) => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('completed');
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');
    });
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('updates a task title and refreshes updatedAt', async () => {
    const createRes = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', {
        title: 'Buy groceries',
      }),
    );
    const { id, createdAt } = await createRes.json();

    const res = await patchTask(
      jsonRequest('PATCH', `http://localhost/api/tasks/${id}`, {
        title: 'Buy groceries and cook dinner',
      }),
      { params: { id } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Buy groceries and cook dinner');
    expect(body.updatedAt > createdAt).toBe(true);
  });

  it('marks a task as completed', async () => {
    const createRes = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', { title: 'Do it' }),
    );
    const { id } = await createRes.json();

    const res = await patchTask(
      jsonRequest('PATCH', `http://localhost/api/tasks/${id}`, {
        completed: true,
      }),
      { params: { id } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.completed).toBe(true);
  });

  it('returns 404 for a non-existent task', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    const res = await patchTask(
      jsonRequest('PATCH', `http://localhost/api/tasks/${id}`, { title: 'X' }),
      { params: { id } },
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for an invalid id format', async () => {
    const res = await patchTask(
      jsonRequest('PATCH', 'http://localhost/api/tasks/not-a-uuid', {
        title: 'X',
      }),
      { params: { id: 'not-a-uuid' } },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('INVALID_ID');
  });

  it('rejects an invalid title with 400', async () => {
    const createRes = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', { title: 'Valid' }),
    );
    const { id } = await createRes.json();
    const res = await patchTask(
      jsonRequest('PATCH', `http://localhost/api/tasks/${id}`, { title: '' }),
      { params: { id } },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a non-boolean completed value', async () => {
    const createRes = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', { title: 'Valid' }),
    );
    const { id } = await createRes.json();
    const res = await patchTask(
      jsonRequest('PATCH', `http://localhost/api/tasks/${id}`, {
        completed: 'true',
      }),
      { params: { id } },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes an existing task and returns 204', async () => {
    const createRes = await createTask(
      jsonRequest('POST', 'http://localhost/api/tasks', {
        title: 'Delete me',
      }),
    );
    const { id } = await createRes.json();

    const res = await deleteTask(
      new Request(`http://localhost/api/tasks/${id}`, { method: 'DELETE' }),
      { params: { id } },
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');

    const listRes = await getTasks();
    const tasks = await listRes.json();
    expect(tasks.find((t: any) => t.id === id)).toBeUndefined();
  });

  it('returns 404 for a non-existent task', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    const res = await deleteTask(
      new Request(`http://localhost/api/tasks/${id}`, { method: 'DELETE' }),
      { params: { id } },
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for an invalid id format', async () => {
    const res = await deleteTask(
      new Request('http://localhost/api/tasks/not-a-uuid', { method: 'DELETE' }),
      { params: { id: 'not-a-uuid' } },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('INVALID_ID');
  });
});

describe('405 method not allowed', () => {
  it('PUT /api/tasks returns 405 with Allow header', async () => {
    const res = await putCollection();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, POST');
    const body = await res.json();
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('POST /api/tasks/:id returns 405 with Allow header', async () => {
    const res = await postItem();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('PATCH, DELETE');
  });
});
