import { eq } from 'drizzle-orm';
import { todos, type Todo, type NewTodo } from '../db/schema';
import { getDb, type DB } from '../db/client';
import { NotFoundError } from '../errors';

export class TodoRepository {
  private db: DB;

  constructor(db?: DB) {
    this.db = db ?? getDb();
  }

  findAll(): Todo[] {
    return this.db.select().from(todos).all();
  }

  findById(id: number): Todo | null {
    const result = this.db.select().from(todos).where(eq(todos.id, id)).all();
    return result[0] ?? null;
  }

  create(data: NewTodo): Todo {
    const result = this.db.insert(todos).values(data).returning().all();
    return result[0];
  }

  update(id: number, data: Partial<NewTodo>): Todo {
    const result = this.db
      .update(todos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(todos.id, id))
      .returning()
      .all();

    if (result.length === 0) {
      throw new NotFoundError(`Todo with id ${id} not found`);
    }

    return result[0];
  }

  delete(id: number): void {
    const result = this.db
      .delete(todos)
      .where(eq(todos.id, id))
      .returning()
      .all();

    if (result.length === 0) {
      throw new NotFoundError(`Todo with id ${id} not found`);
    }
  }
}

export const todoRepository = new TodoRepository();
