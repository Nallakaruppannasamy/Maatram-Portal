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

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────────────────
router.post('/login', validate(loginValidator), authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate(forgotPasswordValidator), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidator), authController.resetPassword);

// ─── Protected Routes ────────────────────────────────────────────────────────
router.post('/logout', requireAuth, authController.logout);
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordValidator),
  authController.changePassword
);
router.get('/me', requireAuth, authController.getMe);

export default router;
export const authRoutes = router;
