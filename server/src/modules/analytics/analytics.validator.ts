/**
 * @file src/modules/analytics/analytics.validator.ts
 * @description Zod validation schemas for Analytics query parameters.
 */

import { z } from 'zod';

export const volunteeringAnalyticsQuerySchema = z.object({
  query: z.object({
    period: z.enum(['total', 'academicYear', 'custom']).optional().default('total'),
    academicYear: z.string().trim().optional(),
    fromDate: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid fromDate format (expected YYYY-MM-DD)',
      }),
    toDate: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid toDate format (expected YYYY-MM-DD)',
      }),
    studentYear: z.enum(['all', '1', '2', '3', '4']).optional().default('all'),
    zoneId: z.string().trim().optional().default('all'),
    collegeId: z.string().trim().optional().default('all'),
  }),
});

export const collegeDrillDownQuerySchema = z.object({
  params: z.object({
    collegeId: z.string().uuid('Invalid College ID'),
  }),
  query: z.object({
    period: z.enum(['total', 'academicYear', 'custom']).optional().default('total'),
    academicYear: z.string().trim().optional(),
    fromDate: z.string().trim().optional(),
    toDate: z.string().trim().optional(),
    studentYear: z.enum(['all', '1', '2', '3', '4']).optional().default('all'),
  }),
});

export const zoneDrillDownQuerySchema = z.object({
  params: z.object({
    zoneId: z.string().uuid('Invalid Zone ID'),
  }),
  query: z.object({
    period: z.enum(['total', 'academicYear', 'custom']).optional().default('total'),
    academicYear: z.string().trim().optional(),
    fromDate: z.string().trim().optional(),
    toDate: z.string().trim().optional(),
    studentYear: z.enum(['all', '1', '2', '3', '4']).optional().default('all'),
    collegeId: z.string().trim().optional().default('all'),
  }),
});
