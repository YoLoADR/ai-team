import { NextRequest, NextResponse } from 'next/server';
import { createTodo, getAllTodos } from '../../../lib/db/repository';
import { createTodoSchema } from '../../../lib/validators';
import {
  errorResponse,
  parseBody,
  mapCreateValidationError,
} from '../../../lib/errors';

export async function GET(request: NextRequest) {
  try {
    const todos = getAllTodos();
    return NextResponse.json(todos);
  } catch {
    return errorResponse('DATABASE_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request);

  if (!parsed.ok) {
    return errorResponse(parsed.code, parsed.status);
  }

  const validation = createTodoSchema.safeParse(parsed.data);

  if (!validation.success) {
    const { error, status, message } = mapCreateValidationError(validation.error.issues);
    return errorResponse(error, status, message);
  }

  try {
    const todo = createTodo(validation.data);
    return NextResponse.json(todo, { status: 201 });
  } catch {
    return errorResponse('DATABASE_ERROR', 500);
  }
}
