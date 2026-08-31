/**
 * @file src/modules/analytics/analytics.routes.ts
 * @description Route registrations for Volunteering Analytics.
 */

import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { validate } from '@/common/middleware/validate';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';
import {
  volunteeringAnalyticsQuerySchema,
  collegeDrillDownQuerySchema,
  zoneDrillDownQuerySchema,
} from './analytics.validator';

const router = Router();

// Protect all analytics routes - Super Admin and Zone Incharges
router.use(requireAuth);
router.use(requireRole('admin', 'zone'));

// Main volunteering analytics endpoint
router.get(
  '/volunteering',
  validate(volunteeringAnalyticsQuerySchema),
  analyticsController.getVolunteeringAnalytics
);

// College Drill-down endpoint
router.get(
  '/colleges/:collegeId',
  validate(collegeDrillDownQuerySchema),
  analyticsController.getCollegeDrillDown
);

// Zone Drill-down endpoint
router.get(
  '/zones/:zoneId',
  validate(zoneDrillDownQuerySchema),
  analyticsController.getZoneDrillDown
);

export default router;
