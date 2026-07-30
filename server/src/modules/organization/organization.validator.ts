/**
 * @file src/modules/organization/organization.validator.ts
 * @description Zod schema definitions for Organization module inputs.
 */

import { z } from 'zod';

const orgCodeRegex = /^[A-Z0-9-]+$/;

export const createOrganizationValidator = z.object({
  body: z.object({
    name: z.string().min(3, 'Organization name must be at least 3 characters long').max(100).trim(),
    code: z
      .string()
      .min(2, 'Organization code must be at least 2 characters long')
      .max(20)
      .regex(
        orgCodeRegex,
        'Organization code must contain only uppercase alphanumeric characters and hyphens'
      )
      .trim(),
    description: z.string().max(500).optional(),
  }),
});

export const updateOrganizationValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Organization name must be at least 3 characters long')
      .max(100)
      .trim()
      .optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
  }),
});
