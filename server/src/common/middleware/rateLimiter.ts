/**
 * @file src/common/middleware/rateLimiter.ts
 * @description Scoped rate limiters for sensitive endpoints (SEC-007).
 * Defends against brute-force, credential stuffing, enumeration, DoS, and upload/export abuse.
 */

import { rateLimit } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Standard 429 response structure matching ResponseFormatter
 */
const createRateLimitHandler = (message: string) => {
  return (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message,
      retryAfter: res.getHeader('Retry-After'),
    });
  };
};

/**
 * 1. Login Limiter:
 * 10 attempts per 15 minutes per IP.
 * Prevents brute force and credential stuffing.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many login attempts. Please try again in 15 minutes.'),
});

/**
 * 2. Forgot Password Limiter:
 * 5 requests per 15 minutes per IP.
 * Prevents email bombing, spamming, and account enumeration abuse.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many password recovery requests. Please try again in 15 minutes.'),
});

/**
 * 3. Reset Password Limiter:
 * 5 attempts per 15 minutes per IP.
 * Prevents brute-forcing reset tokens.
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many password reset attempts. Please try again in 15 minutes.'),
});

/**
 * 4. Refresh Token Limiter:
 * 60 requests per 15 minutes per IP.
 * Prevents refresh endpoint spamming while supporting standard SPA session lifecycles.
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many token refresh requests. Please try again later.'),
});

/**
 * 5. Import Limiter:
 * 10 batch import requests per 15 minutes per IP.
 * Protects server resources against repeated massive Excel parsing operations.
 */
export const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many import requests. Please try again in 15 minutes.'),
});

/**
 * 6. File Upload Limiter:
 * 30 uploads per 15 minutes per IP.
 * Protects storage and Cloudinary bandwidth from upload abuse.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many file upload requests. Please try again later.'),
});

/**
 * 7. Export Limiter:
 * 30 export requests per 15 minutes per IP.
 * Prevents CPU & memory exhaustion from unconstrained Excel workbook generation.
 */
export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many export requests. Please try again later.'),
});
