/**
 * @file src/modules/zone/zone.routes.ts
 * @description Route registrations for the Zone module.
 */

import { Router } from 'express';
import { zoneController } from './zone.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';
import {
  createZoneValidator,
  updateZoneValidator,
  createCollegeValidator,
  updateCollegeValidator,
  createDepartmentValidator,
  createProgramValidator
} from './zone.validator';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Protect all routes with auth
router.use(requireAuth);

// Template download
router.get('/import/template', requireRole('admin'), zoneController.downloadTemplate);

// Read-only endpoints accessible to both admins and zone incharges
router.get('/', requireRole('admin', 'zone'), zoneController.list);
router.get('/:zoneId/colleges', requireRole('admin', 'zone'), zoneController.getZoneColleges);
router.get('/:zoneId/colleges/export', requireRole('admin', 'zone'), zoneController.exportZoneColleges);
router.get('/:id', requireRole('admin', 'zone'), zoneController.getOne);

// Write endpoints restricted to admins only
router.post('/', requireRole('admin'), validate(createZoneValidator), zoneController.create);
router.put('/:id', requireRole('admin'), validate(updateZoneValidator), zoneController.update);
router.delete('/:id', requireRole('admin'), zoneController.delete);

// College CRUD routes
router.post('/:zoneId/colleges', requireRole('admin'), validate(createCollegeValidator), zoneController.addCollege);
router.put('/colleges/:collegeId', requireRole('admin'), validate(updateCollegeValidator), zoneController.updateCollege);
router.delete('/colleges/:collegeId', requireRole('admin'), zoneController.deleteCollege);

// Department CRUD routes
router.post('/colleges/:collegeId/departments', requireRole('admin'), validate(createDepartmentValidator), zoneController.addDepartment);
router.put('/departments/:departmentId', requireRole('admin'), validate(createDepartmentValidator), zoneController.updateDepartment);
router.delete('/departments/:departmentId', requireRole('admin'), zoneController.deleteDepartment);

// Program CRUD routes
router.post('/departments/:departmentId/programs', requireRole('admin'), validate(createProgramValidator), zoneController.addProgram);
router.put('/programs/:programId', requireRole('admin'), validate(createProgramValidator), zoneController.updateProgram);
router.delete('/programs/:programId', requireRole('admin'), zoneController.deleteProgram);

// Import route
router.post('/:zoneId/import', requireRole('admin'), upload.single('file'), zoneController.importStructure);

export default router;
