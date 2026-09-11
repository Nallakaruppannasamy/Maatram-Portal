/**
 * @file src/modules/user/user.validator.ts
 * @description Zod schema definitions for User administrative actions.
 */

import { z } from 'zod';
import { UserRole } from '@prisma/client';

const isValidPhone = (val: unknown): boolean => {
  if (val === undefined || val === null || val === '') return true;
  if (typeof val !== 'string') return false;
  const digits = val.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 && /^\+?[0-9\s\-()]+$/.test(val.trim());
};

const phoneSchema = z
  .string()
  .refine(isValidPhone, { message: 'Mobile number must contain between 10 and 15 digits' })
  .optional()
  .nullable();

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
    mobile: phoneSchema,
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
    mobile: phoneSchema,
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
