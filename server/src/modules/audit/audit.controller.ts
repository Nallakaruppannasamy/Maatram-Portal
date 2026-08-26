/**
 * @file src/modules/audit/audit.controller.ts
 * @description Controller handling incoming requests for Audit Logs.
 */

import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { ResponseFormatter } from '@/common/responses/formatter';

export class AuditController {
  /**
   * GET /api/v1/audit-logs
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await auditService.listAuditLogs(req.query, req.user);
      ResponseFormatter.success(
        res,
        result.items,
        'Audit logs retrieved successfully',
        200,
        result.meta
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/audit-logs/actions
   */
  async getActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actions = await auditService.getAuditActions();
      ResponseFormatter.success(
        res,
        actions,
        'Distinct audit actions retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/audit-logs/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await auditService.getAuditLogById(req.params.id, req.user);
      ResponseFormatter.success(
        res,
        log,
        'Audit log record retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
