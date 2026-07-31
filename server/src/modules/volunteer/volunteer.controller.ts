/**
 * @file src/modules/volunteer/volunteer.controller.ts
 * @description Controller layer handling Express requests for Volunteer Management.
 */

import { Request, Response } from 'express';
import { volunteerService } from './volunteer.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { AuditActorRole } from '@prisma/client';

export class VolunteerController {
  /**
   * Helper to map user request roles to audit actor roles.
   */
  private getAuditActorRole(role: string): AuditActorRole {
    if (role === 'admin') return AuditActorRole.admin;
    if (role === 'zone') return AuditActorRole.zone;
    if (role === 'student') return AuditActorRole.student;
    return AuditActorRole.system;
  }

  /**
   * Creates a new volunteer.
   */
  createVolunteer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const volunteer = await volunteerService.createVolunteer(req.body, actorId, actorRole);

    ResponseFormatter.success(res, volunteer, 'Volunteer created successfully', 201);
  });

  /**
   * Retrieves a single volunteer by ID.
   */
  getVolunteerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const volunteer = await volunteerService.getVolunteerById(id);

    ResponseFormatter.success(res, volunteer, 'Volunteer retrieved successfully');
  });

  /**
   * Updates a volunteer's profile.
   */
  updateVolunteer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const volunteer = await volunteerService.updateVolunteer(id, req.body, actorId, actorRole);

    ResponseFormatter.success(res, volunteer, 'Volunteer updated successfully');
  });

  /**
   * Changes the status of a volunteer.
   */
  changeStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const volunteer = await volunteerService.changeStatus(id, status, actorId, actorRole);

    ResponseFormatter.success(res, volunteer, `Volunteer status changed to ${status}`);
  });

  /**
   * Lists volunteers with pagination, search, sorting, and filters.
   */
  listVolunteers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await volunteerService.listVolunteers(req.query);

    ResponseFormatter.success(
      res,
      result.items,
      'Volunteers listed successfully',
      200,
      result.meta
    );
  });
}

export const volunteerController = new VolunteerController();
