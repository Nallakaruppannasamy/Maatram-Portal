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
   * Creates a new volunteer or a student volunteer submission.
   */
  createVolunteerOrSubmission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    if (req.user!.role === 'student') {
      const submission = await volunteerService.createSubmission(req.body, actorId, actorRole);
      ResponseFormatter.success(res, submission, 'Volunteer activity log submitted successfully', 201);
    } else {
      const volunteer = await volunteerService.createVolunteer(req.body, actorId, actorRole);
      ResponseFormatter.success(res, volunteer, 'Volunteer created successfully', 201);
    }
  });

  /**
   * Retrieves a single volunteer or submission by ID.
   */
  getVolunteerOrSubmissionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const actorId = req.user!.userId;
    const actorRole = req.user!.role;

    try {
      const submission = await volunteerService.getSubmissionById(id, actorId, actorRole);
      ResponseFormatter.success(res, submission, 'Volunteer submission retrieved successfully');
    } catch (err: any) {
      if (err.status === 404) {
        const volunteer = await volunteerService.getVolunteerById(id);
        ResponseFormatter.success(res, volunteer, 'Volunteer retrieved successfully');
      } else {
        throw err;
      }
    }
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
   * Changes the status of a volunteer or submission.
   */
  changeStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, reviewerComment } = req.body;
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const SUBMISSION_STATUSES = ['pending', 'approved', 'rejected', 'PENDING', 'APPROVED', 'REJECTED'];
    const isSubmission = SUBMISSION_STATUSES.includes(status);

    if (isSubmission) {
      const submission = await volunteerService.updateSubmissionStatus(
        id,
        status,
        reviewerComment,
        actorId,
        actorRole
      );
      ResponseFormatter.success(res, submission, `Volunteer submission status changed to ${status}`);
    } else {
      const volunteer = await volunteerService.changeStatus(id, status, actorId, actorRole);
      ResponseFormatter.success(res, volunteer, `Volunteer status changed to ${status}`);
    }
  });

  /**
   * Adds or updates a comment on a volunteer submission.
   */
  addComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { comment } = req.body;
    const actorId = req.user!.userId;
    const actorRole = this.getAuditActorRole(req.user!.role);

    const submission = await volunteerService.addSubmissionComment(id, comment, actorId, actorRole);
    ResponseFormatter.success(res, submission, 'Submission reviewer comment added successfully');
  });

  /**
   * Lists volunteers or submissions with pagination, search, sorting, and filters.
   */
  listVolunteers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user?.userId;
    const actorRole = req.user?.role;
    const result = await volunteerService.listVolunteers(req.query, actorId, actorRole);

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
