/**
 * @file src/modules/user/user.routes.ts
 * @description Route registrations for the User module.
 */

import { Router } from 'express';
import { userController } from './user.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';
import { createUserValidator, updateUserValidator } from './user.validator';

const router = Router();

// Protect all routes with auth
router.use(requireAuth);

// Read-only endpoints accessible to both admins and zone incharges
router.get('/', requireRole('admin', 'zone'), userController.list);
router.get('/:id', requireRole('admin', 'zone'), userController.getOne);

// Write endpoints restricted to admins only
router.post('/', requireRole('admin'), validate(createUserValidator), userController.create);
router.put('/:id', requireRole('admin'), validate(updateUserValidator), userController.update);
router.patch('/:id/activate', requireRole('admin'), userController.activate);
router.patch('/:id/deactivate', requireRole('admin'), userController.deactivate);

export default router;
export const userRoutes = router;
