/**
 * @file src/modules/audit/audit.routes.ts
 * @description Route definitions and security middlewares for the Audit Log module.
 */

import { Router } from 'express';
import { auditController } from './audit.controller';
import { requireAuth } from '@/common/middleware/auth';
import { requireRole } from '@/common/middleware/rbac';

const router = Router();

// Strict RBAC: Accessible to Super Admin ('admin') and Zone Incharge ('zone')
router.use(requireAuth);
router.use(requireRole('admin', 'zone'));

router.get('/', auditController.list);
router.get('/actions', auditController.getActions);
router.get('/:id', auditController.getOne);

export default router;
export const auditRoutes = router;
