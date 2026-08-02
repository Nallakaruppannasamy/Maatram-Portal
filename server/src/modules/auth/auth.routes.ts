/**
 * @file src/modules/auth/auth.routes.ts
 * @description Routes registration for the Authentication module.
 */

import { Router, Request } from 'express';
import { rateLimit } from 'express-rate-limit';
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

// Dedicated Auth Rate Limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 login attempts per 15 minutes per IP + identifier
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const identifier =
      typeof req.body?.identifier === 'string' ? req.body.identifier.trim().toLowerCase() : '';
    return `${req.ip}_${identifier}`;
  },
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 15 minutes.',
  },
});

// ─── Public Routes ───────────────────────────────────────────────────────────
router.post('/login', loginLimiter, validate(loginValidator), authController.login);
router.post('/refresh', authController.refresh);
router.post(
  '/forgot-password',
  passwordRecoveryLimiter,
  validate(forgotPasswordValidator),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  passwordRecoveryLimiter,
  validate(resetPasswordValidator),
  authController.resetPassword
);

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
