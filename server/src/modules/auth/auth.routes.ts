/**
 * @file src/modules/auth/auth.routes.ts
 * @description Routes registration for the Authentication module.
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import {
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from './auth.validator';
import {
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  refreshLimiter,
} from '@/common/middleware/rateLimiter';
import { verifyCsrfOrigin } from '@/common/middleware/csrfProtection';

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────────────────
router.post('/login', loginLimiter, validate(loginValidator), authController.login);
router.post('/refresh', refreshLimiter, verifyCsrfOrigin, authController.refresh);
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate(forgotPasswordValidator),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validate(resetPasswordValidator),
  authController.resetPassword
);

// ─── Protected Routes ────────────────────────────────────────────────────────
router.post('/logout', requireAuth, verifyCsrfOrigin, authController.logout);
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordValidator),
  authController.changePassword
);
router.get('/me', requireAuth, authController.getMe);

export default router;
export const authRoutes = router;
