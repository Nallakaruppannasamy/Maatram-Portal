/**
 * @file src/modules/profile/profile.routes.ts
 * @description Route registrations for the Profile module.
 */

import { Router } from 'express';
import { profileController } from './profile.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { updateProfileValidator } from './profile.validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure local multer disk storage
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
    cb(null, 'profile-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid image type. Allowed: JPEG, PNG, WEBP'));
    }
    cb(null, true);
  },
});

// Protect all routes with auth
router.use(requireAuth);

// Academic metadata routes
router.get('/colleges', profileController.getColleges);
router.get('/degrees', profileController.getDegrees);
router.get('/departments', profileController.getDepartments);

// Profile fetch & update routes
router.get('/', profileController.get);
router.put('/', validate(updateProfileValidator), profileController.update);

// Profile image upload route
router.post('/upload', upload.single('file'), profileController.uploadImage);

// Skill CRUD routes
router.post('/skills', profileController.addSkill);
router.put('/skills/:id', profileController.updateSkill);
router.delete('/skills/:id', profileController.deleteSkill);

// Project CRUD routes
router.post('/projects', profileController.addProject);
router.put('/projects/:id', profileController.updateProject);
router.delete('/projects/:id', profileController.deleteProject);

// Certification CRUD routes
router.post('/certifications', profileController.addCertification);
router.put('/certifications/:id', profileController.updateCertification);
router.delete('/certifications/:id', profileController.deleteCertification);

export default router;
export const profileRoutes = router;
