import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { unlinkSync } from 'node:fs';
import { db } from '@/lib/db/client';
import { tasks } from '@/lib/db/schema';
import { GET as getAll, POST as create } from '@/app/api/todos/route';
import { DELETE as remove, GET as getOne, PATCH as update } from '@/app/api/todos/[id]/route';

const buildUrl = (path: string, base = 'http://localhost:3000') => new URL(path, base);

const buildRequest = (method: string, path: string, body?: unknown) => {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new Request(buildUrl(path).toString(), init);
};

// La signature des route handlers Next.js attend `context: { params: Promise<{ id: string }> }`.
// En test, on simule ce contexte en wrappant l'id dans une Promise.
function routeContext(id: number | string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id: String(id) }) };
}

describe('API /api/todos', () => {
  const dbPath = process.env.DATABASE_PATH || './todo.db';

  beforeAll(() => {
    db.delete(tasks).run();
  });

  afterAll(() => {
    try {
      unlinkSync(dbPath);
    } catch {
      // fichier déjà absent
    }
  });

  describe('POST /api/todos', () => {
    test('crée un todo avec un titre valide et retourne 201', async () => {
      const request = buildRequest('POST', '/api/todos', { title: 'Apprendre TDD' });
      const response = await create(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeTypeOf('number');
      expect(data.title).toBe('Apprendre TDD');
      expect(data.completed).toBe(false);
      expect(data.priority).toBe('medium');
    });

    test('retourne 400 quand le titre est manquant', async () => {
      const request = buildRequest('POST', '/api/todos', {});
      const response = await create(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('accepte toutes les propriétés optionnelles', async () => {
      const request = buildRequest('POST', '/api/todos', {
        title: 'Todo complète',
        description: 'Description détaillée',
        completed: true,
        priority: 'high',
        dueDate: '2026-08-10',
        category: 'dev',
      });
      const response = await create(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Todo complète');
      expect(data.description).toBe('Description détaillée');
      expect(data.completed).toBe(true);
      expect(data.priority).toBe('high');
      expect(data.dueDate).toBe('2026-08-10');
      expect(data.category).toBe('dev');
    });
  });

  describe('GET /api/todos', () => {
    test('retourne la liste des todos avec status 200', async () => {
      db.delete(tasks).run();
      await create(buildRequest('POST', '/api/todos', { title: 'Premier todo' }));
      await create(buildRequest('POST', '/api/todos', { title: 'Deuxième todo' }));

      const response = await getAll();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
      expect(data.some((todo: { title: string }) => todo.title === 'Premier todo')).toBe(true);
    });
  });

  describe('GET /api/todos/[id]', () => {
    test('retourne un todo existant avec status 200', async () => {
      const createResponse = await create(buildRequest('POST', '/api/todos', { title: 'Todo unique' }));
      const created = await createResponse.json();

      const response = await getOne(new Request(buildUrl(`/api/todos/${created.id}`).toString()), routeContext(created.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(created.id);
      expect(data.title).toBe('Todo unique');
    });

    test("retourne 404 pour un id qui n'existe pas", async () => {
      const response = await getOne(new Request(buildUrl('/api/todos/999999').toString()), routeContext(999999));

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('PATCH /api/todos/[id]', () => {
    test('met à jour un todo existant et retourne 200', async () => {
      const createResponse = await create(buildRequest('POST', '/api/todos', { title: 'Avant MAJ' }));
      const created = await createResponse.json();

      const response = await update(
        buildRequest('PATCH', `/api/todos/${created.id}`, { title: 'Après MAJ', completed: true }),
        routeContext(created.id)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Après MAJ');
      expect(data.completed).toBe(true);
    });

    test('retourne 404 si le todo à mettre à jour est inexistant', async () => {
      const response = await update(
        buildRequest('PATCH', '/api/todos/999999', { completed: true }),
        routeContext(999999)
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('retourne 400 si les données sont invalides', async () => {
      const createResponse = await create(buildRequest('POST', '/api/todos', { title: 'Todo à valider' }));
      const created = await createResponse.json();

      const response = await update(
        buildRequest('PATCH', `/api/todos/${created.id}`, { title: '', priority: 'invalid' }),
        routeContext(created.id)
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE /api/todos/[id]', () => {
    test('supprime un todo existant et retourne 204', async () => {
      const createResponse = await create(buildRequest('POST', '/api/todos', { title: 'Todo à supprimer' }));
      const created = await createResponse.json();

      const response = await remove(new Request(buildUrl(`/api/todos/${created.id}`).toString()), routeContext(created.id));

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');

      const getResponse = await getOne(new Request(buildUrl(`/api/todos/${created.id}`).toString()), routeContext(created.id));
      expect(getResponse.status).toBe(404);
    });

    test('retourne 404 si le todo à supprimer est inexistant', async () => {
      const response = await remove(new Request(buildUrl('/api/todos/999999').toString()), routeContext(999999));

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
