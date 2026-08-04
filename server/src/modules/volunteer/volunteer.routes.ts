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
import path from 'path';
import fs from 'fs';
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

// Configure local multer disk storage for volunteer proofs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'volunteer-' + uniqueSuffix + ext);
  },
});

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
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }
    const relativePath = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      data: { url: relativePath },
    });
  });
});

// ─── Read Endpoints (admin, zone managers, and students) ─────────────────────
router.get('/', requireRole('admin', 'zone', 'student'), volunteerController.listVolunteers);
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
