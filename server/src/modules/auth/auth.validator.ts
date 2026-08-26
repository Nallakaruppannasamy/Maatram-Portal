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
      confirmPassword: z.string().optional(),
    })
    .refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
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
  body: z
    .object({
      identifier: z.string().trim().optional(),
      email: z.string().trim().optional(),
    })
    .refine(
      (data) => Boolean((data.identifier && data.identifier.length > 0) || (data.email && data.email.length > 0)),
      {
        message: 'Identifier or Email is required',
        path: ['identifier'],
      }
    ),
});

// ─── Reset Password Schema ───────────────────────────────────────────────────
export const resetPasswordValidator = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Token is required').trim(),
      password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
      newPassword: z.string().min(6, 'Password must be at least 6 characters long').optional(),
      confirmPassword: z.string().optional(),
    })
    .refine((data) => Boolean(data.password || data.newPassword), {
      message: 'New password is required',
      path: ['newPassword'],
    })
    .refine(
      (data) => {
        const pwd = data.password || data.newPassword;
        if (data.confirmPassword && pwd) {
          return pwd === data.confirmPassword;
        }
        return true;
      },
      {
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      }
    ),
});
