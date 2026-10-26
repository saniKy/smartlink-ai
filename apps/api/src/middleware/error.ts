/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorResponse } from '@shared/types/api.ts';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Array<{ field?: string; message: string }>;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: Array<{ field?: string; message: string }>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    const issues = (err as any).issues || (err as any).errors || [];
    const details = issues.map((e: any) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : undefined,
      message: e.message || 'Validation error',
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or query parameters',
        details,
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error('[Unhandled Server Error]', err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    },
  });
}
