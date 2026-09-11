/**
 * @file src/modules/student/student.routes.ts
 * @description Route registrations for the Student Management module.
 */

import { Router } from 'express';
import { studentController } from './student.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';
import {
  createStudentSchema,
  updateStudentSchema,
  changeStudentStatusSchema,
  manualStudentSchema,
  updateStudentSpocSchema,
} from './student.validator';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const router = Router();

// Protect all routes with auth
router.use(requireAuth);

// Read endpoints
router.get('/', requireRole('admin', 'zone'), studentController.listStudents);
router.get('/export', requireRole('admin', 'zone'), studentController.exportStudents);
router.get('/template', requireRole('admin'), studentController.getTemplate);
router.get('/:id/resume', studentController.getResume);
router.get('/:id', requireRole('admin', 'zone'), studentController.getStudentById);

// SPOC status update (Super Admin globally, Zone Incharge within own zone)
router.patch(
  '/:id/spoc',
  requireRole('admin', 'zone'),
  validate(updateStudentSpocSchema),
  studentController.updateSpocStatus
);

// Write endpoints (Admin only)
router.post(
  '/',
  requireRole('admin'),
  validate(createStudentSchema),
  studentController.createStudent
);
router.post(
  '/manual',
  requireRole('admin'),
  validate(manualStudentSchema),
  studentController.manualRegister
);
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateStudentSchema),
  studentController.updateStudent
);
router.patch(
  '/:id/status',
  requireRole('admin', 'zone'),
  validate(changeStudentStatusSchema),
  studentController.changeStatus
);
router.post(
  '/bulk-deactivate',
  requireRole('admin', 'zone'),
  studentController.bulkDeactivate
);
router.post(
  '/import',
  requireRole('admin'),
  upload.single('file'),
  studentController.importStudents
);
router.get(
  '/imports/:id',
  requireRole('admin'),
  studentController.getImportStatus
);
router.get(
  '/imports/:id/errors/export',
  requireRole('admin'),
  studentController.exportImportErrors
);

export default router;
