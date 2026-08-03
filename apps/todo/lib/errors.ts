import { NextResponse } from 'next/server';
import type { ZodIssue } from 'zod';

export type ErrorCode =
  | 'INVALID_TITLE'
  | 'TITLE_TOO_LONG'
  | 'INVALID_ID'
  | 'NO_FIELDS_TO_UPDATE'
  | 'TODO_NOT_FOUND'
  | 'INVALID_JSON'
  | 'PAYLOAD_TOO_LARGE'
  | 'DATABASE_ERROR';

const defaultMessages: Record<ErrorCode, string> = {
  INVALID_TITLE: 'Title is required and must be a non-empty string',
  TITLE_TOO_LONG: 'Title must not exceed 200 characters',
  INVALID_ID: 'ID parameter is malformed',
  NO_FIELDS_TO_UPDATE: 'At least one field (title or completed) is required',
  TODO_NOT_FOUND: 'No todo exists with the given ID',
  INVALID_JSON: 'Request body is not valid JSON',
  PAYLOAD_TOO_LARGE: 'Request body exceeds size limit',
  DATABASE_ERROR: 'Unexpected database failure',
};

export function errorResponse(code: ErrorCode, status: number, message = defaultMessages[code]) {
  return NextResponse.json({ error: code, message }, { status });
}

export async function parseBody(
  request: Request,
  maxBytes = 10240,
): Promise<{ ok: true; data: unknown } | { ok: false; code: ErrorCode; status: number }> {
  const text = await request.text();

  if (text.length > maxBytes) {
    return { ok: false, code: 'PAYLOAD_TOO_LARGE', status: 413 };
  }

  if (text.trim() === '') {
    return { ok: true, data: {} };
  }

  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, code: 'INVALID_JSON', status: 400 };
  }
}

export function validateId(
  raw: string | string[] | undefined,
): { ok: true; id: string } | { ok: false; response: NextResponse } {
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (!value || value.trim() === '') {
    return { ok: false, response: errorResponse('INVALID_ID', 400) };
  }

  return { ok: true, id: value };
}

export function mapCreateValidationError(issues: ZodIssue[]) {
  for (const issue of issues) {
    if (issue.message === 'TITLE_TOO_LONG' || issue.code === 'too_big') {
      return {
        error: 'TITLE_TOO_LONG' as ErrorCode,
        status: 400,
        message: defaultMessages.TITLE_TOO_LONG,
      };
    }
  }

  return {
    error: 'INVALID_TITLE' as ErrorCode,
    status: 400,
    message: defaultMessages.INVALID_TITLE,
  };
}

export function mapUpdateValidationError(issues: ZodIssue[]) {
  for (const issue of issues) {
    if (issue.message === 'NO_FIELDS_TO_UPDATE') {
      return {
        error: 'NO_FIELDS_TO_UPDATE' as ErrorCode,
        status: 400,
        message: defaultMessages.NO_FIELDS_TO_UPDATE,
      };
    }

    if (issue.message === 'TITLE_TOO_LONG' || issue.code === 'too_big') {
      return {
        error: 'TITLE_TOO_LONG' as ErrorCode,
        status: 400,
        message: defaultMessages.TITLE_TOO_LONG,
      };
    }
  }

  return {
    error: 'INVALID_TITLE' as ErrorCode,
    status: 400,
    message: defaultMessages.INVALID_TITLE,
  };
}
