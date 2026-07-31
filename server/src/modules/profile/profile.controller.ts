/**
 * @file src/modules/profile/profile.controller.ts
 * @description Controller mapping Express endpoints to profile services.
 */

import { Request, Response } from 'express';
import { profileService } from './profile.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
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
}

export const profileController = new ProfileController();
