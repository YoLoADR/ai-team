import { NextRequest } from 'next/server';
import { todoRepository } from '../../../../lib/repositories/todo-repository';
import { validateUpdateTodo } from '../../../../lib/validators';
import { successResponse, errorResponse } from '../../../../lib/api-utils';
import { ValidationError, NotFoundError } from '../../../../lib/errors';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid id parameter');
    }

    const todo = todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundError(`Todo with id ${id} not found`);
    }

    return successResponse(todo);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid id parameter');
    }

    const body = await request.json();
    const validated = validateUpdateTodo(body);
    const todo = todoRepository.update(id, validated);
    return successResponse(todo);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid id parameter');
    }

    todoRepository.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
