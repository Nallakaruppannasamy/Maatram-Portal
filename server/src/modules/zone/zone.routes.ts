/**
 * @file src/modules/zone/zone.routes.ts
 * @description Route registrations for the Zone module.
 */

import { Router } from 'express';
import { zoneController } from './zone.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';
import { createZoneValidator, updateZoneValidator } from './zone.validator';

const router = Router();

// Protect all routes with auth
router.use(requireAuth);

// Read-only endpoints accessible to both admins and zone incharges
router.get('/', requireRole('admin', 'zone'), zoneController.list);
router.get('/:zoneId/colleges', requireRole('admin', 'zone'), zoneController.getZoneColleges);
router.get('/:zoneId/colleges/export', requireRole('admin', 'zone'), zoneController.exportZoneColleges);
router.get('/:id', requireRole('admin', 'zone'), zoneController.getOne);

// Write endpoints restricted to admins only
router.post('/', requireRole('admin'), validate(createZoneValidator), zoneController.create);
router.put('/:id', requireRole('admin'), validate(updateZoneValidator), zoneController.update);
router.delete('/:id', requireRole('admin'), zoneController.delete);

export default router;
