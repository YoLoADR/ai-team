import { NextRequest, NextResponse } from 'next/server';
import { getTodoById, updateTodo, deleteTodo } from '../../../../lib/db/repository';
import { updateTodoSchema } from '../../../../lib/validators';
import {
  errorResponse,
  parseBody,
  mapUpdateValidationError,
  validateId,
} from '../../../../lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const idCheck = validateId(params.id);
  if (!idCheck.ok) {
    return idCheck.response;
  }

  try {
    const todo = getTodoById(idCheck.id);
    if (!todo) {
      return errorResponse('TODO_NOT_FOUND', 404);
    }
    return NextResponse.json(todo);
  } catch {
    return errorResponse('DATABASE_ERROR', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const idCheck = validateId(params.id);
  if (!idCheck.ok) {
    return idCheck.response;
  }

  const parsed = await parseBody(request);
  if (!parsed.ok) {
    return errorResponse(parsed.code, parsed.status);
  }

  const validation = updateTodoSchema.safeParse(parsed.data);
  if (!validation.success) {
    const { error, status, message } = mapUpdateValidationError(validation.error.issues);
    return errorResponse(error, status, message);
  }

  try {
    const todo = updateTodo(idCheck.id, validation.data);
    if (!todo) {
      return errorResponse('TODO_NOT_FOUND', 404);
    }
    return NextResponse.json(todo);
  } catch {
    return errorResponse('DATABASE_ERROR', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const idCheck = validateId(params.id);
  if (!idCheck.ok) {
    return idCheck.response;
  }

  try {
    const deleted = deleteTodo(idCheck.id);
    if (!deleted) {
      return errorResponse('TODO_NOT_FOUND', 404);
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return errorResponse('DATABASE_ERROR', 500);
  }
}
