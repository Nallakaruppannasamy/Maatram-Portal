/**
 * @file src/common/middleware/requestContext.ts
 * @description Request Context management via AsyncLocalStorage for tracking client IP, user agent, and request metadata.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface RequestContext {
  ipAddress: string;
  userAgent: string | null;
  requestId: string;
  userId?: string;
  role?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Retrieves the current request context store, if available.
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Safely extracts and normalizes the client IP address from an Express request.
 * - Adheres to Express `trust proxy` configuration (resolves real client IP behind reverse proxies like Render).
 * - Normalizes IPv6-mapped IPv4 addresses (::ffff:127.0.0.1 -> 127.0.0.1).
 * - Normalizes IPv6 localhost (::1 -> 127.0.0.1).
 * - Safely trims and handles multi-IP strings if present.
 */
export function extractClientIp(req: Request): string {
  // Express `req.ip` automatically resolves according to `trust proxy` settings
  let rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';

  // If rawIp contains comma (fallback defense), take the first valid trimmed IP
  if (rawIp.includes(',')) {
    rawIp = rawIp.split(',')[0].trim();
  }

  // Normalize IPv6-mapped IPv4 (e.g. ::ffff:192.168.1.1 -> 192.168.1.1)
  if (rawIp.startsWith('::ffff:')) {
    rawIp = rawIp.substring(7);
  }

  // Normalize localhost IPv6
  if (rawIp === '::1') {
    rawIp = '127.0.0.1';
  }

  return rawIp.trim();
}

/**
 * Express middleware that initializes the AsyncLocalStorage context for every incoming HTTP request.
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ipAddress = extractClientIp(req);
  const userAgent = (req.headers['user-agent'] as string) || null;
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

  // Attach requestId header to response for distributed tracing
  res.setHeader('X-Request-Id', requestId);

  const context: RequestContext = {
    ipAddress,
    userAgent,
    requestId,
  };

  requestContextStorage.run(context, () => {
    next();
  });
}
