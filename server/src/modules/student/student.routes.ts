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
router.get('/:id', requireRole('admin', 'zone'), studentController.getStudentById);

// Write endpoints (Admin only)
router.post(
  '/',
  requireRole('admin'),
  validate(createStudentSchema),
  studentController.createStudent
);
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateStudentSchema),
  studentController.updateStudent
);
router.patch(
  '/:id/status',
  requireRole('admin'),
  validate(changeStudentStatusSchema),
  studentController.changeStatus
);
router.post(
  '/import',
  requireRole('admin'),
  upload.single('file'),
  studentController.importStudents
);

export default router;
