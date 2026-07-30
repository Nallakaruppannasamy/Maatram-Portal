/**
 * @file src/modules/auth/auth.validator.ts
 * @description Zod validation schemas for all Authentication API request payloads.
 */

import { z } from 'zod';

// ─── Password Complexity Regex ───────────────────────────────────────────────
// Requires at least: 1 uppercase, 1 lowercase, 1 digit, 1 special character.
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const complexPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    passwordRegex,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  );

// ─── Login Schema ────────────────────────────────────────────────────────────
export const loginValidator = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Identifier is required').trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

// ─── Change Password Schema ──────────────────────────────────────────────────
export const changePasswordValidator = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: complexPasswordSchema,
      confirmPassword: z.string().min(1, 'Password confirmation is required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'New password and confirm password must match',
      path: ['confirmPassword'],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: 'New password cannot be the same as the current password',
      path: ['newPassword'],
    }),
});

// ─── Forgot Password Schema ──────────────────────────────────────────────────
export const forgotPasswordValidator = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Identifier is required').trim(),
  }),
});

// ─── Reset Password Schema ───────────────────────────────────────────────────
export const resetPasswordValidator = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Token is required'),
      password: complexPasswordSchema,
      confirmPassword: z.string().min(1, 'Password confirmation is required'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Password and confirm password must match',
      path: ['confirmPassword'],
    }),
});
