import { NextRequest } from 'next/server';
import { todoRepository } from '../../../lib/repositories/todo-repository';
import { validateCreateTodo } from '../../../lib/validators';
import { successResponse, errorResponse } from '../../../lib/api-utils';

export async function GET() {
  try {
    const todos = todoRepository.findAll();
    return successResponse(todos);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateCreateTodo(body);
    const todo = todoRepository.create(validated);
    return successResponse(todo, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
