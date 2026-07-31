/**
 * @file src/modules/profile/profile.routes.ts
 * @description Route registrations for the Profile module.
 */

import { Router } from 'express';
import { profileController } from './profile.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { updateProfileValidator } from './profile.validator';

const router = Router();

// Protect all routes with auth
router.use(requireAuth);

router.get('/', profileController.get);
router.put('/', validate(updateProfileValidator), profileController.update);

export default router;
export const profileRoutes = router;
