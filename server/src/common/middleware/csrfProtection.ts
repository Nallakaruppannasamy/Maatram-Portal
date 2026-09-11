/**
 * @file src/common/middleware/csrfProtection.ts
 * @description Origin/Referer verification middleware for cookie-bearing state-changing endpoints (SEC-009).
 * Ensures that requests relying on credentials/cookies originate strictly from trusted, allowed frontend origins.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/common/exceptions/apiError';
import { env } from '@/config/env';

const configuredOrigins = env.FRONTEND_URL.split(',')
  .map((u) => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const devOrigins =
  env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']
    : [];

export const trustedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    'https://maatram-portal.onrender.com',
    'https://maatram-staging.onrender.com',
    ...devOrigins,
  ])
);

/**
 * Middleware to validate Origin and Referer headers against trusted origins.
 * Guards sensitive cookie-dependent endpoints (like /auth/refresh and /auth/logout)
 * against Cross-Site Request Forgery (CSRF).
 */
export const verifyCsrfOrigin = (req: Request, res: Response, next: NextFunction): void => {
  // Safe read-only HTTP methods do not change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  let requestOrigin: string | null = null;

  if (typeof originHeader === 'string' && originHeader.trim() !== '') {
    requestOrigin = originHeader.trim().replace(/\/+$/, '');
  } else if (typeof refererHeader === 'string' && refererHeader.trim() !== '') {
    try {
      const parsed = new URL(refererHeader);
      requestOrigin = parsed.origin.replace(/\/+$/, '');
    } catch {
      return next(ApiError.forbidden('CSRF validation failed: Invalid Referer header'));
    }
  }

  // In production or when origin is present, verify against trusted origins
  if (requestOrigin) {
    const isTrusted = trustedOrigins.includes(requestOrigin);
    if (!isTrusted) {
      return next(
        ApiError.forbidden(`CSRF validation failed: Origin "${requestOrigin}" is not permitted`)
      );
    }
  } else if (env.NODE_ENV === 'production') {
    // In production, browser cross-origin state-changing requests ALWAYS attach Origin
    // Reject requests with missing Origin/Referer if cookie authentication is present
    if (req.cookies?.refreshToken) {
      return next(ApiError.forbidden('CSRF validation failed: Missing Origin or Referer header'));
    }
  }

  next();
};
