/**
 * @file src/modules/zone/zone.controller.ts
 * @description Controller mapping Express endpoints to zone services.
 */

import { Request, Response } from 'express';
import { zoneService } from './zone.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { AuditActorRole } from '@prisma/client';

export class ZoneController {
  /**
   * Create a new zone
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;

    const zone = await zoneService.createZone(req.body, actorId, actorRole);
    ResponseFormatter.success(res, zone, 'Zone created successfully', 201);
  });

  /**
   * Update zone details
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;
    const { id } = req.params;

    const zone = await zoneService.updateZone(id, req.body, actorId, actorRole);
    ResponseFormatter.success(res, zone, 'Zone updated successfully');
  });

  /**
   * Get zone by ID
   */
  getOne = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const zone = await zoneService.getZone(id);
    ResponseFormatter.success(res, zone, 'Zone retrieved successfully');
  });

  /**
   * Get paginated and filtered list of zones
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await zoneService.listZones(req.query);
    ResponseFormatter.success(res, result.data, 'Zones listed successfully', 200, result.meta);
  });

  /**
   * Soft-delete zone (updates isActive = false)
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;
    const { id } = req.params;

    await zoneService.deleteZone(id, actorId, actorRole);
    ResponseFormatter.success(res, null, 'Zone deleted successfully');
  });

  /**
   * Retrieves colleges and stats assigned to a specific zone.
   */
  getZoneColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { zoneId } = req.params;
    const colleges = await zoneService.getZoneColleges(zoneId);
    ResponseFormatter.success(res, colleges, 'Zone colleges retrieved successfully');
  });

  /**
   * Exports colleges and stats assigned to a specific zone.
   */
  exportZoneColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { zoneId } = req.params;
    const format = ((req.query.format as string) || 'csv').toLowerCase();

    if (format === 'xlsx') {
      const buffer = await zoneService.exportZoneColleges(zoneId, 'xlsx');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=zone-colleges-${Date.now()}.xlsx`
      );
      res.status(200).send(buffer);
    } else {
      const csvContent = await zoneService.exportZoneColleges(zoneId, 'csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=zone-colleges-${Date.now()}.csv`
      );
      res.status(200).send(csvContent);
    }
  });
}

export const zoneController = new ZoneController();
