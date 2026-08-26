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

import { uploadToCloudinary } from '@/utils/cloudinary';

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
   * Upload profile image, persist to database, and return updated profile data.
   */
  uploadImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, 'profiles');
    const fileUrl = uploadResult.secure_url;

    // Automatically persist to database for active user
    const updatedProfile = await profileService.uploadProfileImage(
      req.user!.userId,
      req.user!.role,
      fileUrl
    );

    ResponseFormatter.success(
      res,
      { fileUrl, profile: updatedProfile },
      'Profile image uploaded and updated successfully'
    );
  });

  // ─── Skill Handlers ──────────────────────────────────────────────────────
  addSkill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const skill = await profileService.addSkill(req.user!.userId, req.user!.role, req.body.skillName);
    ResponseFormatter.success(res, skill, 'Skill added successfully', 201);
  });

  updateSkill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const skill = await profileService.updateSkill(req.user!.userId, req.user!.role, id, req.body.skillName);
    ResponseFormatter.success(res, skill, 'Skill updated successfully');
  });

  deleteSkill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await profileService.deleteSkill(req.user!.userId, req.user!.role, id);
    ResponseFormatter.success(res, null, 'Skill deleted successfully');
  });

  // ─── Project Handlers ────────────────────────────────────────────────────
  addProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const project = await profileService.addProject(req.user!.userId, req.user!.role, req.body);
    ResponseFormatter.success(res, project, 'Project added successfully', 201);
  });

  updateProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const project = await profileService.updateProject(req.user!.userId, req.user!.role, id, req.body);
    ResponseFormatter.success(res, project, 'Project updated successfully');
  });

  deleteProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await profileService.deleteProject(req.user!.userId, req.user!.role, id);
    ResponseFormatter.success(res, null, 'Project deleted successfully');
  });

  // ─── Certification Handlers ──────────────────────────────────────────────
  addCertification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const cert = await profileService.addCertification(req.user!.userId, req.user!.role, req.body);
    ResponseFormatter.success(res, cert, 'Certification added successfully', 201);
  });

  updateCertification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const cert = await profileService.updateCertification(req.user!.userId, req.user!.role, id, req.body);
    ResponseFormatter.success(res, cert, 'Certification updated successfully');
  });

  deleteCertification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await profileService.deleteCertification(req.user!.userId, req.user!.role, id);
    ResponseFormatter.success(res, null, 'Certification deleted successfully');
  });
}

export const profileController = new ProfileController();
