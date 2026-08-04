/**
 * @file src/modules/organization/organization.routes.ts
 * @description Route registrations for the Organization module.
 */

import { Router } from 'express';
import { organizationController } from './organization.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';
import { createOrganizationValidator, updateOrganizationValidator } from './organization.validator';

const router = Router();

// Protect all routes with auth
router.use(requireAuth);

// Read-only endpoints accessible to both admins and zone incharges
router.get('/', requireRole('admin', 'zone'), organizationController.list);
router.get('/hierarchy', requireRole('admin', 'zone'), organizationController.getHierarchy);
router.get('/export', requireRole('admin'), organizationController.exportHierarchy);
router.get('/:id', requireRole('admin', 'zone'), organizationController.getOne);

// Write endpoints restricted to admins only
router.post(
  '/',
  requireRole('admin'),
  validate(createOrganizationValidator),
  organizationController.create
);
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateOrganizationValidator),
  organizationController.update
);
router.delete('/:id', requireRole('admin'), organizationController.delete);

export default router;
