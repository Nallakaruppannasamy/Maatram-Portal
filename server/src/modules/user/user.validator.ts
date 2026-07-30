/**
 * @file src/modules/user/user.validator.ts
 * @description Zod schema definitions for User administrative actions.
 */

import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserValidator = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format').trim().toLowerCase(),
    role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid user role' }) }),
    employeeId: z
      .string()
      .min(2, 'Employee ID must be at least 2 characters long')
      .max(50)
      .optional(),
    fullName: z.string().min(3, 'Full name must be at least 3 characters long').max(100).trim(),
    mobile: z
      .string()
      .regex(/^\d{10,15}$/, 'Mobile number must contain between 10 and 15 digits')
      .optional(),
    designation: z.string().max(100).optional(),
    organizationId: z.string().uuid('Invalid Organization ID format').optional(),
    zoneId: z.string().uuid('Invalid Zone ID format').optional(),
  }),
});

export const updateUserValidator = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').trim().toLowerCase().optional(),
    role: z.nativeEnum(UserRole).optional(),
    employeeId: z.string().min(2).max(50).optional(),
    fullName: z.string().min(3).max(100).trim().optional(),
    mobile: z
      .string()
      .regex(/^\d{10,15}$/, 'Mobile number must contain between 10 and 15 digits')
      .optional(),
    designation: z.string().max(100).optional(),
    organizationId: z.string().uuid('Invalid Organization ID format').optional(),
    zoneId: z.string().uuid('Invalid Zone ID format').nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const assignRoleValidator = z.object({
  body: z.object({
    role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid user role' }) }),
  }),
});
