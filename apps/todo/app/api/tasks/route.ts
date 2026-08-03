export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createTask, getAllTasks } from '../../../lib/tasks/repository';
import { createTaskSchema } from '../../../lib/validators';
import { errorResponse } from '../../../lib/api/errors';

function methodNotAllowed(allow: string) {
  return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405, {
    Allow: allow,
  });
}

async function parseJsonBody(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  try {
    const text = await request.text();
    if (!text.trim()) {
      return {
        ok: false,
        response: errorResponse(
          'Request body is required',
          'VALIDATION_ERROR',
          400,
        ),
      };
    }
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: errorResponse('Malformed JSON body', 'MALFORMED_JSON', 400),
    };
  }
}

export async function GET() {
  const tasks = getAllTasks();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = createTaskSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return errorResponse('Invalid task title', 'VALIDATION_ERROR', 400);
  }

  const task = createTask(parsed.data);
  return NextResponse.json(task, { status: 201 });
}

export async function PUT() {
  return methodNotAllowed('GET, POST');
}

export async function PATCH() {
  return methodNotAllowed('GET, POST');
}

export async function DELETE() {
  return methodNotAllowed('GET, POST');
}
