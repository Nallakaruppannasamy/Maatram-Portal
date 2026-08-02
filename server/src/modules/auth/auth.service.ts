/**
 * @file src/modules/auth/auth.service.ts
 * @description Service layer containing all business logic for authentication.
 */

import crypto from 'crypto';
import { ApiError } from '@/common/exceptions/apiError';
import { logger } from '@/config/logger';
import { authRepository } from './auth.repository';
import { comparePassword, hashPassword } from '@/utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { mockNotificationService } from '@/utils/notification';
import { LoginResponseData, UserAuthProfile } from './auth.types';
import { AUTH_LOGS } from './auth.constants';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '@/types';

import { User, Student, Zone, College, Department, Program, UserProfile } from '@prisma/client';

type StudentWithRelations = Student & {
  zone?: Zone | null;
  college?: College | null;
  department?: Department | null;
  program?: Program | null;
};

type UserWithRelations = User & {
  userProfile?: UserProfile | null;
  zone?: Zone | null;
  student?: StudentWithRelations | null;
  zoneIncharge?: Zone | null;
};

// Helper to hash tokens for DB storage/matching (SHA-256)
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export class AuthService {
  /**
   * Helper to map a user model with loaded relations to a UserAuthProfile.
   */
  private mapToProfile(user: UserWithRelations): UserAuthProfile {
    let fullName = user.userProfile?.fullName || (user.email ? user.email.split('@')[0] : 'User');
    let mobile: string | null = user.userProfile?.mobile || null;
    let zone: { id: string; name: string; code: string } | null = null;
    let college: { id: string; name: string; code: string } | null = null;

    if (user.role === 'student' && user.student) {
      fullName = [user.student.firstName, user.student.middleName, user.student.lastName]
        .filter(Boolean)
        .join(' ');
      mobile = user.student.mobile;
      zone = user.student.zone
        ? { id: user.student.zone.id, name: user.student.zone.name, code: user.student.zone.code }
        : null;
      college = user.student.college
        ? {
            id: user.student.college.id,
            name: user.student.college.name,
            code: user.student.college.code,
          }
        : null;
    } else if (user.role === 'zone') {
      const activeZone = user.zoneIncharge || user.zone;
      if (activeZone) {
        zone = {
          id: activeZone.id,
          name: activeZone.name,
          code: activeZone.code,
        };
      }
    }

    return {
      id: user.id,
      email: user.email,
      registerNumber: user.registerNumber,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      fullName,
      mobile,
      zone,
      college,
    };
  }

  /**
   * Performs dual-mode user login.
   */
  async login(identifier: string, password: string): Promise<LoginResponseData> {
    const user = await authRepository.findUserByIdentifier(identifier);

    if (!user) {
      logger.warn(`[${AUTH_LOGS.LOGIN_FAILED}] User not found with identifier: ${identifier}`);
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      logger.warn(`[${AUTH_LOGS.LOGIN_FAILED}] Inactive user login attempt: ${user.id}`);
      throw ApiError.forbidden('Your account is inactive');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      logger.warn(`[${AUTH_LOGS.LOGIN_FAILED}] Password mismatch for user: ${user.id}`);
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email || '',
      role: user.role,
      zoneId: user.student?.zoneId || user.zoneIncharge?.id || undefined,
      registerNumber: user.registerNumber || undefined,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save hashed refresh token to DB
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await authRepository.createRefreshToken(user.id, refreshTokenHash, expiresAt);
    await authRepository.updateLastLogin(user.id);

    logger.info(`[${AUTH_LOGS.LOGIN_SUCCESS}] User logged in: ${user.id}`);

    return {
      accessToken,
      refreshToken,
      user: this.mapToProfile(user),
    };
  }

  /**
   * Rotates access and refresh tokens.
   */
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: TokenPayload & jwt.JwtPayload;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(token);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      // Token reuse / compromise detection: revoke all tokens for this user if reuse is attempted
      if (storedToken) {
        await authRepository.revokeAllRefreshTokens(storedToken.userId);
        logger.error(
          `[SECURITY WARNING] Reused refresh token detected for user: ${storedToken.userId}. Revoked all tokens.`
        );
      }
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Revoke old refresh token
    await authRepository.revokeRefreshToken(tokenHash);

    // Generate new tokens
    const tokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      zoneId: decoded.zoneId,
      registerNumber: decoded.registerNumber,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Save new refresh token
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await authRepository.createRefreshToken(decoded.userId, newRefreshTokenHash, expiresAt);

    logger.info(`[${AUTH_LOGS.REFRESH_TOKEN_ROTATED}] Tokens rotated for user: ${decoded.userId}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revokes the active refresh token on logout.
   */
  async logout(userId: string, token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await authRepository.revokeRefreshToken(tokenHash);
    logger.info(`[${AUTH_LOGS.LOGOUT}] User logged out: ${userId}`);
  }

  /**
   * Updates password, clears first login state, and revokes all refresh tokens.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('Invalid current password');
    }

    const newHash = await hashPassword(newPassword);
    await authRepository.updatePassword(userId, newHash, false);

    // Revoke all other sessions
    await authRepository.revokeAllRefreshTokens(userId);

    logger.info(`[${AUTH_LOGS.PASSWORD_CHANGED}] Password changed for user: ${userId}`);
  }

  /**
   * Initiates password recovery process.
   */
  async forgotPassword(identifier: string): Promise<void> {
    const user = await authRepository.findUserByIdentifier(identifier);

    // Always return 200 to prevent user enumeration
    if (!user) {
      logger.warn(
        `[${AUTH_LOGS.PASSWORD_RESET_REQUESTED}] Identifier not found (enum prevention): ${identifier}`
      );
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(resetToken);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await authRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    // Send password reset email
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    await mockNotificationService.sendEmail({
      to: user.email || '',
      subject: 'Maatram Foundation — Password Reset Request',
      body: `You requested a password reset. Please click the following link to reset your password within 1 hour:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1a56db;">Password Reset Request</h2>
          <p>You requested a password reset for your Maatram Foundation account.</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #1a56db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </p>
          <p>This link is valid for 1 hour.</p>
          <p style="color: #666; font-size: 12px;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    logger.info(
      `[${AUTH_LOGS.PASSWORD_RESET_REQUESTED}] Reset token generated for user: ${user.id}`
    );
  }

  /**
   * Resets password using valid token.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const resetEntry = await authRepository.getPasswordResetToken(tokenHash);

    if (!resetEntry || resetEntry.usedAt || resetEntry.expiresAt < new Date()) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const newHash = await hashPassword(newPassword);

    // Begin database transaction changes
    await authRepository.updatePassword(resetEntry.userId, newHash, false);
    await authRepository.markPasswordResetUsed(resetEntry.id);
    await authRepository.revokeAllRefreshTokens(resetEntry.userId);

    logger.info(
      `[${AUTH_LOGS.PASSWORD_RESET_COMPLETED}] Password reset completed for user: ${resetEntry.userId}`
    );
  }

  /**
   * Returns current active profile detail.
   */
  async getMe(userId: string): Promise<UserAuthProfile> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw ApiError.unauthorized('User not authenticated');
    }
    return this.mapToProfile(user);
  }
}

export const authService = new AuthService();
