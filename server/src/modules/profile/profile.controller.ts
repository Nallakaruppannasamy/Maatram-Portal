/**
 * @file src/modules/profile/profile.controller.ts
 * @description Controller mapping Express endpoints to profile services.
 */

import { Request, Response } from 'express';
import { profileService } from './profile.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { ApiError } from '@/common/exceptions/apiError';
import { AuditActorRole } from '@prisma/client';

export class ProfileController {
  /**
   * Retrieve active user's profile
   */
  get = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const profile = await profileService.getProfile(userId, role);
    ResponseFormatter.success(res, profile, 'Profile retrieved successfully');
  });

  /**
   * Update active user's profile
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const actorRole = req.user!.role as AuditActorRole;

    const profile = await profileService.updateProfile(userId, role, req.body, actorRole);
    ResponseFormatter.success(res, profile, 'Profile updated successfully');
  });

  /**
   * Get all active colleges
   */
  getColleges = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const colleges = await profileService.getColleges();
    ResponseFormatter.success(res, colleges, 'Colleges retrieved successfully');
  });

  /**
   * Get all degrees
   */
  getDegrees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const degrees = await profileService.getDegrees();
    ResponseFormatter.success(res, degrees, 'Degrees retrieved successfully');
  });

  /**
   * Get all departments
   */
  getDepartments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const departments = await profileService.getDepartments();
    ResponseFormatter.success(res, departments, 'Departments retrieved successfully');
  });

  /**
   * Upload profile image and return URL path
   */
  uploadImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }

    // Return the relative URL path for local access
    const fileUrl = `/uploads/${req.file.filename}`;

    ResponseFormatter.success(
      res,
      { fileUrl },
      'Profile image uploaded successfully'
    );
  });
}

export const profileController = new ProfileController();
