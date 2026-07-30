import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '@/common/exceptions/apiError';
import { ResponseFormatter } from '@/common/responses/formatter';
import { logger } from '@/config/logger';
import { env } from '@/config/env';

interface PrismaClientError {
  name: string;
  code: string;
  message: string;
  meta?: unknown;
  stack?: string;
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: PrismaClientError | ApiError | ZodError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof ZodError) {
    const errors = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    error = ApiError.badRequest('Validation Failed', errors);
  } else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as PrismaClientError;
    error = new ApiError(400, `Database constraint error: ${prismaErr.code}`, [
      { code: prismaErr.code, meta: prismaErr.meta },
    ]);
  } else {
    const genericErr = err as PrismaClientError;
    error = new ApiError(
      genericErr.statusCode || 500,
      err.message || 'Something went wrong',
      [],
      genericErr.isOperational || false,
      err.stack
    );
  }

  if (error.statusCode >= 500) {
    logger.error(`[SYSTEM ERROR] ${req.method} ${req.url} - Stack: ${error.stack}`);
  } else {
    logger.warn(
      `[API WARNING] ${req.method} ${req.url} - Status: ${error.statusCode} - Msg: ${error.message}`
    );
  }

  const responseMessage =
    error.statusCode >= 500 && env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : error.message;

  ResponseFormatter.error(res, responseMessage, error.statusCode, error.errors);
};
