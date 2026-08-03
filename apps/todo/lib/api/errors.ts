import { NextResponse } from 'next/server';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'BAD_REQUEST'
  | 'MALFORMED_JSON'
  | 'INVALID_ID';

export function errorResponse(
  message: string,
  code: ErrorCode,
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error: { message, code } },
    { status, headers },
  );
}
