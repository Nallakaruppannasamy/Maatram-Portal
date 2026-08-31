/**
 * @file src/modules/analytics/analytics.controller.ts
 * @description Controller mapping analytics endpoints to services.
 */

import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { VolunteeringAnalyticsQueryDTO } from './analytics.types';

export class AnalyticsController {
  /**
   * Retrieves volunteering analytics across top students, colleges, and zones.
   */
  getVolunteeringAnalytics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const query = req.query as unknown as VolunteeringAnalyticsQueryDTO;
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
      const query = req.query as unknown as VolunteeringAnalyticsQueryDTO;
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
      const query = req.query as unknown as VolunteeringAnalyticsQueryDTO;
      const data = await analyticsService.getZoneDrillDown(zoneId, query);
      ResponseFormatter.success(res, data, 'Zone drill-down analytics retrieved successfully');
    }
  );
}

export const analyticsController = new AnalyticsController();
