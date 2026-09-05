/**
 * @file src/modules/volunteer/volunteer.routes.ts
 * @description Route registrations for the Volunteer Management module.
 */

import { Router } from 'express';
import { volunteerController } from './volunteer.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';
import multer from 'multer';
import { uploadToCloudinary } from '@/utils/cloudinary';
import {
  createVolunteerSchema,
  updateVolunteerSchema,
  changeVolunteerStatusSchema,
  createVolunteerSubmissionSchema,
  updateSubmissionStatusSchema,
  addSubmissionCommentSchema,
} from './volunteer.validator';

const router = Router();

// Protect all routes with authentication
router.use(requireAuth);

// Configure memory storage for Cloudinary upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid image type. Allowed: JPEG, JPG, PNG, WEBP'));
    }
    cb(null, true);
  },
});

// Dynamic validator helpers
const validateSubmissionOrCreateVolunteer = (req: any, res: any, next: any) => {
  if (req.user!.role === 'student') {
    return validate(createVolunteerSubmissionSchema)(req, res, next);
  } else {
    return validate(createVolunteerSchema)(req, res, next);
  }
};

const validateChangeStatus = (req: any, res: any, next: any) => {
  const SUBMISSION_STATUSES = ['pending', 'approved', 'rejected', 'PENDING', 'APPROVED', 'REJECTED'];
  if (req.body && SUBMISSION_STATUSES.includes(req.body.status)) {
    return validate(updateSubmissionStatusSchema)(req, res, next);
  } else {
    return validate(changeVolunteerStatusSchema)(req, res, next);
  }
};

// ─── Image Upload Endpoint ──────────────────────────────────────────────────
router.post('/upload', requireRole('admin', 'zone', 'student'), (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File size must not exceed 5 MB'
          : err.message || 'Invalid upload file';
      return res.status(400).json({
        success: false,
        message,
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image file.',
      });
    }
    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'volunteers');
      res.status(200).json({
        success: true,
        data: { url: uploadResult.secure_url },
      });
    } catch (uploadError: any) {
      res.status(500).json({
        success: false,
        message: uploadError.message || 'Cloudinary upload failed',
      });
    }
  });
});

// ─── Read Endpoints (admin, zone managers, and students) ─────────────────────
router.get('/export', requireRole('admin', 'zone'), volunteerController.exportVolunteeringLogs);
router.get('/', requireRole('admin', 'zone', 'student'), volunteerController.listVolunteers);
router.get('/logs', requireRole('admin', 'zone'), volunteerController.listVolunteers);
router.get('/:id', requireRole('admin', 'zone', 'student'), volunteerController.getVolunteerOrSubmissionById);

// ─── Write Endpoints ────────────────────────────────────────────────────────
router.post(
  '/',
  requireRole('admin', 'student'),
  validateSubmissionOrCreateVolunteer,
  volunteerController.createVolunteerOrSubmission
);

router.put(
  '/:id',
  requireRole('admin'),
  validate(updateVolunteerSchema),
  volunteerController.updateVolunteer
);

router.patch(
  '/:id/status',
  requireRole('admin', 'zone'),
  validateChangeStatus,
  volunteerController.changeStatus
);

router.patch(
  '/:id/comment',
  requireRole('admin', 'zone'),
  validate(addSubmissionCommentSchema),
  volunteerController.addComment
);

export default router;
