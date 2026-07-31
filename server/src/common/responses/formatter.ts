import { Response } from 'express';

interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown[];
  meta?: PaginationMeta;
}

export class ResponseFormatter {
  static success<T>(
    res: Response,
    data: T,
    message = 'Request completed successfully',
    statusCode = 200,
    meta?: PaginationMeta
  ): Response {
    const envelope: ApiResponseEnvelope<T> = {
      success: true,
      message,
      data,
      meta,
    };
    return res.status(statusCode).json(envelope);
  }

  static error(
    res: Response,
    message = 'An error occurred',
    statusCode = 500,
    errors: unknown[] = []
  ): Response {
    const envelope: ApiResponseEnvelope = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
    };
    return res.status(statusCode).json(envelope);
  }
}
