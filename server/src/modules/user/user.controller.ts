/**
 * @file src/modules/user/user.controller.ts
 * @description Controller mapping Express endpoints to user services.
 */

import { Request, Response } from 'express';
import { userService } from './user.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { AuditActorRole } from '@prisma/client';

export class UserController {
  /**
   * Create and provision a new user (admin or zone)
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;

    const result = await userService.createUser(req.body, actorId, actorRole);
    ResponseFormatter.success(res, result, 'User provisioned successfully', 201);
  });

  /**
   * Update administrative user details
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;
    const { id } = req.params;

    const user = await userService.updateUser(id, req.body, actorId, actorRole);
    ResponseFormatter.success(res, user, 'User updated successfully');
  });

  /**
   * Get administrative user details by ID
   */
  getOne = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = await userService.getUser(id);
    ResponseFormatter.success(res, user, 'User retrieved successfully');
  });

  /**
   * Get paginated and filtered list of users
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.listUsers(req.query);
    ResponseFormatter.success(res, result, 'Users listed successfully');
  });

  /**
   * Activate a user account
   */
  activate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;
    const { id } = req.params;

    await userService.toggleUserActivation(id, true, actorId, actorRole);
    ResponseFormatter.success(res, null, 'User activated successfully');
  });

  /**
   * Deactivate a user account
   */
  deactivate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const actorId = req.user!.userId;
    const actorRole = req.user!.role as AuditActorRole;
    const { id } = req.params;

    await userService.toggleUserActivation(id, false, actorId, actorRole);
    ResponseFormatter.success(res, null, 'User deactivated successfully');
  });
}

export const userController = new UserController();
