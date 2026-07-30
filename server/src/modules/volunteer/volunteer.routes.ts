/**
 * @file src/modules/volunteer/volunteer.routes.ts
 * @description Route registrations for the Volunteer Management module.
 */

import { Router } from 'express';
import { volunteerController } from './volunteer.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';
import {
  createVolunteerSchema,
  updateVolunteerSchema,
  changeVolunteerStatusSchema,
} from './volunteer.validator';

const router = Router();

// Protect all routes with authentication
router.use(requireAuth);

// ─── Read Endpoints (admin and zone managers) ──────────────────────────────
router.get('/', requireRole('admin', 'zone'), volunteerController.listVolunteers);
router.get('/:id', requireRole('admin', 'zone'), volunteerController.getVolunteerById);

// ─── Write Endpoints (admin only) ─────────────────────────────────────────
router.post(
  '/',
  requireRole('admin'),
  validate(createVolunteerSchema),
  volunteerController.createVolunteer
);
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateVolunteerSchema),
  volunteerController.updateVolunteer
);
router.patch(
  '/:id/status',
  requireRole('admin'),
  validate(changeVolunteerStatusSchema),
  volunteerController.changeStatus
);

export default router;
