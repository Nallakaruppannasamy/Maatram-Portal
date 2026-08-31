/**
 * @file src/modules/analytics/analytics.controller.ts
 * @description Controller mapping analytics endpoints to services.
 */

import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { VolunteeringAnalyticsQueryDTO } from './analytics.types';
import { zoneService } from '@/modules/zone/zone.service';
import { ApiError } from '@/common/exceptions/apiError';
import { prisma } from '@/config/database';

export class AnalyticsController {
  /**
   * Helper to validate and enforce zone scoping for Zone Incharges.
   */
  private async enforceZoneScope(req: Request): Promise<string | null> {
    const user = req.user;
    if (user && user.role === 'zone') {
      const assignedZoneId = await zoneService.getAssignedZoneIdForUser(user.userId);
      if (!assignedZoneId) {
        throw ApiError.forbidden('No active operational zone assigned to this incharge');
      }
      return assignedZoneId;
    }
    return null;
  }

  /**
   * Retrieves volunteering analytics across top students, colleges, and zones.
   */
  getVolunteeringAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const query = { ...(req.query as unknown as VolunteeringAnalyticsQueryDTO) };
      const assignedZoneId = await this.enforceZoneScope(req);

      if (assignedZoneId) {
        // Enforce assigned zone
        query.zoneId = assignedZoneId;

        // If a specific college is requested, ensure it belongs to the assigned zone
        if (query.collegeId && query.collegeId !== 'all') {
          const college = await prisma.college.findUnique({
            where: { id: query.collegeId },
            select: { zoneId: true },
          });
          if (!college || college.zoneId !== assignedZoneId) {
            throw ApiError.forbidden('Access denied: You cannot access colleges outside your assigned zone');
          }
        }
      }

      const data = await analyticsService.getVolunteeringAnalytics(query);
      ResponseFormatter.success(res, data, 'Volunteering analytics retrieved successfully');
    }
  );

  /**
   * College Drill-Down: College Overview + Top 5 Students in this College.
   */
  getCollegeDrillDown = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { collegeId } = req.params;
      const query = { ...(req.query as unknown as VolunteeringAnalyticsQueryDTO) };
      const assignedZoneId = await this.enforceZoneScope(req);

      if (assignedZoneId) {
        const college = await prisma.college.findUnique({
          where: { id: collegeId },
          select: { zoneId: true },
        });
        if (!college || college.zoneId !== assignedZoneId) {
          throw ApiError.forbidden('Access denied: You cannot access colleges outside your assigned zone');
        }
        query.zoneId = assignedZoneId;
      }

      const data = await analyticsService.getCollegeDrillDown(collegeId, query);
      ResponseFormatter.success(res, data, 'College drill-down analytics retrieved successfully');
    }
  );

  /**
   * Zone Drill-Down: Zone Overview + Colleges Performance inside this Zone.
   */
  getZoneDrillDown = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { zoneId } = req.params;
      const query = { ...(req.query as unknown as VolunteeringAnalyticsQueryDTO) };
      const assignedZoneId = await this.enforceZoneScope(req);

      if (assignedZoneId) {
        if (zoneId !== assignedZoneId) {
          throw ApiError.forbidden('Access denied: You cannot access analytics for other zones');
        }
        query.zoneId = assignedZoneId;
      }

      const data = await analyticsService.getZoneDrillDown(zoneId, query);
      ResponseFormatter.success(res, data, 'Zone drill-down analytics retrieved successfully');
    }
  );
}

export const analyticsController = new AnalyticsController();
