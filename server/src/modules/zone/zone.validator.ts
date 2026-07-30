/**
 * @file src/modules/zone/zone.validator.ts
 * @description Zod schema definitions for Zone module inputs.
 */

import { z } from 'zod';

const zoneCodeRegex = /^[A-Z0-9-]+$/;

export const createZoneValidator = z.object({
  body: z.object({
    name: z.string().min(3, 'Zone name must be at least 3 characters long').max(100).trim(),
    code: z
      .string()
      .min(2, 'Zone code must be at least 2 characters long')
      .max(20)
      .regex(
        zoneCodeRegex,
        'Zone code must contain only uppercase alphanumeric characters and hyphens'
      )
      .trim(),
    regionLabel: z
      .string()
      .min(3, 'Region label must be at least 3 characters long')
      .max(150)
      .trim(),
    organizationId: z.string().uuid('Invalid Organization ID format'),
    inchargeId: z.string().uuid('Invalid Incharge ID format').optional(),
  }),
});

export const updateZoneValidator = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Zone name must be at least 3 characters long')
      .max(100)
      .trim()
      .optional(),
    regionLabel: z
      .string()
      .min(3, 'Region label must be at least 3 characters long')
      .max(150)
      .trim()
      .optional(),
    organizationId: z.string().uuid('Invalid Organization ID format').optional(),
    inchargeId: z.string().uuid('Invalid Incharge ID format').nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});
