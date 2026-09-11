/**
 * @file src/modules/auth/auth.controller.ts
 * @description Controller layer for the Authentication module. Interacts with the service layer.
 */

import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ResponseFormatter } from '@/common/responses/formatter';
import { asyncHandler } from '@/common/responses/asyncHandler';
import { ApiError } from '@/common/exceptions/apiError';

export class AuthController {
  /**
   * Dual login endpoint (email/register number + password)
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);

    // Set refresh token in HTTP-only cookie for enhanced security
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ResponseFormatter.success(res, result, 'Logged in successfully');
  });

  /**
   * Refreshes JWT tokens via Refresh Token rotation
   */
  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken =
      req.body.refreshToken || req.cookies?.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw ApiError.badRequest('Refresh token is required');
    }

    const result = await authService.refreshToken(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ResponseFormatter.success(res, result, 'Token refreshed successfully');
  });

  /**
   * Log out user and revoke refresh token
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken =
      req.body.refreshToken || req.cookies?.refreshToken || req.headers['x-refresh-token'];

    if (refreshToken && typeof refreshToken === 'string') {
      await authService.logout(req.user!.userId, refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    ResponseFormatter.success(res, null, 'Logged out successfully');
  });

  /**
   * Change password (normal change and first-login forced change)
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    ResponseFormatter.success(res, null, 'Password changed successfully');
  });

  /**
   * Forgot password recovery request (simulated email delivery)
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const identifier = req.body.identifier || req.body.email;
    await authService.forgotPassword(identifier);
    // Always return 200 OK for security
    ResponseFormatter.success(res, null, 'If the account exists, reset instructions were sent.');
  });

  /**
   * Reset password using generated token
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.body.token;
    const password = req.body.password || req.body.newPassword;
    await authService.resetPassword(token, password);
    ResponseFormatter.success(res, null, 'Password reset successfully');
  });

  /**
   * Retrieve profile of the currently authenticated user
   */
  getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profile = await authService.getMe(req.user!.userId);
    ResponseFormatter.success(res, profile, 'Profile retrieved successfully');
  });
}

export const authController = new AuthController();
