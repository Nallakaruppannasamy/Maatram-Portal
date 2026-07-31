/**
 * @file src/modules/organization/organization.controller.ts
 * @description Controller mapping Express endpoints to organization services.
 */

import { Request, Response } from 'express';
import { organizationService } from './organization.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { AuditActorRole } from '@prisma/client';

export class OrganizationController {
  /**
   * Create a new organization
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;

    const org = await organizationService.createOrganization(req.body, actorId, actorRole);
    ResponseFormatter.success(res, org, 'Organization created successfully', 201);
  });

  /**
   * Update organization details
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;
    const { id } = req.params;

    const org = await organizationService.updateOrganization(id, req.body, actorId, actorRole);
    ResponseFormatter.success(res, org, 'Organization updated successfully');
  });

  /**
   * Get organization by ID
   */
  getOne = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const org = await organizationService.getOrganization(id);
    ResponseFormatter.success(res, org, 'Organization retrieved successfully');
  });

  /**
   * Get paginated and filtered list of organizations
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await organizationService.listOrganizations(req.query);
    ResponseFormatter.success(
      res,
      result.data,
      'Organizations listed successfully',
      200,
      result.meta
    );
  });

  /**
   * Soft-delete organization (updates isActive = false)
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;
    const { id } = req.params;

    await organizationService.deleteOrganization(id, actorId, actorRole);
    ResponseFormatter.success(res, null, 'Organization deleted successfully');
  });
}

export const organizationController = new OrganizationController();
