import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { todos } from './schema';
import { getDb } from './client';

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type TodoRow = typeof todos.$inferSelect;

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createTodo(input: { title: string }, database = getDb()): Todo {
  const now = new Date().toISOString();
  const id = randomUUID();

  const [row] = database
    .insert(todos)
    .values({
      id,
      title: input.title.trim(),
      completed: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!row) {
    throw new Error('DATABASE_ERROR');
  }

  return toTodo(row);
}

export function getAllTodos(database = getDb()): Todo[] {
  const rows = database.select().from(todos).orderBy(desc(todos.createdAt));
  return rows.map(toTodo);
}

export function getTodoById(id: string, database = getDb()): Todo | undefined {
  const [row] = database.select().from(todos).where(eq(todos.id, id)).limit(1);
  return row ? toTodo(row) : undefined;
}

export function updateTodo(
  id: string,
  input: { title?: string; completed?: boolean },
  database = getDb(),
): Todo | undefined {
  const set: Partial<TodoRow> & { updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    set.title = input.title.trim();
  }

  if (input.completed !== undefined) {
    set.completed = input.completed ? 1 : 0;
  }

  const [row] = database.update(todos).set(set).where(eq(todos.id, id)).returning();
  return row ? toTodo(row) : undefined;
}

export function deleteTodo(id: string, database = getDb()): boolean {
  const rows = database.delete(todos).where(eq(todos.id, id)).returning();
  return rows.length > 0;
}
