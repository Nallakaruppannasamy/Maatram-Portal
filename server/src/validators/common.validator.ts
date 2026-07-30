/**
 * @file src/validators/common.validator.ts
 * @description Shared reusable Zod schemas used across multiple modules.
 * Import these primitives into module-specific validators to avoid duplication.
 */

import { z } from 'zod';

// ─── Primitive Reusables ───────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid('Must be a valid UUID');

export const emailSchema = z.string().email('Must be a valid email address').toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters');

export const indianMobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number');

// ─── Pagination Query Schema ───────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
  }),
});

// ─── UUID Param Schema ─────────────────────────────────────────────────────────

export const uuidParamSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});
