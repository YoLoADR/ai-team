export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { updateTask, deleteTask } from '../../../../lib/tasks/repository';
import { updateTaskSchema } from '../../../../lib/validators';
import { errorResponse } from '../../../../lib/api/errors';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = context.params;
  if (!UUID_REGEX.test(id)) {
    return errorResponse('Invalid task id', 'INVALID_ID', 400);
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = updateTaskSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return errorResponse('Invalid update fields', 'VALIDATION_ERROR', 400);
  }

  const task = updateTask(id, parsed.data);
  if (!task) {
    return errorResponse('Task not found', 'NOT_FOUND', 404);
  }

  return NextResponse.json(task);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = context.params;
  if (!UUID_REGEX.test(id)) {
    return errorResponse('Invalid task id', 'INVALID_ID', 400);
  }

  const deleted = deleteTask(id);
  if (!deleted) {
    return errorResponse('Task not found', 'NOT_FOUND', 404);
  }

  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return methodNotAllowed('PATCH, DELETE');
}

export async function POST() {
  return methodNotAllowed('PATCH, DELETE');
}

export async function PUT() {
  return methodNotAllowed('PATCH, DELETE');
}
