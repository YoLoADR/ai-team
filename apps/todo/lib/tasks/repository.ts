import { randomUUID } from 'crypto';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/client';
import { tasks } from '../db/schema';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = { title: string };
export type UpdateTaskInput = { title?: string; completed?: boolean };

export function createTask(input: CreateTaskInput): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title: input.title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(tasks).values(task).run();
  return task;
}

export function getAllTasks(): Task[] {
  return db.select().from(tasks).orderBy(asc(tasks.createdAt)).all();
}

export function getTaskById(id: string): Task | undefined {
  return db.select().from(tasks).where(eq(tasks.id, id)).get();
}

export function updateTask(
  id: string,
  input: UpdateTaskInput,
): Task | undefined {
  const existing = getTaskById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const updates: Partial<typeof tasks.$inferSelect> = { updatedAt: now };

  if (input.title !== undefined) {
    updates.title = input.title.trim();
  }

  if (input.completed !== undefined) {
    updates.completed = input.completed;
  }

  db.update(tasks).set(updates).where(eq(tasks.id, id)).run();
  return getTaskById(id)!;
}

export function deleteTask(id: string): boolean {
  const existing = getTaskById(id);
  if (!existing) return false;

  db.delete(tasks).where(eq(tasks.id, id)).run();
  return true;
}
