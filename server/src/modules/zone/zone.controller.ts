/**
 * @file src/modules/zone/zone.controller.ts
 * @description Controller mapping Express endpoints to zone services.
 */

import { Request, Response } from 'express';
import { zoneService } from './zone.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { ApiError } from '@/common/exceptions/apiError';
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
   * Retrieves colleges assigned to the authenticated user's zone.
   */
  getMyColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role === 'admin') {
      const zoneId = req.query.zoneId as string;
      if (zoneId) {
        const colleges = await zoneService.getZoneColleges(zoneId);
        ResponseFormatter.success(res, colleges, 'Zone colleges retrieved successfully');
        return;
      }
      // If admin and no zoneId passed, return first zone's colleges or all colleges
      const zones = await zoneService.listZones({});
      if (zones.data && zones.data.length > 0) {
        const colleges = await zoneService.getZoneColleges(zones.data[0].id);
        ResponseFormatter.success(res, colleges, 'Zone colleges retrieved successfully');
        return;
      }
      ResponseFormatter.success(res, [], 'No colleges found');
      return;
    }

    const colleges = await zoneService.getMyColleges(userId);
    ResponseFormatter.success(res, colleges, 'Assigned colleges retrieved successfully');
  });

  /**
   * Exports colleges assigned to the authenticated user's zone.
   */
  exportMyColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const format = ((req.query.format as string) || 'csv').toLowerCase();

    let bufferOrCsv: Buffer | string;
    if (role === 'admin' && req.query.zoneId) {
      bufferOrCsv = await zoneService.exportZoneColleges(req.query.zoneId as string, format);
    } else {
      bufferOrCsv = await zoneService.exportMyColleges(userId, format);
    }

    if (format === 'xlsx') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=assigned-colleges-${Date.now()}.xlsx`
      );
      res.status(200).send(bufferOrCsv);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=assigned-colleges-${Date.now()}.csv`
      );
      res.status(200).send(bufferOrCsv);
    }
  });

  /**
   * Retrieves colleges and stats assigned to a specific zone.
   */
  getZoneColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { zoneId } = req.params;
    const role = req.user!.role;
    const userId = req.user!.userId;

    if (role === 'zone') {
      const assignedZoneId = await zoneService.getAssignedZoneIdForUser(userId);
      if (assignedZoneId !== zoneId) {
        throw ApiError.forbidden('Access denied: You can only view colleges in your assigned zone');
      }
    }

    const colleges = await zoneService.getZoneColleges(zoneId);
    ResponseFormatter.success(res, colleges, 'Zone colleges retrieved successfully');
  });

  /**
   * Exports colleges and stats assigned to a specific zone.
   */
  exportZoneColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { zoneId } = req.params;
    const role = req.user!.role;
    const userId = req.user!.userId;

    if (role === 'zone') {
      const assignedZoneId = await zoneService.getAssignedZoneIdForUser(userId);
      if (assignedZoneId !== zoneId) {
        throw ApiError.forbidden('Access denied: You can only export colleges in your assigned zone');
      }
    }

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

  // --- College CRUD ---
  addCollege = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { zoneId } = req.params;
    const college = await zoneService.addCollege(zoneId, req.body);
    ResponseFormatter.success(res, college, 'College added successfully', 201);
  });

  updateCollege = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { collegeId } = req.params;
    const college = await zoneService.updateCollege(collegeId, req.body);
    ResponseFormatter.success(res, college, 'College updated successfully');
  });

  deleteCollege = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { collegeId } = req.params;
    const result = await zoneService.deleteCollege(collegeId);
    ResponseFormatter.success(res, result, 'College deleted successfully');
  });

  // --- Department CRUD ---
  addDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { collegeId } = req.params;
    const dept = await zoneService.addDepartment(collegeId, req.body.name);
    ResponseFormatter.success(res, dept, 'Department added successfully', 201);
  });

  updateDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { departmentId } = req.params;
    const dept = await zoneService.updateDepartment(departmentId, req.body.name);
    ResponseFormatter.success(res, dept, 'Department updated successfully');
  });

  deleteDepartment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { departmentId } = req.params;
    const result = await zoneService.deleteDepartment(departmentId);
    ResponseFormatter.success(res, result, 'Department deleted successfully');
  });

  // --- Program/Degree CRUD ---
  addProgram = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { departmentId } = req.params;
    const prog = await zoneService.addProgram(departmentId, req.body.name, req.body.durationYears);
    ResponseFormatter.success(res, prog, 'Degree/Program added successfully', 201);
  });

  updateProgram = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { programId } = req.params;
    const prog = await zoneService.updateProgram(programId, req.body.name, req.body.durationYears);
    ResponseFormatter.success(res, prog, 'Degree/Program updated successfully');
  });

  deleteProgram = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { programId } = req.params;
    const result = await zoneService.deleteProgram(programId);
    ResponseFormatter.success(res, result, 'Degree/Program deleted successfully');
  });

  // --- Excel Bulk Import & Template ---
  importStructure = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { zoneId } = req.params;
    if (!req.file) {
      ResponseFormatter.error(res, 'No Excel file uploaded', 400);
      return;
    }
    const result = await zoneService.importZoneStructure(zoneId, req.file.buffer);
    ResponseFormatter.success(res, result, 'Zone structure imported successfully');
  });

  downloadTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const buffer = await zoneService.getTemplateBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=zone-import-template.xlsx'
    );
    res.status(200).send(buffer);
  });
}

export const zoneController = new ZoneController();
